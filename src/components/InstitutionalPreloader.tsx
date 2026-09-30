import React, { useState, useEffect } from 'react';
import { ArmpLogo } from './ArmpLogo';
import { Shield, Sparkles, CheckCircle2 } from 'lucide-react';

interface InstitutionalPreloaderProps {
  isLoading: boolean;
  statusText?: string;
}

export const InstitutionalPreloader: React.FC<InstitutionalPreloaderProps> = ({
  isLoading,
  statusText = "Initialisation du Système National d'Apprentissage..."
}) => {
  const [progress, setProgress] = useState(15);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.floor(Math.random() * 15) + 5;
        });
      }, 150);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#061833] via-[#0C3B7C] to-[#041021] text-white transition-opacity duration-500 ${
        isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Background glow effects */}
      <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -top-10 right-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center space-y-6">
        {/* Animated Emblem Badge */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-3 shadow-2xl shadow-blue-900/50">
            <ArmpLogo size="lg" isDarkMode={true} />
          </div>
          <span className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-amber-400 text-slate-950 shadow-md">
            <Sparkles className="w-4 h-4" />
          </span>
        </div>

        {/* Institutional Titles */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-amber-300 tracking-wider uppercase">
            <Shield className="w-3 h-3" />
            <span>République Démocratique du Congo</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            ACADEMIA ITECH
          </h2>
          <p className="text-xs font-semibold text-sky-200 tracking-wide">
            Plateforme Nationale de Formation aux Marchés Publics
          </p>
          <p className="text-[10px] text-slate-300 font-mono">
            ARMP • DGCMP • CGPMP — Loi n° 10/010 du 27 avril 2010
          </p>
        </div>

        {/* Progress Bar and Indicator */}
        <div className="w-full space-y-2 pt-2">
          <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-sky-400 to-blue-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
            <span className="truncate max-w-[280px]">{statusText}</span>
            <span className="font-bold text-amber-300">{progress}%</span>
          </div>
        </div>

        {/* Subtle security statement */}
        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Connexion chiffrée & Persistance Firestore active</span>
        </div>
      </div>
    </div>
  );
};
