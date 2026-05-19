const BASE_LAYOUT: Record<string, [number, number]> = {
  'q': [0, 0], 'w': [0, 1], 'e': [0, 2], 'r': [0, 3], 't': [0, 4],
  'y': [0, 5], 'u': [0, 6], 'i': [0, 7], 'o': [0, 8], 'p': [0, 9],
  'a': [1, 0], 's': [1, 1], 'd': [1, 2], 'f': [1, 3], 'g': [1, 4],
  'h': [1, 5], 'j': [1, 6], 'k': [1, 7], 'l': [1, 8], 'ç': [1, 9],
  'z': [2, 0], 'x': [2, 1], 'c': [2, 2], 'v': [2, 3], 'b': [2, 4],
  'n': [2, 5], 'm': [2, 6],
};

const ACCENT_BASE: Record<string, string> = {
  'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a',
  'é': 'e', 'ê': 'e',
  'í': 'i',
  'ó': 'o', 'ô': 'o', 'õ': 'o',
  'ú': 'u',
};

function resolveKey(ch: string): [number, number] | undefined {
  const base = ACCENT_BASE[ch] || ch;
  return BASE_LAYOUT[base];
}

export function keyboardWeight(a: string, b: string): number {
  const ca = a.toLowerCase();
  const cb = b.toLowerCase();
  if (ca === cb) return 0;

  const pa = resolveKey(ca);
  const pb = resolveKey(cb);
  if (!pa || !pb) return 1;

  const dr = pa[0] - pb[0];
  const dc = pa[1] - pb[1];
  return Math.sqrt(dr * dr + dc * dc);
}

export function keyboardWeightedDistance(word: string, candidate: string): number {
  if (word.length !== candidate.length) return Math.abs(word.length - candidate.length);

  let totalWeight = 0;
  for (let i = 0; i < word.length; i++) {
    totalWeight += keyboardWeight(word[i], candidate[i]);
  }
  return totalWeight / word.length;
}
