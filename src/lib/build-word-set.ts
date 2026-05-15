import fs from 'fs';
import path from 'path';

let wordSet: Set<string> | null = null;
let wordSetPromise: Promise<Set<string>> | null = null;

export async function getWordSet(): Promise<Set<string>> {
  if (wordSet) return wordSet;
  if (wordSetPromise) return wordSetPromise;

  wordSetPromise = (async () => {
    const dictPath = path.join(
      process.cwd(),
      'node_modules',
      'dictionary-pt-br',
      'index.dic'
    );
    const content = fs.readFileSync(dictPath, 'utf8');
    const lines = content.split('\n');
    const words = new Set<string>();
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const word = line.split('/')[0].toLowerCase();
      if (word) words.add(word);
    }
    wordSet = words;
    return words;
  })();

  return wordSetPromise;
}
