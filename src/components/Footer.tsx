import React from 'react';
import { 
  Scale, 
  ExternalLink, 
  Award, 
  Phone, 
  Mail, 
  MapPin, 
  Wifi, 
  WifiOff,
  ShieldCheck
} from 'lucide-react';
import { ArmpLogo } from './ArmpLogo';

interface FooterProps {
  onOpenLegalDocs: () => void;
  onOpenTuteur: () => void;
  isOffline: boolean;
  isDarkMode?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLegalDocs,
  onOpenTuteur,
  isOffline,
  isDarkMode = false
}) => {
  return (
    <footer className={`border-t text-xs transition-colors ${
      isDarkMode 
        ? 'bg-slate-950 text-slate-300 border-slate-800' 
        : 'bg-slate-200/60 text-slate-800 border-slate-300'
    }`}>
      {/* Top Strip */}
      <div className={`py-3 px-4 sm:px-6 lg:px-8 border-b ${
        isDarkMode 
          ? 'border-slate-800/80 bg-slate-900/50' 
          : 'border-slate-300 bg-slate-100 shadow-2xs'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
              ACADEMIA ITECH RDC • Plateforme Réglementaire Conforme à la Loi n° 10/010
            </span>
          </div>

          <div className={`flex items-center space-x-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
            <span className="flex items-center space-x-1">
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Cache Local Actif</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Connecté au Portail National ARMP</span>
                </>
              )}
            </span>
            <span>•</span>
            <span>Édition 2026</span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold">v863427f • header full-width + mode jour</span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Col 1: Institutional Presentation with Official ARMP Logo */}
        <div className="space-y-4 md:col-span-1">
          {/* Official ARMP Logo as uploaded by the user */}
          <div className="pb-1">
            <ArmpLogo 
              size="sm" 
              isDarkMode={isDarkMode} 
            />
          </div>

          <p className={`leading-relaxed text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
            Plateforme officielle de formation continue et d'évaluation certifiante des acteurs de la commande publique en République Démocratique du Congo (Loi n° 10/010 du 27 avril 2010).
          </p>
          <div className={`text-[11px] space-y-1 pt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <p className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-amber-400 flex-shrink-0" />
              <span>Boulevard du 30 Juin, Gombe, Kinshasa, RDC</span>
            </p>
            <p className="flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>+243 (0) 81 000 2430 / DFAT Direction</span>
            </p>
          </div>
        </div>

        {/* Col 2: Textes Légaux RDC */}
        <div className="space-y-3">
          <h4 className={`font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            <Scale className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Cadre Légal & Réglementaire</span>
          </h4>
          <ul className={`space-y-2 text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <li>
              <button onClick={onOpenLegalDocs} className="hover:text-blue-600 dark:hover:text-amber-400 transition text-left">
                Loi n° 10/010 du 27 avril 2010 (In extenso)
              </button>
            </li>
            <li>
              <button onClick={onOpenLegalDocs} className="hover:text-blue-600 dark:hover:text-amber-400 transition text-left">
                Décret n° 10/22 portant manuel des procédures
              </button>
            </li>
            <li>
              <button onClick={onOpenLegalDocs} className="hover:text-blue-600 dark:hover:text-amber-400 transition text-left">
                Décret n° 10/21 portant création de l'ARMP
              </button>
            </li>
            <li>
              <button onClick={onOpenLegalDocs} className="hover:text-blue-600 dark:hover:text-amber-400 transition text-left">
                Décret n° 10/23 portant création de la DGCMP
              </button>
            </li>
            <li>
              <button onClick={onOpenLegalDocs} className="hover:text-blue-600 dark:hover:text-amber-400 transition text-left">
                Recueil des Décisions du CRD (Contentieux)
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Workflows & Certifications */}
        <div className="space-y-3">
          <h4 className={`font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Parcours & Certifications</span>
          </h4>
          <ul className={`space-y-2 text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <li>
              <span className={`font-semibold block ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                Pour les CGPMP ministérielles :
              </span>
              Sessions soumises à visa préalable DFAT
            </li>
            <li>
              <span className={`font-semibold block ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                Pour les Agents DGCMP :
              </span>
              Instruction des ANO et contrôle a priori
            </li>
            <li>
              <span className={`font-semibold block ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                Pour les Soumissionnaires :
              </span>
              Conformité des offres et recours gracieux
            </li>
            <li>
              <button onClick={onOpenTuteur} className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center space-x-1 pt-1">
                <span>Interroger le Tuteur IA Juridique</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </li>
          </ul>
        </div>

        {/* Col 4: Gouvernance & Déontologie */}
        <div className="space-y-3">
          <h4 className={`font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Transparence & Éthique</span>
          </h4>
          <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            La commande publique en RDC repose sur les principes de liberté d'accès, d'égalité de traitement des candidats et de transparence des procédures.
          </p>
          <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-800' 
              : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 block">Ligne Verte Dénonciation / ARMP :</span>
            <p className={`font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>contact@armp-rdc.org</p>
            <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Signalement des manquements éthiques et fraudes
            </p>
          </div>
        </div>

      </div>

      {/* Bottom Legal Notice */}
      <div className={`border-t py-4 px-4 sm:px-6 lg:px-8 text-center text-[11px] ${
        isDarkMode 
          ? 'border-slate-800/80 text-slate-400 bg-slate-950' 
          : 'border-slate-200 text-slate-500 bg-slate-50'
      }`}>
        <p>
          © {new Date().getFullYear()} ACADEMIA ITECH RDC. Inspiré du projet officiel de gouvernance éducative. Tous droits réservés. Développé pour la République Démocratique du Congo.
        </p>
      </div>
    </footer>
  );
};
