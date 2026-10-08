/**
 * Attribution des modules de formation à leur auteur (formateur ou super admin).
 * Persisté en localStorage pour que l'espace admin puisse calculer les
 * performances des formateurs en fonction des modules qu'ils ont ajoutés.
 */
export interface ModuleAuthor {
  id: string;
  name: string;
}

const AUTHORS_KEY = 'armp_module_authors_v1';

export function readModuleAuthors(): Record<string, ModuleAuthor> {
  try {
    const raw = localStorage.getItem(AUTHORS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function recordModuleAuthor(courseId: string, author: ModuleAuthor): void {
  try {
    const map = readModuleAuthors();
    map[courseId] = author;
    localStorage.setItem(AUTHORS_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}
