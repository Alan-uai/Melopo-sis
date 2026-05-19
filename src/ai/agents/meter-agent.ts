import { validateSyllableCount, validateAccentPositions } from '@/lib/poetic-forms';
import type { TextStructure } from '@/lib/poetic-forms';
import type { Suggestion } from '@/ai/types';
import { scanPoem, getCadenceQuality, getRhythmicProfile } from '@/lib/phonetic/meter-scanner';
import { detectAllEnjambements } from '@/lib/phonetic/enjambement';
import { detectDevicesInText } from '@/lib/phonetic/sound-devices';

export async function runMeterAgent(
  text: string,
  structure: TextStructure,
): Promise<Suggestion[]> {
  const lines = text.split('\n');
  const suggestions: Suggestion[] = [];

  const syllableErrors = validateSyllableCount(text, structure);
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

  const accentErrors = validateAccentPositions(text, structure);
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

  const poemScan = scanPoem(text);
  const profile = getRhythmicProfile(poemScan);

  if (poemScan.lines.length > 0) {
    const badCadence = poemScan.lines.filter(l => !l.hasProperCadence);
    for (const line of badCadence.slice(0, 3)) {
      suggestions.push({
        originalText: lines[line.lineNumber - 1] || '',
        correctedText: '',
        explanation: `Cadência incorreta: verso ${line.lineNumber} (${line.poeticSyllables} sílabas, ${profile.description}). Padrão de acentos esperado não encontrado.`,
        type: 'grammar',
        severity: 'media',
        context: lines[line.lineNumber - 1] || '',
        alternatives: [],
      });
    }
  }

  const enjambements = detectAllEnjambements(text);
  const strongEnjambements = enjambements.filter(e => e.type === 'enjambement_forte');
  for (const ej of strongEnjambements.slice(0, 3)) {
    suggestions.push({
      originalText: lines[ej.lineA - 1] ? `${lines[ej.lineA - 1]}\n${lines[ej.lineB - 1] || ''}` : '',
      correctedText: '',
      explanation: `Enjambement forte entre versos ${ej.lineA} e ${ej.lineB}: ${ej.evidence}. Pode quebrar o fluxo rítmico.`,
      type: 'grammar',
      severity: 'baixa',
      context: `${lines[ej.lineA - 1] || ''}\n${lines[ej.lineB - 1] || ''}`,
      alternatives: [],
    });
  }

  const devices = detectDevicesInText(text);
  for (const device of devices.slice(0, 3)) {
    suggestions.push({
      originalText: lines[device.line - 1] || '',
      correctedText: '',
      explanation: `Dispositivo sonoro detectado: ${device.evidence}`,
      type: 'grammar',
      severity: 'baixa',
      context: lines[device.line - 1] || '',
      alternatives: [],
    });
  }

  return suggestions;
}
