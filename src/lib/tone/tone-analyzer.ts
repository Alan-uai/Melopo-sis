import { getToneAutomatons, getAntiPatternAutomaton, getRegisterAutomaton, stemmer, tokenizer } from './tone-lexicon';
import { getToneProfiles } from './tone-profiles';
import { FIGURE_DETECTORS } from './lexicons/figure-matchers';
import { analyzeSentiment } from './lexicons/sentilex-pt';
import { FORMAL_MARKERS, INFORMAL_MARKERS } from './lexicons/register-lexicon';
import { countPoeticSyllables } from '@/lib/poetic-forms';
import { computeDiagnostics } from './tone-diagnostics';
import { computeConfidence } from './tone-suggestion-engine';
import type {
  AnalysisResult, LexicalScore, ImageScore, RegisterScore,
  FigureScore, EmotionScore, RhythmScore,
} from './tone-types';

function splitIntoStanzas(text: string): string[][] {
  return text.split(/\n\s*\n/).map(s => s.split('\n').filter(l => l.trim()));
}

function analyzeLexical(
  stems: string[],
  lineStemsArray: string[][],
  selectedTone: string,
): LexicalScore {
  const selectedLower = selectedTone.toLowerCase();
  const text = stems.join(' ');
  const automatons = getToneAutomatons();
  const antiAc = getAntiPatternAutomaton();

  const toneMatches: Record<string, number> = {};
  for (const automaton of automatons) {
    const matches = automaton.ac.search(text);
    toneMatches[automaton.name] = matches.length;
  }

  const selectedScore = (toneMatches[selectedLower] ?? 0) / (stems.length || 1);

  const conflicting = Object.entries(toneMatches)
    .filter(([name]) => name !== selectedLower)
    .sort(([, a], [, b]) => b - a);

  const antiPatternHits = antiAc.search(text).length;

  const selectedAutomaton = automatons.find(a => a.name === selectedLower);
  const perLine = lineStemsArray.map(
    lineStems => selectedAutomaton?.ac.search(lineStems.join(' ')).length ?? 0
  );

  return {
    selectedToneScore: selectedScore,
    highestConflicting: conflicting[0]?.[0] ?? null,
    highestConflictingScore: (conflicting[0]?.[1] ?? 0) / (stems.length || 1),
    antiPatternHits,
    perLine,
  };
}

function analyzeImages(stems: string[], selectedTone: string): ImageScore {
  const sections = getToneProfiles();
  const section = sections.find(s => s.name === selectedTone.toLowerCase());
  if (!section) return { score: 0, total: 0, ratio: 0 };

  const imageProfiles = section.profiles.filter(p => p.category === 'imagens');
  const allKeywords = [...new Set(imageProfiles.flatMap(p => p.keywords))];
  if (allKeywords.length === 0) return { score: 0, total: 0, ratio: 0 };

  const stemmedKeywords = new Set(allKeywords.map(k => {
    try { return stemmer.stem(k.toLowerCase()); }
    catch { return k.toLowerCase(); }
  }));

  const textStems = new Set(stems);

  let matches = 0;
  for (const stem of stemmedKeywords) {
    if (textStems.has(stem)) matches++;
  }

  return {
    score: matches,
    total: allKeywords.length,
    ratio: matches / (allKeywords.length || 1),
  };
}

function analyzeRegister(tokens: string[]): RegisterScore {
  let formal = 0, informal = 0;
  let i = 0;

  while (i < tokens.length) {
    let matched = false;
    for (let n = Math.min(5, tokens.length - i); n >= 1; n--) {
      const phrase = tokens.slice(i, i + n).join(' ').toLowerCase();
      if (FORMAL_MARKERS.has(phrase)) { formal++; i += n; matched = true; break; }
      if (INFORMAL_MARKERS.has(phrase)) { informal++; i += n; matched = true; break; }
    }
    if (!matched) i++;
  }

  const total = formal + informal || 1;
  return {
    formalScore: formal / total,
    informalScore: informal / total,
    isConsistent: Math.abs(formal - informal) / total > 0.5,
    dominantRegister: formal > informal ? 'formal' : informal > formal ? 'informal' : 'mixed',
  };
}

function analyzeFigures(lines: string[]): FigureScore {
  const detected: FigureScore['detected'] = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount < 4) continue;
    for (const detector of FIGURE_DETECTORS) {
      const match = detector(lines, i);
      if (match) detected.push(match);
    }
  }
  const totalLines = lines.filter(l => l.trim()).length || 1;
  return {
    detected,
    density: detected.length / totalLines,
  };
}

function analyzeEmotion(stems: string[]): EmotionScore {
  return analyzeSentiment(stems);
}

const SYLLABLE_RULES: Record<string, number | null> = {
  soneto: 10, decassilabo: 10, oitava: 10, decima: 10,
  haicai: null, cordel: 7, trova: 7, redondilha: null,
};

function analyzeRhythm(text: string, structure?: string): RhythmScore {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { avgSyllables: 0, variance: 0, hasEnjambement: false, isConsistent: false };

  const counts = lines.map(l => countPoeticSyllables(l));
  const avgSyllables = counts.reduce((a, b) => a + b, 0) / counts.length;

  const variance = counts.reduce((acc, c) => acc + (c - avgSyllables) ** 2, 0) / counts.length;

  let hasEnjambement = false;
  for (let i = 0; i < lines.length - 1; i++) {
    const curr = lines[i].trimEnd();
    if (curr.length > 0 && !/[.,;:!?)\]]$/.test(curr)) {
      const nextStart = lines[i + 1].trimStart();
      if (nextStart && /^[a-zà-ú]/.test(nextStart)) {
        hasEnjambement = true;
        break;
      }
    }
  }

  const expected = structure ? SYLLABLE_RULES[structure] : undefined;
  const structureVariance = expected
    ? counts.reduce((acc, c) => acc + (c - expected) ** 2, 0) / counts.length
    : variance;
  const isConsistent = expected ? structureVariance < 2 : variance < 4;

  return { avgSyllables, variance: structureVariance, hasEnjambement, isConsistent };
}

function stemToken(t: string): string {
  try { return stemmer.stem(t.toLowerCase()); }
  catch { return t.toLowerCase(); }
}

export async function analyzeTone(
  text: string,
  selectedTone: string,
  _structure: string,
): Promise<AnalysisResult> {
  const lines = text.split('\n');
  const rawTokens = tokenizer.tokenize(text, true) as string[];
  const stems = rawTokens.map(stemToken);

  const lineStemsArray = lines.map(line => {
    const lineTokens = tokenizer.tokenize(line, true) as string[];
    return lineTokens.map(stemToken);
  });

  const lexical = analyzeLexical(stems, lineStemsArray, selectedTone);
  const image = analyzeImages(stems, selectedTone);
  const register = analyzeRegister(rawTokens);
  const figure = analyzeFigures(lines);
  const emotion = analyzeEmotion(stems);
  const rhythm = analyzeRhythm(text, _structure);

  const wordCount = stems.length;
  const diagnostics = computeDiagnostics({ lexical, image, register, figure, emotion, rhythm }, text);
  const confidence = computeConfidence(lexical, diagnostics, wordCount, image, register, figure, emotion, rhythm);

  return {
    lexical, image, register, figure, emotion, rhythm,
    confidence, diagnostics,
  } satisfies AnalysisResult;
}
