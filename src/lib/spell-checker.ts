import { getWordSet } from './build-word-set';

export interface SpellingError {
  word: string;
  position: number;
  suggestions: string[];
}

export interface SpellCheckResult {
  errors: SpellingError[];
}

const VERB_SUFFIXES = [
  'o', 'as', 'a', 'amos', 'ais', 'am',
  'ei', 'aste', 'ou', 'amos', 'astes', 'aram',
  'ava', 'avas', 'ava', 'ávamos', 'áveis', 'avam',
  'ei', 'aste', 'ou', 'amos', 'astes', 'aram',
  'erei', 'erás', 'erá', 'eremos', 'ereis', 'erão',
  'ia', 'ias', 'ia', 'íamos', 'íeis', 'iam',
  'iria', 'irias', 'iria', 'iríamos', 'iríeis', 'iriam',
  'isse', 'isses', 'isse', 'íssemos', 'ísseis', 'issem',
  'indo', 'ido', 'indo', 'ida', 'idas', 'idos',
  'ndo',
  'mos',
];

const PLURAL_SUFFIXES = ['s', 'es', 'ões', 'ães', 'ais', 'eis', 'ois', 'ns'];

const ADVERB_SUFFIX = 'mente';

const AUGMENTATIVE_SUFFIXES = ['ão', 'ona', 'zão', 'zona', 'aço', 'aça'];

const DIMINUTIVE_SUFFIXES = [
  'inho', 'inha', 'inhos', 'inhas',
  'zinho', 'zinha', 'zinhos', 'zinhas',
];

function stripSuffix(word: string, suffix: string): string | null {
  if (word.length <= suffix.length + 1) return null;
  if (word.endsWith(suffix)) {
    return word.slice(0, -suffix.length);
  }
  return null;
}

function tryVerbConjugation(knownWords: Set<string>, word: string): boolean {
  if (word.length < 3) return false;

  for (const suffix of VERB_SUFFIXES) {
    const base = stripSuffix(word, suffix);
    if (base && knownWords.has(base)) return true;
  }

  const arEndings = ['ar', 'o', 'a', 'am', 'ei', 'aste', 'ou', 'aram', 'ava', 'ado'];
  const erEndings = ['er', 'o', 'e', 'em', 'i', 'eu', 'este', 'eram', 'ia', 'ido'];
  const irEndings = ['ir', 'o', 'e', 'em', 'i', 'iu', 'iste', 'iram', 'ia', 'ido'];

  for (const baseEnding of ['ar', 'er', 'ir']) {
    if (word.endsWith(baseEnding)) {
      const root = word.slice(0, -2);
      if (root.length > 1 && knownWords.has(root + 'ar')) return true;
      if (root.length > 1 && knownWords.has(root + 'er')) return true;
      if (root.length > 1 && knownWords.has(root + 'ir')) return true;
    }
  }

  return false;
}

function tryPlural(knownWords: Set<string>, word: string): boolean {
  for (const suffix of PLURAL_SUFFIXES) {
    const base = stripSuffix(word, suffix);
    if (base && knownWords.has(base)) return true;
  }

  if (word.endsWith('s')) {
    const singular = word.slice(0, -1);
    if (singular.length > 1 && knownWords.has(singular)) return true;
  }

  return false;
}

function tryAdverb(knownWords: Set<string>, word: string): boolean {
  const base = stripSuffix(word, ADVERB_SUFFIX);
  if (!base) return false;
  if (knownWords.has(base)) return true;
  if (base.endsWith('a') && knownWords.has(base.slice(0, -1) + 'o')) return true;
  return false;
}

function tryFeminine(knownWords: Set<string>, word: string): boolean {
  if (word.endsWith('a')) {
    const masculine = word.slice(0, -1) + 'o';
    if (masculine.length > 1 && knownWords.has(masculine)) return true;

    const masculine2 = word.slice(0, -1);
    if (masculine2.length > 1 && knownWords.has(masculine2)) return true;
  }

  if (word.endsWith('ora')) {
    const base = word.slice(0, -3) + 'or';
    if (base.length > 1 && knownWords.has(base)) return true;
  }

  if (word.endsWith('eira')) {
    const base = word.slice(0, -4) + 'eiro';
    if (base.length > 1 && knownWords.has(base)) return true;
    const base2 = word.slice(0, -4) + 'eira';
  }

  if (word.endsWith('triz')) {
    const base = word.slice(0, -4) + 'tor';
    if (base.length > 1 && knownWords.has(base)) return true;
  }

  return false;
}

function tryDiminutiveAugmentative(knownWords: Set<string>, word: string): boolean {
  for (const suffix of [...DIMINUTIVE_SUFFIXES, ...AUGMENTATIVE_SUFFIXES]) {
    const base = stripSuffix(word, suffix);
    if (base && knownWords.has(base)) return true;
  }
  return false;
}

function trySuperlative(knownWords: Set<string>, word: string): boolean {
  if (word.endsWith('íssimo') || word.endsWith('íssima')) {
    const base = word.replace(/íssim[oa]$/, '');
    if (base.length > 1 && knownWords.has(base + 'o')) return true;
    if (base.length > 1 && knownWords.has(base)) return true;
  }
  return false;
}

function isWordKnown(knownWords: Set<string>, word: string): boolean {
  const lower = word.toLowerCase();
  if (knownWords.has(lower)) return true;

  if (tryVerbConjugation(knownWords, lower)) return true;
  if (tryPlural(knownWords, lower)) return true;
  if (tryAdverb(knownWords, lower)) return true;
  if (tryFeminine(knownWords, lower)) return true;
  if (tryDiminutiveAugmentative(knownWords, lower)) return true;
  if (trySuperlative(knownWords, lower)) return true;

  if (lower.endsWith('mente')) {
    const base = lower.slice(0, -5);
    if (base.endsWith('a')) {
      const masc = base.slice(0, -1) + 'o';
      if (masc.length > 1 && knownWords.has(masc)) return true;
    }
  }

  return false;
}

const COMMON_WORDS = new Set([
  'à', 'às', 'ao', 'aos',
  'do', 'da', 'dos', 'das',
  'no', 'na', 'nos', 'nas',
  'pelo', 'pela', 'pelos', 'pelas',
  'este', 'esta', 'estes', 'estas', 'isto',
  'esse', 'essa', 'esses', 'essas', 'isso',
  'aquele', 'aquela', 'aqueles', 'aquelas', 'aquilo',
  'muito', 'muita', 'muitos', 'muitas',
  'pouco', 'pouca', 'poucos', 'poucas',
  'todo', 'toda', 'todos', 'todas',
  'algum', 'alguma', 'alguns', 'algumas',
  'nenhum', 'nenhuma', 'nenhuns', 'nenhumas',
  'outro', 'outra', 'outros', 'outras',
  'mesmo', 'mesma', 'mesmos', 'mesmas',
  'próprio', 'própria', 'próprios', 'próprias',
  'bom', 'boa', 'bons', 'boas',
  'mau', 'má', 'maus', 'más',
  'grande', 'grandes',
  'melhor', 'melhores',
  'pior', 'piores',
  'maior', 'maiores',
  'menor', 'menores',
  'lhe', 'lhes',
  'me', 'te', 'se', 'nos', 'vos',
  'meu', 'minha', 'meus', 'minhas',
  'teu', 'tua', 'teus', 'tuas',
  'seu', 'sua', 'seus', 'suas',
  'nosso', 'nossa', 'nossos', 'nossas',
  'vosso', 'vossa', 'vossos', 'vossas',
  'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles', 'elas',
  'você', 'vocês',
  'senhor', 'senhora',
  'estou', 'estás', 'está', 'estamos', 'estais', 'estão',
  'estive', 'esteve', 'estivemos', 'estiveram',
  'estava', 'estávamos', 'estáveis', 'estavam',
  'estarei', 'estará', 'estaremos', 'estarão',
  'estaria', 'estaríamos', 'estaríeis', 'estariam',
  'esteja', 'estejamos', 'estejam',
  'sou', 'és', 'é', 'somos', 'sois', 'são',
  'era', 'eras', 'éramos', 'éreis', 'eram',
  'fui', 'foi', 'fomos', 'foram',
  'serei', 'será', 'seremos', 'serão',
  'seria', 'seríamos', 'seríeis', 'seriam',
  'seja', 'sejas', 'sejamos', 'sejam',
  'tenho', 'tens', 'tem', 'temos', 'tendes', 'têm',
  'tinha', 'tínhamos', 'tínheis', 'tinham',
  'tive', 'teve', 'tivemos', 'tiveram',
  'terei', 'terá', 'teremos', 'terão',
  'teria', 'teríamos', 'teríeis', 'teriam',
  'tenha', 'tenhas', 'tenhamos', 'tenham',
  'faço', 'fazes', 'faz', 'fazemos', 'fazeis', 'fazem',
  'fiz', 'fez', 'fizemos', 'fizeram',
  'farei', 'fará', 'faremos', 'farão',
  'faria', 'faríamos', 'faríeis', 'fariam',
  'faça', 'faças', 'façamos', 'façam',
  'digo', 'dizes', 'diz', 'dizemos', 'dizeis', 'dizem',
  'disse', 'disseste', 'dissemos', 'disseram',
  'direi', 'dirá', 'diremos', 'dirão',
  'diria', 'diríamos', 'diríeis', 'diriam',
  'diga', 'digas', 'digamos', 'digam',
  'vou', 'vais', 'vai', 'vamos', 'ides', 'vão',
  'ia', 'ías', 'íamos', 'íeis', 'iam',
  'fui', 'foi', 'fomos', 'foram',
  'irei', 'irá', 'iremos', 'irão',
  'iria', 'iríamos', 'iríeis', 'iriam',
  'vá', 'vás', 'vamos', 'vão',
  'posso', 'podes', 'pode', 'podemos', 'podeis', 'podem',
  'pude', 'pôde', 'pudemos', 'puderam',
  'poderei', 'poderá', 'poderemos', 'poderão',
  'poderia', 'poderíamos', 'poderíeis', 'poderiam',
  'possa', 'possas', 'possamos', 'possamos', 'possam',
  'quero', 'queres', 'quer', 'queremos', 'quereis', 'querem',
  'quis', 'quiseste', 'quisemos', 'quiseram',
  'queria', 'queríamos', 'queríeis', 'queriam',
  'queira', 'queiras', 'queiramos', 'queiram',
  'saber', 'sei', 'sabe', 'sabemos', 'sabeis', 'sabem',
  'soube', 'souberam',
  'saberei', 'saberá', 'saberemos', 'saberão',
  'sabia', 'sabíamos', 'sabiam',
  'há', 'houve', 'houveram', 'haverá', 'haveria',
  'dá', 'dão', 'dei', 'deu', 'deram', 'dava', 'daremos',
  'vê', 'viu', 'viram', 'via', 'víamos', 'viam', 'verei', 'verá',
  'crê', 'cri', 'cremos', 'criam',
  'lê', 'li', 'lemos', 'leio', 'leem',
  'ri', 'riu', 'riram', 'ria', 'ríamos',
  'põe', 'pôs', 'põem', 'punha', 'punham',
  'vem', 'vimos', 'vieram', 'vindo', 'viera',
  'contém', 'contêm', 'conteve',
  'obtém', 'obtêm', 'obteve',
  'advém', 'advêm',
  'intervém', 'intervêm',
  'mantém', 'mantêm', 'manteve',
]);

function isPunctuationOrNumber(word: string): boolean {
  return /^[\d.,!?;:()\[\]{}\"'«»\-—…\s]+$/.test(word);
}

export async function checkText(text: string): Promise<SpellCheckResult> {
  const knownWords = await getWordSet();

  const errors: SpellingError[] = [];

  const wordRegex = /[a-zA-ZáàâãéèêíïóôõöúçñüÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑÜ]+/g;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(text)) !== null) {
    const word = match[0];
    const position = match.index;

    if (isPunctuationOrNumber(word)) continue;
    if (isWordKnown(knownWords, word)) continue;
    if (COMMON_WORDS.has(word.toLowerCase())) continue;

    const suggestions = generateSuggestions(knownWords, word);
    errors.push({ word, position, suggestions });
  }

  return { errors };
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function generateSuggestions(knownWords: Set<string>, word: string): string[] {
  const lower = word.toLowerCase();
  const candidates: { word: string; dist: number }[] = [];

  const accentReplacements: Record<string, string> = {
    'a': 'áàâã', 'e': 'éê', 'i': 'í', 'o': 'óôõ', 'u': 'ú',
    'c': 'ç',
    'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a',
    'é': 'e', 'ê': 'e',
    'í': 'i',
    'ó': 'o', 'ô': 'o', 'õ': 'o',
    'ú': 'u',
    'ç': 'c',
  };

  const altSpellings: string[] = [];
  const chars = word.split('');

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i].toLowerCase();
    const replacements = accentReplacements[ch];
    if (replacements) {
      for (const r of replacements) {
        const alt = [...chars];
        alt[i] = ch === chars[i] ? r : ch.toUpperCase() === chars[i] ? r.toUpperCase() : r;
        altSpellings.push(alt.join(''));
      }
    }
  }

  const doubledLetters = /(.)\1/.test(word);
  if (doubledLetters) {
    const deduped = word.replace(/(.)\1+/g, '$1');
    altSpellings.push(deduped);
    const deduped2 = word.replace(/(.)\1/g, '$1');
    if (deduped2 !== deduped) altSpellings.push(deduped2);
  } else {
    for (let i = 0; i < word.length; i++) {
      const doubled = word.slice(0, i) + word[i] + word.slice(i);
      altSpellings.push(doubled);
    }
  }

  for (const alt of altSpellings) {
    if (isWordKnown(knownWords, alt) || COMMON_WORDS.has(alt.toLowerCase())) {
      const dist = levenshteinDistance(lower, alt.toLowerCase());
      candidates.push({ word: alt, dist });
    }
  }

  const knownWordsArray = Array.from(knownWords);
  const shortList = knownWordsArray
    .filter(w => Math.abs(w.length - lower.length) <= 2 && w[0] === lower[0]);

  for (const known of shortList) {
    const dist = levenshteinDistance(lower, known);
    if (dist <= 2) {
      candidates.push({ word: known, dist });
    }
  }

  candidates.sort((a, b) => a.dist - b.dist);

  return [...new Set(candidates.map(c => c.word))].slice(0, 5);
}
