import { buildCourseCatalog } from '../../shared/courseCatalog';
import imgCoverSeminar from '../assets/images/marches_publics_seminar_1789983166275.jpg';
import imgCoverFormation from '../assets/images/formation_numerique_1789983181347.jpg';
import imgCoverAudit from '../assets/images/expert_audit_cgpmp_1789983194702.jpg';
import imgCoverMentor from '../assets/images/mentor_juriste_africain_1789983212035.jpg';
export const COURSES_DATA = buildCourseCatalog([imgCoverSeminar,imgCoverFormation,imgCoverAudit,imgCoverMentor]);

export const INITIAL_COURSES = COURSES_DATA;
