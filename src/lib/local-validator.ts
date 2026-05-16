import { checkText } from './spell-checker';
import { validateStructure, validateSyllableCount, validateAccentPositions, validatePunctuation } from './poetic-forms';
import type { TextStructure, StructureError } from './poetic-forms';
import { analyzeRhymeScheme, extractLastWord } from './rhyme-detector';
import type { Suggestion } from '@/ai/types';

export interface LocalValidationResult {
  suggestions: Suggestion[];
}

export async function validateAll(
  text: string,
  structure: TextStructure,
  rhyme: boolean
): Promise<LocalValidationResult> {
  const suggestions: Suggestion[] = [];

  const spellResult = await checkText(text);
  const structureValidation = validateStructure(text, structure);
  const syllableErrors = validateSyllableCount(text, structure);
  const accentErrors = validateAccentPositions(text, structure);
  const punctuationErrors = validatePunctuation(text);

  const lines = text.split('\n');

  for (const err of spellResult.errors) {
    let contextLine = '';
    let charCount = 0;
    for (const line of lines) {
      if (charCount + line.length >= err.position) {
        contextLine = line;
        break;
      }
      charCount += line.length + 1;
    }

    suggestions.push({
      originalText: err.word,
      correctedText: err.suggestions[0] || err.word,
      explanation: err.suggestions.length > 0
        ? `Erro ortográfico: "${err.word}" não encontrado no dicionário. Sugestões: ${err.suggestions.join(', ')}.`
        : `Erro ortográfico: "${err.word}" não encontrado no dicionário.`,
      type: 'grammar',
      severity: 'alta',
      context: contextLine,
      alternatives: err.suggestions,
    });
  }

  for (const err of structureValidation.errors) {
    suggestions.push({
      originalText: err.line ? lines[err.line - 1] || text.slice(0, 60) : text.slice(0, 60),
      correctedText: '',
      explanation: err.message,
      type: 'grammar',
      severity: err.severity,
      context: text,
      alternatives: [],
    });
  }

  for (const err of syllableErrors) {
    suggestions.push({
      originalText: err.line ? lines[err.line - 1] || '' : text.slice(0, 60),
      correctedText: '',
      explanation: err.message,
      type: 'grammar',
      severity: err.severity,
      context: err.line ? lines[err.line - 1] || '' : text,
      alternatives: [],
    });
  }

  for (const err of accentErrors) {
    suggestions.push({
      originalText: err.line ? lines[err.line - 1] || '' : text.slice(0, 60),
      correctedText: '',
      explanation: err.message,
      type: 'grammar',
      severity: err.severity,
      context: err.line ? lines[err.line - 1] || '' : text,
      alternatives: [],
    });
  }

  if (rhyme) {
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
        explanation: `[RIM-18] O poema contém ${analysis.clichePairs} par(es) de rima previsível/desgastada (ex: amor/dor, coração/ilusão). Tente substituir por rimas mais originais e adequadas ao tom.`,
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
          explanation: `[RIM-15] O esquema de rimas não é consistente. Detectado: ${analysis.schemeName}, mas apenas ${Math.round(analysis.consistency * 100)}% das estrofes seguem o mesmo padrão. Considere uniformizar ou marcar claramente a transição de esquema.`,
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
          explanation: `[RIM-07~10] Apenas ${Math.round(analysis.rhymeRatio * 100)}% dos versos participam de rimas (esquema detectado: ${analysis.schemeName}). Com rima obrigatória, espera-se que pelo menos 50% dos versos rimem. Considere revisar os versos sem rima.`,
          type: 'grammar',
          severity: 'media',
          context: text,
          alternatives: [],
        });
      }

      const stanzaType = structure === 'soneto' ? 'soneto' : structure === 'cordel' ? 'cordel' : null;
      if (stanzaType === 'soneto' && analysis.rhymeRatio < 0.8) {
        suggestions.push({
          originalText: text.slice(0, 60),
          correctedText: '',
          explanation: '[RIM-24] Soneto com rima obrigatória: todos os versos devem rimar (exceto possíveis exceções estruturais mínimas). Muitos versos estão sem par de rima.',
          type: 'grammar',
          severity: 'alta',
          context: text,
          alternatives: [],
        });
      }
    } else if (cleanLines.length >= 4 && analysis.rhymeRatio < 0.2) {
      suggestions.push({
        originalText: text.slice(0, 60),
        correctedText: '',
        explanation: '[RIM-07~10] O poema está marcado como "com rima", mas quase nenhum verso rima. Por favor, adicione rimas consistentes ao poema.',
        type: 'grammar',
        severity: 'alta',
        context: text,
        alternatives: [],
      });
    }
  }

  for (const err of punctuationErrors) {
    suggestions.push({
      originalText: text.slice(0, 60),
      correctedText: '',
      explanation: err.message,
      type: 'grammar',
      severity: err.severity,
      context: text,
      alternatives: [],
    });
  }

  return { suggestions };
}
