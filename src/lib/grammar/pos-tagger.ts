export interface TaggedToken {
  word: string;
  tag: string;
  position: number;
}

const ARTICLES = new Set([
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
]);

const COORD_CONJ = new Set([
  'e', 'mas', 'ou', 'nem', 'porém', 'contudo', 'todavia',
  'entretanto', 'logo', 'portanto', 'pois',
]);

const SUBORD_CONJ = new Set([
  'que', 'se', 'porque', 'quando', 'enquanto', 'embora',
  'caso', 'conforme', 'como',
]);

const PREPOSITIONS = new Set([
  'de', 'em', 'para', 'por', 'com', 'sem', 'sob', 'sobre',
  'até', 'após', 'contra', 'entre', 'desde', 'perante', 'trás',
  'a', 'ante', 'durante', 'mediante', 'exceto', 'salvo', 'menos',
]);

const PREP_ART = new Set([
  'no', 'na', 'nos', 'nas', 'do', 'da', 'dos', 'das',
  'pelo', 'pela', 'pelos', 'pelas', 'num', 'numa',
  'dum', 'duma', 'à', 'às', 'ao', 'aos',
  'deste', 'desta', 'destes', 'destas',
  'desse', 'dessa', 'desses', 'dessas',
  'daquele', 'daquela', 'daqueles', 'daquelas',
  'noutro', 'noutra',
]);

const PERSONAL_PRONOUNS = new Set([
  'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles', 'elas',
  'me', 'te', 'se', 'lhe', 'nos', 'vos', 'lhes',
  'mim', 'ti', 'si',
  'comigo', 'contigo', 'consigo', 'connosco', 'convosco',
]);

const POSSESSIVE_PRONOUNS = new Set([
  'meu', 'minha', 'meus', 'minhas',
  'teu', 'tua', 'teus', 'tuas',
  'seu', 'sua', 'seus', 'suas',
  'nosso', 'nossa', 'nossos', 'nossas',
  'vosso', 'vossa', 'vossos', 'vossas',
  'cujo', 'cuja', 'cujos', 'cujas',
]);

const SUBSTANTIVE_PRONOUNS = new Set([
  'alguém', 'ninguém', 'algo', 'nada', 'tudo', 'cada', 'outrem',
  'quem', 'que', 'qual', 'quais',
  'quanto', 'quantos', 'quanta', 'quantas',
  'este', 'esta', 'estes', 'estas', 'isto',
  'esse', 'essa', 'esses', 'essas', 'isso',
  'aquele', 'aquela', 'aqueles', 'aquelas', 'aquilo',
  'outro', 'outra', 'outros', 'outras',
  'mesmo', 'mesma', 'mesmos', 'mesmas',
  'próprio', 'própria', 'próprios', 'próprias',
  'qualquer', 'quaisquer',
]);

const COMMON_ADVERBS = new Set([
  'não', 'sim', 'já', 'ainda', 'nunca', 'sempre', 'talvez',
  'aqui', 'ali', 'aí', 'lá', 'cá', 'acolá', 'além',
  'agora', 'hoje', 'amanhã', 'ontem', 'cedo', 'tarde',
  'antes', 'depois', 'enfim', 'mal',
  'muito', 'pouco', 'bastante', 'demais', 'tão', 'tanto',
  'bem', 'assim', 'depressa', 'devagar',
  'certamente', 'realmente', 'decerto',
  'provavelmente', 'possivelmente',
  'apenas', 'somente', 'unicamente',
  'inclusive', 'também',
  'simplesmente', 'felizmente', 'infelizmente',
]);

const VERB_SUFFIXES_STRONG = [
  /[aeo]r$/i,
  /ando$|endo$|indo$/i,
  /[aeo]ria$/i,
  /[aeo]ras$/i,
  /[aeo]rão$/i,
  /(?:ar|er|ir)mos$/i,
  /(?:ar|er|ir)des$/i,
  /(?:ar|er|ir)am$/i,
  /[aeo]ste$/i,
  /[aeo]sse$/i,
  /[aeo]sseis$/i,
  /[aeo]ssem$/i,
  /[aeo]sses$/i,
  /[aeo]ra$/i,
  /[aeo]rei$/i,
  /[aeo]rás$/i,
  /[aeo]rá$/i,
  /[aeo]remos$/i,
  /[aeo]reis$/i,
  /[aeo]riam$/i,
  /[aeo]rias$/i,
];

function isUpperCase(word: string): boolean {
  return word.length > 0 && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();
}

function hasStrongVerbSuffix(word: string): boolean {
  const lower = word.toLowerCase();
  return VERB_SUFFIXES_STRONG.some(p => p.test(lower));
}

function classifyWord(word: string): string {
  const lower = word.toLowerCase().trim();
  if (!lower) return 'N';

  if (/^[\p{P}\p{S}]+$/u.test(word)) return 'PU';
  if (/^[\d,./]+$/.test(word)) return 'NUM';
  if (word === '—' || word === '–' || word === '-') return 'PU';

  if (ARTICLES.has(lower)) return 'ART';
  if (COORD_CONJ.has(lower)) return 'KC';
  if (SUBORD_CONJ.has(lower)) return 'KS';
  if (PREP_ART.has(lower)) return 'PREP+ART';
  if (PREPOSITIONS.has(lower)) return 'PREP';
  if (PERSONAL_PRONOUNS.has(lower)) return 'PROPESS';
  if (POSSESSIVE_PRONOUNS.has(lower)) return 'PROADJ';
  if (SUBSTANTIVE_PRONOUNS.has(lower)) return 'PROSUB';

  if (hasStrongVerbSuffix(word)) return 'V';

  if (/[aeo]ndo$/i.test(lower)) return 'V';
  if (/(?:ado|ida|ido|ados|idas|ada)$/i.test(lower)) return 'PCP';

  if (lower.endsWith('mente')) return 'ADV';
  if (COMMON_ADVERBS.has(lower)) return 'ADV';

  if (lower.endsWith('íssimo') || lower.endsWith('íssima') || lower.endsWith('íssimos') || lower.endsWith('íssimas')) return 'ADJ';

  if (lower.endsWith('ou') || lower.endsWith('eu') || lower.endsWith('iu')) {
    if (lower.length >= 3) return 'V';
  }

  if (lower.endsWith('aste') || lower.endsWith('este') || lower.endsWith('iste')) return 'V';
  if (lower.endsWith('aram') || lower.endsWith('eram') || lower.endsWith('iram')) {
    if (lower.length >= 5) return 'V';
  }
  if (lower.endsWith('asse') || lower.endsWith('esse') || lower.endsWith('isse')) return 'V';
  if (lower.endsWith('ávamos') || lower.endsWith('íamos')) return 'V';
  if (lower.endsWith('áveis') || lower.endsWith('íeis')) return 'V';

  if (lower.endsWith('am') && lower.length >= 4 && !hasNounSuffix(lower)) return 'V';
  if (lower.endsWith('em') && lower.length >= 4 && !hasNounSuffix(lower)) return 'V';

  if (isUpperCase(word) && !COMMON_ADVERBS.has(lower) && !ARTICLES.has(lower) && !PREPOSITIONS.has(lower) && !COORD_CONJ.has(lower) && !SUBORD_CONJ.has(lower)) {
    const rest = word.slice(1).toLowerCase();
    if (/^[a-záéíóúãõâêôçà]+$/i.test(rest)) return 'NPROP';
  }

  if (lower.endsWith('a') && lower.length >= 4) {
    const root = lower.slice(0, -1);
    if (/[bcdfgjklmnpqrstvxz]{2,}$/i.test(root) && !root.endsWith('n') && !root.endsWith('s') && !root.endsWith('z')) return 'V';
  }

  if (lower.endsWith('o') && lower.length >= 4) {
    const root = lower.slice(0, -1);
    if (/[bcdfgjklmnpqrstvxz]{2,}$/i.test(root) && !root.endsWith('n') && !root.endsWith('s')) return 'V';
  }

  if (lower.endsWith('e') && lower.length >= 4) {
    const root = lower.slice(0, -1);
    if (/[bcdfgjklmnpqrstvxz]{2,}$/i.test(root) && !root.endsWith('n') && !root.endsWith('s') && !root.endsWith('z') && !root.endsWith('l') && !root.endsWith('r')) return 'V';
  }

  return 'N';
}

export async function tagText(text: string): Promise<TaggedToken[]> {
  if (!text.trim()) return [];

  const words = text.split(/(\s+|(?=[\p{P}\p{S}])(?<=\S)|(?<=\p{P})(?=\S))/u);
  const result: TaggedToken[] = [];
  let position = 0;

  for (const token of words) {
    if (!token || /^\s+$/.test(token)) {
      position += token.length;
      continue;
    }

    const word = token.replace(/^[^\w\p{L}]+|[^\w\p{L}]+$/gu, '').trim();
    if (!word) {
      position += token.length;
      continue;
    }

    const tag = classifyWord(word);
    const idx = text.indexOf(word, position);
    const pos = idx !== -1 ? idx : position;

    result.push({ word, tag, position: pos });
    position = pos + word.length;
  }

  return result;
}

export function likelyPlural(word: string): boolean {
  const lower = word.toLowerCase().trim();
  if (lower.endsWith('s') && !lower.endsWith('ss')) return true;
  return false;
}

export function likelySingular(word: string): boolean {
  const lower = word.toLowerCase().trim();
  const MASCULINE_ONLY = new Set([
    'mapa', 'sistema', 'problema', 'tema', 'poema', 'drama', 'clima',
    'idioma', 'grama', 'sofá', 'pijama', 'telegrama', 'cinema',
  ]);
  const FEMININE_ONLY = new Set([
    'mão', 'nação', 'lição', 'paixão', 'razão', 'solução',
  ]);
  if (MASCULINE_ONLY.has(lower) || FEMININE_ONLY.has(lower)) return true;
  if (lower.endsWith('s')) return false;
  return true;
}

export function likelyFeminine(word: string): boolean | null {
  const lower = word.toLowerCase().trim();
  const MASCULINE_ONLY = new Set([
    'mapa', 'sistema', 'problema', 'tema', 'poema', 'drama', 'clima',
    'idioma', 'grama', 'sofá', 'pijama', 'telegrama', 'cinema',
  ]);
  if (MASCULINE_ONLY.has(lower)) return false;
  if (lower.endsWith('a') || lower.endsWith('ção') || lower.endsWith('gão') ||
      lower.endsWith('triz') || lower.endsWith('eira') || lower.endsWith('esa') || lower.endsWith('isa')) {
    return true;
  }
  if (lower.endsWith('o') || lower.endsWith('or')) return false;
  return null;
}

export function isKnownArticle(word: string): 'masc' | 'fem' | 'pl' | null {
  const lower = word.toLowerCase();
  if (lower === 'o' || lower === 'os') return 'masc';
  if (lower === 'a' || lower === 'as') return 'fem';
  if (lower === 'um') return 'masc';
  if (lower === 'uma') return 'fem';
  return null;
}

export function articleIsPlural(article: string): boolean {
  const lower = article.toLowerCase();
  return lower === 'os' || lower === 'as' || lower === 'uns' || lower === 'umas';
}

export function articleIsFeminine(article: string): boolean {
  const lower = article.toLowerCase();
  return lower === 'a' || lower === 'as' || lower === 'uma' || lower === 'umas';
}
