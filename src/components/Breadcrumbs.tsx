import React from 'react';
import { 
  Home, 
  ChevronRight, 
  BookOpen, 
  Send,
  FileText, 
  ShieldCheck, 
  BarChart3, 
  Layers, 
  ArrowLeft,
  Wifi,
  WifiOff,
  UserCheck,
  User
} from 'lucide-react';
import { UserProfile } from '../types';

export interface BreadcrumbItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  tab?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: string;
}

interface BreadcrumbsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentProfile: UserProfile;
  isAuthenticated?: boolean;
  subCategory?: string | null;
  onClearSubCategory?: () => void;
  subDetail?: string | null;
  onClearSubDetail?: () => void;
  isOfflineMode?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  activeTab,
  setActiveTab,
  currentProfile,
  isAuthenticated = true,
  subCategory,
  onClearSubCategory,
  subDetail,
  onClearSubDetail,
  isOfflineMode
}) => {
  // Define primary tab metadata
  const tabConfig: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
    accueil: {
      label: 'Accueil',
      icon: <Home className="w-3.5 h-3.5" />,
      description: 'Portail E-Learning & Régulation Commande Publique RDC'
    },
    catalogue: {
      label: 'Catalogue',
      icon: <BookOpen className="w-3.5 h-3.5 text-blue-500" />,
      description: 'Catalogue et parcours certifiants ARMP Loi 10/010'
    },
    cours: {
      label: 'Catalogue',
      icon: <BookOpen className="w-3.5 h-3.5 text-blue-500" />,
      description: 'Catalogue et parcours certifiants ARMP Loi 10/010'
    },
    demander: {
      label: 'Demander',
      icon: <Send className="w-3.5 h-3.5 text-purple-500" />,
      description: 'Demande de formation et validation institutionnelle CGPMP / DFAT'
    },
    workflow: {
      label: 'Demander',
      icon: <Send className="w-3.5 h-3.5 text-purple-500" />,
      description: 'Demande de formation et validation institutionnelle CGPMP / DFAT'
    },
    'cgpmp-workflow': {
      label: 'Demander',
      icon: <Send className="w-3.5 h-3.5 text-purple-500" />,
      description: 'Demande de formation et validation institutionnelle CGPMP / DFAT'
    },
    profil: {
      label: 'Mon Profil',
      icon: <User className="w-3.5 h-3.5 text-purple-500" />,
      description: 'Identité institutionnelle, certifications ARMP et suivi'
    },
    textes: {
      label: 'Cadre Légal & Bibliothèque ARMP',
      icon: <FileText className="w-3.5 h-3.5 text-emerald-500" />,
      description: 'Loi n° 10/010, décrets d’application, manuels et DAO types'
    },
    'textes-legaux': {
      label: 'Cadre Légal & Bibliothèque ARMP',
      icon: <FileText className="w-3.5 h-3.5 text-emerald-500" />,
      description: 'Loi n° 10/010, décrets d’application, manuels et DAO types'
    },
    dashboard: {
      label: 'Observatoire & Tableaux de Bord DFAT',
      icon: <BarChart3 className="w-3.5 h-3.5 text-amber-500" />,
      description: 'Suivi de la conformité, cartographie et analyses IA'
    },
    analytics: {
      label: 'Observatoire & Tableaux de Bord DFAT',
      icon: <BarChart3 className="w-3.5 h-3.5 text-amber-500" />,
      description: 'Suivi de la conformité, cartographie et analyses IA'
    }
  };

  const currentTabInfo = tabConfig[activeTab] || tabConfig.accueil;

  return (
    <nav 
      aria-label="Fil d'ariane" 
      className="bg-slate-100/90 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-300 dark:border-slate-800/80 py-2.5 px-4 sm:px-6 lg:px-8 transition-colors sticky top-16 sm:top-20 z-30 shadow-2xs"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
        
        {/* Breadcrumb Path Links */}
        <ol className="flex items-center flex-wrap gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          
          {/* Home Link */}
          <li className="flex items-center">
            <button
              onClick={() => {
                setActiveTab('accueil');
                if (onClearSubCategory) onClearSubCategory();
                if (onClearSubDetail) onClearSubDetail();
              }}
              className={`inline-flex items-center space-x-1.5 px-2 py-1 rounded-md transition font-medium ${
                activeTab === 'accueil' && !subCategory && !subDetail
                  ? 'bg-blue-100/80 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-bold'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Retourner à l'accueil"
            >
              <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Accueil</span>
            </button>
          </li>

          {/* Level 1: Current Main Tab (if not on home) */}
          {activeTab !== 'accueil' && (
            <li className="flex items-center space-x-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <button
                onClick={() => {
                  if (onClearSubCategory) onClearSubCategory();
                  if (onClearSubDetail) onClearSubDetail();
                }}
                className={`inline-flex items-center space-x-1.5 px-2 py-1 rounded-md transition font-medium ${
                  !subCategory && !subDetail
                    ? 'bg-blue-100/80 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-bold'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {currentTabInfo.icon}
                <span>{currentTabInfo.label}</span>
              </button>
            </li>
          )}

          {/* Level 2: Sub-category filter or classification if selected */}
          {subCategory && (
            <li className="flex items-center space-x-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="inline-flex items-center space-x-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 font-semibold">
                <Layers className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="truncate max-w-[180px] sm:max-w-none">{subCategory}</span>
                {onClearSubCategory && (
                  <button
                    onClick={onClearSubCategory}
                    className="ml-1 text-amber-700 dark:text-amber-300 hover:text-amber-950 dark:hover:text-white font-bold"
                    title="Effacer ce filtre"
                  >
                    ×
                  </button>
                )}
              </span>
            </li>
          )}

          {/* Level 3: Specific Document or Course Detail */}
          {subDetail && (
            <li className="flex items-center space-x-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold truncate max-w-[220px] sm:max-w-xs">
                <span className="truncate">{subDetail}</span>
                {onClearSubDetail && (
                  <button
                    onClick={onClearSubDetail}
                    className="ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    title="Fermer le détail"
                  >
                    ×
                  </button>
                )}
              </span>
            </li>
          )}

        </ol>

        {/* Right Info Pill: Active Profile & Contextual Helper */}
        <div className="flex items-center space-x-2 text-[11px] self-end md:self-auto">
          
          {/* Active Profile context pill — visible seulement en mode connecté */}
          {isAuthenticated && (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium">
              <UserCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span className="text-slate-400">Rôle :</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                {currentProfile.roleTitle}
              </span>
            </div>
          )}

          {/* Offline/Online Status Pill */}
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-[10px] font-bold ${
            isOfflineMode 
              ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700' 
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
          }`}>
            {isOfflineMode ? (
              <>
                <WifiOff className="w-2.5 h-2.5 text-amber-600" />
                <span>Mode Hors-ligne</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Synchronisé Kinshasa</span>
              </>
            )}
          </div>

        </div>

      </div>
    </nav>
  );
};
