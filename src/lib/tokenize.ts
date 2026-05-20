export interface TokenPosition {
  word: string;
  position: number;
}

const WORD_REGEX = /[a-zA-ZáàâãéèêíïóôõöúçñüÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑÜ]+(?:-[a-zA-ZáàâãéèêíïóôõöúçñüÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑÜ]+)*/g;

export function tokenize(text: string): TokenPosition[] {
  const tokens: TokenPosition[] = [];
  let m: RegExpExecArray | null;
  while ((m = WORD_REGEX.exec(text)) !== null) {
    tokens.push({ word: m[0], position: m.index });
  }
  return tokens;
}
