import '../src/index.css';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CartoonLessonStage } from '../src/components/CartoonLessonStage';
import { buildSynchronizedLessonScreens } from '../src/components/ProfessorFilmScenes';
import { COURSES_DATA } from '../src/data/coursesData';
function Check() {
 const [playing, setPlaying] = useState(false);
 const course = COURSES_DATA[0], lesson = course.lessons[0];
 const screen = buildSynchronizedLessonScreens(lesson.title, lesson.content, course.code, course.legalRef, 0).sceneData.screens[0];
 return <main style={{ maxWidth: 1100, margin: '24px auto', padding: 16, fontFamily: 'system-ui' }}>
  <h1 style={{fontSize:26,fontWeight:750,marginBottom:8}}>Aperçu du cours animé</h1>
  <p>Présentation pédagogique ARMP · Des repères clairs pour comprendre le cours.</p>
  <button style={{ padding: '12px 24px', marginBottom: 16 }} onClick={() => setPlaying(p => !p)}>{playing ? 'Pause' : 'Lire'}</button>
  <CartoonLessonStage screen={screen} progress={.08} playing={playing} speaking={false} mouthOpenness={0} viseme="rest" legalRef={course.legalRef} sceneCount={5}/>
 </main>;
}
createRoot(document.getElementById('root')!).render(<Check/>);
