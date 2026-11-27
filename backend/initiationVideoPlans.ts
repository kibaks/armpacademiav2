import { Router } from 'express';
import { createHash } from 'node:crypto';
import { buildInitiationModules } from '../src/data/initiationCurriculum.js';
import { buildSynchronizedLessonScreens } from '../src/components/ProfessorFilmScenes.js';
import { courseMotionStoryboard } from '../src/utils/courseMotionStoryboard.js';
import { generateQwenAuthor } from './qwenTutor.js';
import { services } from './services.js';

export function createInitiationVideoPlansRouter(deps: {db?:()=>any; author?:typeof generateQwenAuthor} = {}) {
 const router=Router();
 router.post('/initiation/video-plan',async(req,res)=>{
  res.set('Cache-Control','no-store');
  const course=buildInitiationModules(['']).find(item=>item.id===req.body?.courseId);
  const index=req.body?.lessonIndex;
  const lesson=Number.isInteger(index) && index>=0 ? course?.lessons[index] : undefined;
  if(!course || !lesson)return res.status(400).json({error:'Chapitre d’initiation invalide.'});
  const fingerprint=createHash('sha256').update(JSON.stringify(['hosted-qwen-course-v1',course.id,index,lesson.content])).digest('hex');
  try {
   const ref=(deps.db?.() || services().db).collection('initiationVideoPlans').doc(fingerprint),saved=await ref.get();
   if(saved.exists)return res.json(saved.data());
   const {sceneData,sentences}=buildSynchronizedLessonScreens(lesson.title,lesson.content,course.code||'',course.legalRef||'',index);
   // The local LLM selects emphasis from authored text; it cannot invent narration.
   const candidates=sentences.map(text=>{
    const words=Array.from(text.matchAll(/\S+/g));
    return [0,Math.max(0,Math.floor(words.length/2)-2),Math.max(0,words.length-4)].map(start=>{
     const last=words[Math.min(words.length-1,start+3)];return text.slice(words[start].index,last.index!+last[0].length);
    });
   });
   const reply=await (deps.author || generateQwenAuthor)('Prépare les mises en relief de cette vidéo ARMP. Pour chaque séquence, choisis le meilleur extrait parmi les trois propositions indexées 0, 1 et 2. Réponds uniquement par un tableau JSON de '+sentences.length+' entiers entre 0 et 2, un choix par séquence. Pas de texte. Séquences : '+JSON.stringify(sentences.map((text,i)=>({narration:text,extraits:candidates[i]}))));
   const choices:unknown=JSON.parse(reply.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));
   if(!Array.isArray(choices)||choices.length!==sentences.length||choices.some(h=>!Number.isInteger(h)||h<0||h>2))throw Error('INVALID_PLAN');
   const highlights=choices.map((choice,i)=>candidates[i][choice]);
   const scenes=sceneData.screens.map((screen,i)=>({text:sentences[i],lesson:{...courseMotionStoryboard(screen,lesson.title,i,sentences.length,true),terms:[highlights[i] as string]}}));
   const plan={fingerprint,courseId:course.id,lessonIndex:index,content:lesson.content,title:lesson.title,model:'academia-tuteur',scenes};
   await ref.set(plan);return res.json(plan);
  }catch(error){
   const warming=error instanceof Error && /QWEN_HTTP_(503|429)/.test(error.message);
   return res.status(503).json({code:warming?'TUTOR_WARMING':'VIDEO_PLAN_UNAVAILABLE',error:warming?'Le moteur se prépare.':'La préparation du film reste en attente.'});
  }
 });
 return router;
}
