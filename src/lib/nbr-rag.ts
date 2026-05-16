import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Document } from 'genkit/retriever';
import { ai, nbrIndexer, nbrRetriever } from '@/ai/genkit';

const NBR_DIR = join(process.cwd(), 'docs', 'nbr');

const STRUCTURE_FILE_MAP: Record<string, string> = {
  soneto: 'soneto.txt',
  haicai: 'haicai.txt',
  cordel: 'cordel.txt',
  redondilha: 'redondilha.txt',
  decassilabo: 'decassilabo.txt',
  poema: 'poema-poesia.txt',
  poesia: 'poema-poesia.txt',
  trova: 'trova.txt',
  oitava: 'oitava.txt',
  decima: 'decima.txt',
  elegia: 'elegia.txt',
  ode: 'ode.txt',
  'verso-livre': 'verso-livre.txt',
  'poesia-concreta-visual': 'poesia-concreta-visual.txt',
  'poesia-marginal-slam': 'poesia-marginal-slam.txt',
  'figuras-linguagem': 'figuras-linguagem.txt',
  'revisao-poetica': 'revisao-poetica.txt',
};

const RESEARCH_FILE_MAP: Record<string, string> = {
  soneto: null as unknown as string,
  haicai: null as unknown as string,
  cordel: null as unknown as string,
  redondilha: null as unknown as string,
  decassilabo: null as unknown as string,
  poema: null as unknown as string,
  poesia: null as unknown as string,
  trova: 'trova-research.txt',
  oitava: 'oitava-research.txt',
  decima: 'decima-research.txt',
  elegia: 'elegia-research.txt',
  ode: 'ode-research.txt',
  'verso-livre': 'verso-livre-research.txt',
  'poesia-concreta-visual': 'poesia-concreta-visual-research.txt',
  'poesia-marginal-slam': 'poesia-marginal-slam-research.txt',
  'figuras-linguagem': 'figuras-linguagem-research.txt',
  'revisao-poetica': 'revisao-poetica-research.txt',
};

export function getResearchFilename(structure: string): string | null {
  return RESEARCH_FILE_MAP[structure] || null;
}

export function getRuleFilename(structure: string): string | null {
  return STRUCTURE_FILE_MAP[structure] || null;
}

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

function getSectionName(line: string): string {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return '';
  return trimmed;
}

function chunkRuleFile(content: string, sourceFile: string): Array<{ text: string; metadata: Record<string, string> }> {
  const lines = content.split('\n');
  const chunks: Array<{ text: string; metadata: Record<string, string> }> = [];
  let buffer: string[] = [];
  let currentCode = '';
  let inCode = false;
  let currentSection = '';

  function flush() {
    if (buffer.length === 0 || !inCode) return;
    chunks.push({
      text: buffer.join('\n'),
      metadata: {
        sourceFile,
        code: currentCode,
        section: currentSection,
        chunkType: 'rule',
      },
    });
    buffer = [];
  }

  for (const line of lines) {
    const codeMatch = line.match(/^## \[([A-Z]+-\d+)\]/);
    if (codeMatch) {
      flush();
      currentCode = codeMatch[1];
      inCode = true;
      buffer.push(line);
      continue;
    }

    const sectionMatch = line.match(/^={3,}\s*$/);
    if (sectionMatch) {
      const nextSectionName = getSectionName(lines[lines.indexOf(line) + 1] || '');
      if (nextSectionName) {
        currentSection = nextSectionName;
      }
      buffer.push(line);
      continue;
    }

    buffer.push(line);
  }
  flush();

  return chunks;
}

function chunkResearchFile(content: string, sourceFile: string): Array<{ text: string; metadata: Record<string, string> }> {
  const lines = content.split('\n');
  const chunks: Array<{ text: string; metadata: Record<string, string> }> = [];
  let buffer: string[] = [];
  let currentSection = '';
  let separatorCount = 0;

  function flush() {
    if (buffer.length === 0) return;
    chunks.push({
      text: buffer.join('\n'),
      metadata: {
        sourceFile,
        section: currentSection,
        chunkType: 'research',
      },
    });
    buffer = [];
  }

  for (const line of lines) {
    if (line.startsWith('=') && line.length > 10) {
      separatorCount++;
      if (separatorCount % 2 === 0 && buffer.length > 0) {
        currentSection = '';
      }
      buffer.push(line);
      continue;
    }

    if (line.startsWith('# ')) {
      buffer.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed && separatorCount > 0) {
      buffer.push(line);
      continue;
    }

    if (separatorCount > 0 && trimmed && !currentSection) {
      currentSection = trimmed;
    }

    buffer.push(line);
  }
  flush();

  return chunks;
}

export function chunkFile(filePath: string): Array<{ text: string; metadata: Record<string, string> }> {
  const content = readFileSync(filePath, 'utf-8');
  const fileName = filePath.split('/').pop() || '';

  if (fileName.endsWith('-research.txt')) {
    return chunkResearchFile(content, fileName);
  }
  return chunkRuleFile(content, fileName);
}

export function getAllNbrFiles(): string[] {
  return readdirSync(NBR_DIR)
    .filter(f => f.endsWith('.txt'))
    .map(f => join(NBR_DIR, f));
}

// ---------------------------------------------------------------------------
// Indexing
// ---------------------------------------------------------------------------

let indexedCount = 0;

export async function indexAllNbrFiles(): Promise<number> {
  const files = getAllNbrFiles();
  let total = 0;

  for (const filePath of files) {
    const chunks = chunkFile(filePath);
    if (chunks.length === 0) continue;

    const documents = chunks.map(c =>
      Document.fromText(c.text, c.metadata)
    );

    await ai.index({
      indexer: nbrIndexer,
      documents,
    });

    total += documents.length;
  }

  indexedCount = total;
  return total;
}

export function getIndexedCount(): number {
  return indexedCount;
}

// ---------------------------------------------------------------------------
// Retrieval
// ---------------------------------------------------------------------------

export type RetrievalOptions = {
  structure: string;
  text: string;
  focus: 'grammar' | 'tone';
  tone?: string;
  rhyme?: boolean;
  k?: number;
};

function buildQuery(opts: RetrievalOptions): string {
  const { structure, text, focus, tone, rhyme } = opts;
  const preview = text.replace(/\s+/g, ' ').slice(0, 300);

  if (focus === 'grammar') {
    const parts = [
      `[${structure}]`,
      'NBR regras: métrica rima estrofação estrofe verso escansão sílaba acento pontuação espaçamento parágrafo concordância ortografia',
    ];
    if (rhyme) parts.push('rima obrigatória rima consoante toante rica pobre');
    return parts.join(' ');
  }

  const parts = [
    `[${structure}]`,
    tone ? `tom ${tone}` : '',
    'tom poético estilo dicção figura de linguagem metáfora imagem exemplos',
  ];
  if (rhyme) parts.push('rima musicalidade sonoridade');
  return parts.filter(Boolean).join(' ');
}

export async function retrieveRelevantChunks(
  opts: RetrievalOptions,
): Promise<Array<{ text: string; metadata: Record<string, string> }>> {
  const query = buildQuery(opts);

  try {
    const docs = await ai.retrieve({
      retriever: nbrRetriever,
      query,
      options: { k: opts.k || 6 },
    });

    if (!docs || docs.length === 0) return [];

    return docs.map(d => ({
      text: typeof d.content === 'string' ? d.content : JSON.stringify(d.content),
      metadata: (d.metadata as Record<string, string>) || {},
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Fallback: load the research file for the selected structure
// ---------------------------------------------------------------------------

const MAX_RESEARCH_FALLBACK = 15000;

export function loadResearchFallback(structure: string): string {
  const filename = RESEARCH_FILE_MAP[structure];
  if (!filename) return '';

  try {
    const filePath = join(NBR_DIR, filename);
    const content = readFileSync(filePath, 'utf-8');
    if (content.length > MAX_RESEARCH_FALLBACK) {
      return content.slice(0, MAX_RESEARCH_FALLBACK) + '\n# ... (truncado por tamanho)';
    }
    return content;
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Build research context string for the prompt
// ---------------------------------------------------------------------------

export async function buildResearchContext(
  opts: RetrievalOptions,
): Promise<string> {
  const chunks = await retrieveRelevantChunks(opts);

  if (chunks.length === 0) {
    if (opts.focus === 'grammar') return '';
    return loadResearchFallback(opts.structure);
  }

  return chunks
    .map(c => {
      const source = c.metadata.sourceFile || '';
      const section = c.metadata.section || c.metadata.code || '';
      return `[${source}]${section ? ` — ${section}` : ''}\n${c.text}`;
    })
    .join('\n\n---\n\n');
}
