declare module 'nspell' {
  interface NSpellInstance {
    correct(word: string): boolean;
    suggest(word: string): string[];
    spell(word: string): boolean;
    add(word: string): void;
    remove(word: string): void;
    dictionary(dic: string | Buffer): void;
    personal(dic: string | Buffer): void;
    wordCharacters(): string;
  }

  interface NSpellConstructor {
    (aff: string | Buffer, dic?: string | Buffer): NSpellInstance;
    new (aff: string | Buffer, dic?: string | Buffer): NSpellInstance;
  }

  const nspell: NSpellConstructor;
  export default nspell;
}
