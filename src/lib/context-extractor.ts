const PORTUGUESE_STOPWORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
  'um', 'uma', 'uns', 'umas', 'o', 'a', 'os', 'as',
  'para', 'por', 'com', 'sem', 'sob', 'sobre', 'entre',
  'que', 'como', 'mas', 'e', 'ou', 'nem', 'se',
  'ele', 'ela', 'eles', 'elas', 'meu', 'minha', 'teu', 'tua',
  'seu', 'sua', 'nosso', 'nossa', 'vosso', 'vossa',
  'eu', 'tu', 'ele', 'nós', 'vós', 'eles',
  'me', 'te', 'se', 'nos', 'vos', 'lhe', 'lhes',
  'já', 'mais', 'menos', 'muito', 'pouco', 'bem', 'mal',
  'só', 'também', 'ainda', 'depois', 'antes',
  'agora', 'hoje', 'amanhã', 'ontem', 'sempre', 'nunca',
  'cá', 'lá', 'ali', 'aqui', 'acolá',
  'sim', 'não', 'talvez', 'ser', 'estar', 'ter', 'haver',
  'foi', 'era', 'são', 'está', 'estão', 'tem', 'têm',
  'há', 'tinha', 'tive', 'teve', 'tido',
  'porque', 'pois', 'portanto', 'contudo', 'todavia',
  'entretanto', 'assim', 'tão', 'quão', 'quanto',
  'isto', 'isso', 'aquilo', 'este', 'esta', 'esse', 'essa',
  'aquele', 'aquela', 'estes', 'estas', 'esses', 'essas',
  'aqueles', 'aquelas',
]);

function extractVocabulary(text: string): Set<string> {
  const words = text.toLowerCase()
    .replace(/[^a-záéíóúâêîôûãõçàèìòùäëïöü]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !PORTUGUESE_STOPWORDS.has(w));
  return new Set(words);
}

function calculateOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }
  return intersection / Math.min(a.size, b.size);
}

export function extractRelevantContent(
  chunks: Array<{ text: string; metadata: Record<string, string> }>,
  poemText: string,
): string {
  const poemVocab = extractVocabulary(poemText);
  const results: string[] = [];

  for (const chunk of chunks) {
    const chunkType = chunk.metadata.chunkType || 'rule';

    if (chunkType === 'rule') {
      const lines = chunk.text.split('\n');
      let currentBlock: string[] = [];
      let blockRelevant = false;

      for (const line of lines) {
        const isCodeHeader = /^## \[[A-Z]+-\d+\]/.test(line);
        if (isCodeHeader) {
          if (blockRelevant && currentBlock.length > 0) {
            results.push(currentBlock.join('\n'));
          }
          currentBlock = [line];
          blockRelevant = false;
          continue;
        }

        currentBlock.push(line);
        if (!blockRelevant && line.trim()) {
          const lineVocab = extractVocabulary(line);
          if (calculateOverlap(poemVocab, lineVocab) > 0.1) {
            blockRelevant = true;
          }
        }
      }
      if (blockRelevant && currentBlock.length > 0) {
        results.push(currentBlock.join('\n'));
      }
    } else {
      const paragraphs = chunk.text.split(/\n\n+/);
      const relevantParas = paragraphs.filter(para => {
        const trimmed = para.trim();
        if (trimmed.length < 20) return false;
        const paraVocab = extractVocabulary(trimmed);
        return calculateOverlap(poemVocab, paraVocab) > 0.15;
      });

      if (relevantParas.length > 0) {
        const source = chunk.metadata.sourceFile || '';
        results.push(relevantParas.join('\n\n') + (source ? `\n\n[Fonte: ${source}]` : ''));
      }
    }
  }

  const output = results.join('\n\n---\n\n');

  if (output.length < 200 && chunks.length > 0) {
    return chunks
      .map(c => {
        const source = c.metadata.sourceFile || '';
        const section = c.metadata.section || c.metadata.code || '';
        return `[${source}]${section ? ` — ${section}` : ''}\n${c.text}`;
      })
      .join('\n\n---\n\n');
  }

  return output;
}
