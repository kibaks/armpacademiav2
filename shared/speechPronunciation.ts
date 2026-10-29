export interface PronunciationEntry { word: string; pronunciation: string }
// French spelling hints are editable approximations, not identity or language inference.
export const PRONUNCIATION_EXAMPLES: PronunciationEntry[] = [
  { word: 'Luba', pronunciation: 'Louba' }, { word: 'Tshiluba', pronunciation: 'Tchilouba' },
  { word: 'Bakongo', pronunciation: 'Bakongo' }, { word: 'Bandundu', pronunciation: 'Bandoundou' },
  { word: 'Ester', pronunciation: 'Estère' }, { word: 'Esther', pronunciation: 'Estère' },
  { word: 'David', pronunciation: 'David' }, { word: 'Landry', pronunciation: 'Landri' },
];
const PROVINCE_PRONUNCIATIONS: PronunciationEntry[] = [
  {
    "word": "Bas-Uélé",
    "pronunciation": "Bas-Ouélé"
  },
  {
    "word": "Équateur",
    "pronunciation": "Équateur"
  },
  {
    "word": "Haut-Katanga",
    "pronunciation": "Haut-Katanga"
  },
  {
    "word": "Haut-Lomami",
    "pronunciation": "Haut-Lomami"
  },
  {
    "word": "Haut-Uélé",
    "pronunciation": "Haut-Ouélé"
  },
  {
    "word": "Ituri",
    "pronunciation": "Itouri"
  },
  {
    "word": "Kasaï",
    "pronunciation": "Kassaï"
  },
  {
    "word": "Kasaï-Central",
    "pronunciation": "Kassaï-Central"
  },
  {
    "word": "Kasaï-Oriental",
    "pronunciation": "Kassaï-Oriental"
  },
  {
    "word": "Kinshasa",
    "pronunciation": "Kinshassa"
  },
  {
    "word": "Kongo-Central",
    "pronunciation": "Kongo-Central"
  },
  {
    "word": "Kwango",
    "pronunciation": "Kouango"
  },
  {
    "word": "Kwilu",
    "pronunciation": "Kouilou"
  },
  {
    "word": "Lomami",
    "pronunciation": "Lomami"
  },
  {
    "word": "Lualaba",
    "pronunciation": "Loualaba"
  },
  {
    "word": "Mai-Ndombe",
    "pronunciation": "Maï-Ndombé"
  },
  {
    "word": "Maï-Ndombe",
    "pronunciation": "Maï-Ndombé"
  },
  {
    "word": "Maniema",
    "pronunciation": "Maniéma"
  },
  {
    "word": "Mongala",
    "pronunciation": "Mongala"
  },
  {
    "word": "Nord-Kivu",
    "pronunciation": "Nord-Kivou"
  },
  {
    "word": "Nord-Ubangi",
    "pronunciation": "Nord-Oubangui"
  },
  {
    "word": "Sankuru",
    "pronunciation": "Sankourou"
  },
  {
    "word": "Sud-Kivu",
    "pronunciation": "Sud-Kivou"
  },
  {
    "word": "Sud-Ubangi",
    "pronunciation": "Sud-Oubangui"
  },
  {
    "word": "Tanganyika",
    "pronunciation": "Tanganyika"
  },
  {
    "word": "Tshopo",
    "pronunciation": "Tchopo"
  },
  {
    "word": "Tshuapa",
    "pronunciation": "Tchouapa"
  }
];
export function parsePronunciationEntries(input: unknown): PronunciationEntry[] {
  if (!Array.isArray(input) || input.length > 200) throw new Error('Le dictionnaire accepte au maximum 200 noms.');
  const seen = new Set<string>();
  return input.map(item => {
    if (!item || typeof item.word !== 'string' || typeof item.pronunciation !== 'string') throw new Error('Indiquez un nom et sa prononciation.');
    const word = item.word.trim().normalize('NFC'), pronunciation = item.pronunciation.trim().normalize('NFC');
    const valid = /^[\p{L}\p{M}][\p{L}\p{M} ’'’-]*$/u;
    if (!word || word.length > 80 || !pronunciation || pronunciation.length > 120 || !valid.test(word) || !valid.test(pronunciation)) throw new Error('Utilisez des mots, espaces, apostrophes ou traits d’union (nom : 80 caractères, prononciation : 120).');
    const key = word.toLocaleLowerCase('fr');
    if (seen.has(key)) throw new Error('Chaque nom doit apparaître une seule fois.');
    seen.add(key); return { word, pronunciation };
  });
}
function regionalPronunciation(text: string): string {
    return text
      // Prevent any English-accented reading of first names (e.g. "Landry") or English loanwords at the start of sentences
      .replace(/\bLandry\b/gi, 'Landri')
      .replace(/\bstandstill\b/gi, 'délai de suspension')
      .replace(/\be-procurement\b/gi, 'passation numérique')
      .replace(/\bopen\s+data\b/gi, 'données ouvertes')
      .replace(/\bopen\s+contracting\b/gi, 'commande publique ouverte')
      .replace(/\bworkflow\b/gi, 'circuit de validation')
      .replace(/\bcheck-lists?\b/gi, 'liste de vérification')
      .replace(/\bchecklists?\b/gi, 'liste de vérification')
      .replace(/\bplanning\b/gi, 'calendrier')
      .replace(/\breporting\b/gi, 'rapport de suivi')
      .replace(/\bmanagement\b/gi, 'pilotage')
      .replace(/\bquiz\b/gi, 'questionnaire')
      // 1. Compound & Multi-word DRC Provinces (26 Provinces)
      .replace(/\bKongo[\s-]+Central\b/gi, 'Kongo-Central')
      .replace(/\bMa[iï][\s-]+Ndombe\b/gi, 'Maï-Ndombé')
      .replace(/\bKasa[iï][\s-]+Central\b/gi, 'Kassaï-Central')
      .replace(/\bKasa[iï][\s-]+Oriental\b/gi, 'Kassaï-Oriental')
      .replace(/\bHaut[\s-]+Katanga\b/gi, 'Haut-Katanga')
      .replace(/\bHaut[\s-]+Lomami\b/gi, 'Haut-Lomami')
      .replace(/\bHaut[\s-]+U[eé]l[eé]\b/gi, 'Haut-Ouélé')
      .replace(/\bBas[\s-]+U[eé]l[eé]\b/gi, 'Bas-Ouélé')
      .replace(/\bNord[\s-]+Kivu\b/gi, 'Nord-Kivou')
      .replace(/\bSud[\s-]+Kivu\b/gi, 'Sud-Kivou')
      .replace(/\bNord[\s-]+Ubangi\b/gi, 'Nord-Oubangui')
      .replace(/\bSud[\s-]+Ubangi\b/gi, 'Sud-Oubangui')
      // 2. Single-word DRC Provinces & Historic Regions
      .replace(/\bKinshasa\b/gi, 'Kinshasa')
      .replace(/\bKinchassa\b/gi, 'Kinshasa')
      .replace(/\bKasa[iï][\s-]+Vubu\b/gi, 'Kasa-Vubu')
      .replace(/\bKasa[iï]\b/gi, 'Kassaï')
      .replace(/\bKwilu\b/gi, 'Kwilu')
      .replace(/\bKwango\b/gi, 'Kwango')
      .replace(/\bSankuru\b/gi, 'Sankourou')
      .replace(/\bManiema\b/gi, 'Maniéma')
      .replace(/\bIturi\b/gi, 'Itouri')
      .replace(/\bTshopo\b/gi, 'Tshopo')
      .replace(/\bTshuapa\b/gi, 'Tshuapa')
      .replace(/\bLualaba\b/gi, 'Loualaba')
      .replace(/\bLulua\b/gi, 'Louloua')
      .replace(/\bTanganyika\b/gi, 'Tanganyika')
      .replace(/\bMongala\b/gi, 'Mongala')
      .replace(/\bU[eé]l[eé]\b/gi, 'Ouélé')
      .replace(/\bUbangi\b/gi, 'Oubangui')
      .replace(/\bKivu\b/gi, 'Kivou')
      .replace(/\bBandundu\b/gi, 'Bandoundou')
      .replace(/\bKatanga\b/gi, 'Katanga')
      // 3. Provincial Capitals (Chefs-lieux), Major DRC Cities & Communes
      .replace(/\bLubumbashi\b/gi, 'Louboumbachi')
      .replace(/\bKisangani\b/gi, 'Kissangani')
      .replace(/\bBukavu\b/gi, 'Boukavou')
      .replace(/\bMbuji[\s-]+Mayi\b/gi, 'Mbouji-Mayi')
      .replace(/\bKananga\b/gi, 'Kananga')
      .replace(/\bMbandaka\b/gi, 'Mbandaka')
      .replace(/\bMatadi\b/gi, 'Matadi')
      .replace(/\bBoma\b/gi, 'Boma')
      .replace(/\bGoma\b/gi, 'Goma')
      .replace(/\bKolwezi\b/gi, 'Kolouézi')
      .replace(/\bKolwézi\b/gi, 'Kolouézi')
      .replace(/\bLikasi\b/gi, 'Likassi')
      .replace(/\bKipushi\b/gi, 'Kipouchi')
      .replace(/\bKasumbalesa\b/gi, 'Kassoumbaléssa')
      .replace(/\bTshikapa\b/gi, 'Tchikapa')
      .replace(/\bKikwit\b/gi, 'Kikouite')
      .replace(/\bKenge\b/gi, 'Kéngué')
      .replace(/\bInongo\b/gi, 'Inongo')
      .replace(/\bInga\b/gi, 'Inga')
      .replace(/\bBoende\b/gi, 'Boéndé')
      .replace(/\bGemena\b/gi, 'Guéména')
      .replace(/\bGbadolite\b/gi, 'Gbadolité')
      .replace(/\bLisala\b/gi, 'Lissala')
      .replace(/\bBumba\b/gi, 'Boumba')
      .replace(/\bIsiro\b/gi, 'Issiro')
      .replace(/\bBunia\b/gi, 'Bounia')
      .replace(/\bKindu\b/gi, 'Kindou')
      .replace(/\bKindou\b/gi, 'Kindou')
      .replace(/\bKalemie\b/gi, 'Kalémi')
      .replace(/\bKamina\b/gi, 'Kamina')
      .replace(/\bKabinda\b/gi, 'Kabinda')
      .replace(/\bLusambo\b/gi, 'Loussambo')
      .replace(/\bMwene[\s-]+Ditu\b/gi, 'Mouéné-Ditou')
      .replace(/\bMwéné[\s-]+Ditou\b/gi, 'Mouéné-Ditou')
      .replace(/\bUvira\b/gi, 'Ouvira')
      .replace(/\bButembo\b/gi, 'Boutémbo')
      .replace(/\bBeni\b/gi, 'Béni')
      .replace(/\bMuanda\b/gi, 'Mouanda')
      .replace(/\bMoanda\b/gi, 'Mouanda')
      .replace(/\bZongo\b/gi, 'Zongo')
      .replace(/\bKimpese\b/gi, 'Kimpéssé')
      .replace(/\bGombe\b/gi, 'Gombé')
      .replace(/\bLukunga\b/gi, 'Loukounga')
      .replace(/\bFuna\b/gi, 'Founa')
      .replace(/\bTshangu\b/gi, 'Tchangou')
      .replace(/\bMasina\b/gi, 'Massina')
      .replace(/\bLimete\b/gi, 'Limété')
      .replace(/\bNgaliema\b/gi, 'Ngaliéma')
      .replace(/\bKintambo\b/gi, 'Kintambo')
      .replace(/\bBandalungwa\b/gi, 'Bandaloungoua')
      .replace(/\bSelembao\b/gi, 'Sélémbao')
      .replace(/\bKimbanseke\b/gi, 'Kimbanséké')
      .replace(/\bKimbanséké\b/gi, 'Kimbanséké')
      .replace(/\bMaluku\b/gi, 'Maloukou')
      .replace(/\bKalamu\b/gi, 'Kalamou')
      .replace(/\bBarumbu\b/gi, 'Baroumbou')
      .replace(/\bLingwala\b/gi, 'Lingwala')
      .replace(/\bMatete\b/gi, 'Matété')
      .replace(/\bLemba\b/gi, 'Lémba')
      .replace(/\bNsele\b/gi, 'Nsélé')
      .replace(/\bMont[\s-]+Ngafula\b/gi, 'Mont-Ngafoula')
      // 4. Proper Names & Surnames of DRC Practitioners & Historical Figures (pure French phonetics without English 'w')
      .replace(/\bKibakweto\b/gi, 'Kibakouéto')
      .replace(/\bKibakwéto\b/gi, 'Kibakouéto')
      .replace(/\bMukendi\b/gi, 'Moukéndi')
      .replace(/\bKabangu\b/gi, 'Kabangou')
      .replace(/\bIlunga\b/gi, 'Ilounga')
      .replace(/\bKasongo\b/gi, 'Kassongo')
      .replace(/\bMuteba\b/gi, 'Moutéba')
      .replace(/\bTshilomba\b/gi, 'Tchilomba')
      .replace(/\bMwamba\b/gi, 'Mouamba')
      .replace(/\bTshisekedi\b/gi, 'Tchissékédi')
      .replace(/\bLumumba\b/gi, 'Loumoumba')
      .replace(/\bMobutu\b/gi, 'Moboutou')
      .replace(/\bLukonde\b/gi, 'Loukondé')
      .replace(/\bMbuyi\b/gi, 'Mbouyi')
      .replace(/\bTshiamala\b/gi, 'Tchiamala')
      .replace(/\bKabasele\b/gi, 'Kabassélé')
      .replace(/\bLukoji\b/gi, 'Loukodji')
      .replace(/\bLukusa\b/gi, 'Loukoussa')
      .replace(/\bLufungula\b/gi, 'Loufoungoula')
      .replace(/\bMavungu\b/gi, 'Mavoungou')
      .replace(/\bMutombo\b/gi, 'Moutombo')
      .replace(/\bMulumba\b/gi, 'Mouloumba')
      .replace(/\bNgalula\b/gi, 'Ngaloula')
      .replace(/\bMputu\b/gi, 'Mpoutou')
      .replace(/\bKyungu\b/gi, 'Kyoungou')
      .replace(/\bLukwebo\b/gi, 'Loukouébo')
      .replace(/\bLoukwébo\b/gi, 'Loukouébo')
      .replace(/\bSuminwa\b/gi, 'Souminoua')
      .replace(/\bTuluka\b/gi, 'Toulouka')
      .replace(/\bKapend\b/gi, 'Kapénd')
      // 5. General Congolese proper-noun phonetic rule for capitalized Tsh- names
      .replace(/\bTsh([a-zàâéèêëîïôùû]+)/g, 'Tch$1');
}
const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function normalizeSpeechPronunciation(text: string, custom: PronunciationEntry[] = []) {
  const aliases = new Map<string, string>();
  // First win: administrator overrides precede the built-in examples.
  for (const entry of [...custom, ...PRONUNCIATION_EXAMPLES, ...PROVINCE_PRONUNCIATIONS]) {
    for (const word of [entry.word, regionalPronunciation(entry.word)]) {
      const key = word.normalize('NFC').toLocaleLowerCase('fr');
      if (!aliases.has(key)) aliases.set(key, entry.pronunciation);
    }
  }
  const pattern = new RegExp('(?<![\\p{L}\\p{N}])(?:' + [...aliases.keys()].sort((a,b) => b.length-a.length).map(escapePattern).join('|') + ')(?![\\p{L}\\p{N}])', 'giu');
  const replacements: string[] = [];
  // Protect substitutions from cascading through the legacy geographical rules.
  const source = text.normalize('NFC').replace(/[\uE000\uE001]/g, '');
  const protectedText = source.replace(pattern, name => { const index = replacements.push(aliases.get(name.toLocaleLowerCase('fr'))!) - 1; return `\uE000${index}\uE001`; });
  return regionalPronunciation(protectedText).replace(/\uE000(\d+)\uE001/g, (_token, index) => replacements[Number(index)]);
}
