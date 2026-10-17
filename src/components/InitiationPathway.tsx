import React from 'react';
import { BookOpen, CheckCircle2, ArrowRight, GraduationCap, LockKeyhole, MessageCircle, LogOut } from 'lucide-react';
import type { CourseModule } from '../types';
import './InitiationPathway.css';
export function InitiationPathway({ modules, isRead, ready, onOpen, onTest, onTutor, onLogout }: {
  modules: CourseModule[]; isRead: (course: CourseModule) => boolean; ready: boolean;
  onOpen: (course: CourseModule) => void; onTest: () => void; onTutor: () => void; onLogout: () => void;
}) {
  const done = modules.filter(isRead).length;
  const next = modules.find(m => !isRead(m));
  return <section className="init-path" aria-labelledby="initiation-title">
    <header className="init-path__brand"><span>ARMP <b>ACADEMIA</b></span><button onClick={onLogout}><LogOut size={16} /> Se déconnecter</button></header>
    <div className="init-path__layout">
      <aside className="init-path__intro"><span className="init-path__badge"><GraduationCap size={16} /> Votre parcours · Initiation</span><h1 id="initiation-title">{ready ? 'Vos modules sont terminés. Évaluez vos acquis.' : 'Des bases solides pour agir avec confiance.'}</h1><p>Comprenez les marchés publics, les acteurs et les bonnes pratiques, à votre rythme. Chaque chapitre vous rapproche du niveau approfondi.</p>
        <div className="init-path__progress"><strong>{done} <small>/ {modules.length} modules terminés</small></strong><progress value={done} max={Math.max(1,modules.length)} aria-label="Modules d’initiation terminés" /></div>
        <div className="init-path__milestones"><span><BookOpen size={19} /> Comprendre les fondamentaux</span><span><GraduationCap size={19} /> Réussir le test de niveau</span><span><LockKeyhole size={19} /> Accéder aux notions approfondies</span></div>
        {next && <button className="init-path__primary" onClick={() => onOpen(next)}>Reprendre mon parcours <ArrowRight size={18} /></button>}
        {ready && <button className="init-path__primary" onClick={onTest}>Passer le test de niveau <ArrowRight size={18} /></button>}
        <button className="init-path__tutor" onClick={onTutor}><MessageCircle size={19} /><span><strong>Aïsha vous accompagne</strong><small>Une définition, un exemple ou une explication ?</small></span><ArrowRight size={16} /></button>
      </aside>
      <div className="init-path__modules"><div className="init-path__section-title"><span>VOTRE FEUILLE DE ROUTE</span><h2>Comprendre, pratiquer, progresser</h2><p>Votre progression est enregistrée sur votre compte.</p></div>
        <ol>{modules.map((course,i) => <li key={course.id}><button onClick={() => onOpen(course)}><span className={'init-path__number' + (isRead(course) ? ' is-complete' : '')}>{isRead(course) ? <CheckCircle2 size={22} /> : String(i+1).padStart(2,'0')}</span><span className="init-path__module-copy"><strong>{course.title}</strong><small>{course.lessons.length} chapitres · {isRead(course) ? 'Terminé · Revoir le module' : 'À découvrir ou à poursuivre'}</small></span><ArrowRight size={18} /></button></li>)}</ol>
        {!modules.length && <p role="alert">Votre parcours est en cours de configuration. Contactez l’administration.</p>}
        {!ready && <div className="init-path__locked"><LockKeyhole size={22} /><div><strong>Le niveau approfondi se prépare ici</strong><p>Terminez vos modules d’initiation, puis réussissez le test de niveau pour y accéder.</p></div></div>}
      </div>
    </div>
  </section>;
}
