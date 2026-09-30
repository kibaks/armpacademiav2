import React from 'react';
import { Factory, ShieldCheck, Users, Award, ArrowRight, ChevronRight, Building2, FileCheck, TrendingUp, MapPin, Hammer } from 'lucide-react';

export const ContenuLocalSection: React.FC<{ onExploreCourses: () => void; onOpenTuteur: () => void }> = ({ onExploreCourses, onOpenTuteur }) => {
  return (
    <div className="bg-white dark:bg-black text-zinc-900 dark:text-white border-t border-zinc-100 dark:border-zinc-900">
      {/* ===== Header ===== */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 pt-14 sm:pt-20 pb-8 text-center">
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#bf4800] uppercase">Contenu Local • Loi 17/001 • ARSP • Loi 10/010</p>
        <h2 className="mt-3 text-4xl sm:text-5xl lg:text-[52px] font-semibold tracking-[-0.04em] leading-[0.95] text-zinc-900 dark:text-white">
          Le contenu local,<br />
          <span className="bg-gradient-to-r from-[#0C3B7C] to-[#0071e3] bg-clip-text text-transparent">votre part qui vous revient.</span>
        </h2>
        <p className="mt-5 max-w-3xl mx-auto text-[19px] sm:text-[20px] leading-[1.35] font-normal text-[#6e6e73] dark:text-zinc-400">
          La loi vous réserve des marchés. L’<strong className="font-semibold text-zinc-900 dark:text-white">ARSP</strong> l’atteste. Nous vous apprenons à les gagner — de Kinshasa à Kolwezi, de l’atelier à l’entreprise.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-[#f5f5f7] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-medium inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> 51% capital RDC exigé
          </span>
          <span className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 font-medium text-amber-900 dark:text-amber-200">Préférence 20% prix</span>
          <span className="px-3 py-1.5 rounded-full bg-[#f5f5f7] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-medium">ARSP • Attestation obligatoire</span>
          <span className="px-3 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 font-medium text-sky-900 dark:text-sky-200">Activités réservées</span>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-4 text-[15px]">
          <button onClick={onExploreCourses} className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold shadow-sm active:scale-[0.98] transition">
            Voir le module Contenu Local <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={onOpenTuteur} className="inline-flex items-center gap-1.5 text-[#06c] hover:underline font-medium">
            Vérifier mon éligibilité ARSP <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { k: '51%', l1: 'Capital détenu', l2: 'par des Congolais', sub: 'Loi 17/001 • ARSP' },
            { k: '20%', l1: 'Marge de préférence', l2: 'nationale au prix', sub: 'Code marchés publics' },
            { k: '300+', l1: 'Activités réservées', l2: 'à la sous-traitance', sub: 'Liste ARSP • 2024' },
          ].map((s) => (
            <div key={s.k} className="rounded-[20px] bg-[#f5f5f7] dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-6 text-center">
              <div className="text-[36px] font-black tracking-tight text-[#0C3B7C] dark:text-white leading-none">{s.k}</div>
              <div className="mt-2 text-[13px] font-bold leading-tight text-zinc-900 dark:text-zinc-100">
                {s.l1}
                <br />
                {s.l2}
              </div>
              <div className="mt-1 text-[11px] font-medium text-[#6e6e73] dark:text-zinc-500">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 3 Piliers ===== */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 mt-10">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pilier 1 */}
          <div className="rounded-[24px] bg-[#0C3B7C] text-white p-7 sm:p-8 flex flex-col overflow-hidden relative">
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-sky-400/20 rounded-full blur-2xl" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                <Factory className="w-5 h-5 text-white" />
              </div>
              <h3 className="mt-4 text-[20px] font-semibold leading-tight">
                Sous-traitance<br />réservée & contrôlée
              </h3>
              <p className="mt-3 text-[14px] leading-[1.5] text-sky-100">
                Loi 17/001 : toute sous-traitance privée &gt; 51% capital RDC. ARSP délivre l’attestation, contrôle et sanction. Sans elle, pas de marché.
              </p>
              <ul className="mt-5 space-y-2.5 text-[13px] leading-[1.5]">
                <li className="flex gap-2.5">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />{' '}
                  <span>
                    <strong className="font-semibold text-white">51% capital</strong> détenu par Congolais — personne physique ou morale
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" /> Activités réservées : gardiennage, restauration, transport, BTP léger…
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" /> Attestation ARSP obligatoire avant signature
                </li>
              </ul>
              <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-200 border border-white/15 rounded-full px-3 py-1.5 bg-white/5">
                <ShieldCheck className="w-3.5 h-3.5" /> ARSP • Kinshasa • Contrôle terrain
              </div>
            </div>
          </div>

          {/* Pilier 2 */}
          <div className="rounded-[24px] bg-[#f5f5f7] dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-7 sm:p-8 flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm">
              <Award className="w-5 h-5 text-white" />
            </div>
            <h3 className="mt-4 text-[20px] font-semibold leading-tight text-zinc-900 dark:text-white">
              Préférence nationale
              <br />
              qui fait la différence
            </h3>
            <p className="mt-3 text-[14px] leading-[1.5] text-[#6e6e73] dark:text-zinc-400">
              Dans les marchés publics, l’offre d’une PME congolaise bénéficie d’une marge de 15 à 20% à l’évaluation. Bien chiffrer = gagner.
            </p>
            <ul className="mt-5 space-y-2.5 text-[13px] leading-[1.5] text-zinc-700 dark:text-zinc-300">
              <li className="flex gap-2.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#0C3B7C] shrink-0" />{' '}
                <span>
                  <strong className="font-semibold text-zinc-900 dark:text-white">Marge 20%</strong> : une offre à 120 M CDF peut battre une offre étrangère à 100 M
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#0C3B7C] shrink-0" /> Critère d’allotissement : découpez pour que la PME puisse répondre
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#0C3B7C] shrink-0" /> Pièces : RCCM, attestation ARSP, capacité technique allégée
              </li>
            </ul>
            <div className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-[#0C3B7C] dark:text-sky-300">
              <TrendingUp className="w-4 h-4" /> Votre prix devient compétitif, légalement
            </div>
          </div>

          {/* Pilier 3 */}
          <div className="rounded-[24px] bg-[#f5f5f7] dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-7 sm:p-8 flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="mt-4 text-[20px] font-semibold leading-tight text-zinc-900 dark:text-white">
              Groupement &
              <br />
              financement
            </h3>
            <p className="mt-3 text-[14px] leading-[1.5] text-[#6e6e73] dark:text-zinc-400">
              Vous n’avez pas tout ? Groupez-vous. Cotraitance solidaire, groupement momentané d’entreprises (GME) et accès financement PME.
            </p>
            <ul className="mt-5 space-y-2.5 text-[13px] leading-[1.5] text-zinc-700 dark:text-zinc-300">
              <li className="flex gap-2.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> GME : additionnez vos capacités (chiffre d’affaires, matériel, personnel)
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> Garantie bancaire allégée PME + avance de démarrage 30%
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> Partage du marché local : vous exécutez, vous apprenez, vous grandissez
              </li>
            </ul>
            <div className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <Building2 className="w-4 h-4" /> De l’atelier à l’entreprise structurée
            </div>
          </div>
        </div>
      </section>

      {/* ===== Parcours PME ===== */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 mt-8">
        <div className="rounded-[28px] bg-[#fbfbfd] dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-[11px] font-bold tracking-[0.18em] text-[#bf4800] uppercase">Parcours PME • 4 étapes • Attestation ARSP</p>
              <h3 className="mt-2 text-[24px] sm:text-[28px] font-semibold tracking-tight leading-[1.1] text-zinc-900 dark:text-white">
                Votre parcours contenu local,
                <br />
                <span className="text-[#0071e3]">de l’idée au marché.</span>
              </h3>
              <p className="mt-3 text-[14px] leading-[1.5] text-[#6e6e73] dark:text-zinc-400">
                Chaque étape est un module Academia. Suivez-les dans l’ordre, obtenez votre attestation et présentez-vous serein devant l’acheteur public.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <button
                onClick={onExploreCourses}
                className="px-5 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold shadow-sm active:scale-[0.98] transition inline-flex items-center gap-1.5"
              >
                Explorer le module PME <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenTuteur}
                className="px-5 py-2.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
              >
                Parler à l’expert contenu local
              </button>
            </div>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                n: '01',
                icon: Building2,
                title: 'Se former & se mettre en règle',
                desc: 'Créez votre entreprise (RCCM), obtenez l’attestation ARSP et formez-vous au Code des marchés (Loi 10/010).',
                color: 'bg-sky-500',
              },
              {
                n: '02',
                icon: FileCheck,
                title: 'Lire un DAO & chiffrer juste',
                desc: 'Décortiquez le DAO type ARMP : CCTP, allotissement, critères, contenu local. Chiffrez avec la marge 20%.',
                color: 'bg-amber-500',
              },
              {
                n: '03',
                icon: Users,
                title: 'Se grouper & répondre',
                desc: 'Constituez un GME, réunissez les pièces (ARSP, CNSS, fisc) et déposez sur le portail sans erreur.',
                color: 'bg-emerald-500',
              },
              {
                n: '04',
                icon: Hammer,
                title: 'Exécuter & grandir',
                desc: 'Exécutez le marché, facturez, encaissez l’avance 30%, capitalisez et répondez plus gros demain.',
                color: 'bg-[#0C3B7C]',
              },
            ].map((s) => (
              <div key={s.n} className="rounded-[18px] bg-white dark:bg-black border border-zinc-200/70 dark:border-zinc-800 p-5 sm:p-6 flex flex-col">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${s.color} text-white flex items-center justify-center text-[11px] font-black`}>{s.n}</div>
                  <s.icon className="w-5 h-5 text-zinc-900 dark:text-white" strokeWidth={1.8} />
                </div>
                <div className="mt-4 font-semibold text-[14px] leading-tight text-zinc-900 dark:text-white">{s.title}</div>
                <div className="mt-2 text-[13px] leading-[1.5] text-[#6e6e73] dark:text-zinc-400">{s.desc}</div>
                <div className="mt-4 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div className={`h-full ${s.color}`} style={{ width: `${parseInt(s.n) * 25}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-500">
            <MapPin className="w-3.5 h-3.5" /> Kinshasa • Lubumbashi • Goma • Kolwezi • Matadi • Kananga — votre province, votre marché.
          </div>
        </div>
      </section>

      {/* ===== Note ARSP ===== */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 mt-6 pb-12 sm:pb-16">
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-5 sm:p-6 flex gap-4">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="text-[13px] leading-[1.6] text-amber-900 dark:text-amber-100">
            <strong className="font-semibold">À retenir :</strong> La sous-traitance sans attestation ARSP est nulle (Loi 17/001, art. 6). L’acheteur public doit vérifier. Academia vous prépare : module <em>Contenu Local & ARSP</em> avec modèles de dossiers, check-lists DAO et quiz ARSP blancs. <button onClick={onExploreCourses} className="underline font-semibold">Voir le module</button>.
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-zinc-500 dark:text-zinc-500">
          Sources : Loi n°10/010 du 27 avril 2010 relative aux marchés publics • Loi n°17/001 du 08.02.2017 sur la sous-traitance • ARSP 2024 • ARMP RDC. Contenus pédagogiques Academia ITECH.
        </p>
      </section>
    </div>
  );
};
