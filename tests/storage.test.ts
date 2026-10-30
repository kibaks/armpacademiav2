process.env.ACADEMIA_STORAGE_URL='https://storage.example.com/files-api';
process.env.ACADEMIA_STORAGE_KEY='test-storage-key-with-at-least-32-characters';
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createHmac } from 'node:crypto';
import express from 'express';
import { createStorageRouter } from '../backend/storage';
let forwarded: any;
const app=express(); app.use(express.json());
app.use('/api/storage',createStorageRouter({authenticate:(req:any,res,next)=>{
 if(req.headers.authorization!=='Bearer valid') {res.status(401).end();return;}
 req.identity={uid:'owner-123',role:'particulier'};next();
},fetch:(async(url:any,opts:any)=>{
 forwarded={url,opts};
 return new Response(JSON.stringify(String(url).endsWith('/preview')?{url:'https://storage.example.com/files-api/content/file-1?ticket=temporary'}:{data:[]}),{status:200});
}) as typeof fetch}));
const server=app.listen(0,'127.0.0.1'); await new Promise<void>(r=>server.once('listening',r));
const base=`http://127.0.0.1:${(server.address() as any).port}/api/storage`;
after(()=>server.close());
const upload=(body:any,token='valid')=>fetch(base+'/upload-ticket',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
const file={name:'lettre.pdf',size:2048,category:'cours',visibility:'private'};
test('upload authorization requires an authenticated application session',async()=>{
 assert.equal((await upload(file,'invalid')).status,401);
});
test('tickets bind owner, exact filename, size and visibility; keys stay server-side',async()=>{
 const response=await upload({...file,uploadedBy:'attacker'});assert.equal(response.status,200);
 const data=await response.json();assert.equal(data.url,'https://storage.example.com/files-api/api/files');
 const [encoded,sig]=data.token.split('.');const claims=JSON.parse(Buffer.from(encoded,'base64url').toString());
 assert.equal(sig,createHmac('sha256',process.env.ACADEMIA_STORAGE_KEY!).update(encoded).digest('base64url'));
 assert.equal(claims.sub,'owner-123');assert.equal(claims.name,file.name);assert.equal(claims.size,file.size);
 assert.equal(claims.scope,'upload');assert.ok(claims.jti);assert.ok(claims.exp>Date.now()/1000);
 assert.equal(JSON.stringify(data).includes(process.env.ACADEMIA_STORAGE_KEY!),false);
});
test('unsafe filenames, extensions, sizes and categories are rejected',async()=>{
 for(const change of [{name:'../x.pdf'},{name:'x.html'},{size:0},{size:101*1024**2},{name:'photo.png',size:4*1024**2},{category:'../tmp'},{visibility:'everyone'}])
  assert.ok((await upload({...file,...change})).status>=400);
});
test('metadata access carries server-derived ownership to the configured server',async()=>{
 assert.equal((await fetch(base+'/files?category=cours',{headers:{Authorization:'Bearer valid'}})).status,200);
 assert.equal(forwarded.url,'https://storage.example.com/files-api/api/files?category=cours');
 const encoded=forwarded.opts.headers.Authorization.slice(7).split('.')[0];
 const claims=JSON.parse(Buffer.from(encoded,'base64url').toString());assert.equal(claims.sub,'owner-123');assert.equal(claims.scope,'manage');
});
test('private media redirects only after authorization to a short-lived server link',async()=>{
 assert.equal((await fetch(base+'/files/file-1/preview',{redirect:'manual'})).status,401);
 const res=await fetch(base+'/files/file-1/preview',{redirect:'manual',headers:{Authorization:'Bearer valid'}});
 assert.equal(res.status,307);assert.match(res.headers.get('location')!,/^https:\/\/storage.example.com\/files-api\/content\//);
});
