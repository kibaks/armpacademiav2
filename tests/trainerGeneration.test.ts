import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createOperationsRouter} from '../backend/operations';

test('trainers generate reviewable drafts, learners cannot and cold starts remain retryable',async()=>{
 let calls=0,cold=false;
 const module={title:'Préparer un achat',description:'Brouillon pédagogique.',lessons:[{title:'Le besoin',content:'Décrire le besoin avant la consultation.'}],quiz:[{question:'Quel point de départ ?',options:['Le besoin','La marque','Le vendeur','Une promesse'],correctIndex:0}]};
 const db={collection:()=>({doc:(uid:string)=>({get:async()=>({exists:true,data:()=>({id:uid,role:uid==='trainer'?'formateur':'particulier'})})})})};
 const app=express();app.use(express.json());app.use(createOperationsRouter({db,authenticate:(req:any,res,next)=>{req.identity={uid:req.get('X-User')||'learner'};next();},generate:async()=>{calls++;if(cold)throw Error('QWEN_HTTP_503');return JSON.stringify(module);}}));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
 const url=`http://127.0.0.1:${(server.address() as any).port}/generate-animated-module`;
 const send=(user:string)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-User':user},body:JSON.stringify({sourceTitle:'Achat',sourceText:'Le besoin doit être défini avant la consultation.',legalRef:'Support du formateur'})});
 try{
  assert.equal((await send('learner')).status,403);assert.equal(calls,0);
  const response=await send('trainer');assert.equal(response.status,200);const data=await response.json();assert.equal(data.source,'local-qwen');assert.equal(data.reviewRequired,true);assert.equal(data.module.legalRef,'Support du formateur');
  cold=true;const warming=await send('trainer');assert.equal(warming.status,503);assert.equal((await warming.json()).code,'TUTOR_WARMING');
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});
