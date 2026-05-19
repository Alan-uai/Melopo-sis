import type { Suggestion } from '@/ai/types';
import type { FigureMatch } from './lexicons/figure-matchers';

export type Severity = 'alta' | 'media' | 'baixa';

export interface LexicalScore {
  selectedToneScore: number;
  highestConflicting: string | null;
  highestConflictingScore: number;
  antiPatternHits: number;
  perLine: number[];
}

export interface ImageScore {
  score: number;
  total: number;
  ratio: number;
}

export interface RegisterScore {
  formalScore: number;
  informalScore: number;
  isConsistent: boolean;
  dominantRegister: 'formal' | 'informal' | 'mixed';
}

export interface FigureScore {
  detected: FigureMatch[];
  density: number;
}

export interface EmotionScore {
  positiveRatio: number;
  negativeRatio: number;
  neutralRatio: number;
  compoundScore: number;
  dominantEmotion: string;
}

export interface RhythmScore {
  avgSyllables: number;
  variance: number;
  hasEnjambement: boolean;
  isConsistent: boolean;
}

export interface Diagnostic {
  id: string;
  severity: Severity;
  line?: number;
  dimensions: string[];
  details: Record<string, unknown>;
  toneRef: string;
  toneRefQuote: string;
  canonicalExample?: string;
}

export interface AnalysisResult {
  lexical: LexicalScore;
  image: ImageScore;
  register: RegisterScore;
  figure: FigureScore;
  emotion: EmotionScore;
  rhythm: RhythmScore;
  confidence: number;
  diagnostics: Diagnostic[];
}

export type ToneAction = 'local' | 'hybrid' | 'ai';

export interface ToneSuggestionResult {
  action: ToneAction;
  suggestions: Suggestion[];
  confidence: number;
  analysis?: AnalysisResult;
}
