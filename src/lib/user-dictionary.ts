const LOCAL_STORAGE_KEY = 'melopoesis_user_dictionary_v1';

function getLocalWords(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveLocalWords(words: Set<string>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([...words]));
}

export function getLocalUserWords(): string[] {
  return [...getLocalWords()].sort();
}

export function addLocalUserWord(word: string): boolean {
  const trimmed = word.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return false;
  const words = getLocalWords();
  if (words.has(trimmed)) return false;
  words.add(trimmed);
  saveLocalWords(words);
  return true;
}

export function removeLocalUserWord(word: string): boolean {
  const trimmed = word.trim().toLowerCase();
  const words = getLocalWords();
  if (!words.has(trimmed)) return false;
  words.delete(trimmed);
  saveLocalWords(words);
  return true;
}

export function clearLocalUserDictionary(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

export function mergeWithGlobal(wordSet: Set<string>): Set<string> {
  const merged = new Set(wordSet);
  for (const w of getLocalWords()) {
    merged.add(w);
  }
  return merged;
}

let firestoreWords: Set<string> | null = null;

export function setFirestoreUserWords(words: string[]): void {
  firestoreWords = new Set(words.map(w => w.toLowerCase().trim()).filter(Boolean));
}

export function clearFirestoreUserWords(): void {
  firestoreWords = null;
}

export async function getUserWords(userId: string | null): Promise<Set<string>> {
  const local = getLocalWords();
  if (!userId) return local;
  const firestore = firestoreWords ?? new Set();
  return new Set([...local, ...firestore]);
}
