import React from 'react';
import { BookOpen, Award, MessageCircle, Zap, ChevronRight, Smartphone, Download, WifiOff, Play, ShieldCheck } from 'lucide-react';
import captureHome from '../assets/images/captures/capture_home.jpg';
import phone3D from '../assets/images/slide_foreground_5.png';
import { useLevelSettings, levelLabels } from '../utils/levelSettings';

// Apple style : MacBook centré + Téléphone 3D + Tuto Step-by-step
export const TutorialSection: React.FC<{ onExploreCourses: () => void; onOpenTuteur: () => void }> = ({ onExploreCourses, onOpenTuteur }) => {
  // Échelle de niveaux paramétrable (libellés admin)
  const lvl = levelLabels(useLevelSettings());
  const tutoSteps = [
    {
      n: '01',
      title: 'Installez l’app en un tap',
      desc: 'Ouvrez armpacademia.vercel.app dans Chrome ou Safari → « Installer l’app » / « Ajouter à l’écran d’accueil ». PWA 1,2 Mo, icône ARMP, lancement instantané à Kinshasa, Lubumbashi ou Goma.',
      icon: Download,
    },
    {
      n: '02',
      title: 'Positionnez-vous en 10 min',
      desc: `Lancez le Tuteur IA : test adaptatif ${lvl[0]} → ${lvl[3]}. Il analyse votre profil et recommande vos 2 modules prioritaires sur les 6 (PPM, DAO types, ANO DGCMP 72h, CRD…).`,
      icon: Zap,
    },
    {
      n: '03',
      title: 'Apprenez, même sans internet',
      desc: 'Vidéos, fiches et quiz contextualisés RDC. Téléchargez à Kinshasa, poursuivez à Kikwit, Mbandaka ou Bukavu hors-ligne. Synchronisation Firestore automatique au retour du réseau.',
      icon: BookOpen,
    },
    {
      n: '04',
      title: 'Certifiez-vous & rejoignez la communauté',
      desc: 'Examen 70% DFAT → attestation QR vérifiable, imprimable et enregistrée. Profil vérifié, forum CGPMP/ARMP, partage WhatsApp, 2 500+ apprenants actifs.',
      icon: Award,
    },
  ];

  return (
    <div className="bg-[#fbfbfd] dark:bg-black text-zinc-900 dark:text-white">
      {/* ==================== SECTION 1 : MACBOOK CENTRÉ — GRANDE CAPTURE ==================== */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 pt-16 sm:pt-24 pb-10 sm:pb-14 text-center overflow-hidden">
        <p className="text-[11px] font-bold tracking-[0.18em] text-[#bf4800] uppercase">ACADEMIA ITECH • ARMP RDC • Loi n° 10/010</p>
        <h2 className="mt-3 text-4xl sm:text-5xl lg:text-[56px] font-semibold tracking-[-0.04em] leading-[0.95] text-zinc-900 dark:text-white">
          Devenir Expert<br />dans la commande<br />
          <span className="bg-gradient-to-r from-[#0C3B7C] to-[#0071e3] bg-clip-text text-transparent">Publique</span>
        </h2>
        <p className="mt-5 max-w-3xl mx-auto text-[19px] sm:text-[21px] leading-[1.33] font-normal text-[#6e6e73] dark:text-zinc-400">
          Portail officiel de renforcement des capacités — <strong className="font-semibold text-zinc-900 dark:text-white">République Démocratique du Congo</strong>. 6 modules DFAT, de Kinshasa aux 26 provinces, CGPMP, DGCMP, ARMP & CRD.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-[#f5f5f7] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-medium">📍 Kinshasa • Gombe</span>
          <span className="px-3 py-1 rounded-full bg-[#f5f5f7] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-medium">🏛 47 CGPMP ministérielles</span>
          <span className="px-3 py-1 rounded-full bg-[#f5f5f7] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-medium">⚖ Loi 10/010 • 2010</span>
          <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 font-medium text-amber-800 dark:text-amber-300">🎓 DFAT • 88,6% certifiés</span>
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-6 text-[17px]">
          <button onClick={onExploreCourses} className="inline-flex items-center gap-1.5 text-[#06c] hover:underline font-normal">
            Découvrir les 6 modules <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button onClick={onOpenTuteur} className="inline-flex items-center gap-1.5 text-[#06c] hover:underline font-normal">
            Essayer le Tuteur IA <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* ——— MacBook Pro 14" ——— */}
        <div className="mt-12 sm:mt-16">
          <div className="mx-auto max-w-[980px]">
            <div className="relative">
              {/* Lid / châssis */}
              <div className="relative bg-[#2b2b2e] rounded-t-[18px] sm:rounded-t-[22px] p-[8px] sm:p-[10px] shadow-[0_28px_80px_rgba(0,0,0,0.18)] border border-[#3a3a3e] border-b-0">
                {/* encoche */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 sm:w-24 sm:h-[18px] bg-black rounded-b-[8px] flex items-center justify-center z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1c1c1f] border border-white/10 shadow-inner" />
                </div>
                {/* écran */}
                <div className="rounded-t-[12px] sm:rounded-t-[14px] overflow-hidden bg-black p-[6px] sm:p-[7px] pb-0">
                  {/* barre macOS */}
                  <div className="flex items-center gap-2 px-3 py-[9px] bg-[#1f1f21] rounded-t-[8px] border-b border-white/[0.06]">
                    <div className="flex gap-[6px]">
                      <span className="w-[11px] h-[11px] rounded-full bg-[#ff5f56] border border-black/15 shadow-sm" />
                      <span className="w-[11px] h-[11px] rounded-full bg-[#ffbd2e] border border-black/15 shadow-sm" />
                      <span className="w-[11px] h-[11px] rounded-full bg-[#27c93f] border border-black/15 shadow-sm" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-3 py-1 border border-white/10">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                        <span className="text-[11px] font-medium text-white/90 tracking-wide">armpacademia.vercel.app</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-white/30">
                      <div className="w-7 h-5 rounded-md bg-white/10" />
                      <div className="w-5 h-5 rounded-md bg-white/10" />
                    </div>
                    <div className="w-10 sm:hidden" />
                  </div>
                  {/* capture */}
                  <div className="bg-white overflow-hidden">
                    <img
                      src={captureHome}
                      alt="Capture réelle Academia — page d'accueil"
                      className="w-full h-auto object-cover object-top aspect-[16/10] sm:aspect-[16/9.4]"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
              {/* base / charnière */}
              <div className="h-[13px] sm:h-[15px] bg-gradient-to-b from-[#d8d8dc] via-[#c9c9ce] to-[#b9b9be] rounded-b-[10px] sm:rounded-b-[12px] shadow-[0_10px_24px_rgba(0,0,0,0.14)] border-t border-white/70 mx-[1.6%] relative">
                <div className="absolute inset-x-0 top-0 h-[1px] bg-white/85" />
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-20 sm:w-28 h-[5px] bg-gradient-to-b from-[#b0b0b5] to-[#9ea0a6] rounded-b-[5px] shadow-inner border-x border-white/30" />
              </div>
              {/* ombre portée */}
              <div className="mt-3 h-7 bg-black/[0.08] dark:bg-black/35 blur-[20px] rounded-full mx-8 sm:mx-16" />
              <div className="h-1 bg-black/[0.04] blur-[10px] rounded-full mx-20 sm:mx-32 -mt-1" />
            </div>
          </div>
          <p className="mt-3 text-xs text-[#6e6e73] dark:text-zinc-500">
            Capture réelle — <span className="font-medium text-zinc-900 dark:text-zinc-300">armpacademia.vercel.app</span> sur MacBook Pro 14" • PWA 1,2 Mo • 100% hors-ligne • Firestore
          </p>
        </div>
      </section>

      {/* ==================== SECTION 2 : TÉLÉPHONE 3D + TUTO STEP-BY-STEP ==================== */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 pb-12 sm:pb-16">
        <div className="rounded-[28px] sm:rounded-[32px] bg-[#f5f5f7] dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 overflow-hidden">
          <div className="grid lg:grid-cols-[460px_1fr] xl:grid-cols-[500px_1fr] gap-0">
            {/* — Colonne téléphone — */}
            <div className="relative bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100 dark:from-zinc-800 dark:via-zinc-900 dark:to-black p-8 sm:p-10 lg:p-10 flex flex-col items-center justify-center overflow-hidden">
              {/* formes décoratives */}
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/40 dark:bg-white/[0.04] rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-sky-300/20 dark:bg-sky-900/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(to right,#0C3B7C 1px,transparent 1px),linear-gradient(to bottom,#0C3B7C 1px,transparent 1px)', backgroundSize: '36px 36px' }} />

              <div className="relative">
                {/* label flottant haut */}
                <div className="absolute -top-2 right-0 sm:-right-8 z-20">
                  <div className="inline-flex items-center gap-2 sm:gap-2.5 bg-white dark:bg-zinc-800 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-zinc-200 dark:border-zinc-700 px-2.5 sm:px-3 py-2 sm:py-2.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm shrink-0">
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white fill-white ml-0.5" />
                    </div>
                    <div className="text-left leading-none">
                      <div className="text-[11px] sm:text-xs font-bold tracking-tight text-zinc-900 dark:text-white">Formation vidéo</div>
                      <div className="text-[10px] sm:text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Accès immédiat</div>
                    </div>
                  </div>
                </div>

                {/* téléphone 3D */}
                <img
                  src={phone3D}
                  alt="Application ARMP sur smartphone — Recommandations adaptatives"
                  className="relative z-10 w-[230px] sm:w-[310px] lg:w-[330px] h-auto drop-shadow-[0_24px_48px_rgba(0,0,0,0.22)] select-none"
                  loading="lazy"
                />

                {/* label flottant bas */}
                <div className="absolute -bottom-1 left-0 sm:-left-7 z-20">
                  <div className="inline-flex items-center gap-2 sm:gap-2.5 bg-white dark:bg-zinc-800 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-zinc-200 dark:border-zinc-700 px-2.5 sm:px-3 py-2 sm:py-2.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#0C3B7C] flex items-center justify-center shadow-sm shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="text-left leading-none">
                      <div className="text-[11px] sm:text-xs font-bold tracking-tight text-zinc-900 dark:text-white">Certificat inclus</div>
                      <div className="text-[10px] sm:text-[11px] font-medium text-zinc-500 dark:text-zinc-400">QR vérifiable</div>
                    </div>
                  </div>
                </div>

                {/* badge Lecture flottant bas-droite discret */}
                <div className="absolute bottom-8 -right-2 sm:right-1 z-10 hidden sm:flex">
                  <div className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-full shadow-md border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                    <Play className="w-3.5 h-3.5" /> Lecture
                  </div>
                </div>

                {/* reflet sol */}
                <div className="mx-auto -mt-2 w-[200px] h-3 bg-black/15 dark:bg-black/30 blur-[12px] rounded-full" />
              </div>

              {/* badges Store sous le téléphone */}
              <div className="relative z-10 mt-7 flex flex-wrap items-center justify-center gap-2.5">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); onExploreCourses(); }}
                  className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-black hover:bg-zinc-900 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <path d="M3.6 2.2a1 1 0 0 0-.6.8v17.9c0 .3.2.6.5.8l10.2-9.7L3.6 2.2Z" fill="#4285F4" />
                    <path d="M17.1 13.7 3.7 21.1c.3.3.7.4 1.1.2l12.3-7-0-0.6Z" fill="#34A853" />
                    <path d="M17.1 10.2 4.8 2.9A1.5 1.5 0 0 0 3.6 3v.2L17.1 10.2Z" fill="#FBBC05" />
                    <path d="M20.8 12 17.1 10.2 13.7 12l3.4 1.8L20.8 12Z" fill="#EA4335" />
                    <path d="M20.8 12c0 .4-.2.8-.5 1l-3.2 1.9 3.7-2v-.9Z" fill="#34A853" />
                  </svg>
                  <div className="text-left leading-none">
                    <div className="text-[9px] font-semibold tracking-widest uppercase opacity-80">Disponible sur</div>
                    <div className="text-[13px] font-bold -mt-0.5">Google Play</div>
                  </div>
                </a>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); onExploreCourses(); }}
                  className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-black hover:bg-zinc-900 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <svg width="16" height="18" viewBox="0 0 24 24" fill="white" className="shrink-0">
                    <path d="M12.04 2c-1.9 0-3.2 1-4 2.1-.8 1-1.1 2.4-.9 3.7 1.1.1 2.2-.4 2.9-1.2.7-.8 1.1-1.9.9-3-.5 0-1.1-.1-1.6-.4-.5-.3-1-.8-1.3-1.4.6-.7 1.5-1.2 2.4-1.4.8-.2 1.7-.1 2.4.3-.1.6-.3 1.1-.8 1.3ZM12 8.8c-1.4 0-2.2.7-3.2.7-.9 0-1.7-.7-2.6-.7-1.3 0-2.5.8-3.2 2-.9 1.6-.7 3.7.5 5.2.6.8 1.4 1.6 2.3 1.6.9 0 1.2-.6 2.1-.6.9 0 1.1.6 2 .6 1 0 1.6-.9 2.2-1.6.6-.8 1-1.5 1-2.5 0-.9-.4-1.5-1-2-.6-.5-1.5-.8-2.1-.7Z" />
                  </svg>
                  <div className="text-left leading-none">
                    <div className="text-[9px] font-semibold tracking-wide opacity-80">Télécharger dans</div>
                    <div className="text-[13px] font-bold -mt-0.5">l’App Store</div>
                  </div>
                </a>
              </div>
              <p className="mt-3 text-[11px] font-medium tracking-wide text-zinc-500 dark:text-zinc-400">PWA • Offline • 24/7 • QR • 1,2 Mo</p>
            </div>

            {/* — Colonne tuto steps — */}
            <div className="bg-white dark:bg-zinc-900 p-8 sm:p-10 lg:p-10 xl:p-12">
              <p className="text-[11px] font-bold tracking-[0.18em] text-[#bf4800] uppercase flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5" /> Tutoriel • 4 étapes • Mobile & Mac
              </p>
              <h3 className="mt-3 text-[28px] sm:text-[32px] lg:text-[34px] font-semibold tracking-[-0.03em] leading-[1.05] text-zinc-900 dark:text-white">
                L’ARMP dans<br />votre poche.<br />
                <span className="bg-gradient-to-r from-[#0C3B7C] to-[#0071e3] bg-clip-text text-transparent">Commencez ici.</span>
              </h3>
              <p className="mt-3 text-[15px] sm:text-[16px] leading-[1.5] text-[#6e6e73] dark:text-zinc-400">
                Installez la PWA 1,2 Mo à Kinshasa, poursuivez sans réseau jusqu’à Kikwit. Le Tuteur IA vous guide jusqu’à l’attestation DFAT.
              </p>

              {/* Steps timeline */}
              <div className="mt-8 relative">
                {/* ligne verticale */}
                <div className="absolute left-[19px] top-2 bottom-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
                <div className="space-y-5">
                  {tutoSteps.map((s) => (
                    <div key={s.n} className="relative flex gap-4 sm:gap-5">
                      <div className="shrink-0 w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center text-[11px] font-extrabold tracking-widest text-[#0C3B7C] dark:text-white z-10">
                        {s.n}
                      </div>
                      <div className="flex-1 rounded-2xl bg-[#f5f5f7] dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-700/60 p-4 sm:p-5 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="hidden sm:flex w-8 h-8 rounded-xl bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 items-center justify-center shrink-0 shadow-sm">
                            <s.icon className="w-4 h-4 text-[#0C3B7C] dark:text-white" strokeWidth={1.9} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 sm:hidden mb-1.5">
                              <s.icon className="w-4 h-4 text-[#0C3B7C] dark:text-white" strokeWidth={1.9} />
                            </div>
                            <div className="font-semibold text-[15px] sm:text-[16px] leading-tight text-zinc-900 dark:text-white">{s.title}</div>
                            <div className="mt-1.5 text-[13.5px] sm:text-[14px] leading-[1.55] text-[#6e6e73] dark:text-zinc-400">{s.desc}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={onExploreCourses}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold text-[15px] shadow-sm active:scale-[0.98] transition"
                >
                  Explorer les 6 modules
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenTuteur}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#f5f5f7] dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-semibold text-[15px] transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  Parler au Tuteur IA
                </button>
              </div>
              <p className="mt-3 text-xs text-[#6e6e73] dark:text-zinc-500">Gratuit • Sans installation lourde • Compatible Android, iOS, Windows, macOS</p>
            </div>
          </div>
        </div>

        {/* note légale discrète */}
        <p className="mt-6 text-center text-[11px] leading-[1.5] text-zinc-500 dark:text-zinc-500 max-w-3xl mx-auto">
          Contenus contextualisés RDC — PPM, DAO types, avis de non-objection DGCMP 72h, recours CRD, audit CGPMP. Attestations DFAT avec QR vérifiable, enregistrées dans Firestore.
        </p>
      </section>
    </div>
  );
};
