import type { Suggestion } from '@/ai/types';
import type { Diagnostic } from './tone-types';

const TEMPLATES: Record<string, (d: Diagnostic, tone: string) => string> = {
  ABSTRACT_OVERLOAD: (d, tone) => {
    const { abstractRatio, imageRatio } = d.details as Record<string, number>;
    return [
      `O poema tem alta densidade de léxico abstrato (${Math.round((abstractRatio ?? 0) * 100)}% `,
      `das palavras significativas) mas apenas ${Math.round((imageRatio ?? 0) * 100)}% de imagens concretas. `,
      `Para o tom ${tone}, o sentimento deve ser **sugerido por imagens**, não declarado. `,
      d.toneRefQuote ? `${d.toneRef} — "${d.toneRefQuote}"\n` : '',
      d.canonicalExample ? `Consulte: ${d.canonicalExample}\n` : '',
      `**Sugestão:** substitua declarações abstratas por imagens sensoriais. `,
      `Em vez de "Estou triste", tente "Desce a treva, e no peito um vazio profundo".`,
    ].filter(Boolean).join('');
  },

  TONE_POLLUTION: (d, tone) => {
    const details = d.details as Record<string, string | number>;
    return [
      `O poema utiliza vocabulário característico do tom **${details.conflictingTone}** `,
      `(${Math.round((details.conflictingRatio as number ?? 0) * 100)}% de cobertura), `,
      `que conflita com o tom selecionado (${tone}).`,
      d.toneRefQuote ? `\nRegra ${d.toneRef}: "${d.toneRefQuote}"` : '',
      `\n**Revisão:** identifique as palavras do léxico de ${details.conflictingTone} `,
      `e substitua por equivalentes de ${tone}.`,
    ].join('');
  },

  REGISTER_LEAK: (d, tone) => {
    const { formalScore, informalScore } = d.details as Record<string, number>;
    const dominant = (formalScore ?? 0) > (informalScore ?? 0) ? 'formal' : 'informal';
    return [
      `O poema mescla registro **formal** (${Math.round((formalScore ?? 0) * 100)}%) e `,
      `**informal** (${Math.round((informalScore ?? 0) * 100)}%) de forma inconsistente. `,
      `Para o tom ${tone}, recomenda-se registro **${dominant}** uniforme.`,
      d.toneRefQuote ? `\nRegra ${d.toneRef}: "${d.toneRefQuote}"` : '',
      `\n**Revisão:** uniformize o registro — revise as expressões de registro oposto.`,
    ].join('');
  },

  EMOTION_ARC_BREAK: (d, tone) => {
    const details = d.details as Record<string, number>;
    return [
      `O tom emocional muda abruptamente entre estrofes `,
      `(score de ${details.startEmotion?.toFixed(2)} para ${details.endEmotion?.toFixed(2)}). `,
      `Para o tom ${tone}, a emoção deve ter uma progressão natural.`,
      d.toneRefQuote ? `\nRegra ${d.toneRef}: "${d.toneRefQuote}"` : '',
      `\n**Revisão:** suavize a transição emocional entre estrofes.`,
    ].join('');
  },

  ANTIPATTERN_HIT: (d, tone) => {
    const { antiPatternCount } = d.details as Record<string, number>;
    return [
      `Detectados ${antiPatternCount} anti-padrões característicos do que **não** fazer `,
      `no tom ${tone}.`,
      d.toneRefQuote ? `\nRegra ${d.toneRef}: "${d.toneRefQuote}"` : '',
      `\n**Revisão:** substitua os anti-padrões pelas alternativas sugeridas nas regras TOM correspondentes.`,
    ].join('');
  },

  RHYTHM_MISMATCH: (d, tone) => {
    const { avgSyllables, variance } = d.details as Record<string, number>;
    return [
      `O ritmo poético está inconsistente com o tom ${tone} `,
      `(média de ${Math.round(avgSyllables ?? 0)} sílabas, variância de ${(variance ?? 0).toFixed(1)}). `,
      d.toneRefQuote ? `\nRegra ${d.toneRef}: "${d.toneRefQuote}"` : '',
      `\n**Revisão:** ajuste a métrica dos versos ao padrão esperado para ${tone}.`,
    ].join('');
  },

  CANONICAL_MISMATCH: (d, tone) => {
    const { lexicalScore, imageRatio } = d.details as Record<string, number>;
    return [
      `O poema tem baixa correspondência com o léxico canônico do tom ${tone} `,
      `(score lexical: ${((lexicalScore ?? 0) * 100).toFixed(0)}%, `,
      `imagens: ${((imageRatio ?? 0) * 100).toFixed(0)}%).`,
      d.toneRefQuote ? `\nRegra ${d.toneRef}: "${d.toneRefQuote}"` : '',
      d.canonicalExample ? `\nConsulte: ${d.canonicalExample}` : '',
      `\n**Revisão:** enriqueça o vocabulário com termos característicos de ${tone}.`,
    ].join('');
  },
};

function buildExplanation(diagnostic: Diagnostic, tone: string): string {
  const template = TEMPLATES[diagnostic.id];
  if (template) return template(diagnostic, tone);
  return `Diagnóstico ${diagnostic.id} para o tom ${tone}. ${diagnostic.toneRefQuote}`;
}

export function diagnosticToSuggestion(
  diagnostic: Diagnostic,
  text: string,
  tone: string,
): Suggestion {
  const line = diagnostic.line ? text.split('\n')[diagnostic.line - 1] || '' : '';
  const originalText = line || text.slice(0, 80);

  return {
    originalText,
    correctedText: originalText,
    explanation: buildExplanation(diagnostic, tone),
    type: 'tone',
    severity: diagnostic.severity,
    context: text,
    alternatives: [],
  };
}
