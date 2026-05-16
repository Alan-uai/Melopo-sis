import { analyzeRhymeScheme } from '@/lib/rhyme-detector';
import type { TextStructure } from '@/lib/poetic-forms';
import type { Suggestion } from '@/ai/types';

export async function runRhymeAgent(
  text: string,
  structure: TextStructure,
  rhyme: boolean,
): Promise<Suggestion[]> {
  if (!rhyme) return [];

  const suggestions: Suggestion[] = [];
  const analysis = analyzeRhymeScheme(text);
  const cleanLines = text.split('\n').filter(l => l.trim());

  if (analysis.hasEcho) {
    suggestions.push({
      originalText: text.slice(0, 60),
      correctedText: '',
      explanation: '[RIM-14] O poema contém rima-eco: a mesma palavra repetida no fim de versos diferentes. Isso não constitui rima verdadeira.',
      type: 'grammar',
      severity: 'media',
      context: text,
      alternatives: [],
    });
  }

  if (analysis.clichePairs > 0) {
    suggestions.push({
      originalText: text.slice(0, 60),
      correctedText: '',
      explanation: `[RIM-18] O poema contém ${analysis.clichePairs} par(es) de rima previsível/desgastada (ex: amor/dor, coração/ilusão). Tente substituir por rimas mais originais.`,
      type: 'grammar',
      severity: 'baixa',
      context: text,
      alternatives: [],
    });
  }

  if (analysis.dominantScheme !== 'free') {
    if (analysis.consistency < 0.5 && analysis.stanzaSchemes.length > 1) {
      suggestions.push({
        originalText: text.slice(0, 60),
        correctedText: '',
        explanation: `[RIM-15] Esquema de rimas inconsistente. Detectado: ${analysis.schemeName}, apenas ${Math.round(analysis.consistency * 100)}% das estrofes seguem o padrão.`,
        type: 'grammar',
        severity: 'media',
        context: text,
        alternatives: [],
      });
    }

    if (analysis.rhymeRatio < 0.4 && cleanLines.length >= 4) {
      suggestions.push({
        originalText: text.slice(0, 60),
        correctedText: '',
        explanation: `[RIM-07~10] Apenas ${Math.round(analysis.rhymeRatio * 100)}% dos versos participam de rimas (esquema: ${analysis.schemeName}). Com rima obrigatória, espera-se ≥50%.`,
        type: 'grammar',
        severity: 'media',
        context: text,
        alternatives: [],
      });
    }
  } else if (cleanLines.length >= 4 && analysis.rhymeRatio < 0.2) {
    suggestions.push({
      originalText: text.slice(0, 60),
      correctedText: '',
      explanation: '[RIM-07~10] O poema está marcado como "com rima", mas quase nenhum verso rima.',
      type: 'grammar',
      severity: 'alta',
      context: text,
      alternatives: [],
    });
  }

  return suggestions;
}
