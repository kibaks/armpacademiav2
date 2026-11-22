import '../src/index.css';
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AnimatedLessonPlayer} from '../src/components/AnimatedLessonPlayer';
import {COURSES_DATA} from '../src/data/coursesData';
function Check(){
 const [index,setIndex]=useState(0),[edited,setEdited]=useState(false);
 const original=COURSES_DATA[0];
 const course=edited ? {...original,lessons:original.lessons.map((lesson,i)=>i===index ? {...lesson,content:lesson.content+' Texte de contrôle modifié.'}:lesson)} : original;
 return <main style={{maxWidth:1100,margin:'24px auto',padding:16}}>
 <label>Leçon à vérifier <select value={index} onChange={event=>setIndex(Number(event.target.value))}>{original.lessons.map((lesson,i)=><option key={i} value={i}>{lesson.title}</option>)}</select></label>
 <label style={{marginLeft:16}}><input type="checkbox" checked={edited} onChange={event=>setEdited(event.target.checked)}/>Simuler un texte de leçon modifié</label>
 <AnimatedLessonPlayer course={course} lessonIndex={index} autoPlayVoice={false}/></main>;
}
createRoot(document.getElementById('root')!).render(<Check/>);
