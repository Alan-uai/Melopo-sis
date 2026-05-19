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
  lines: string[],
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
  const perLine = lines.map(line => {
    const lineTokens = tokenizer.tokenize(line, true) as string[];
    const lineStems = lineTokens.map(t => {
      try { return stemmer.stem(t.toLowerCase()); }
      catch { return t.toLowerCase(); }
    });
    return selectedAutomaton?.ac.search(lineStems.join(' ')).length ?? 0;
  });

  return {
    selectedToneScore: selectedScore,
    highestConflicting: conflicting[0]?.[0] ?? null,
    highestConflictingScore: (conflicting[0]?.[1] ?? 0) / (stems.length || 1),
    antiPatternHits,
    perLine,
  };
}

function analyzeImages(text: string, selectedTone: string): ImageScore {
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

  const tokens = tokenizer.tokenize(text, true) as string[];
  const textStems = new Set(tokens.map(t => {
    try { return stemmer.stem(t.toLowerCase()); }
    catch { return t.toLowerCase(); }
  }));

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
  for (const t of tokens) {
    const lower = t.toLowerCase();
    if (FORMAL_MARKERS.has(lower)) formal++;
    if (INFORMAL_MARKERS.has(lower)) informal++;
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
    if (!lines[i].trim()) continue;
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

function analyzeEmotion(tokens: string[]): EmotionScore {
  const stems = tokens.map(t => {
    try { return stemmer.stem(t.toLowerCase()); }
    catch { return t.toLowerCase(); }
  });
  return analyzeSentiment(stems);
}

function analyzeRhythm(text: string): RhythmScore {
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

  const isConsistent = variance < 4;

  return { avgSyllables, variance, hasEnjambement, isConsistent };
}

export async function analyzeTone(
  text: string,
  selectedTone: string,
  _structure: string,
): Promise<AnalysisResult> {
  const lines = text.split('\n');
  const rawTokens = tokenizer.tokenize(text, true) as string[];
  const stems = rawTokens.map(t => {
    try { return stemmer.stem(t.toLowerCase()); }
    catch { return t.toLowerCase(); }
  });

  const lexical = analyzeLexical(stems, lines, selectedTone);
  const image = analyzeImages(text, selectedTone);
  const register = analyzeRegister(rawTokens);
  const figure = analyzeFigures(lines);
  const emotion = analyzeEmotion(rawTokens);
  const rhythm = analyzeRhythm(text);

  const diagnostics = computeDiagnostics({ lexical, image, register, figure, emotion, rhythm }, text);
  const confidence = computeConfidence(lexical, diagnostics, image, register, figure, emotion, rhythm);

  return {
    lexical, image, register, figure, emotion, rhythm,
    confidence, diagnostics,
  } satisfies AnalysisResult;
}
