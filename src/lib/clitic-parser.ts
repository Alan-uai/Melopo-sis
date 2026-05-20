interface CliticResult {
  verbForm: string;
  clitics: { index: number; pronoun: string; position: 'enclitic' | 'mesoclitic' }[];
}

const ENCLITIC_PRONOUNS = [
  'lo', 'la', 'los', 'las',
  'no', 'na', 'nos', 'nas',
  'lhe', 'lhes',
  'me', 'te', 'se',
  'o', 'a', 'os', 'as',
  'vos',
] as const;

function isEncliticPronoun(s: string): boolean {
  return (ENCLITIC_PRONOUNS as readonly string[]).includes(s);
}

function restoreVerbFromLo(word: string): string[] {
  if (word.endsWith('r')) {
    return [word.slice(0, -1)];
  }
  if (word.endsWith('s')) {
    return [word.slice(0, -1)];
  }
  if (word.endsWith('z')) {
    return [word.slice(0, -1)];
  }
  return [];
}

function restoreVerbFromNo(word: string): string[] {
  if (word.endsWith('m')) {
    return [word.slice(0, -1)];
  }
  if (word.endsWith('õ')) {
    return [word + 'e'];
  }
  if (word.endsWith('ã')) {
    return [word.slice(0, -1) + 'ão', word];
  }
  return [];
}

function restoreVerbFromLhe(word: string): string[] {
  return [word];
}

function restoreVerbFromSimple(word: string): string[] {
  return [word];
}

export function parseClitic(word: string): CliticResult | null {
  if (!word.includes('-')) return null;
  const parts = word.split('-');
  if (parts.length < 2) return null;

  const verbPart = parts[0];
  const pronounPart = parts.slice(1).join('-');

  if (verbPart.length < 2) return null;

  const pronouns = parts.slice(1).filter(isEncliticPronoun);
  if (pronouns.length === 0) return null;

  const pronoun = pronouns[0];
  const clitics = pronounPart.split('-').map((p, i) => ({
    index: i + 1,
    pronoun: p,
    position: 'enclitic' as const,
  }));

  const candidates: string[] = [];

  if (['lo', 'la', 'los', 'las'].includes(pronoun)) {
    candidates.push(...restoreVerbFromLo(verbPart));
  } else if (['no', 'na', 'nos', 'nas'].includes(pronoun)) {
    candidates.push(...restoreVerbFromNo(verbPart));
  } else if (['lhe', 'lhes'].includes(pronoun)) {
    candidates.push(...restoreVerbFromLhe(verbPart));
  } else {
    candidates.push(...restoreVerbFromSimple(verbPart));
  }

  const verbForm = candidates.length > 0 ? candidates[0] : verbPart;

  return { verbForm, clitics };
}

export function hasClitic(word: string): boolean {
  if (!word.includes('-')) return false;
  const parts = word.split('-');
  return parts.slice(1).some(isEncliticPronoun);
}
