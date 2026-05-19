interface BertSuggestion {
  original: string;
  predicted: string;
  confidence: number;
  position: number;
}

let pipeline: any = null;

const MIN_CONFIDENCE = 0.3;

export async function getBertSpellingSuggestions(text: string): Promise<BertSuggestion[]> {
  try {
    const { pipeline: pipe } = await import('@huggingface/transformers');
    if (!pipeline) {
      pipeline = await pipe('fill-mask', 'Xenova/bert-base-portuguese-cased');
    }

    const tokens = tokenize(text);
    const suggestions: BertSuggestion[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const { word, position } = tokens[i];
      const masked = text.slice(0, position) + '[MASK]' + text.slice(position + word.length);

      const results = await pipeline(masked);
      const top = results[0];

      if (top && top.token_str && top.score >= MIN_CONFIDENCE) {
        const predicted = top.token_str as string;
        if (predicted.toLowerCase() !== word.toLowerCase()) {
          suggestions.push({
            original: word,
            predicted,
            confidence: top.score,
            position,
          });
        }
      }
    }

    return suggestions;
  } catch {
    return [];
  }
}

function tokenize(text: string): { word: string; position: number }[] {
  const tokens: { word: string; position: number }[] = [];
  const re = /[a-zA-ZáàâãéèêíïóôõöúçñüÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑÜ]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    tokens.push({ word: m[0], position: m.index });
  }
  return tokens;
}

export type { BertSuggestion };
