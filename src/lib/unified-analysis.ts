import { analyzeTone } from './tone/tone-analyzer';
import { buildToneSuggestions } from './tone/tone-suggestion-engine';
import { scanPoem } from './phonetic/meter-scanner';
import { detectAllEnjambements, enjambementRatio } from './phonetic/enjambement';
import { detectDevicesInText } from './phonetic/sound-devices';
import { detectRhymeSchemeEnhanced } from './phonetic/rhyme-enhanced';
import { analyzeRhymeScheme } from './rhyme-detector';
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
}

export async function analyzeUnified(
  text: string,
  selectedTone: string,
  structure: string,
): Promise<UnifiedAnalysis> {
  const toneResult = await analyzeTone(text, selectedTone, structure);
  const toneSuggestion = buildToneSuggestions(toneResult, text, selectedTone);

  const [meterScan, enjambements, soundDevices, rhymeStandard, rhymeEnhanced] = await Promise.all([
    scanPoem(text),
    detectAllEnjambements(text),
    detectDevicesInText(text),
    analyzeRhymeScheme(text),
    detectRhymeSchemeEnhanced(text),
  ]);

  return {
    tone: toneResult,
    toneSuggestion,
    meter: meterScan,
    enjambements,
    soundDevices,
    rhyme: {
      standard: rhymeStandard,
      enhanced: rhymeEnhanced,
    },
    enjambementRatio: enjambementRatio(text),
  };
}
