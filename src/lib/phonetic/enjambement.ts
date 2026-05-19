export type LineBreakType = 'end_stopped' | 'enjambement_leve' | 'enjambement_forte' | 'enjambement_medial';

export interface EnjambementResult {
  lineA: number;
  lineB: number;
  type: LineBreakType;
  confidence: number;
  evidence: string;
  syntacticCues: string[];
}

export interface CaesuraResult {
  line: number;
  position: number;
  hasPause: boolean;
  confidence: number;
}

const DEPENDENT_ENDINGS = /\b(?:a|o|as|os|um|uns|uma|umas|em|no|na|nos|nas|do|da|dos|das|dum|duns|duma|dumas|num|nuns|numa|numas|ao|aos|com|sem|sob|entre|para|por|de|em|que|se|lhe|lhes|me|te|nos|vos|seu|sua|teu|tua|meu|minha|nosso|nossa|vosso|vossa)$/i;

const DEPENDENT_STARTS = /^(?:que|se|e|mas|porque|pois|como|quando|enquanto|embora|caso|se|a|o|os|as|um|uns|uma|umas|no|na|nos|nas|do|da|dos|das|num|nuns|numa|numas|ao|aos|com|sem|sob|entre|para|por|de|em|lhe|lhes|me|te|se|nos|vos)$/i;

const PREPOSITION = /^(?:a|ante|apos|ate|com|contra|de|desde|em|entre|para|perante|por|sem|sob|sobre|tras|dentre|deste|dessa|nesse|naquela)$/i;

const CLAUSE_START = /^(?:e|mas|ou|pois|portanto|contudo|todavia|entretanto|no entanto|assim|logo|por isso|por conseguinte|entao)$/i;

export function detectEnjambement(lines: string[], lineAIndex: number): EnjambementResult | null {
  if (lineAIndex >= lines.length - 1) return null;

  const lineA = lines[lineAIndex].trim();
  const lineB = lines[lineAIndex + 1].trim();
  if (!lineA || !lineB) return null;

  const hasEndPunctuation = /[.,;:!?)\]]$/.test(lineA);
  const hasEllipsis = /\.{3,}$/.test(lineA);
  const lineAEnd = lineA.split(/\s+/).pop() || '';
  const lineBStart = lineB.split(/\s+/)[0] || '';

  const cues: string[] = [];
  let type: LineBreakType;
  let confidence: number;

  if (hasEndPunctuation && !hasEllipsis) {
    type = 'end_stopped';
    confidence = 0.95;
    cues.push('pontuação final');
    return { lineA: lineAIndex + 1, lineB: lineAIndex + 2, type, confidence, evidence: 'verso com pontuação final — pausa natural', syntacticCues: cues };
  }

  if (DEPENDENT_ENDINGS.test(lineAEnd)) {
    type = 'enjambement_forte';
    confidence = 0.9;
    cues.push(`"${lineAEnd}" exige complemento`);
  } else if (DEPENDENT_STARTS.test(lineBStart)) {
    type = 'enjambement_medial';
    confidence = 0.7;
    cues.push(`"${lineBStart}" liga sintaticamente ao verso anterior`);
  } else if (lineAEnd.length <= 3 && /^[a-zà-ú]$/i.test(lineAEnd)) {
    type = 'enjambement_leve';
    confidence = 0.5;
    cues.push(`palavra curta "${lineAEnd}" no fim sugere continuidade`);
  } else if (lineB.length > 0 && /^[a-zà-ú]/.test(lineBStart) && !CLAUSE_START.test(lineBStart)) {
    type = 'enjambement_leve';
    confidence = 0.4;
    cues.push('sem pontuação final, verso seguinte começa com minúscula');
  } else {
    return null;
  }

  return {
    lineA: lineAIndex + 1,
    lineB: lineAIndex + 2,
    type,
    confidence,
    evidence: cues.join('; '),
    syntacticCues: cues,
  };
}

export function detectAllEnjambements(text: string): EnjambementResult[] {
  const lines = text.split('\n').filter(l => l.trim());
  const results: EnjambementResult[] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const result = detectEnjambement(lines, i);
    if (result) results.push(result);
  }
  return results;
}

export function detectCaesura(line: string, lineNumber: number): CaesuraResult | null {
  const trimmed = line.trim();
  if (trimmed.length < 20) return null;

  const words = trimmed.split(/\s+/);
  const midPoint = Math.floor(words.length / 2);

  const punctPos = trimmed.search(/[,;:—–]/);
  if (punctPos >= 0) {
    const beforePunct = trimmed.slice(0, punctPos).trim();
    const wordsBefore = beforePunct.split(/\s+/).length;
    return {
      line: lineNumber + 1,
      position: wordsBefore,
      hasPause: true,
      confidence: 0.85,
    };
  }

  const phraseBreak = findPhraseBreak(words);
  if (phraseBreak >= 0) {
    return {
      line: lineNumber + 1,
      position: phraseBreak,
      hasPause: false,
      confidence: 0.5,
    };
  }

  return null;
}

function findPhraseBreak(words: string[]): number {
  for (let i = Math.floor(words.length * 0.3); i < Math.min(words.length, Math.floor(words.length * 0.7)); i++) {
    if (PREPOSITION.test(words[i]) && i > 0) {
      return i;
    }
    if (i > 1 && words[i].length <= 2 && words[i - 1].length > 3) {
      return i;
    }
  }
  return -1;
}

export function enjambementRatio(text: string): number {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return 0;
  const enjambed = detectAllEnjambements(text);
  const strongEnjambed = enjambed.filter(e => e.type === 'enjambement_forte' || e.type === 'enjambement_medial');
  return strongEnjambed.length / (lines.length - 1);
}
