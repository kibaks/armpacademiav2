import bibliography from './legalBibliography.json';
import type { LegalDocument } from '../types';
// Source URLs and coverage come from the official catalogue; no fabricated article excerpts.
export const LEGAL_DOCS_DATA = bibliography as LegalDocument[];
export const LEGAL_DOCS = LEGAL_DOCS_DATA;
