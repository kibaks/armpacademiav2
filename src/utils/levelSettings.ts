import { useEffect, useState } from 'react';

// ============================================================================
// Niveaux d'apprenant paramétrables — source unique de vérité côté client.
// Libellés + seuils pilotés par GET/POST /api/level-settings (espace admin).
// Les composants s'abonnent via useLevelSettings() : une modification admin
// est répercutée partout dans la plateforme sans rechargement.
// ============================================================================

export type LevelKey = 'debutant' | 'intermediaire' | 'avance' | 'expert';

export interface LevelSettings {
  intermediaire: number;
  avance: number;
  expert: number;
  labels: Record<LevelKey, string>;
}

export const LEVEL_KEYS: LevelKey[] = ['debutant', 'intermediaire', 'avance', 'expert'];

/** Libellés historiques (valeurs stockées dans les profils existants). */
export const CANONICAL_LEVELS = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'];

export const DEFAULT_LEVEL_SETTINGS: LevelSettings = {
  intermediaire: 60,
  avance: 80,
  expert: 90,
  labels: { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé', expert: 'Expert' },
};

/** Normalise la réponse du serveur (fusionne les défauts, garantit 4 libellés distincts). */
export function normalizeLevelSettings(raw: any): LevelSettings {
  const clamp = (v: any, d: number) =>
    Number.isFinite(+v) ? Math.min(100, Math.max(0, Math.round(+v))) : d;
  const dfl = DEFAULT_LEVEL_SETTINGS.labels;
  const clean = (v: any, d: string) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 40) : d);
  let labels: Record<LevelKey, string> = {
    debutant: clean(raw?.labels?.debutant, dfl.debutant),
    intermediaire: clean(raw?.labels?.intermediaire, dfl.intermediaire),
    avance: clean(raw?.labels?.avance, dfl.avance),
    expert: clean(raw?.labels?.expert, dfl.expert),
  };
  const vals = LEVEL_KEYS.map((k) => labels[k].toLowerCase());
  if (new Set(vals).size !== 4) labels = { ...dfl };
  const intermediaire = clamp(raw?.intermediaire, DEFAULT_LEVEL_SETTINGS.intermediaire);
  const avance = clamp(raw?.avance, DEFAULT_LEVEL_SETTINGS.avance);
  const expert = clamp(raw?.expert, DEFAULT_LEVEL_SETTINGS.expert);
  return {
    intermediaire,
    avance: Math.max(avance, intermediaire + 1),
    expert: Math.max(expert, Math.max(avance, intermediaire) + 1),
    labels,
  };
}

// ---------- Cache + abonnements (propagation live après save admin) ----------
let cache: LevelSettings | null = null;
let inflight: Promise<LevelSettings> | null = null;
const listeners = new Set<(s: LevelSettings) => void>();

function notify(s: LevelSettings) {
  listeners.forEach((fn) => fn(s));
}

export function getLevelSettings(): Promise<LevelSettings> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch('/api/level-settings')
    .then((r) => r.json())
    .then((raw) => {
      cache = normalizeLevelSettings(raw);
      return cache;
    })
    .catch(() => cache ?? DEFAULT_LEVEL_SETTINGS)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Met à jour le cache et notifie tous les composants abonnés. */
export function setLevelSettingsCache(s: any) {
  cache = normalizeLevelSettings(s);
  notify(cache);
}

/** Lecture synchrone du cache (derniers settings connus ; défauts si froid). */
export function peekLevelSettings(): LevelSettings {
  return cache ?? DEFAULT_LEVEL_SETTINGS;
}

export function subscribeLevelSettings(fn: (s: LevelSettings) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Hook : settings à jour + abonnement aux changements admin. */
export function useLevelSettings(): LevelSettings {
  const [settings, setSettings] = useState<LevelSettings>(() => cache ?? DEFAULT_LEVEL_SETTINGS);
  useEffect(() => {
    let alive = true;
    getLevelSettings().then((v) => {
      if (alive) setSettings(v);
    });
    const unsub = subscribeLevelSettings(setSettings);
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  return settings;
}

// ------------------------------- Helpers -----------------------------------
/** Libellés ordonnés croissants : [Débutant … Expert]. */
export function levelLabels(s: LevelSettings): string[] {
  return LEVEL_KEYS.map((k) => s.labels[k]);
}

/** Ordre complet pour filtres et statistiques admin (avec « Non évalué »). */
export function buildLevelOrder(s: LevelSettings): string[] {
  return [...levelLabels(s), 'Non évalué'];
}

/**
 * Index du niveau dans l'échelle (0..3), -1 pour « Non évalué »/inconnu.
 * Résout par levelKey (stockage moderne), puis par libellé courant,
 * puis par libellé canonique historique (compatibilité des profils existants).
 */
export function resolveLevelIndex(level: string, levelKey: LevelKey | undefined, s: LevelSettings): number {
  if (levelKey && LEVEL_KEYS.includes(levelKey)) return LEVEL_KEYS.indexOf(levelKey);
  const labels = levelLabels(s);
  const i = labels.indexOf(level);
  if (i >= 0) return i;
  const c = CANONICAL_LEVELS.indexOf(level);
  if (c >= 0) return c;
  return -1;
}

/** Libellé à afficher pour un niveau stocké (suit les renommages admin). */
export function levelLabel(level: string, levelKey: LevelKey | undefined, s: LevelSettings): string {
  const idx = resolveLevelIndex(level, levelKey, s);
  return idx >= 0 ? levelLabels(s)[idx] : level;
}

/** Clé stable d'un niveau à partir de son libellé courant. */
export function levelKeyFromLabel(label: string, s: LevelSettings): LevelKey | undefined {
  const labels = levelLabels(s);
  const i = labels.indexOf(label);
  if (i >= 0) return LEVEL_KEYS[i];
  const c = CANONICAL_LEVELS.indexOf(label);
  if (c >= 0) return LEVEL_KEYS[c];
  return undefined;
}
