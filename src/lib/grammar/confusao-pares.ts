interface PairError {
  word: string;
  position: number;
  expected: string;
  message: string;
}

const PAIRS: {
  matchWord: (word: string) => boolean;
  contextCheck: (tokens: { word: string; position: number }[], i: number) => boolean;
  expected: string;
  message: string;
}[] = [
  // "mais" used as adversative conjunction (before comma or after period)
  {
    matchWord: (w) => /^mais$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0) return true;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      return prev === ',' || prev === '.' || prev === ';';
    },
    expected: 'mas',
    message: '"mas" (conjunção adversativa) no lugar de "mais" (quantidade)',
  },
  // "mau" before adjective/participle → should be "mal"
  {
    matchWord: (w) => /^mau$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      return /^(aluno|exemplo|humor|gosto|caráter|elemento|resultado|entendido|visto)$/i.test(next || '');
    },
    expected: 'mal',
    message: '"mal" (advérbio) antes de adjetivo/particípio — não "mau" (adjetivo)',
  },
  // "mal" after ser/estar → should be "mau"
  {
    matchWord: (w) => /^mal$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      return /^(é|foi|era|será|seria|seja|fosse|sendo|sou|somos|são|estou|está|estamos|estão|estava|estive|esteve|estivesse)$/i.test(prev || '');
    },
    expected: 'mau',
    message: '"mau" (adjetivo) após verbo ser/estar — não "mal" (advérbio)',
  },
  // "a" for time elapsed → should be "há"
  {
    matchWord: (w) => /^a$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      return /^(dois|três|quatro|cinco|seis|sete|oito|nove|dez|muito|pouco|alguns|algumas)$/i.test(next || '');
    },
    expected: 'há',
    message: '"há" (verbo haver = tempo decorrido) no lugar de "a" (preposição)',
  },
  // "porque" in questions → should be "por que"
  {
    matchWord: (w) => /^porque$/i.test(w),
    contextCheck: (_tokens, i) => {
      const next = _tokens[i + 1]?.word;
      if (next && next.endsWith('?')) return true;
      return false;
    },
    expected: 'por que',
    message: '"por que" (pergunta) no lugar de "porque" (afirmação)',
  },
  // "onde" with movement verb → should be "aonde"
  {
    matchWord: (w) => /^onde$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      return /^(ir|vou|vai|foi|indo|irei|iria|fui)$/i.test(prev || '');
    },
    expected: 'aonde',
    message: '"aonde" (movimento/destino) no lugar de "onde" (localização estática)',
  },
];

export interface PairValidationResult {
  errors: PairError[];
}

export function validatePairs(text: string): PairValidationResult {
  const tokens = tokenize(text);
  const errors: PairError[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const { word, position } = tokens[i];
    for (const pair of PAIRS) {
      if (pair.matchWord(word) && pair.contextCheck(tokens, i)) {
        errors.push({
          word,
          position,
          expected: pair.expected,
          message: pair.message,
        });
      }
    }
  }

  return { errors };
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

export type { PairError };
