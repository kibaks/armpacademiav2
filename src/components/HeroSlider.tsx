import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Play,
  Pause,
  Sparkles,
  BookOpen,
  Award,
  Smartphone,
  GraduationCap,
  Building2,
  ShieldCheck,
  Factory
} from 'lucide-react';

import bgSeminar from '../assets/images/marches_publics_seminar_1789983166275.jpg';
import bgTraining from '../assets/images/formation_numerique_1789983181347.jpg';
import bgAudit from '../assets/images/expert_audit_cgpmp_1789983194702.jpg';
import fg1 from '../assets/images/slide_foreground_1.webp';
import fg2 from '../assets/images/slide_foreground_2.webp';
import fg3 from '../assets/images/slide_foreground_3.webp';
import fg4 from '../assets/images/slide_foreground_4.webp';
import fg5 from '../assets/images/slide_foreground_5.webp';

interface HeroSliderProps {
  onExploreCourses: () => void;
  onOpenTuteur: () => void;
  onOpenPlacement: () => void;
  isDarkMode?: boolean;
}

const SLIDES = [
  {
    id: 1,
    bg: bgSeminar,
    foreground: fg1,
    badge: 'CGPMP  •  47 Cellules  •  Membre Acheteur',
    badgeIcon: Building2,
    title: 'Membre CGPMP',
    titleAccent: 'sécurisez chaque marché',
    description: 'PPM conforme, DAO types ARMP, avis de non-objection DGCMP en 72h et recours CRD maîtrisés. Intégrez le contenu local dès l’allotissement — préférence 20%, sous-traitance 51% capital RDC contrôlée par l’ARSP — et évitez toute irrecevabilité.',
    ctaPrimary: 'Explorer les formations',
    ctaSecondary: 'Tester mon niveau',
    stat: 'ANO 72h  •  Recours CRD  •  0 rejet',
  },
  {
    id: 2,
    bg: bgAudit,
    foreground: fg3,
    badge: 'ARMP  •  Régulation  •  Agent de Contrôle',
    badgeIcon: ShieldCheck,
    title: 'Agent ARMP',
    titleAccent: 'régulez avec autorité',
    description: 'Passez de l’audit a posteriori au contrôle préventif. Maîtrisez la jurisprudence CRD, le contrôle a priori DGCMP et la vérification du contenu local : 51% capital congolais, activités réservées, attestations ARSP pour une commande crédible et traçable.',
    ctaPrimary: 'Découvrir la méthode',
    ctaSecondary: 'Voir la jurisprudence',
    stat: 'ARSP  •  Contrôle  •  Traçabilité',
  },
  {
    id: 3,
    bg: bgTraining,
    foreground: fg2,
    badge: 'PME  •  Contenu Local  •  51% Capital RDC',
    badgeIcon: Factory,
    title: 'PME & Opérateurs',
    titleAccent: 'captez le contenu local',
    description: 'La loi vous réserve des marchés : sous-traitance obligatoire 51% aux Congolais, préférence nationale et cotraitance. Apprenez à lire un DAO, chiffrer juste, vous grouper et répondre sans erreur. Votre atelier, votre chantier, votre marché — enfin à portée.',
    ctaPrimary: 'Commencer maintenant',
    ctaSecondary: 'Voir les opportunités',
    stat: 'Préférence 20%  •  Groupement  •  51% RDC',
  },
  {
    id: 4,
    bg: bgSeminar,
    foreground: fg4,
    badge: 'Certification  •  Attestation QR  •  Évolution Carrière',
    badgeIcon: Award,
    title: 'Valorisez vos',
    titleAccent: 'compétences',
    description: 'Que vous soyez CGPMP, ARMP ou PME, obtenez l’attestation DFAT 70% avec QR vérifiable Firestore. Rejoignez 2 500+ alumni, faites reconnaître votre expertise contenu local et faites évoluer votre carrière ou votre entreprise.',
    ctaPrimary: 'Obtenir ma certification',
    ctaSecondary: 'Voir les attestations',
    stat: 'QR vérifiable  •  Alumni 2 500+',
  },
  {
    id: 5,
    bg: bgTraining,
    foreground: fg5,
    badge: 'Application Mobile  •  PWA 1,2 Mo  •  100% Hors-ligne',
    badgeIcon: Smartphone,
    title: 'L\'ARMP dans',
    titleAccent: 'votre poche',
    description: 'Installez l’app en un tap à Kinshasa, Lubumbashi ou Goma. 6 modules dont contenu local, vidéos et attestations accessibles sur smartphone, même sans internet — synchronisation Firestore au retour.',
    ctaPrimary: 'Installer l\'application',
    ctaSecondary: 'Voir la capture',
    stat: 'PWA  •  Offline  •  24/7  •  QR',
  },
];

export const HeroSlider: React.FC<HeroSliderProps> = ({
  onExploreCourses,
  onOpenTuteur,
  onOpenPlacement,
}) => {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const id = setInterval(() => setCurrent((p) => (p + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, [isAutoPlaying]);

  const active = SLIDES[current];
  const BadgeIcon = active.badgeIcon;
  const isLargeImage = active.id === 1 || active.id === 4; // trois personnes + diplômée
  const isPhoneSlide = active.id === 5; // téléphone 3D

  const go = (dir: number) => setCurrent((p) => (p + dir + SLIDES.length) % SLIDES.length);

  return (
    <div className="relative overflow-x-hidden select-none w-full max-w-[100vw]">
      {/* ===== SLIDER BLEU CIEL - RESPONSIVE MOBILE / TABLETTE / DESKTOP ===== */}
      <div className="relative min-h-[590px] sm:min-h-[620px] lg:min-h-0 lg:h-[560px] xl:h-[580px] w-full max-w-[100vw] bg-sky-100 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            {/* Fond bleu ciel uni */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-sky-200 to-blue-200" />

            {/* Overlay image très subtile */}
            <motion.div
              initial={{ scale: 1.06 }}
              animate={{ scale: 1 }}
              transition={{ duration: 7, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              <img
                src={active.bg}
                alt=""
                className="w-full h-full object-cover opacity-[0.10] mix-blend-luminosity"
              />
              {/* Voile bleu ciel pour garder la teinte */}
              <div className="absolute inset-0 bg-gradient-to-r from-sky-200/70 via-sky-100/60 to-blue-200/50" />
              <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-white/10" />
            </motion.div>

            {/* Formes décoratives bleu ciel - clippées pour éviter décalage droite */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-24 -right-24 w-[520px] h-[520px] bg-white/35 rounded-full blur-3xl" />
              <div className="absolute -bottom-32 -left-32 w-[640px] h-[640px] bg-sky-300/20 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full blur-2xl" />
            </div>

            {/* Grid léger */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #0C3B7C 1px, transparent 1px), linear-gradient(to bottom, #0C3B7C 1px, transparent 1px)',
                backgroundSize: '72px 72px',
              }}
            />

            {/* ===== CONTENU - IMAGE AU MÊME NIVEAU QUE TEXTE ===== */}
            <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
              <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 sm:gap-6 lg:gap-8 items-center h-full pt-5 pb-14 sm:py-6">
                {/* TEXTE - CENTRÉ SUR MOBILE, ALIGNÉ GAUCHE SUR DESKTOP */}
                <div className="relative z-10 flex flex-col justify-center space-y-3 sm:space-y-4 lg:space-y-5 text-center lg:text-left order-1 px-2 sm:px-6 lg:px-0">
                  {/* Badge */}
                  <motion.div
                    initial={{ y: 14, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.6, ease: 'easeOut' }}
                    className="inline-flex self-center lg:self-start items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-sky-200 shadow-sm max-w-full"
                  >
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0C3B7C] flex items-center justify-center shrink-0">
                      <BadgeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold tracking-wide text-[#0C3B7C] uppercase truncate">
                      {active.badge}
                    </span>
                  </motion.div>

                  {/* Titre - FIX P coupé : leading 1.0 + overflow-visible + pb */}
                  <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="text-[26px] sm:text-[38px] lg:text-[52px] xl:text-[58px] font-black tracking-[-0.04em] leading-[1.02] lg:leading-[0.95] text-[#0C3B7C] overflow-visible pb-1 sm:pb-2"
                    style={{ overflow: 'visible', paddingBottom: '0.12em' }}
                  >
                    <span className="block overflow-visible pb-0.5 sm:pb-1">{active.title}</span>
                    <span className="block overflow-visible pb-1 sm:pb-2 bg-gradient-to-r from-[#0C3B7C] via-[#1e5bb5] to-[#0EA5E9] bg-clip-text text-transparent">
                      {active.titleAccent}
                    </span>
                  </motion.h1>

                  {/* Description */}
                  <motion.p
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.38, duration: 0.6 }}
                    className="text-[13.5px] sm:text-[16px] lg:text-[17px] leading-[1.55] sm:leading-[1.6] font-medium text-slate-700 max-w-[560px] mx-auto lg:mx-0 line-clamp-4 sm:line-clamp-none"
                  >
                    {active.description}
                  </motion.p>

                  {/* CTAs - Store badges pour téléphone, sinon CTA classiques */}
                  {isPhoneSlide ? (
                    <motion.div
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.48, duration: 0.6 }}
                      className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2"
                    >
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); onExploreCourses(); }}
                        className="group inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-black hover:bg-zinc-900 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
                          <path d="M3.6 2.2a1 1 0 0 0-.6.8v17.9c0 .3.2.6.5.8l10.2-9.7L3.6 2.2Z" fill="#4285F4"/>
                          <path d="M17.1 13.7 3.7 21.1c.3.3.7.4 1.1.2l12.3-7-0-0.6Z" fill="#34A853"/>
                          <path d="M17.1 10.2 4.8 2.9A1.5 1.5 0 0 0 3.6 3v.2L17.1 10.2Z" fill="#FBBC05"/>
                          <path d="M20.8 12 17.1 10.2 13.7 12l3.4 1.8L20.8 12Z" fill="#EA4335"/>
                          <path d="M20.8 12c0 .4-.2.8-.5 1l-3.2 1.9 3.7-2v-.9Z" fill="#34A853"/>
                        </svg>
                        <div className="text-left leading-none">
                          <div className="text-[10px] font-medium tracking-widest uppercase opacity-90">Disponible sur</div>
                          <div className="text-[15px] font-bold tracking-tight">Google Play</div>
                        </div>
                      </a>
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); onExploreCourses(); }}
                        className="group inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-black hover:bg-zinc-900 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                      >
                        <svg width="18" height="20" viewBox="0 0 24 24" fill="white" className="shrink-0">
                          <path d="M12.04 2c-1.9 0-3.2 1-4 2.1-.8 1-1.1 2.4-.9 3.7 1.1.1 2.2-.4 2.9-1.2.7-.8 1.1-1.9.9-3-.5 0-1.1-.1-1.6-.4-.5-.3-1-.8-1.3-1.4.6-.7 1.5-1.2 2.4-1.4.8-.2 1.7-.1 2.4.3-.1.6-.3 1.1-.8 1.3ZM12 8.8c-1.4 0-2.2.7-3.2.7-.9 0-1.7-.7-2.6-.7-1.3 0-2.5.8-3.2 2-.9 1.6-.7 3.7.5 5.2.6.8 1.4 1.6 2.3 1.6.9 0 1.2-.6 2.1-.6.9 0 1.1.6 2 .6 1 0 1.6-.9 2.2-1.6.6-.8 1-1.5 1-2.5 0-.9-.4-1.5-1-2-.6-.5-1.5-.8-2.1-.7Z"/>
                        </svg>
                        <div className="text-left leading-none">
                          <div className="text-[10px] font-medium tracking-wide opacity-90">Télécharger dans</div>
                          <div className="text-[15px] font-bold tracking-tight">l'App Store</div>
                        </div>
                      </a>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.48, duration: 0.6 }}
                      className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1"
                    >
                      <button
                        onClick={onExploreCourses}
                        className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0C3B7C] hover:bg-[#0a2f63] text-white font-bold text-sm shadow-lg shadow-[#0C3B7C]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                      >
                        <span>{active.ctaPrimary}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      <button
                        onClick={() => (current === 0 ? onOpenPlacement() : onOpenTuteur())}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white hover:bg-sky-50 text-[#0C3B7C] font-bold text-sm border border-sky-200 shadow-sm hover:shadow-md transition"
                      >
                        <Sparkles className="w-4 h-4 text-sky-500" />
                        <span>{active.ctaSecondary}</span>
                      </button>
                    </motion.div>
                  )}

                  {/* Mini stat */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-slate-600 pt-1 justify-center lg:justify-start"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {active.stat}
                  </motion.div>
                </div>

                {/* IMAGE - HANCHE AU RAS DU BAS OU TELEPHONE 3D CENTRÉ */}
                <div className="relative order-2 flex items-end justify-center h-[210px] sm:h-[250px] lg:h-[560px] xl:h-[580px] pointer-events-none lg:pl-2 self-end overflow-visible">
                  {/* Encadré transparent qui touche le bas */}
                  <motion.div
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.8 }}
                    className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-center pointer-events-none"
                  >
                    <div className="w-full h-full bg-transparent border border-white/20 rounded-[1.5rem] lg:rounded-[1.75rem] rounded-b-none border-b-0 shadow-none" />
                  </motion.div>

                  {isPhoneSlide ? (
                    /* Téléphone 3D - centré, flottant, avec capture */
                    <motion.div
                      initial={{ y: 30, opacity: 0, scale: 0.92 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ delay: 0.32, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0 flex items-center justify-center overflow-visible"
                    >
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                        className="relative flex items-center justify-center"
                      >
                        <motion.img
                          src={active.foreground}
                          alt={active.title}
                          className="w-auto h-[210px] sm:h-[260px] lg:h-[520px] xl:h-[540px] object-contain drop-shadow-[0_24px_48px_rgba(12,59,124,0.28)]"
                          style={{ filter: 'drop-shadow(0 20px 40px rgba(12,59,124,0.22))' }}
                        />
                        {/* Reflet sol */}
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[180px] h-[24px] bg-slate-900/10 rounded-full blur-xl pointer-events-none" />
                      </motion.div>
                    </motion.div>
                  ) : (
                  <motion.div
                    initial={{ x: 30, opacity: 0, scale: 0.96 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.32, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-center overflow-visible"
                  >
                    <motion.img
                      src={active.foreground}
                      alt={active.title}
                      className={`w-auto object-contain object-bottom origin-bottom drop-shadow-[0_16px_32px_rgba(12,59,124,0.16)] absolute bottom-0 left-1/2 -translate-x-1/2 ${
                        isLargeImage
                          ? 'h-[105%] sm:h-[115%] lg:h-[142%] xl:h-[152%] max-h-[230px] sm:max-h-[280px] lg:max-h-[780px] xl:max-h-[860px] scale-[1.08] sm:scale-[1.18] lg:scale-[1.52] xl:scale-[1.62]'
                          : 'h-[100%] sm:h-[110%] lg:h-[128%] xl:h-[134%] max-h-[210px] sm:max-h-[260px] lg:max-h-[660px] xl:max-h-[720px] scale-[1.05] sm:scale-[1.12] lg:scale-[1.34] xl:scale-[1.40]'
                      }`}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                      style={{ filter: 'drop-shadow(0 12px 24px rgba(12,59,124,0.14))', bottom: '0px' }}
                    />
                  </motion.div>
                  )}

                  {/* Badge flottant */}
                  <motion.div
                    initial={{ y: 10, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="absolute top-6 right-6 lg:right-10 hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-white shadow-xl border border-sky-100"
                  >
                    <span className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </span>
                    <div className="text-left leading-tight">
                      <div className="text-xs font-black text-slate-900">Formation vidéo</div>
                      <div className="text-[11px] font-medium text-slate-500">Accès immédiat</div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.85, duration: 0.6 }}
                    className="absolute bottom-10 left-0 lg:left-6 hidden sm:flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[#0C3B7C] shadow-xl text-white"
                  >
                    <span className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </span>
                    <div className="leading-tight">
                      <div className="text-xs font-bold">Certificat inclus</div>
                      <div className="text-[11px] font-medium text-sky-200">QR vérifiable</div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Flèches */}
        <button
          onClick={() => go(-1)}
          className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#0C3B7C] shadow-lg border border-sky-100 flex items-center justify-center backdrop-blur-md transition z-20 hover:scale-105 active:scale-95"
          aria-label="Précédent"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => go(1)}
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#0C3B7C] shadow-lg border border-sky-100 flex items-center justify-center backdrop-blur-md transition z-20 hover:scale-105 active:scale-95"
          aria-label="Suivant"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Contrôles bas */}
        <div className="absolute bottom-4 sm:bottom-5 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between z-20">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-full px-2 py-1.5 border border-white/60 shadow-sm">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-400 ${
                  i === current ? 'w-7 bg-[#0C3B7C]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-sky-100 text-xs font-bold text-[#0C3B7C] shadow-sm hover:bg-white transition"
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAutoPlaying ? 'Pause' : 'Lecture'}</span>
          </button>
        </div>
      </div>

      {/* ===== BANDEAU FORMATION (remplace ARMP/DGCMP) ===== */}
      <div className="border-t border-sky-100 bg-white px-4 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 text-center">
          {[
            { k: '6 Modules', v: 'Parcours progressif', icon: BookOpen },
            { k: '45h+ de contenu', v: 'Vidéos • Cas pratiques', icon: Play },
            { k: '2 500+ apprenants', v: 'Communauté active', icon: Sparkles },
            { k: 'Attestation', v: 'QR vérifiable • 24/7', icon: Award },
          ].map((it, idx) => (
            <div key={it.k} className={`px-2 sm:px-4 py-1.5 ${idx % 2 === 0 ? 'border-r border-sky-100' : ''} ${idx < 2 ? 'border-b lg:border-b-0 border-sky-100 pb-3 lg:pb-1.5' : ''} lg:border-r lg:last:border-r-0`}>
              <div className="flex items-center justify-center gap-1.5 text-[#0C3B7C] text-[11px] font-black uppercase tracking-wider">
                <it.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{it.k}</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">{it.v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
