import {Router} from 'express';
import type {RequestHandler} from 'express';
import {randomUUID} from 'node:crypto';
import {Readable} from 'node:stream';
import {head,get,del,list} from '@vercel/blob';
import {handleUpload} from '@vercel/blob/client';
import {authenticate,services} from './admin.js';
import {MAX_IMAGE_BYTES,imageMime} from '../shared/imageUpload.js';

const extensions=new Set('pdf jpg jpeg png gif webp doc docx xls xlsx ppt pptx odt ods odp txt csv rtf zip rar 7z mp3 mp4 wav avi mov webm mkv json xml ogg m4a flac aac'.split(' '));
const mime:Record<string,string>={pdf:'application/pdf',txt:'text/plain',csv:'text/csv',json:'application/json',mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime',mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',m4a:'audio/mp4',zip:'application/zip',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation'};
export const blobStorageConfigured=()=>Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const validId=(id:string)=>/^[a-f0-9-]{36}$/.test(id);
const admin=(identity:any)=>['super_admin','dfat_admin'].includes(identity.role);
export const mayReadBlob=(file:any,identity:any)=>file.visibility==='public'||file.uploadedBy===identity?.uid||admin(identity||{});
export const mayDeleteBlob=(file:any,identity:any)=>file.uploadedBy===identity?.uid||admin(identity||{});
export function createBlobStorageRouter(deps:{db?:()=>any;authenticate?:RequestHandler;head?:typeof head;get?:typeof get;del?:typeof del;list?:typeof list}={}){
 const router=Router(),auth=deps.authenticate||authenticate;
 const db=()=>deps.db?.()||services().db;
 const collection=()=>db().collection('academiaBlobFiles');
 const wrap=(fn:any)=>(req:any,res:any,next:any)=>Promise.resolve(fn(req,res,next)).catch(()=>{if(!res.headersSent)res.status(503).json({message:'Stockage temporairement indisponible.'});});
 const expose=(f:any)=>{const {blobPath,status,expiresAt,...file}=f;return file;};
 const finish=async(id:string)=>{
  const ref=collection().doc(id),snap=await ref.get(),f=snap.data();
  if(!f)throw Error('Missing upload');
  const info=await (deps.head||head)(f.blobPath);
  if(info.pathname!==f.blobPath||info.size!==f.size||info.contentType.split(';')[0]!==f.mimeType)throw Error('Invalid uploaded file');
  await ref.update({status:'ready',updatedAt:new Date().toISOString()});return expose({...f,status:'ready'});
 };
 const read=wrap(async(req:any,res:any,next:any)=>{
  const id=req.params.id || req.params.stored?.split('.')[0];
  if(!validId(id))return res.sendStatus(404);
  const snap=await collection().doc(id).get(),f=snap.data();
  if(!f)return next('router');
  if(f.status!=='ready'||(req.params.stored?f.visibility!=='public':!mayReadBlob(f,req.identity)))return res.sendStatus(404);
  res.set('Accept-Ranges','bytes');
  if(req.method==='HEAD'){res.set('Content-Type',f.mimeType);res.set('Content-Length',String(f.size));res.set('Cache-Control','private, no-store');return res.end();}
  const range=req.get('Range');
  if(range && (range.length>64 || !/^bytes=(?:[0-9]+-[0-9]*|-[0-9]+)$/.test(range)))return res.status(416).set('Content-Range',`bytes */${f.size}`).end();
  const controller=new AbortController();res.on('close',()=>controller.abort());
  const result=await (deps.get||get)(f.blobPath,{access:'private',...(range?{headers:{Range:range}}:{}),abortSignal:controller.signal});
  if(!result||result.statusCode!==200)return res.sendStatus(404);
  const contentRange=result.headers.get('content-range');if(contentRange)res.status(206).set('Content-Range',contentRange);
  const length=result.headers.get('content-length');if(length)res.set('Content-Length',length);
  res.set('Content-Type',f.mimeType);res.set('X-Content-Type-Options','nosniff');res.set('Cache-Control','private, no-store');
  res.set('Content-Disposition',`${req.path.endsWith('/download')?'attachment':'inline'}; filename*=UTF-8''${encodeURIComponent(f.originalName)}`);
  Readable.fromWeb(result.stream as any).on('error',()=>res.destroy()).pipe(res);
 });
 router.get('/health',wrap(async(_req:any,res:any)=>{await(deps.list||list)({prefix:'academia/',limit:1});res.set('Cache-Control','no-store').json({ready:true,provider:'vercel-blob'});}));
 router.get('/public/:stored',read);
 // Vercel signs completion callbacks. Only token generation requires a learner session.
 router.post('/blob-upload',(req:any,res,next)=>req.body?.type==='blob.generate-client-token'?auth(req,res,next):next(),wrap(async(req:any,res:any)=>{
  const result=await handleUpload({body:req.body,request:req,onBeforeGenerateToken:async(pathname,clientPayload)=>{
   const id=JSON.parse(clientPayload||'{}').id;
   if(!req.identity?.uid||!validId(id||''))throw Error('Authentication required');
   const f=(await collection().doc(id).get()).data();
   if(!f||f.uploadedBy!==req.identity.uid||f.blobPath!==pathname||f.expiresAt<Date.now()||f.status!=='pending')throw Error('Invalid upload');
   return {allowedContentTypes:[f.mimeType],maximumSizeInBytes:f.size,validUntil:f.expiresAt,addRandomSuffix:false,tokenPayload:JSON.stringify({id,uid:req.identity.uid})};
  },onUploadCompleted:async({blob,tokenPayload})=>{
   const {id,uid}=JSON.parse(tokenPayload||'{}');if(!validId(id||''))throw Error('Invalid callback');
   const f=(await collection().doc(id).get()).data();if(!f||f.uploadedBy!==uid||f.blobPath!==blob.pathname)throw Error('Invalid callback');await finish(id);
  }});res.json(result);
 }));
 router.use(auth);
 router.post('/upload-ticket',wrap(async(req:any,res:any)=>{
  const {name,size,category='divers',visibility='private',entityId,description}=req.body||{};
  const ext=typeof name==='string'?name.split('.').pop()?.toLowerCase()||'':'';
  if(typeof name!=='string'||name.length>180||/[\/\\\x00-\x1f]/.test(name)||!extensions.has(ext))return res.status(400).json({message:'Nom ou format non autorisé.'});
  const limit=imageMime(name)?MAX_IMAGE_BYTES:100*1024*1024;
  if(!Number.isSafeInteger(size)||size<=0||size>limit)return res.status(413).json({message:'Fichier trop volumineux.'});
  if(typeof category!=='string'||!/^[\w-]{1,60}$/.test(category)||!['public','private'].includes(visibility)||(entityId&&(typeof entityId!=='string'||entityId.length>128))||(description&&(typeof description!=='string'||description.length>1000)))return res.status(400).json({message:'Paramètres invalides.'});
  const id=randomUUID(),storedName=id+'.'+ext,now=new Date().toISOString(),pathname=`academia/${req.identity.uid}/${storedName}`;
  const f={id,storedName,originalName:name,path:pathname,blobPath:pathname,url:visibility==='public'?`/api/storage/public/${storedName}`:`/api/storage/files/${id}/preview`,disk:visibility==='public'?'academia_public':'academia',mimeType:imageMime(name)||mime[ext]||'application/octet-stream',extension:ext,size,category,visibility,entityId:entityId||req.identity.uid,description:description||null,uploadedBy:req.identity.uid,createdAt:now,updatedAt:now,status:'pending',expiresAt:Date.now()+10*60000};
  await collection().doc(id).set(f);res.set('Cache-Control','no-store').json({provider:'vercel-blob',id,pathname,contentType:f.mimeType});
 }));
 router.post('/files/:id/complete',wrap(async(req:any,res:any)=>{
  if(!validId(req.params.id))return res.sendStatus(404);const f=(await collection().doc(req.params.id).get()).data();
  if(!f||f.uploadedBy!==req.identity.uid)return res.sendStatus(404);res.json({data:await finish(req.params.id)});
 }));
 router.get('/files/:id/preview',read);router.get('/files/:id/download',read);
 router.get('/files/:id',wrap(async(req:any,res:any,next:any)=>{if(!validId(req.params.id))return res.sendStatus(404);const f=(await collection().doc(req.params.id).get()).data();if(!f)return next('router');if(f.status!=='ready'||!mayReadBlob(f,req.identity))return res.sendStatus(404);res.json({data:expose(f)});}));
 router.get('/files',wrap(async(req:any,res:any)=>{
  let query=collection().where('status','==','ready');if(!admin(req.identity))query=query.where('uploadedBy','==',req.identity.uid);
  const snap=await query.limit(500).get();const files=snap.docs.map((d:any)=>d.data()).filter((f:any)=>(!req.query.category||f.category===req.query.category)&&(!req.query.entity_id||f.entityId===req.query.entity_id)&&(!req.query.visibility||f.visibility===req.query.visibility));res.json({data:files.slice(0,Math.min(500,Number(req.query.limit)||100)).map(expose)});
 }));
 router.get('/storage-stats',wrap(async(req:any,res:any)=>{let q=collection();if(!admin(req.identity))q=q.where('uploadedBy','==',req.identity.uid);const s=await q.limit(500).get();const files=s.docs.map((d:any)=>d.data()).filter((f:any)=>f.status==='ready'&&(!req.query.category||f.category===req.query.category));const groups=new Map<string,{category:string;count:number;size:number}>();for(const f of files){const g=groups.get(f.category)||{category:f.category,count:0,size:0};g.count++;g.size+=f.size;groups.set(f.category,g);}res.json({data:{totalFiles:files.length,totalSize:files.reduce((n:number,f:any)=>n+f.size,0),byCategory:[...groups.values()].map(g=>({...g,size:String(g.size)})),quota:0}});}));
 router.delete('/files/:id',wrap(async(req:any,res:any)=>{if(!validId(req.params.id))return res.sendStatus(404);const ref=collection().doc(req.params.id),f=(await ref.get()).data();if(!f||!mayDeleteBlob(f,req.identity))return res.sendStatus(404);await(deps.del||del)(f.blobPath);await ref.delete();res.json({ok:true});}));
 return router;
}
