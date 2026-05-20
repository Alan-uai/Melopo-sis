declare module 'words-pt' {
  interface Options {
    removeNames?: boolean;
  }

  interface WordsPt {
    init(options: Options, callback: (err: Error | null) => void): void;
    isWord(word: string): boolean;
    getArray(): string[];
    randomWord(beginning?: string, middle?: string, end?: string): string;
    biggestWord(): string;
  }

  const wordsPt: WordsPt;
  export default wordsPt;
}
