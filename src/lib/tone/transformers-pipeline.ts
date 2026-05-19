import type { AnalysisResult } from './tone-types';

let transformersAvailable = false;
let pipelineFn: unknown = null;
let pipelineInstance: unknown = null;

const TONE_LABELS = [
  'melancolico', 'romantico', 'reflexivo', 'jubiloso', 'sombrio',
  'saudoso', 'epico', 'lirico', 'satirico', 'filosofico',
  'intimista', 'nostalgico', 'visionario', 'conciso', 'erotico',
  'grotesco', 'sagrado', 'hibrido',
];

async function ensureTransformers() {
  if (transformersAvailable) return true;
  try {
    const mod = await import('@huggingface/transformers');
    pipelineFn = mod.pipeline as (task: string, model?: string) => Promise<unknown>;
    transformersAvailable = true;
    return true;
  } catch {
    transformersAvailable = false;
    return false;
  }
}

async function ensurePipeline(task: string, model?: string) {
  if (!transformersAvailable) return false;
  if (pipelineInstance) return true;
  try {
    if (pipelineFn) {
      pipelineInstance = await (pipelineFn as (task: string, model?: string) => Promise<unknown>)(task, model);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function zeroShotToneClassification(text: string): Promise<{
  scores: Record<string, number>;
  dominantTone: string;
  confidence: number;
}> {
  const available = await ensureTransformers();
  if (!available) {
    return { scores: {}, dominantTone: 'unknown', confidence: 0 };
  }

  try {
    const ready = await ensurePipeline('zero-shot-classification', 'Xenova/bert-base-multilingual-uncased-mnli');
    if (!ready || !pipelineInstance) throw new Error('Pipeline not available');

    const classifier = pipelineInstance as (inputs: string, candidateLabels: string[], options?: Record<string, unknown>) => Promise<unknown>;
    const result = await classifier(text, TONE_LABELS) as {
      labels: string[];
      scores: number[];
    };

    const scores: Record<string, number> = {};
    for (let i = 0; i < result.labels.length; i++) {
      scores[result.labels[i]] = result.scores[i];
    }

    const maxScore = Math.max(...result.scores);
    const dominantTone = result.labels[result.scores.indexOf(maxScore)];

    return { scores, dominantTone, confidence: maxScore };
  } catch {
    return { scores: {}, dominantTone: 'unknown', confidence: 0 };
  }
}

export async function transformerSentiment(text: string): Promise<{
  label: string;
  score: number;
} | null> {
  const available = await ensureTransformers();
  if (!available) return null;

  try {
    const ready = await ensurePipeline('sentiment-analysis', 'Xenova/bert-base-multilingual-uncased-sentiment');
    if (!ready || !pipelineInstance) throw new Error('Pipeline not available');

    const classifier = pipelineInstance as (inputs: string) => Promise<{ label: string; score: number }[]>;
    const result = await classifier(text);
    if (result && result.length > 0) {
      return result[0];
    }
    return null;
  } catch {
    return null;
  }
}

export interface EnhancedAnalysis {
  transformerTone: {
    scores: Record<string, number>;
    dominantTone: string;
    confidence: number;
  } | null;
  transformerSentiment: {
    label: string;
    score: number;
  } | null;
}

export async function enhanceWithTransformers(text: string): Promise<EnhancedAnalysis> {
  const [toneResult, sentimentResult] = await Promise.all([
    zeroShotToneClassification(text),
    transformerSentiment(text),
  ]);

  return {
    transformerTone: toneResult.confidence > 0 ? toneResult : null,
    transformerSentiment: sentimentResult,
  };
}

export function mergeAnalysis(
  local: AnalysisResult,
  transformer: EnhancedAnalysis,
): AnalysisResult {
  const merged = { ...local };

  if (transformer.transformerTone && transformer.transformerTone.confidence > 0.5) {
    merged.lexical = {
      ...merged.lexical,
      selectedToneScore: (merged.lexical.selectedToneScore + transformer.transformerTone.confidence) / 2,
    };
  }

  if (transformer.transformerSentiment) {
    const transformerRatio = transformer.transformerSentiment.label === 'POSITIVE' ? 0.6
      : transformer.transformerSentiment.label === 'NEGATIVE' ? 0.1
      : 0.3;

    merged.emotion = {
      ...merged.emotion,
      compoundScore: (merged.emotion.compoundScore + (transformerRatio * 2 - 1)) / 2,
    };
  }

  merged.confidence = Math.min(
    merged.confidence * 0.7 + (transformer.transformerTone ? transformer.transformerTone.confidence * 0.3 : 0),
    1,
  );

  return merged;
}
