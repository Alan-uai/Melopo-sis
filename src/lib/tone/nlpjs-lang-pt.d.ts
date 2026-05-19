declare module '@nlpjs/lang-pt' {
  export class StemmerPt {
    stem(word: string): string;
  }
  export class TokenizerPt {
    tokenize(text: string, normalize?: boolean): string[];
  }
}
