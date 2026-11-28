import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createBlobStorageRouter} from '../backend/blobStorage';

test('private Blob uploads enforce owner, verified metadata, public visibility and byte ranges',async()=>{
 const records=new Map<string,any>();let wrong=false,reads=0,deleted=false;
 const db={collection:()=>({doc:(id:string)=>({get:async()=>({data:()=>records.get(id)}),set:async(f:any)=>{records.set(id,f);},update:async(p:any)=>{records.set(id,{...records.get(id),...p});},delete:async()=>{records.delete(id);}})})};
 const app=express();app.use(express.json());app.use(createBlobStorageRouter({db:()=>db,authenticate:(req:any,res,next)=>{const uid=req.get('X-User');if(!uid)return res.status(401).end();req.identity={uid,role:'particulier'};next();},head:async(path:any)=>{const f=[...records.values()].find(f=>f.blobPath===path);return {pathname:path,size:wrong?999:f.size,contentType:f.mimeType} as any;},get:async(path:any,opts:any)=>{reads++;assert.equal(opts.access,'private');const ranged=opts.headers?.Range;return {statusCode:200,headers:new Headers(ranged?{'content-range':'bytes 0-1/5','content-length':'2'}:{'content-length':'5'}),stream:new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(ranged?'he':'hello'));c.close();}})} as any;},del:async()=>{deleted=true;}}));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));const url=`http://127.0.0.1:${(server.address() as any).port}`;
 const req=(path:string,user?:string,body?:any,method?:string,headers:any={})=>fetch(url+path,{method:method||(body?'POST':'GET'),headers:{'Content-Type':'application/json',...(user?{'X-User':user}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
 try{
  assert.equal((await req('/upload-ticket',undefined,{name:'a.pdf',size:5})).status,401);
  assert.equal((await req('/upload-ticket','alice',{name:'bad.exe',size:5})).status,400);
  assert.equal((await req('/upload-ticket','alice',{name:'a.png',size:4*1024*1024})).status,413);
  const ticket=await(await req('/upload-ticket','alice',{name:'a.pdf',size:5})).json();assert.equal(ticket.provider,'vercel-blob');assert.ok(ticket.pathname.startsWith('academia/alice/'));
  assert.equal((await req(`/files/${ticket.id}/complete`,'bob',{})).status,404);
  wrong=true;assert.equal((await req(`/files/${ticket.id}/complete`,'alice',{})).status,503);assert.equal(records.get(ticket.id).status,'pending');
  wrong=false;assert.equal((await req(`/files/${ticket.id}/complete`,'alice',{})).status,200);
  assert.equal((await req(`/files/${ticket.id}/preview`,'bob')).status,404);assert.equal(reads,0);
  assert.equal((await req(`/public/${ticket.id}.pdf`)).status,404);
  const ranged=await req(`/files/${ticket.id}/preview`,'alice',undefined,'GET',{Range:'bytes=0-1'});assert.equal(ranged.status,206);assert.equal(await ranged.text(),'he');
  assert.equal((await req(`/files/${ticket.id}/preview`,'alice',undefined,'GET',{Range:'bytes=0-1,3-4'})).status,416);
  assert.equal((await req(`/files/${ticket.id}`,'bob',undefined,'DELETE')).status,404);assert.equal(deleted,false);
  records.get(ticket.id).visibility='public';assert.equal(await(await req(`/public/${ticket.id}.pdf`)).text(),'hello');
  assert.equal((await req(`/files/${ticket.id}`,'alice',undefined,'DELETE')).status,200);assert.equal(deleted,true);
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});
