import { syllabifyWord, countSyllables } from './syllabifier';
import { evaluateWordStress, evaluateLineStress, detectMetricalForm } from './stress-evaluator';
import { applyMetaplasms, countPoeticSyllablesLine } from './metaplasm-engine';
import { phoneticEditDistance, phoneticSimilarity, vowelNucleusSimilarity, rhymeLikeness, assonanceDegree, consonanceDegree } from './phonetic-distance';
import type { SyllableInfo } from './syllabifier';
import type { WordStress, LineStress } from './stress-evaluator';
import type { MetaplasmResult } from './metaplasm-engine';

export function syllabify(word: string): SyllableInfo {
  return syllabifyWord(word);
}

export function countWordSyllables(word: string): number {
  return countSyllables(word);
}

export function countPoeticSyllables(line: string): number {
  return countPoeticSyllablesLine(line);
}

export function getMetaplasms(line: string): MetaplasmResult {
  const words = line
    .toLowerCase()
    .replace(/[^a-záàâãéèêíïóôõöúüçñ\s-]/g, '')
    .trim()
    .split(/[\s-]+/);

  return applyMetaplasms(words);
}

export function analyzeWordStress(word: string): WordStress {
  return evaluateWordStress(word);
}

export function analyzeLineStress(line: string): LineStress {
  const poetic = countPoeticSyllablesLine(line);
  const stress = evaluateLineStress(line);
  return stress;
}

export function detectForm(line: string): string {
  const stress = evaluateLineStress(line);
  return detectMetricalForm(stress);
}

export function phoneticDistance(a: string, b: string): number {
  return phoneticEditDistance(a, b);
}

export function phonSimilarity(a: string, b: string): number {
  return phoneticSimilarity(a, b);
}

export function rhymeScore(a: string, b: string): number {
  return rhymeLikeness(a, b);
}

export function assonanceScore(a: string, b: string): number {
  return assonanceDegree(a, b);
}

export function consonanceScore(a: string, b: string): number {
  return consonanceDegree(a, b);
}

export type {
  SyllableInfo,
  WordStress,
  LineStress,
  MetaplasmResult,
};
