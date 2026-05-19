import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ToneProfile {
  code: string;
  tone: string;
  title: string;
  source: string;
  description: string;
  keywords: string[];
  badExample: string;
  goodExample: string;
  severity: 'alta' | 'media' | 'baixa';
  category: string;
  canonicalExample?: {
    author: string;
    work: string;
    verse: string;
  };
}

export interface ToneSection {
  name: string;
  profiles: ToneProfile[];
}

const CATEGORY_MAP: Record<string, string> = {
  'vocabulário': 'vocabulario',
  'vocabulario': 'vocabulario',
  'imagens': 'imagens',
  'figuras': 'figuras',
  'ritmo': 'ritmo',
  'estrutura': 'estrutura',
  'anti-padrão': 'anti-padrao',
  'anti-padrao': 'anti-padrao',
  'tom': 'tom',
  'essência': 'essencia',
  'essencia': 'essencia',
  'recursos': 'recursos',
  'erótico': 'erotico',
  'erotico': 'erotico',
  'grotesco': 'grotesco',
  'sagrado': 'sagrado',
  'híbrido': 'hibrido',
  'hibrido': 'hibrido',
  'melancólico': 'melancolico',
  'melancolico': 'melancolico',
  'jubiloso': 'jubiloso',
  'satírico': 'satirico',
  'satirico': 'satirico',
  'lirico': 'lirico',
  'lírico': 'lirico',
};

function normalizeCategory(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  const parts = trimmed.split('—');
  const last = parts[parts.length - 1]?.trim() ?? '';
  return CATEGORY_MAP[last] ?? last.replace(/[^a-z0-9]+/g, '_');
}

export function normalizeToneName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

const STOP_WORDS = new Set([
  'que', 'para', 'com', 'por', 'como', 'mais', 'mas', 'dos', 'das',
  'não', 'nao', 'uma', 'sua', 'seu', 'qual', 'este', 'esta', 'entre', 'sobre',
  'tom', 'usa', 'usar', 'evitar', 'preferir', 'criar',
  'através', 'atraves', 'quando', 'tudo', 'pois',
  'muito', 'pouco', 'todo', 'mesmo', 'grande',
  'gente', 'coisa', 'parte', 'lugar', 'forma', 'comum',
  'tipo', 'modo', 'vez', 'caso', 'fato', 'ponto', 'meio', 'fim',
  'são', 'estão', 'tinha', 'havia', 'ser', 'estar', 'ter', 'pode',
  'texto', 'autor', 'obra', 'leitor', 'leitora',
  'estrofe', 'poético', 'poetico', 'literário', 'literario',
  'brasileiro', 'brasileira', 'português', 'portugues', 'portuguesa',
  'ainda', 'também', 'tambem', 'depois', 'antes', 'sempre', 'nunca',
  'sem', 'sob', 'sobre', 'contra', 'desde', 'durante', 'mediante',
  'palavras', 'palavra', 'através', 'atraves', 'através', 'através',
]);

const COMMON_LISTS = new Set([
  'são', 'estao', 'eram', 'foram', 'sobre', 'poema', 'tom',
  'verso', 'versos', 'poesia', 'imagem', 'poético', 'poetico',
]);

function extractKeywords(text: string): string[] {
  const keywords = new Set<string>();
  const cleaned = text.replace(/^Descrição:\s*/i, '');
  const segments = cleaned.split(/[：:—]/);

  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;
    const items = trimmed.split(',').map(s => {
      let clean = s.trim()
        .replace(/^["'«»\[\(]/, '')
        .replace(/["'«»\]\)\.;!?]+$/, '')
        .trim();
      return clean;
    }).filter(s => {
      if (s.length < 2) return false;
      if (s.includes(' ')) return false;
      const lower = s.toLowerCase();
      if (STOP_WORDS.has(lower)) return false;
      if (COMMON_LISTS.has(lower)) return false;
      if (/^\d/.test(s)) return false;
      return true;
    });

    if (items.length >= 2) {
      items.forEach(k => keywords.add(k.toLowerCase()));
    }
  }

  return [...keywords];
}

const EXAMPLE_RE = /^(.+?),\s*"([^"]+)"\s*(?:\([^)]*\)\s*)?:\s*"(.+)"$/;

function parseCanonicalExample(line: string): { author: string; work: string; verse: string } | undefined {
  const content = line.replace(/^Exemplo real:\s*/, '').trim();
  const match = content.match(EXAMPLE_RE);
  if (match) {
    return { author: match[1].trim(), work: match[2].trim(), verse: match[3].trim() };
  }
  return undefined;
}

const RULE_START = /^##\s*\[(TOM-\d+)\]\s*(.+)$/;
const FIELD_SOURCE = /^(Fonte|fonte):\s*(.+)$/;
const FIELD_DESC = /^Descrição:\s*(.+)$/;
const FIELD_BAD = /^❌\s*Errado:\s*"(.+)"\s*$/;
const FIELD_GOOD = /^✅\s*Correto:\s*"(.+)"\s*$/;
const FIELD_SEV = /^Severidade:\s*(alta|media|baixa)\s*$/;
const FIELD_CAT = /^Categoria:\s*(.+)$/;
const FIELD_EXAMPLE = /^Exemplo real:\s*(.+)$/;
const SEPARATOR = /^={10,}$/;

function parseTomFile(): ToneSection[] {
  const filePath = join(process.cwd(), 'docs', 'nbr', 'tom.txt');
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const sections: ToneSection[] = [];
  let currentSection: ToneSection | null = null;
  let currentProfile: Partial<ToneProfile> | null = null;
  let justOpenedSection = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimEnd();

    if (SEPARATOR.test(trimmed)) {
      if (currentProfile && currentSection) {
        finalizeProfile(currentProfile, currentSection.name);
        currentSection.profiles.push(currentProfile as ToneProfile);
        currentProfile = null;
      }

      if (justOpenedSection) {
        justOpenedSection = false;
        continue;
      }

      let j = i + 1;
      while (j < lines.length && !lines[j].trimEnd()) j++;
      if (j < lines.length) {
        const rawName = lines[j].trimEnd();
        currentSection = { name: normalizeToneName(rawName), profiles: [] };
        sections.push(currentSection);
        i = j;
        justOpenedSection = true;
      }
      continue;
    }

    const ruleMatch = trimmed.match(RULE_START);
    if (ruleMatch && currentSection) {
      if (currentProfile) {
        finalizeProfile(currentProfile, currentSection.name);
        currentSection.profiles.push(currentProfile as ToneProfile);
      }
      currentProfile = {
        code: ruleMatch[1],
        title: ruleMatch[2].trim(),
        tone: currentSection.name,
      };
      continue;
    }

    if (!currentProfile) continue;

    let m: RegExpMatchArray | null;

    if ((m = trimmed.match(FIELD_SOURCE))) {
      currentProfile.source = (currentProfile.source ?? '') + m[2].trim();
    } else if ((m = trimmed.match(FIELD_DESC))) {
      currentProfile.description = (currentProfile.description ?? '') + m[1].trim();
    } else if ((m = trimmed.match(FIELD_BAD))) {
      currentProfile.badExample = m[1];
    } else if ((m = trimmed.match(FIELD_GOOD))) {
      if (!currentProfile.goodExample) {
        currentProfile.goodExample = m[1];
      }
    } else if ((m = trimmed.match(FIELD_SEV))) {
      currentProfile.severity = m[1] as 'alta' | 'media' | 'baixa';
    } else if ((m = trimmed.match(FIELD_CAT))) {
      currentProfile.category = normalizeCategory(m[1]);
    } else if ((m = trimmed.match(FIELD_EXAMPLE))) {
      const example = parseCanonicalExample(m[1]);
      if (example) {
        currentProfile.canonicalExample = example;
      }
    }
  }

  if (currentProfile && currentSection) {
    finalizeProfile(currentProfile, currentSection.name);
    currentSection.profiles.push(currentProfile as ToneProfile);
  }

  return sections;
}

function finalizeProfile(p: Partial<ToneProfile>, toneName: string): void {
  p.tone = toneName;
  p.keywords = extractKeywords(p.description ?? '');
  p.source = p.source ?? '';
  p.description = p.description ?? '';
  p.badExample = p.badExample ?? '';
  p.goodExample = p.goodExample ?? '';
  p.severity = p.severity ?? 'media';
  p.category = p.category ?? 'outro';
}

let cachedSections: ToneSection[] | null = null;

export function getToneProfiles(): ToneSection[] {
  if (!cachedSections) {
    cachedSections = parseTomFile();
  }
  return cachedSections;
}
