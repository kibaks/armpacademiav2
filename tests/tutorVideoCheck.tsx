import '../src/index.css';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {AnimatedLessonPlayer} from '../src/components/AnimatedLessonPlayer';
import {COURSES_DATA} from '../src/data/coursesData';
createRoot(document.getElementById('root')!).render(<main style={{maxWidth:1100,margin:'24px auto',padding:16}}><AnimatedLessonPlayer course={COURSES_DATA[0]} lessonIndex={0} autoPlayVoice={false}/></main>);
