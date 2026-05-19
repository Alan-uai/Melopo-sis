export interface TaggedToken {
  word: string;
  tag: string;
  position: number;
}

let taggerInstance: {
  analyzeString: (text: string) => Promise<string[]>;
} | null = null;

async function getTagger(): Promise<typeof taggerInstance> {
  if (taggerInstance) return taggerInstance;
  const PosTagger = (await import('singularity-tagger')).default;
  taggerInstance = await PosTagger();
  return taggerInstance;
}

export async function tagText(text: string): Promise<TaggedToken[]> {
  if (!text.trim()) return [];
  const tagger = await getTagger();
  const raw = await tagger!.analyzeString(text);
  const result: TaggedToken[] = [];
  let searchFrom = 0;

  for (const item of raw) {
    const i = item.lastIndexOf('_');
    if (i === -1) continue;
    const word = item.slice(0, i);
    const tag = item.slice(i + 1);
    const idx = text.indexOf(word, searchFrom);
    const position = idx !== -1 ? idx : searchFrom;
    if (idx !== -1) searchFrom = idx + word.length;
    result.push({ word, tag, position });
  }

  return result;
}

const FEMININE_ENDINGS = /[aáàâã]o?$/;
const MASCULINE_ENDINGS = /[oôéê]s?$/;
const PLURAL_ENDINGS = /(?:s|ns|ães|ões|ais|eis|is)$/;
const SINGULAR_ENDINGS = /[oaeo]$/;

const MASCULINE_ONLY = new Set([
  'mapa', 'sistema', 'problema', 'tema', 'poema', 'drama', 'clima',
  'idioma', 'grama', 'sofá', 'pijama', 'telegrama', 'cinema',
]);

const FEMININE_ONLY = new Set([
  'mão', 'nação', 'lição', 'paixão', 'razão', 'solução',
]);

export function likelyPlural(word: string): boolean {
  const lower = word.toLowerCase().trim();
  if (lower.endsWith('s') && !lower.endsWith('ss')) return true;
  return false;
}

export function likelySingular(word: string): boolean {
  const lower = word.toLowerCase().trim();
  if (MASCULINE_ONLY.has(lower) || FEMININE_ONLY.has(lower)) return true;
  if (lower.endsWith('s')) return false;
  return true;
}

export function likelyFeminine(word: string): boolean | null {
  const lower = word.toLowerCase().trim();
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
