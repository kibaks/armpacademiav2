import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Pause, Play } from 'lucide-react';
import trainingImage from '../assets/images/formation_numerique_1789983181347.jpg';
import procurementImage from '../assets/images/marches_publics_seminar_1789983166275.jpg';
import expertiseImage from '../assets/images/expert_audit_cgpmp_1789983194702.jpg';

const slides = [
  { image: trainingImage, category: 'APPRENDRE. PROGRESSER. RÉUSSIR.', title: 'Votre expertise,\nun nouvel horizon.', description: 'Des formations pour développer vos compétences et faire avancer la commande publique.', position: '46% center', label: 'Formation et compétences' },
  { image: procurementImage, category: 'LA COMMANDE PUBLIQUE EN PRATIQUE', title: 'Les bons savoirs.\nLes bonnes décisions.', description: 'Approfondissez vos connaissances et abordez chaque marché avec confiance.', position: '36% center', label: 'Marchés publics' },
  { image: expertiseImage, category: 'GRANDIR ENSEMBLE', title: 'Un parcours qui\nvous ressemble.', description: 'Retrouvez vos cours, suivez votre progression et construisez votre avenir professionnel.', position: '58% center', label: 'Parcours professionnel' },
];

export function AuthShowcase({ onClose }: { onClose?: () => void }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setVisible(document.visibilityState === 'visible');
    updateMotion(); updateVisibility();
    media.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      media.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (paused || hovered || focused || reducedMotion || !visible) return;
    const timer = window.setInterval(() => setActive(value => (value + 1) % slides.length), 7000);
    return () => window.clearInterval(timer);
  }, [paused, hovered, focused, reducedMotion, visible]);

  const select = (index: number) => { setActive((index + slides.length) % slides.length); setPaused(true); };
  const slide = slides[active];

  return <aside className="auth-showcase" aria-label="Découvrir ACADEMIA" aria-roledescription="carrousel"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className="auth-showcase__images" aria-hidden="true">
      {slides.map((item, index) => <img key={item.image} src={item.image} alt="" loading={index === 0 ? 'eager' : 'lazy'} decoding="async"
        className={`auth-showcase__image ${active === index ? 'is-active' : ''}`} style={{ objectPosition: item.position }} />)}
    </div>
    <div className="auth-showcase__shade" />
    <header className="auth-showcase__header">
      <div className="auth-showcase__identity"><BookOpen size={25} strokeWidth={1.6} aria-hidden="true" /><div><strong>ACADEMIA</strong><span>LA FORMATION PAR L’ARMP RDC</span></div></div>
      {onClose && <button type="button" className="auth-showcase__back" aria-label="Retour au portail" onClick={onClose}><ArrowLeft size={16} aria-hidden="true" /><span>Retour au portail</span></button>}
    </header>
    <div className="auth-showcase__bottom">
      <div className="auth-showcase__caption">
        <p className="auth-showcase__category"><span />{slide.category}</p>
        <h1>{slide.title}</h1>
        <p className="auth-showcase__description">{slide.description}</p>
      </div>
      <div className="auth-showcase__navigation">
        <div className="auth-showcase__pagination" aria-label="Choisir une image">
          {slides.map((item, index) => <button type="button" key={item.label} aria-label={`Afficher l’image ${index + 1} : ${item.label}`} aria-pressed={active === index}
            onClick={() => select(index)}><span className={active === index ? 'is-active' : ''} /></button>)}
        </div>
        <span className="auth-showcase__counter" aria-hidden="true">0{active + 1}<span> / 0{slides.length}</span></span>
        <div className="auth-showcase__controls">
          {!reducedMotion && <button type="button" aria-label={paused ? 'Reprendre le diaporama' : 'Mettre le diaporama en pause'} onClick={() => setPaused(value => !value)}>{paused ? <Play size={15} /> : <Pause size={15} />}</button>}
          <button type="button" aria-label="Image précédente" onClick={() => select(active - 1)}><ArrowLeft size={18} /></button>
          <button type="button" aria-label="Image suivante" onClick={() => select(active + 1)}><ArrowRight size={18} /></button>
        </div>
      </div>
    </div>
  </aside>;
}
