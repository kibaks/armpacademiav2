import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, ArrowRight, GraduationCap, LockKeyhole, MessageCircle, LogOut } from 'lucide-react';
import type { CourseModule } from '../types';
import './InitiationPathway.css';
import { ArmpLogo } from './ArmpLogo';
function InitiationCountdown({ expiresAt, enforced }: { expiresAt: number; enforced: boolean }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const refresh = () => setNow(Date.now());
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  const seconds = Math.max(0, Math.floor((expiresAt - now) / 1000));
  const days = Math.floor(seconds / 86400), hours = Math.floor(seconds % 86400 / 3600), minutes = Math.floor(seconds % 3600 / 60);
  return <div className="init-path__countdown" role="timer" aria-label="Temps restant pour l’initiation">{seconds ? `${days} j · ${String(hours).padStart(2,'0')} h · ${String(minutes).padStart(2,'0')} min · ${String(seconds % 60).padStart(2,'0')} s` : enforced ? 'Période terminée · Réactivation par code OTP' : 'Délai écoulé · Votre parcours reste accessible'}</div>;
}
export function InitiationPathway({ modules, isRead, ready, expiresAt, enforced = false, showHeader = true, onReturnPortal, onOpen, onTest, onTutor, onLogout }: {
  modules: CourseModule[]; isRead: (course: CourseModule) => boolean; ready: boolean;
  expiresAt?: number; enforced?: boolean; showHeader?: boolean; onReturnPortal?: () => void;
  onOpen: (course: CourseModule) => void; onTest: () => void; onTutor: () => void; onLogout: () => void;
}) {
  const done = modules.filter(isRead).length;
  const next = modules.find(m => !isRead(m));
  return <section className="init-path" aria-labelledby="initiation-title">
    {showHeader && <header className="init-path__brand"><div className="init-path__identity"><ArmpLogo size="md" /><span><b>ACADEMIA</b><small>Apprendre les marchés publics</small></span></div><button onClick={onLogout}><LogOut size={16} /> Se déconnecter</button></header>}
    {onReturnPortal && <div className="init-path__actions"><button onClick={onReturnPortal}><ArrowRight size={17} style={{transform:"rotate(180deg)"}} /> Retour au portail</button></div>}
    <div className="init-path__layout">
      <aside className="init-path__intro"><span className="init-path__badge"><GraduationCap size={16} /> Votre parcours · Initiation</span><h1 id="initiation-title">{ready ? 'Vos modules sont terminés. Évaluez vos acquis.' : 'Des bases solides pour agir avec confiance.'}</h1><p>Comprenez les marchés publics, les acteurs et les bonnes pratiques, à votre rythme. Chaque chapitre vous rapproche du niveau approfondi.</p>
        <div className="init-path__progress"><strong>{done} <small>/ {modules.length} modules terminés</small></strong><progress value={done} max={Math.max(1,modules.length)} aria-label="Modules d’initiation terminés" /></div>
        <div className="init-path__deadline"><strong>Cinq jours à compter de votre inscription</strong>{expiresAt && <InitiationCountdown expiresAt={expiresAt} enforced={enforced} />}<p>{expiresAt ? (enforced ? 'Accès ouvert jusqu’au ' : 'Objectif de fin au ') + new Intl.DateTimeFormat('fr-CD', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Kinshasa' }).format(expiresAt) + ' (Kinshasa).' : 'La date d’inscription est en cours de vérification.'} {enforced ? 'Au-delà, un code OTP envoyé à votre email est nécessaire pour réactiver l’accès.' : 'Ce compte à rebours vous aide à organiser votre apprentissage. Aucun blocage automatique n’est activé.'} Vos acquis sont conservés.</p></div>
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
