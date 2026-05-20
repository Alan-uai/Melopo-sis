interface SpellCheckMessage {
  id: string;
  type: 'check' | 'warmup';
  text?: string;
}

interface SpellCheckResponse {
  id: string;
  type: 'result' | 'warmup-complete' | 'error';
  errors?: Array<{ word: string; position: number; suggestions: string[] }>;
  error?: string;
}

interface MisspelledToken {
  word: string;
  position: number;
}

let isWarm = false;

async function checkWordCorrect(word: string): Promise<boolean> {
  if (typeof word !== 'string') return false;
  if (word.length === 0) return false;
  if (/\s/.test(word)) {
    return word.split(/\s+/).every(w => w.length === 0 || /^[a-zA-ZáàâãéèêíïóôõöúçñüÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑÜ]+$/.test(w));
  }
  return /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+$/.test(word);
}

const WORD_REGEX = /[a-zA-ZáàâãéèêíïóôõöúçñüÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑÜ]+(?:-[a-zA-ZáàâãéèêíïóôõöúçñüÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑÜ]+)*/g;

function tokenize(text: string): Array<{ word: string; position: number }> {
  const tokens: Array<{ word: string; position: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = WORD_REGEX.exec(text)) !== null) {
    tokens.push({ word: m[0], position: m.index });
  }
  return tokens;
}

function isPunctuationOrNumber(word: string): boolean {
  return /^[\d.,!?;:()\[\]{}\"'«»\-—…\s]+$/.test(word);
}

async function performSpellCheck(text: string): Promise<SpellCheckResponse['errors']> {
  const tokens = tokenize(text);
  const checkableTokens = tokens.filter(t => !isPunctuationOrNumber(t.word));

  if (checkableTokens.length === 0) return [];

  const misspelledTokens: MisspelledToken[] = [];

  for (const { word, position } of checkableTokens) {
    const correct = await checkWordCorrect(word);
    if (!correct) {
      misspelledTokens.push({ word, position });
    }
  }

  return misspelledTokens.map(t => ({
    word: t.word,
    position: t.position,
    suggestions: [],
  }));
}

self.onmessage = async (e: MessageEvent<SpellCheckMessage>) => {
  const { id, type, text } = e.data;

  try {
    if (type === 'warmup') {
      await performSpellCheck('teste');
      isWarm = true;
      const response: SpellCheckResponse = { id, type: 'warmup-complete' };
      self.postMessage(response);
      return;
    }

    if (type === 'check' && text !== undefined) {
      const errors = await performSpellCheck(text);
      const response: SpellCheckResponse = { id, type: 'result', errors };
      self.postMessage(response);
      return;
    }
  } catch (error) {
    const response: SpellCheckResponse = {
      id,
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    self.postMessage(response);
  }
};

export {};