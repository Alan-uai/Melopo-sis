import { Espells } from 'espells';
import ptDict from 'dictionary-pt';

let engine: Espells | null = null;
let engineInitPromise: Promise<Espells> | null = null;

async function initEngine(): Promise<Espells> {
  if (engine) return engine;
  if (engineInitPromise) return engineInitPromise;

  engineInitPromise = (async () => {
    const e = new Espells({
      aff: ptDict.aff,
      dic: ptDict.dic,
    });
    engine = e;
    return e;
  })();

  return engineInitPromise;
}

export function resetEspellsEngine(): void {
  engine = null;
  engineInitPromise = null;
}

export async function isWordCorrectHunspell(word: string): Promise<boolean> {
  const e = await initEngine();
  const result = e.lookup(word, false);
  return result.correct;
}

export async function getHunspellSuggestions(word: string, max = 8): Promise<string[]> {
  const e = await initEngine();
  return e.suggest(word, max);
}
