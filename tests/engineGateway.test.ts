import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {gatewayBase,gatewaySignature,applyGatewayBase,createEngineGatewayRouter,createEngineGatewayMiddleware} from '../backend/engineGateway';
const base='https://new-academia.trycloudflare.com',key='test-only-'+ 'x'.repeat(32),now=1794819900000;
function database(){let value:any;return {read:()=>value,collection:()=>({doc:()=>({get:async()=>({data:()=>value})})}),runTransaction:async(fn:any)=>fn({get:async()=>({data:()=>value}),set:(_:any,v:any)=>{value=v;}})};}
test('gateway destinations are restricted and permanent manual domains retain priority',()=>{
 for(const bad of ['http://new.trycloudflare.com','https://new.trycloudflare.com.evil.test','https://127.0.0.1','https://new.trycloudflare.com/path','https://user@new.trycloudflare.com','https://new.trycloudflare.com:8443'])assert.equal(gatewayBase(bad),null);
 const env={MUSETALK_API_URL:'https://old.trycloudflare.com/musetalk',QWEN_API_URL:'https://permanent.example/chat',MUSETALK_API_KEY:key};applyGatewayBase(env,base);
 assert.equal(env.MUSETALK_API_URL,base+'/musetalk');assert.equal(env.QWEN_API_URL,'https://permanent.example/chat');assert.equal(env.MUSETALK_API_KEY,key);
});
test('signed registration verifies worker health, rejects stale/replayed requests and refreshes warm processes',async()=>{
 const db=database(),env={MUSETALK_API_URL:'https://old.trycloudflare.com/musetalk',MUSETALK_API_KEY:key};let probes=0;
 const app=express();app.use(express.json());app.use('/api/engine-gateway',createEngineGatewayRouter({env,db:()=>db,now:()=>now,fetcher:async(url,init)=>{probes++;assert.equal(url,base+'/national/capabilities');assert.equal(init!.redirect,'error');assert.equal((init!.headers as any).authorization,'Bearer '+key);return Response.json({provider:'national-local'});}}));
 const warmEnv={MUSETALK_API_URL:'https://old.trycloudflare.com/musetalk'};app.use(createEngineGatewayMiddleware({env:warmEnv,db:()=>db,now:()=>now}));app.get('/api/probe',(_req,res)=>res.json(warmEnv));
 const server=app.listen(0);await new Promise<void>(r=>server.once('listening',()=>r()));const root='http://127.0.0.1:'+(server.address() as any).port;
 const announce=(ts:number,signature:string)=>fetch(root+'/api/engine-gateway/register',{method:'POST',headers:{'content-type':'application/json','x-academia-signature':signature},body:JSON.stringify({baseUrl:base,timestamp:ts})});
 try{
 assert.equal((await announce(now,'0'.repeat(64))).status,401);assert.equal((await announce(now-300001,gatewaySignature(base,now-300001,key))).status,401);assert.equal(probes,0);
 assert.equal((await announce(now,gatewaySignature(base,now,key))).status,200);assert.equal(db.read().baseUrl,base);assert.equal(env.MUSETALK_API_URL,base+'/musetalk');
 assert.equal((await announce(now,gatewaySignature(base,now,key))).status,409);
 assert.equal((await (await fetch(root+'/api/probe')).json()).MUSETALK_API_URL,base+'/musetalk');
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});


test('an expired registry address cannot replace the recovered deployment gateway',async()=>{
 const env={MUSETALK_API_URL:base+'/musetalk'};
 const db={collection:()=>({doc:()=>({get:async()=>({data:()=>({baseUrl:'https://expired-academia.trycloudflare.com',instance:'60042833',timestamp:now-86400001})})})})};
 const app=express();app.use(createEngineGatewayMiddleware({env,db:()=>db,now:()=>now}));app.get('/api/probe',(_req,res)=>res.json(env));
 const server=app.listen(0);try{const port=(server.address() as any).port;const response=await fetch(`http://127.0.0.1:${port}/api/probe`);assert.equal((await response.json()).MUSETALK_API_URL,base+'/musetalk');}finally{server.close();}
});

test('database resource exhaustion requests backoff without changing the active endpoint',async()=>{
 const env={MUSETALK_API_URL:'https://old.trycloudflare.com/musetalk',MUSETALK_API_KEY:key};
 const db={...database(),runTransaction:async()=>{throw {code:8,details:'Quota exceeded.'};}};
 const app=express();app.use(express.json());app.use('/api/engine-gateway',createEngineGatewayRouter({env,db:()=>db,now:()=>now,fetcher:async()=>Response.json({provider:'national-local'})}));
 const server=app.listen(0);try{
  const port=(server.address() as any).port;
  const response=await fetch(`http://127.0.0.1:${port}/api/engine-gateway/register`,{method:'POST',headers:{'Content-Type':'application/json','x-academia-signature':gatewaySignature(base,now,key)},body:JSON.stringify({baseUrl:base,timestamp:now})});
  assert.equal(response.status,429);assert.equal(response.headers.get('retry-after'),'900');assert.equal((await response.json()).code,'DATABASE_RESOURCE_EXHAUSTED');
  assert.equal(env.MUSETALK_API_URL,'https://old.trycloudflare.com/musetalk');
 }finally{server.close();}
});
