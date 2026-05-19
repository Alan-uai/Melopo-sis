import { analyzeTone } from './tone/tone-analyzer';
import { buildToneSuggestions } from './tone/tone-suggestion-engine';
import { scanPoem } from './phonetic/meter-scanner';
import { detectAllEnjambements, enjambementRatio } from './phonetic/enjambement';
import { detectDevicesInText } from './phonetic/sound-devices';
import { detectRhymeSchemeEnhanced } from './phonetic/rhyme-enhanced';
import { analyzeRhymeScheme } from './rhyme-detector';
import { enhanceWithTransformers, mergeAnalysis } from './tone/transformers-pipeline';
import type { AnalysisResult, ToneSuggestionResult } from './tone/tone-types';
import type { PoemScan } from './phonetic/meter-scanner';
import type { EnjambementResult } from './phonetic/enjambement';
import type { SoundDeviceMatch } from './phonetic/sound-devices';

export interface UnifiedAnalysis {
  tone: AnalysisResult;
  toneSuggestion: ToneSuggestionResult;
  meter: PoemScan;
  enjambements: EnjambementResult[];
  soundDevices: SoundDeviceMatch[];
  rhyme: {
    standard: ReturnType<typeof analyzeRhymeScheme>;
    enhanced: ReturnType<typeof detectRhymeSchemeEnhanced>;
  };
  enjambementRatio: number;
  transformer?: {
    scores: Record<string, number>;
    dominantTone: string;
    confidence: number;
  };
}

export async function analyzeUnified(
  text: string,
  selectedTone: string,
  structure: string,
  useTransformer: boolean = false,
): Promise<UnifiedAnalysis> {
  const toneResult = await analyzeTone(text, selectedTone, structure);
  let finalAnalysis = toneResult;

  let transformerResult = null;
  if (useTransformer) {
    transformerResult = await enhanceWithTransformers(text);
    if (transformerResult.transformerTone || transformerResult.transformerSentiment) {
      finalAnalysis = mergeAnalysis(toneResult, transformerResult);
    }
  }

  const toneSuggestion = buildToneSuggestions(finalAnalysis, text, selectedTone);

  const [meterScan, enjambements, soundDevices, rhymeStandard, rhymeEnhanced] = await Promise.all([
    Promise.resolve(scanPoem(text)),
    Promise.resolve(detectAllEnjambements(text)),
    Promise.resolve(detectDevicesInText(text)),
    Promise.resolve(analyzeRhymeScheme(text)),
    Promise.resolve(detectRhymeSchemeEnhanced(text)),
  ]);

  return {
    tone: finalAnalysis,
    toneSuggestion,
    meter: meterScan,
    enjambements,
    soundDevices,
    rhyme: {
      standard: rhymeStandard,
      enhanced: rhymeEnhanced,
    },
    enjambementRatio: enjambementRatio(text),
    transformer: transformerResult?.transformerTone ?? undefined,
  };
}
