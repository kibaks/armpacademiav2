import { normalizeTutorQuestion } from '../shared/tutorQuestion.js';

const law = 'https://armp-rdc.cd/wp-content/uploads/2021/12/Lois-relative-aux-marchs-publicsx.pdf';
/** Narrow reviewed definitions bypass inference; cases and procedures never do. */
export function procurementDefinition(question: string) {
  const q = normalizeTutorQuestion(question).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[’']/g, ' ').replace(/[?.!,;:]/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  const prefix = '(?:(?:bonjour|bonsoir|salut) )?(?:(?:c est quoi|qu est ce que|definis|definissez|expliquer moi|explique moi|expliquez moi|definition de|que signifie) )?';
  let reply: string | undefined, articles: string | undefined;
  if (new RegExp('^' + prefix + '(?:un |le |les |une |la |des |du |de la )?(?:marche|marches) public(?:s)?$').test(q)) {
    reply = 'Un marché public est un contrat écrit conclu, moyennant un prix, entre une autorité contractante apportant une contribution ou une garantie financière et un entrepreneur, fournisseur ou prestataire. Il porte sur des travaux, des fournitures, des services ou des prestations intellectuelles.';
    articles = '5 et 7';
  } else if (/^(?:(?:quels? sont|quelles? sont|cite[rz]?|donne[rz]?|enumere[rz]?) )?(?:les |des )?(?:(?:quatre|4|differents) )?(?:types|categories|natures)(?: de| des)? marches publics(?: en rdc)?$/.test(q)
    || /^(?:combien de|il y a combien de) types de marches publics(?: en rdc)?$/.test(q)) {
    reply = 'La loi distingue quatre types de marchés publics : les marchés de travaux, de fournitures, de services et de prestations intellectuelles. Les prestations intellectuelles constituent donc bien un type de marché public.';
    articles = '7';
  } else if (new RegExp('^' + prefix + '(?:un |le |les |une |la |des |du |de la )?(?:marche(?:s)? de )?prestation(?:s)? intellectuelle(?:s)?$').test(q)) {
    reply = 'Les marchés de prestations intellectuelles sont un type de marché public, distinct des travaux, des fournitures et des services. Leur objet est principalement intellectuel : études, maîtrise d’œuvre, assistance technique ou maîtrise d’ouvrage déléguée.';
    articles = '7, 11 et 40';
  }
  return reply ? { reply, sources: [`Loi n° 10/010 du 27 avril 2010 · articles ${articles} — ${law}`], provider: 'procurement-definitions' } : null;
}
