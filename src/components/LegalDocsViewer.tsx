import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookMarked, 
  Search, 
  Download, 
  ExternalLink, 
  Scale, 
  FileText, 
  Bot, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Bookmark,
  Layers,
  Building2,
  ShieldCheck,
  Award,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { LEGAL_DOCS } from '../data/legalDocsData';
import { LegalDocument, LegalArticle } from '../types';

interface LegalDocsViewerProps {
  onAskTutorAboutDoc: (topicOrArticle: string) => void;
  onSelectSubCategoryForBreadcrumb?: (cat: string | null) => void;
  onSelectSubDetailForBreadcrumb?: (detail: string | null) => void;
}

export const LegalDocsViewer: React.FC<LegalDocsViewerProps> = ({
  onAskTutorAboutDoc,
  onSelectSubCategoryForBreadcrumb,
  onSelectSubDetailForBreadcrumb
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [expandedDocId, setExpandedDocId] = useState<string | null>('DOC-001');

  const categories = ['Tous', 'Loi & Décrets', 'Guides & Manuels', 'Modèles DAO', 'Régulation'];

  // Sync with breadcrumbs
  useEffect(() => {
    if (onSelectSubCategoryForBreadcrumb) {
      if (selectedCategory !== 'Tous') {
        onSelectSubCategoryForBreadcrumb(`Niveau : ${selectedCategory}`);
      } else {
        onSelectSubCategoryForBreadcrumb(null);
      }
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (onSelectSubDetailForBreadcrumb) {
      if (expandedDocId) {
        const found = LEGAL_DOCS.find(d => d.id === expandedDocId);
        if (found) {
          onSelectSubDetailForBreadcrumb(found.title.split(' ')[0] + ' ' + found.title.split(' ')[1] || found.id);
        } else {
          onSelectSubDetailForBreadcrumb(null);
        }
      } else {
        onSelectSubDetailForBreadcrumb(null);
      }
    }
  }, [expandedDocId]);

  // Compute counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Tous: LEGAL_DOCS.length };
    LEGAL_DOCS.forEach((d) => {
      if (d.category) {
        counts[d.category] = (counts[d.category] || 0) + 1;
      }
    });
    return counts;
  }, []);

  const filteredDocs = useMemo(() => {
    return LEGAL_DOCS.filter((doc: LegalDocument) => {
      const matchCat = selectedCategory === 'Tous' || doc.category === selectedCategory;
      const matchSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.articles && doc.articles.some((a: LegalArticle) => 
          a.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.content.toLowerCase().includes(searchQuery.toLowerCase())
        ));
      return matchCat && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      
      {/* Header Institutional Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-amber-400/20 text-amber-300">
              <Scale className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Bibliothèque Juridique & Textes Réglementaires RDC
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white">
            Classification Normative de la Commande Publique (Loi n° 10/010)
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Consultez les articles législatifs in extenso, téléchargez les modèles types de DAO validés et analysez les obligations de la commande publique en République Démocratique du Congo.
          </p>
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={() => onAskTutorAboutDoc("Pouvez-vous me résumer les innovations majeures et principes directeurs de la Loi n° 10/010 du 27 avril 2010 ?")}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
          >
            <Bot className="w-4 h-4 text-amber-300" />
            <span>Interroger le Tuteur IA sur un Article</span>
          </button>
        </div>
      </div>

      {/* Normative Pyramid Overview (Hiérarchie des Normes RDC) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Hiérarchie des Normes & Ordre Juridique des Marchés Publics</span>
          </h4>
          <span className="text-[11px] text-slate-400">Application stricte RDC</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-1">
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 font-mono">NIVEAU 1</span>
            <p className="font-bold text-slate-900 dark:text-white">Loi n° 10/010</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">Texte législatif fondamental voté au Parlement.</p>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-1">
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 font-mono">NIVEAU 2</span>
            <p className="font-bold text-slate-900 dark:text-white">Décrets Primature</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">Décrets 10/21 (ARMP), 10/22 (Manuel), 10/23 (DGCMP).</p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-1">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 font-mono">NIVEAU 3</span>
            <p className="font-bold text-slate-900 dark:text-white">Dossiers Types (DAO)</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">Standards obligatoires de Travaux, Fournitures et Services.</p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 font-mono">NIVEAU 4</span>
            <p className="font-bold text-slate-900 dark:text-white">Guides Méthodologiques</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">Directives DFAT, canevas PPM et jurisprudence CRD.</p>
          </div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un article (ex: Art. 14, 29, 77), DAO, seuil..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs w-full sm:w-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center space-x-1.5 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === cat ? 'bg-blue-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {categoryCounts[cat] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Document Accordion / List */}
      <div className="space-y-4">
        {filteredDocs.map((doc: LegalDocument) => {
          const isExpanded = expandedDocId === doc.id;

          return (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition"
            >
              {/* Document Header Bar */}
              <div
                onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition select-none"
              >
                <div className="flex items-start space-x-3.5 flex-1">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                        {doc.type}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        Réf : {doc.reference}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                      {doc.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
                      {doc.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {doc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0 pt-1">
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    {doc.articles ? `${doc.articles.length} extraits indexés` : 'Document officiel'}
                  </span>
                  <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Articles View */}
              {isExpanded && (
                <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Extraits Légaux Majeurs & Jurisprudence Associée
                    </span>
                    <button
                      onClick={() => onAskTutorAboutDoc(`Pouvez-vous m'expliquer les implications opérationnelles du document : ${doc.title} ?`)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Poser une question au Tuteur IA sur ce texte</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {doc.articles?.map((article: LegalArticle, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                            {article.number} • {article.title}
                          </span>
                          <button
                            onClick={() => onAskTutorAboutDoc(`Que dit la Loi 10/010 à propos de "${article.number} - ${article.title}" ?`)}
                            className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 flex items-center space-x-1"
                          >
                            <Bot className="w-3 h-3 text-amber-500" />
                            <span>Analyser</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-serif whitespace-pre-line bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-700/60">
                          {article.content}
                        </p>
                      </div>
                    ))}

                    {(!doc.articles || doc.articles.length === 0) && (
                      <div className="text-center py-6 text-xs text-slate-400">
                        Document officiel téléchargeable in extenso au format réglementaire ARMP RDC.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
