import type { RealisticCardAnimationId } from '../components/ProfessorFilmScenes';
export type CartoonSceneKind = 'justice' | 'institutions' | 'logistics' | 'planning' | 'tender' | 'review';
export function cartoonSceneKind(id: RealisticCardAnimationId): CartoonSceneKind {
  if (['ministry_cgpmp','dgcmp_shield','armp_tower'].includes(id)) return 'institutions';
  if (['construction_crane','supply_truck','intellectual_compass','threshold_gauge'].includes(id)) return 'logistics';
  if (['dao_calendar','allotment_puzzle'].includes(id)) return 'planning';
  if (['sealed_ballot_ano','bank_guarantee_vault'].includes(id)) return 'tender';
  if (['gavel_tribunal','audit_scanner','sigmap_server'].includes(id)) return 'review';
  return 'justice';
}
export const CARTOON_SCENE_LABELS: Record<CartoonSceneKind,string> = {
 justice: 'Les principes en action', institutions: 'Qui fait quoi ?', logistics: 'Du besoin au marché',
 planning: 'Préparer le dossier', tender: 'Des offres aux décisions', review: 'Contrôler et sécuriser',
};
export function cartoonSpeechMouth(speaking: boolean, openness: number, viseme: string) {
  if (!speaking || viseme === 'closed') return { width: 18, height: 2 };
  const open = Math.max(0, Math.min(1, Number.isFinite(openness) ? openness : 0));
  return { width: viseme === 'round' ? 10 : viseme === 'wide' ? 25 : 18, height: 3 + open * 15 };
}
