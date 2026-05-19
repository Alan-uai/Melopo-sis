import { tagText, likelyPlural, likelyFeminine, isKnownArticle, articleIsPlural, articleIsFeminine } from './pos-tagger';
import type { TaggedToken } from './pos-tagger';

export interface AgreementError {
  word: string;
  expected: string;
  message: string;
  position: number;
  ruleId: string;
}

const PLURAL_VERB_ENDINGS = /(?:am|ão|emos|eis|is|mos|desis|ram|ões|ães)$/;
const SINGULAR_VERB_ENDINGS = /(?:[aeo]|ou|eu|iu|ia|ava|era|ira|asse|esse|isse|aste|este|iste|ara|era|ira)$/;

function verbIsPlural(word: string): boolean {
  const lower = word.toLowerCase().trim();
  if (PLURAL_VERB_ENDINGS.test(lower) && !SINGULAR_VERB_ENDINGS.test(lower)) return true;
  if (/(?:nham|nharam|lham|lharam|rão)$/.test(lower)) return true;
  return false;
}

function verbIsSingular(word: string): boolean {
  const lower = word.toLowerCase().trim();
  if (lower.endsWith('s') && !lower.endsWith('ss')) return false;
  if (SINGULAR_VERB_ENDINGS.test(lower) && !PLURAL_VERB_ENDINGS.test(lower)) return true;
  if (/(?:[^s]o|as|es|is)$/.test(lower)) return true;
  return false;
}

function detectSubjectVerbAgreement(tagged: TaggedToken[]): AgreementError[] {
  const errors: AgreementError[] = [];

  for (let i = 0; i < tagged.length - 1; i++) {
    const curr = tagged[i];
    const next = tagged[i + 1];

    if (curr.tag === 'N' && next.tag === 'V') {
      const nounPlural = likelyPlural(curr.word);
      const verbPl = verbIsPlural(next.word);
      const verbSg = verbIsSingular(next.word);

      if (nounPlural && verbSg && !verbPl) {
        const expected = derivePluralVerb(next.word);
        if (expected !== next.word) {
          errors.push({
            word: next.word,
            expected,
            message: `Erro de concordância sujeito-verbo: "${curr.word}" (plural) exige verbo no plural, mas "${next.word}" está no singular. Sugestão: "${expected}".`,
            position: next.position,
            ruleId: 'CONCORDANCIA_SUJ_VERBO',
          });
        }
      }

      if (!nounPlural && verbPl && !verbSg) {
        const expected = deriveSingularVerb(next.word);
        if (expected !== next.word) {
          errors.push({
            word: next.word,
            expected,
            message: `Erro de concordância sujeito-verbo: "${curr.word}" (singular) exige verbo no singular, mas "${next.word}" está no plural. Sugestão: "${expected}".`,
            position: next.position,
            ruleId: 'CONCORDANCIA_SUJ_VERBO',
          });
        }
      }
    }
  }

  return errors;
}

function detectArticleNounAgreement(tagged: TaggedToken[]): AgreementError[] {
  const errors: AgreementError[] = [];

  for (let i = 0; i < tagged.length - 1; i++) {
    const curr = tagged[i];
    const next = tagged[i + 1];

    if (curr.tag === 'ART' && next.tag === 'N') {
      const artGender = isKnownArticle(curr.word);
      const artPlural = articleIsPlural(curr.word);
      const nounGender = likelyFeminine(next.word);
      const nounPlural = likelyPlural(next.word);

      if (artGender === 'fem' && nounGender === false) {
        const expected = artPlural ? 'os' : 'o';
        errors.push({
          word: curr.word,
          expected,
          message: `Erro de concordância artigo-substantivo: o artigo "${curr.word}" é feminino, mas "${next.word}" é masculino. Use "${expected}" em vez de "${curr.word}".`,
          position: curr.position,
          ruleId: 'CONCORDANCIA_ART_SUBST_GENERO',
        });
      }

      if (artGender === 'masc' && nounGender === true) {
        const expected = artPlural ? 'as' : 'a';
        errors.push({
          word: curr.word,
          expected,
          message: `Erro de concordância artigo-substantivo: o artigo "${curr.word}" é masculino, mas "${next.word}" é feminino. Use "${expected}" em vez de "${curr.word}".`,
          position: curr.position,
          ruleId: 'CONCORDANCIA_ART_SUBST_GENERO',
        });
      }

      if (artPlural && !nounPlural && likelyPlural(next.word) === false) {
        const expected = articleIsFeminine(curr.word) ? 'a' : 'o';
        errors.push({
          word: curr.word,
          expected,
          message: `Erro de concordância artigo-substantivo: o artigo "${curr.word}" está no plural, mas "${next.word}" está no singular. Use "${expected}" em vez de "${curr.word}".`,
          position: curr.position,
          ruleId: 'CONCORDANCIA_ART_SUBST_NUMERO',
        });
      }

      if (!artPlural && nounPlural) {
        const expected = articleIsFeminine(curr.word) ? 'as' : 'os';
        errors.push({
          word: curr.word,
          expected,
          message: `Erro de concordância artigo-substantivo: o artigo "${curr.word}" está no singular, mas "${next.word}" está no plural. Use "${expected}" em vez de "${curr.word}".`,
          position: curr.position,
          ruleId: 'CONCORDANCIA_ART_SUBST_NUMERO',
        });
      }
    }
  }

  return errors;
}

function derivePluralVerb(verb: string): string {
  const lower = verb.toLowerCase();
  if (lower.endsWith('a')) return lower.slice(0, -1) + 'am';
  if (lower.endsWith('e')) return lower.slice(0, -1) + 'em';
  if (lower.endsWith('ou')) return lower.slice(0, -3) + 'aram';
  if (lower.endsWith('iu')) return lower.slice(0, -2) + 'iram';
  if (lower.endsWith('eu')) return lower.slice(0, -2) + 'eram';
  if (lower.endsWith('ava')) return lower.slice(0, -3) + 'avam';
  if (lower.endsWith('ia')) return lower.slice(0, -2) + 'iam';
  if (lower.endsWith('o')) return lower.slice(0, -1) + 'am';
  return verb + 'm';
}

function deriveSingularVerb(verb: string): string {
  const lower = verb.toLowerCase();
  if (lower.endsWith('am')) return lower.slice(0, -2) + 'a';
  if (lower.endsWith('em')) return lower.slice(0, -2) + 'e';
  if (lower.endsWith('iam')) return lower.slice(0, -3) + 'ia';
  if (lower.endsWith('avam')) return lower.slice(0, -4) + 'ava';
  if (lower.endsWith('aram')) return lower.slice(0, -5) + 'ou';
  if (lower.endsWith('eram')) return lower.slice(0, -5) + 'eu';
  if (lower.endsWith('iram')) return lower.slice(0, -5) + 'iu';
  if (lower.endsWith('ão')) return lower.slice(0, -2) + 'a';
  return verb.slice(0, -1);
}

export async function validateConcordancia(text: string): Promise<{ errors: AgreementError[] }> {
  if (!text.trim()) return { errors: [] };

  const tagged = await tagText(text);
  const errors = [
    ...detectSubjectVerbAgreement(tagged),
    ...detectArticleNounAgreement(tagged),
  ];

  return { errors };
}
