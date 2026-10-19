import { StructuredChapterArchitecture } from '../src/components/StructuredChapterArchitecture';
import type { UserProfile } from '../src/types';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { COURSES_DATA } from '../src/data/coursesData';
import { InitiationPathway } from '../src/components/InitiationPathway';
import { buildSynchronizedLessonScreens } from '../src/components/ProfessorFilmScenes';
import { InitiationMotionStage } from '../src/components/InitiationMotionStage';
const courses = COURSES_DATA;
function Preview() {
  const [pathway, setPathway] = useState(false);
  const [exampleDeadline] = useState(() => Date.now() + 3 * 86400000);
  const [unit, setUnit] = useState(0), [chapter, setChapter] = useState(0), [scene, setScene] = useState(0);
  const [width, setWidth] = useState(1080), [progress, setProgress] = useState(.3), [playing, setPlaying] = useState(false);
  const course = courses[unit], lesson = course.lessons[chapter];
  const screens = buildSynchronizedLessonScreens(lesson.title, lesson.content, course.code, course.legalRef, chapter).sceneData.screens;
  useEffect(() => { if (!playing) return; const timer = window.setInterval(() => setProgress(p => p >= 1 ? 0 : p + .005), 100); return () => window.clearInterval(timer); }, [playing]);
  return <main style={{ padding: '24px 12px', fontFamily: 'system-ui,sans-serif' }}>
    <h1 style={{ maxWidth: 1080, margin: '0 auto 10px', color: '#122743', fontSize: 24 }}>Les marchés publics, de A à Z</h1>
    <p style={{ maxWidth: 1080, margin: '0 auto 20px', color: '#526780' }}>Aperçu visuel sans narration · Fondamentaux et notions approfondies</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, maxWidth: 1080, margin: '0 auto 20px' }}>
      <button onClick={() => setPathway(v => !v)} style={{ padding: 12 }}>{pathway ? "Voir les explications" : "Voir le parcours débutant"}</button>
      <label>Module <select value={unit} onChange={e => { setUnit(+e.target.value); setChapter(0); }} style={{ padding: 12, maxWidth: 300 }}>{courses.map((c,i) => <option key={c.id} value={i}>{i+1}. {c.title}</option>)}</select></label>
      <label>Chapitre <select value={chapter} onChange={e => setChapter(+e.target.value)} style={{ padding: 12, maxWidth: 260 }}>{course.lessons.map((l,i) => <option key={l.id} value={i}>{l.title}</option>)}</select></label>
      <label>Scène <select value={scene} onChange={e => setScene(+e.target.value)} style={{ padding: 12 }}>{screens.map((s,i) => <option key={i} value={i}>{s.shortTabLabel}</option>)}</select></label>
      <button onClick={() => setWidth(width === 360 ? 1080 : 360)} style={{ padding: 12 }}>{width === 360 ? 'Voir sur ordinateur' : 'Voir sur mobile (360 px)'}</button>
      <button onClick={() => setPlaying(p => !p)} style={{ padding: 12 }}>{playing ? 'Pause' : 'Animer'}</button>
      <label>Progression <input type="range" min="0" max="1" step=".01" value={progress} onChange={e => setProgress(+e.target.value)} /></label>
    </div>
    <div style={{ width, maxWidth: '100%', margin: 'auto', borderRadius: 22, overflow: 'hidden', boxShadow: '0 15px 50px #12274315' }}>
      {pathway ? <InitiationPathway modules={courses.filter(c => c.id.startsWith("INIT-"))} isRead={() => false} ready={false} expiresAt={exampleDeadline} enforced={false} onOpen={course => { setUnit(courses.findIndex(c => c.id === course.id)); setChapter(0); setPathway(false); }} onTest={() => {}} onTutor={() => {}} onLogout={() => {}} /> : <><InitiationMotionStage screen={screens[scene]} progress={progress} courseId={course.id} lessonIndex={chapter} /><StructuredChapterArchitecture course={course} lesson={lesson} lessonIndex={chapter} currentProfile={{id:"preview",name:"Apprenant",role:"particulier",roleTitle:"Apprenant",institution:"ARMP Academia"} as UserProfile} activeScreenIndex={scene} onJumpToWhiteboardScreen={setScene} onCompleteChapterAndNext={() => {}} isChapterCompleted={false} isLastChapter={false} /></>}
    </div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
