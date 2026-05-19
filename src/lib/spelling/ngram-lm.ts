type NgramMap = Map<string, number>;

export class NgramLM {
  private unigrams: NgramMap = new Map();
  private bigrams: NgramMap = new Map();
  private trigrams: NgramMap = new Map();
  private totalUnigrams = 0;

  private readonly STUPID_BACKOFF_ALPHA = 0.4;

  train(texts: string[]): void {
    for (const text of texts) {
      const tokens = tokenize(text);
      if (tokens.length === 0) continue;

      for (const t of tokens) {
        this.unigrams.set(t, (this.unigrams.get(t) || 0) + 1);
        this.totalUnigrams++;
      }

      for (let i = 0; i < tokens.length - 1; i++) {
        const bg = `${tokens[i]}|${tokens[i + 1]}`;
        this.bigrams.set(bg, (this.bigrams.get(bg) || 0) + 1);
      }

      for (let i = 0; i < tokens.length - 2; i++) {
        const tg = `${tokens[i]}|${tokens[i + 1]}|${tokens[i + 2]}`;
        this.trigrams.set(tg, (this.trigrams.get(tg) || 0) + 1);
      }
    }
  }

  unigramProb(word: string): number {
    const count = this.unigrams.get(word.toLowerCase()) || 0;
    if (this.totalUnigrams === 0) return 0;
    return count / this.totalUnigrams;
  }

  bigramProb(prev: string, word: string): number {
    const bg = `${prev.toLowerCase()}|${word.toLowerCase()}`;
    const count = this.bigrams.get(bg) || 0;
    const prevCount = this.unigrams.get(prev.toLowerCase()) || 0;
    if (prevCount === 0) {
      return this.STUPID_BACKOFF_ALPHA * this.unigramProb(word);
    }
    return count / prevCount;
  }

  trigramProb(prev1: string, prev2: string, word: string): number {
    const tg = `${prev1.toLowerCase()}|${prev2.toLowerCase()}|${word.toLowerCase()}`;
    const count = this.trigrams.get(tg) || 0;
    const bgCount = this.bigrams.get(`${prev1.toLowerCase()}|${prev2.toLowerCase()}`) || 0;
    if (bgCount === 0) {
      return this.STUPID_BACKOFF_ALPHA * this.bigramProb(prev2, word);
    }
    return count / bgCount;
  }

  scoreInContext(word: string, leftContext: string[], rightContext: string[]): number {
    let score = this.unigramProb(word);
    const wordLower = word.toLowerCase();

    if (leftContext.length >= 1) {
      score += this.bigramProb(leftContext[leftContext.length - 1], wordLower);
    }
    if (leftContext.length >= 2) {
      score += this.trigramProb(
        leftContext[leftContext.length - 2],
        leftContext[leftContext.length - 1],
        wordLower
      );
    }
    if (rightContext.length >= 1) {
      score += this.bigramProb(wordLower, rightContext[0]);
    }
    if (leftContext.length >= 1 && rightContext.length >= 1) {
      score += this.trigramProb(
        leftContext[leftContext.length - 1],
        wordLower,
        rightContext[0]
      );
    }

    return score;
  }

  rankSuggestions(
    candidates: string[],
    leftContext: string[],
    rightContext: string[]
  ): string[] {
    const scored = candidates.map(c => ({
      word: c,
      score: this.scoreInContext(c, leftContext, rightContext),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.word);
  }

  serialize(): string {
    return JSON.stringify({
      u: Array.from(this.unigrams.entries()),
      b: Array.from(this.bigrams.entries()),
      t: Array.from(this.trigrams.entries()),
      total: this.totalUnigrams,
    });
  }

  static deserialize(json: string): NgramLM {
    const lm = new NgramLM();
    const data = JSON.parse(json);
    lm.unigrams = new Map(data.u);
    lm.bigrams = new Map(data.b);
    lm.trigrams = new Map(data.t);
    lm.totalUnigrams = data.total;
    return lm;
  }

  get size(): number {
    return this.unigrams.size;
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-záàâãéèêíïóôõöúçñ]+/)
    .filter(Boolean);
}

export type { NgramMap };
