import { tagText, likelyPlural, likelyFeminine, isKnownArticle, articleIsPlural, articleIsFeminine, likelySingular } from './pos-tagger';
import type { TaggedToken } from './pos-tagger';

export interface AgreementError {
  word: string;
  expected: string;
  message: string;
  position: number;
  ruleId: string;
}

const PLURAL_VERB_ENDINGS = /(?:am|ão|emos|eis|is|mos|ram|ões|ães)$/;
const SINGULAR_VERB_ENDINGS = /(?:[aeo]|ou|eu|iu|ia|ava|era|ira|asse|esse|isse|aste|este|iste|ara|era|ira|iria|aria|eria)$/;

const IRREGULAR_SG_TO_PL: Record<string, string> = {
  'é': 'são',
  'está': 'estão',
  'tem': 'têm',
  'vem': 'vêm',
  'há': 'hão',
  'vai': 'vão',
  'põe': 'põem',
  'faz': 'fazem',
  'diz': 'dizem',
  'quer': 'querem',
  'sabe': 'sabem',
  'pode': 'podem',
  'deve': 'devem',
  'crê': 'creem',
  'dê': 'deem',
  'lê': 'leem',
  'vê': 'veem',
  'traz': 'trazem',
  'ouve': 'ouvem',
  'sai': 'saem',
  'cai': 'caem',
  'ri': 'riem',
};

const IRREGULAR_PL_TO_SG: Record<string, string> = {
  'são': 'é',
  'estão': 'está',
  'têm': 'tem',
  'vêm': 'vem',
  'hão': 'há',
  'vão': 'vai',
  'põem': 'põe',
  'fazem': 'faz',
  'dizem': 'diz',
  'querem': 'quer',
  'sabem': 'sabe',
  'podem': 'pode',
  'devem': 'deve',
  'creem': 'crê',
  'deem': 'dê',
  'leem': 'lê',
  'veem': 'vê',
  'trazem': 'traz',
  'ouvem': 'ouve',
  'saem': 'sai',
  'caem': 'cai',
  'riem': 'ri',
};

const ADJECTIVE_FEM_ENDINGS = /[aá]s?$/;
const ADJECTIVE_MASC_ENDINGS = /[oó]s?$/;

const IRREGULAR_ADJECTIVE_FEM: Record<string, string> = {
  'bom': 'boa',
  'mau': 'má',
  'espanhol': 'espanhola',
  'holandês': 'holandesa',
  'português': 'portuguesa',
  'francês': 'francesa',
  'inglês': 'inglesa',
  'camponês': 'camponesa',
  'cortês': 'cortesa',
  'freguês': 'freguesa',
  'chinês': 'chinesa',
  'japonês': 'japonesa',
};

const ADJECTIVE_FEM_FORMATIONS: Record<string, string> = {
  'or': 'ora',
  'ês': 'esa',
  'ol': 'ola',
  'il': 'ila',
  'al': 'al',
  'el': 'ela',
  'ão': 'ã',
  'eu': 'eia',
};

const INVARIANT_ADJECTIVES = new Set([
  'feliz', 'capaz', 'eficaz', 'feroz', 'atroz', 'veloz',
  'cortês', 'montês',
  'simples', 'pobre', 'grande', 'forte', 'fácil', 'difícil',
  'triste', 'verde', 'doce', 'amável', 'terrível', 'possível',
  'comum', 'ruim', 'azul', 'qualquer',
  'superior', 'inferior', 'anterior', 'posterior',
  'exterior', 'interior', 'ulterior',
]);

const VERBS_THAT_TAKE_SUBJECT_PREDICATIVE = new Set([
  'ser', 'estar', 'ficar', 'permanecer', 'continuar',
  'tornar-se', 'tornar', 'parecer', 'virar',
  'e', 'é', 'sou', 'somos', 'são', 'era', 'eras', 'eram', 'era',
  'foi', 'foste', 'foram', 'fomos', 'será', 'serão', 'seria', 'seriam',
  'seja', 'sejam', 'fosse', 'fossem', 'sendo',
  'estou', 'está', 'estamos', 'estão', 'estava', 'estavam', 'esteve', 'estiveram',
  'estará', 'estarão', 'estaria', 'estariam', 'esteja', 'estejam', 'estivesse', 'estivessem',
  'ficou', 'ficam', 'ficaram', 'ficava', 'ficarão',
  'permanece', 'permanecem', 'permaneceu', 'permaneceram',
  'continua', 'continuam', 'continuou', 'continuaram',
  'parece', 'parecem', 'pareceu', 'pareceram',
  'tornou', 'tornaram', 'tornou-se', 'tornaram-se',
]);

const COMPOUND_TENSE_AUX = new Set([
  'ter', 'tenho', 'tens', 'tem', 'temos', 'tende', 'têm',
  'tinha', 'tinhas', 'tínhamos', 'tínheis', 'tinham',
  'tive', 'teve', 'tiveste', 'tivemos', 'tiveram',
  'terei', 'terás', 'terá', 'teremos', 'tereis', 'terão',
  'teria', 'terias', 'teríamos', 'teríeis', 'teriam',
  'tenha', 'tenhas', 'tenhamos', 'tenhais', 'tenham',
  'tivesse', 'tivesses', 'tivéssemos', 'tivésseis', 'tivessem',
  'tiver', 'tiveres', 'tivermos', 'tiverdes', 'tiverem',
  'haver', 'hei', 'hás', 'há', 'havemos', 'heis', 'hão',
  'havia', 'havias', 'havíamos', 'havíeis', 'haviam',
  'houve', 'houveste', 'houvemos', 'houveram',
  'houvera', 'houveras', 'houvéramos', 'houvéreis', 'houveram',
  'houveria', 'houverias', 'houveríamos', 'houveríeis', 'houveriam',
  'houver', 'houveres', 'houvernos', 'houverdes', 'houverem',
]);

const PASSIVE_AUX = new Set([
  'ser', 'sou', 'és', 'é', 'somos', 'sois', 'são',
  'era', 'eras', 'éramos', 'éreis', 'eram',
  'fui', 'foi', 'foste', 'fomos', 'foram',
  'serei', 'serás', 'será', 'seremos', 'sereis', 'serão',
  'seria', 'serias', 'seríamos', 'seríeis', 'seriam',
  'seja', 'sejas', 'sejamos', 'sejais', 'sejam',
  'fosse', 'fosses', 'fôssemos', 'fôsseis', 'fossem',
  'sendo', 'sido',
  'for', 'fores', 'formos', 'fordes', 'forem',
]);

const INDEFINITE_PRONOUN_AGREEMENT = new Set([
  'muito', 'muita', 'muitos', 'muitas',
  'pouco', 'pouca', 'poucos', 'poucas',
  'tanto', 'tanta', 'tantos', 'tantas',
  'quanto', 'quanta', 'quantos', 'quantas',
  'algum', 'alguma', 'alguns', 'algumas',
  'nenhum', 'nenhuma', 'nenhuns', 'nenhumas',
  'certo', 'certa', 'certos', 'certas',
  'vários', 'várias',
  'bastante', 'bastantes',
  'todo', 'toda', 'todos', 'todas',
]);

const INDEFINITE_BASE_TO_PLURAL: Record<string, string> = {
  'muito': 'muitos', 'muita': 'muitas',
  'pouco': 'poucos', 'pouca': 'poucas',
  'tanto': 'tantos', 'tanta': 'tantas',
  'quanto': 'quantos', 'quanta': 'quantas',
  'algum': 'alguns', 'alguma': 'algumas',
  'nenhum': 'nenhuns', 'nenhuma': 'nenhumas',
  'certo': 'certos', 'certa': 'certas',
  'todo': 'todos', 'toda': 'todas',
  'vário': 'vários', 'vária': 'várias',
};

function verbIsPlural(word: string): boolean {
  const lower = word.toLowerCase().trim();
  if (IRREGULAR_PL_TO_SG[lower]) return true;
  if (PLURAL_VERB_ENDINGS.test(lower) && !SINGULAR_VERB_ENDINGS.test(lower)) return true;
  if (/(?:nham|nharam|lham|lharam|rão)$/.test(lower)) return true;
  return false;
}

function verbIsSingular(word: string): boolean {
  const lower = word.toLowerCase().trim();
  if (IRREGULAR_SG_TO_PL[lower]) return true;
  if (lower.endsWith('s') && !lower.endsWith('ss')) return false;
  if (SINGULAR_VERB_ENDINGS.test(lower) && !PLURAL_VERB_ENDINGS.test(lower)) return true;
  if (/(?:[^s]o|as|es)$/.test(lower)) return true;
  return false;
}

function adjectiveIsFeminine(word: string): boolean | null {
  const lower = word.toLowerCase().trim();
  if (INVARIANT_ADJECTIVES.has(lower)) return null;
  const base = lower.replace(/s$/, '');
  for (const [masc, fem] of Object.entries(IRREGULAR_ADJECTIVE_FEM)) {
    if (lower === fem) return true;
    if (lower === masc) return false;
  }
  if (ADJECTIVE_FEM_ENDINGS.test(lower)) return true;
  if (ADJECTIVE_MASC_ENDINGS.test(lower)) return false;
  if (base.endsWith('eira') || base.endsWith('esa') || base.endsWith('isa') || base.endsWith('triz')) return true;
  if (base.endsWith('or')) return false;
  if (base.endsWith('ês')) return null;
  if (lower.endsWith('e') || lower.endsWith('l') || lower.endsWith('r') || lower.endsWith('z') || lower.endsWith('m')) return null;
  return null;
}

function deriveFeminineAdjective(adj: string): string | null {
  const lower = adj.toLowerCase().trim();
  if (INVARIANT_ADJECTIVES.has(lower)) return null;
  if (adjectiveIsFeminine(lower)) return null;
  const mascForm = lower.replace(/s$/, '');
  if (IRREGULAR_ADJECTIVE_FEM[mascForm]) {
    const fem = IRREGULAR_ADJECTIVE_FEM[mascForm];
    return lower.endsWith('s') ? fem + 's' : fem;
  }
  if (mascForm.endsWith('o')) return lower.slice(0, -1) + 'a' + (lower.endsWith('s') ? 's' : '');
  if (mascForm.endsWith('ês')) return lower.replace(/ês(s?)$/, 'esa$1');
  if (mascForm.endsWith('or')) return lower + (lower.endsWith('a') ? '' : 'a');
  if (mascForm === 'comum') return lower;
  if (mascForm === 'ruim') return lower;
  return null;
}

function deriveMasculineAdjective(adj: string): string | null {
  const lower = adj.toLowerCase().trim();
  if (INVARIANT_ADJECTIVES.has(lower)) return null;
  if (adjectiveIsFeminine(lower) === false) return null;
  const femForm = lower.replace(/s$/, '');
  for (const [masc, fem] of Object.entries(IRREGULAR_ADJECTIVE_FEM)) {
    if (lower === fem || lower === fem + 's') {
      return lower.endsWith('s') ? masc + 's' : masc;
    }
  }
  if (femForm.endsWith('a')) return lower.slice(0, -1) + 'o' + (lower.endsWith('s') ? 's' : '');
  if (femForm.endsWith('esa')) return lower.replace(/esa(s?)$/, 'ês$1');
  if (femForm.endsWith('ora')) return lower.replace(/ora(s?)$/, 'or$1');
  return null;
}

function derivePluralVerb(verb: string): string {
  const lower = verb.toLowerCase();
  if (IRREGULAR_SG_TO_PL[lower]) {
    return preserveCase(verb, IRREGULAR_SG_TO_PL[lower]);
  }
  if (lower.endsWith('a')) return preserveCase(verb, lower.slice(0, -1) + 'am');
  if (lower.endsWith('e')) return preserveCase(verb, lower.slice(0, -1) + 'em');
  if (lower.endsWith('ou')) return preserveCase(verb, lower.slice(0, -3) + 'aram');
  if (lower.endsWith('iu')) return preserveCase(verb, lower.slice(0, -2) + 'iram');
  if (lower.endsWith('eu')) return preserveCase(verb, lower.slice(0, -2) + 'eram');
  if (lower.endsWith('ava')) return preserveCase(verb, lower.slice(0, -3) + 'avam');
  if (lower.endsWith('ia')) return preserveCase(verb, lower.slice(0, -2) + 'iam');
  if (lower.endsWith('o')) return preserveCase(verb, lower.slice(0, -1) + 'am');
  return verb + 'm';
}

function deriveSingularVerb(verb: string): string {
  const lower = verb.toLowerCase();
  if (IRREGULAR_PL_TO_SG[lower]) {
    return preserveCase(verb, IRREGULAR_PL_TO_SG[lower]);
  }
  if (lower.endsWith('am') && lower.length > 3 && !lower.endsWith('eam') && !lower.endsWith('oam') && !lower.endsWith('iam') && !lower.endsWith('avam')) {
    if (lower.endsWith('aram')) return preserveCase(verb, lower.slice(0, -5) + 'ou');
    if (lower.endsWith('eram')) return preserveCase(verb, lower.slice(0, -5) + 'eu');
    if (lower.endsWith('iram')) return preserveCase(verb, lower.slice(0, -5) + 'iu');
    return preserveCase(verb, lower.slice(0, -2) + 'a');
  }
  if (lower.endsWith('em') && lower.length > 3) return preserveCase(verb, lower.slice(0, -2) + 'e');
  if (lower.endsWith('iam')) return preserveCase(verb, lower.slice(0, -3) + 'ia');
  if (lower.endsWith('avam')) return preserveCase(verb, lower.slice(0, -4) + 'ava');
  if (lower.endsWith('ão')) {
    if (lower === 'são') return verb.replace(/são$/i, 'é');
    if (lower === 'estão') return verb.replace(/estão$/i, 'está');
    if (lower === 'vão') return verb.replace(/vão$/i, 'vai');
    if (lower === 'hão') return verb.replace(/hão$/i, 'há');
    if (lower.endsWith('ão')) return preserveCase(verb, lower.slice(0, -2) + 'a');
  }
  return verb.slice(0, -1);
}

function preserveCase(original: string, derived: string): string {
  if (original[0] === original[0]?.toUpperCase()) {
    return derived[0].toUpperCase() + derived.slice(1);
  }
  return derived;
}

function adjectivePluralize(adj: string): string {
  const lower = adj.toLowerCase().trim();
  if (lower.endsWith('s')) return adj;
  if (lower.endsWith('l') && !lower.endsWith('il')) return adj + 's';
  if (lower.endsWith('il')) return adj.slice(0, -2) + 'is';
  if (lower.endsWith('r') || lower.endsWith('z')) return adj + 'es';
  if (lower.endsWith('ão')) return adj.slice(0, -2) + 'ões';
  if (lower.endsWith('m')) return adj.slice(0, -1) + 'ns';
  return adj + 's';
}

function adjectiveSingularize(adj: string): string {
  const lower = adj.toLowerCase().trim();
  if (!lower.endsWith('s')) return adj;
  if (lower.endsWith('ss')) return adj;
  if (lower.endsWith('is') && !lower.endsWith('ais') && !lower.endsWith('eis') && !lower.endsWith('ois') && !lower.endsWith('uis')) {
    return adj.slice(0, -2) + 'il';
  }
  if (lower.endsWith('ões')) return adj.slice(0, -3) + 'ão';
  if (lower.endsWith('ns')) return adj.slice(0, -2) + 'm';
  if (lower.endsWith('es') && (lower.endsWith('res') || lower.endsWith('zes'))) {
    return adj.slice(0, -2);
  }
  return adj.slice(0, -1);
}

function isSerEstarVerb(word: string): boolean {
  return VERBS_THAT_TAKE_SUBJECT_PREDICATIVE.has(word.toLowerCase());
}

function isCompoundAux(word: string): boolean {
  return COMPOUND_TENSE_AUX.has(word.toLowerCase());
}

function isPassiveAux(word: string): boolean {
  return PASSIVE_AUX.has(word.toLowerCase());
}

function isPastParticiple(word: string, tag: string): boolean {
  if (tag === 'PCP') return true;
  const lower = word.toLowerCase();
  if (/(?:ado|ido|ado|ido|ado|ida|idas|idos|ada|adas|ados)$/.test(lower)) return true;
  const irregular = /^(?:feito|dito|escrito|aberto|coberto|visto|posto|gasto|pago|dado|sido|ido|vindo|roto|frito|eleito|solto)$/i.test(lower);
  return irregular;
}

function isPossessive(word: string, tag: string): boolean {
  if (tag === 'PROADJ') return true;
  const lower = word.toLowerCase();
  return /^(?:meu|minha|meus|minhas|teu|tua|teus|tuas|seu|sua|seus|suas|nosso|nossa|nossos|nossas|vosso|vossa|vossos|vossas)$/i.test(lower);
}

function possessiveAgreement(poss: string, noun: string): { expected: string } | null {
  const lower = poss.toLowerCase();
  const nounFem = likelyFeminine(noun);
  const nounPl = likelyPlural(noun);

  const MASC_SG = new Set(['meu', 'teu', 'seu', 'nosso', 'vosso']);
  const FEM_SG = new Set(['minha', 'tua', 'sua', 'nossa', 'vossa']);
  const MASC_PL = new Set(['meus', 'teus', 'seus', 'nossos', 'vossos']);
  const FEM_PL = new Set(['minhas', 'tuas', 'suas', 'nossas', 'vossas']);

  if (MASC_SG.has(lower) && nounFem && nounPl !== true) {
    return { expected: changePossessive(lower, 'fem', false) };
  }
  if (FEM_SG.has(lower) && nounFem === false && nounPl !== true) {
    return { expected: changePossessive(lower, 'masc', false) };
  }
  if (MASC_PL.has(lower) && nounFem && nounPl !== false) {
    return { expected: changePossessive(lower, 'fem', true) };
  }
  if (FEM_PL.has(lower) && nounFem === false && nounPl !== false) {
    return { expected: changePossessive(lower, 'masc', true) };
  }
  if (MASC_SG.has(lower) && nounPl) {
    const newPoss = changePossessive(lower, 'masc', true);
    if (newPoss !== poss) return { expected: newPoss + ' (concordar em número)' };
  }
  if (FEM_SG.has(lower) && nounPl) {
    const newPoss = changePossessive(lower, 'fem', true);
    if (newPoss !== poss) return { expected: newPoss + ' (concordar em número)' };
  }
  return null;
}

function changePossessive(poss: string, gender: 'masc' | 'fem', plural: boolean): string {
  const MASC_SG: Record<string, [string, string, string]> = {
    'meu': ['minha', 'meus', 'minhas'],
    'teu': ['tua', 'teus', 'tuas'],
    'seu': ['sua', 'seus', 'suas'],
    'nosso': ['nossa', 'nossos', 'nossas'],
    'vosso': ['vossa', 'vossos', 'vossas'],
  };
  const lower = poss.toLowerCase();
  const entry = MASC_SG[lower];
  if (entry) {
    if (gender === 'fem') {
      return plural ? entry[2] : entry[0];
    }
    return plural ? entry[1] : lower;
  }
  const FEM_SG: Record<string, [string, string, string]> = {
    'minha': ['meu', 'minhas', 'meus'],
    'tua': ['teu', 'tuas', 'teus'],
    'sua': ['seu', 'suas', 'seus'],
    'nossa': ['nosso', 'nossas', 'nossos'],
    'vossa': ['vosso', 'vossas', 'vossos'],
  };
  const femEntry = FEM_SG[lower];
  if (femEntry) {
    if (gender === 'masc') {
      return plural ? femEntry[2] : femEntry[0];
    }
    return plural ? femEntry[1] : lower;
  }
  return poss;
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

function detectDistanceSubjectVerbAgreement(tagged: TaggedToken[]): AgreementError[] {
  const errors: AgreementError[] = [];

  const SKIP_TAGS = new Set(['ADV', 'PREP', 'ART', 'PU', 'PREP+ART', 'PREP+PROADJ', 'PREP+PROPESS', 'PROPESS', 'PROADJ', 'NUM', 'PDEN']);

  for (let i = 0; i < tagged.length; i++) {
    if (tagged[i].tag !== 'V') continue;
    const verbToken = tagged[i];

    let nounToken: TaggedToken | null = null;
    for (let j = i - 1; j >= 0; j--) {
      const t = tagged[j];
      if (t.tag === 'N' || t.tag === 'NPROP' || t.tag === 'PROSUB') {
        nounToken = t;
        break;
      }
      if (t.tag === 'PU' || t.tag === 'KC' || t.tag === 'KS') break;
    }
    if (!nounToken) continue;

    const nounPl = likelyPlural(nounToken.word);
    const verbPl = verbIsPlural(verbToken.word);
    const verbSg = verbIsSingular(verbToken.word);

    if (nounPl && verbSg && !verbPl) {
      const expected = derivePluralVerb(verbToken.word);
      if (expected !== verbToken.word && !errors.some(e => e.position === verbToken.position && e.ruleId === 'CONCORDANCIA_SUJ_VERBO_DIST')) {
        errors.push({
          word: verbToken.word,
          expected,
          message: `Erro de concordância sujeito-verbo (à distância): o sujeito "${nounToken.word}" (plural) exige verbo no plural, mas "${verbToken.word}" está no singular. Sugestão: "${expected}".`,
          position: verbToken.position,
          ruleId: 'CONCORDANCIA_SUJ_VERBO_DIST',
        });
      }
    }

    if (!nounPl && verbPl && !verbSg) {
      const expected = deriveSingularVerb(verbToken.word);
      if (expected !== verbToken.word && !errors.some(e => e.position === verbToken.position && e.ruleId === 'CONCORDANCIA_SUJ_VERBO_DIST')) {
        errors.push({
          word: verbToken.word,
          expected,
          message: `Erro de concordância sujeito-verbo (à distância): o sujeito "${nounToken.word}" (singular) exige verbo no singular, mas "${verbToken.word}" está no plural. Sugestão: "${expected}".`,
          position: verbToken.position,
          ruleId: 'CONCORDANCIA_SUJ_VERBO_DIST',
        });
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

      if (artPlural && nounPlural === false) {
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

function detectNounAdjectiveAgreement(tagged: TaggedToken[]): AgreementError[] {
  const errors: AgreementError[] = [];

  for (let i = 0; i < tagged.length - 1; i++) {
    const noun = tagged[i];
    const adj = tagged[i + 1];

    const isNounAdjective = (noun.tag === 'N' || noun.tag === 'NPROP') &&
      (adj.tag === 'ADJ' || adj.tag === 'PCP' || adj.tag === 'PROADJ');

    const isAdjectiveNoun = (noun.tag === 'ADJ' || noun.tag === 'PCP') &&
      (adj.tag === 'N' || adj.tag === 'NPROP');

    if (isNounAdjective) {
      checkAgreement(noun, adj, errors, 'N_ADJ');
    }

    if (isAdjectiveNoun) {
      checkAgreement(adj, noun, errors, 'ADJ_N_INV');
    }
  }

  return errors;
}

function checkAgreement(first: TaggedToken, second: TaggedToken, errors: AgreementError[], ruleIdBase: string): void {
  const firstFem = likelyFeminine(first.word);
  const firstPl = likelyPlural(first.word);
  const secondFem = adjectiveIsFeminine(second.word);
  const secondPl = likelyPlural(second.word);

  if (firstFem !== null && secondFem !== null && firstFem !== secondFem) {
    const derived = firstFem ? deriveFeminineAdjective(second.word) : deriveMasculineAdjective(second.word);
    if (derived && derived !== second.word) {
      errors.push({
        word: second.word,
        expected: derived,
        message: `Erro de concordância de gênero: "${first.word}" (${firstFem ? 'feminino' : 'masculino'}) exige "${derived}" em vez de "${second.word}".`,
        position: second.position,
        ruleId: `CONCORDANCIA_${ruleIdBase}_GENERO`,
      });
    }
  }

  if (firstPl !== null && secondPl !== null && firstPl !== secondPl) {
    if (firstPl && !secondPl) {
      const derived = adjectivePluralize(second.word);
      if (derived !== second.word && !errors.some(e => e.position === second.position && e.ruleId.includes('GENERO'))) {
        errors.push({
          word: second.word,
          expected: derived,
          message: `Erro de concordância de número: "${first.word}" (plural) exige "${derived}" em vez de "${second.word}".`,
          position: second.position,
          ruleId: `CONCORDANCIA_${ruleIdBase}_NUMERO`,
        });
      }
    }
    if (!firstPl && secondPl) {
      const derived = adjectiveSingularize(second.word);
      if (derived !== second.word && !errors.some(e => e.position === second.position && e.ruleId.includes('GENERO'))) {
        errors.push({
          word: second.word,
          expected: derived,
          message: `Erro de concordância de número: "${first.word}" (singular) exige "${derived}" em vez de "${second.word}".`,
          position: second.position,
          ruleId: `CONCORDANCIA_${ruleIdBase}_NUMERO`,
        });
      }
    }
  }
}

function detectNominalPredicativeAgreement(tagged: TaggedToken[]): AgreementError[] {
  const errors: AgreementError[] = [];

  for (let i = 1; i < tagged.length; i++) {
    const curr = tagged[i];
    if (curr.tag !== 'ADJ' && curr.tag !== 'PCP') continue;

    const prev = tagged[i - 1];
    if (!isSerEstarVerb(prev.word)) continue;

    let subjectToken: TaggedToken | null = null;
    for (let j = i - 2; j >= 0; j--) {
      const t = tagged[j];
      if (t.tag === 'N' || t.tag === 'NPROP' || t.tag === 'PROSUB') {
        subjectToken = t;
        break;
      }
      if (t.tag === 'PU' || t.tag === 'KC' || t.tag === 'KS') break;
    }

    if (!subjectToken) continue;

    const subjFem = likelyFeminine(subjectToken.word);
    const subjPl = likelyPlural(subjectToken.word);
    const predFem = adjectiveIsFeminine(curr.word);
    const predPl = likelyPlural(curr.word);

    if (subjFem !== null && predFem !== null && subjFem !== predFem) {
      const derived = subjFem ? deriveFeminineAdjective(curr.word) : deriveMasculineAdjective(curr.word);
      if (derived && derived !== curr.word) {
        errors.push({
          word: curr.word,
          expected: derived,
          message: `Erro de concordância do predicativo: o sujeito "${subjectToken.word}" (${subjFem ? 'feminino' : 'masculino'}) exige "${derived}" em vez de "${curr.word}" após "${prev.word}".`,
          position: curr.position,
          ruleId: 'CONCORDANCIA_PREDICATIVO_GENERO',
        });
      }
    }

    if (subjPl !== null && predPl !== null && subjPl !== predPl) {
      if (subjPl && !predPl) {
        const derived = adjectivePluralize(curr.word);
        if (derived !== curr.word && !errors.some(e => e.position === curr.position && e.ruleId.includes('GENERO'))) {
          errors.push({
            word: curr.word,
            expected: derived,
            message: `Erro de concordância do predicativo: o sujeito "${subjectToken.word}" (plural) exige "${derived}" em vez de "${curr.word}".`,
            position: curr.position,
            ruleId: 'CONCORDANCIA_PREDICATIVO_NUMERO',
          });
        }
      }
    }
  }

  return errors;
}

function detectPastParticipleAgreement(tagged: TaggedToken[]): AgreementError[] {
  const errors: AgreementError[] = [];

  for (let i = 0; i < tagged.length; i++) {
    const curr = tagged[i];
    if (!isPastParticiple(curr.word, curr.tag)) continue;

    if (i === 0) continue;
    const prev = tagged[i - 1];
    const prevLower = prev.word.toLowerCase();

    if (isCompoundAux(prev.word) && curr.tag === 'PCP') {
      const hasFeminineEnding = /[aá]s?$/.test(curr.word.toLowerCase());
      const hasPluralEnding = /[aeos]s$/.test(curr.word.toLowerCase()) && !/(?:ndo)$/.test(curr.word.toLowerCase());

      if (hasFeminineEnding || hasPluralEnding) {
        const expected = deriveMasculineFromParticiple(curr.word);
        if (expected !== curr.word) {
          errors.push({
            word: curr.word,
            expected,
            message: `Erro de concordância do particípio: em tempos compostos com "${prev.word}", o particípio não varia. Use "${expected}" em vez de "${curr.word}".`,
            position: curr.position,
            ruleId: 'CONCORDANCIA_PARTICIPIO_COMPOSTO',
          });
        }
      }
    }

    if (isPassiveAux(prev.word) && !isCompoundAux(prev.word)) {
      let subjectToken: TaggedToken | null = null;
      for (let j = i - 2; j >= 0; j--) {
        const t = tagged[j];
        if (t.tag === 'N' || t.tag === 'NPROP' || t.tag === 'PROSUB') {
          subjectToken = t;
          break;
        }
        if (t.tag === 'PU' || t.tag === 'KC' || t.tag === 'KS') break;
      }

      if (!subjectToken) continue;

      const subjFem = likelyFeminine(subjectToken.word);
      const subjPl = likelyPlural(subjectToken.word);
      const partBase = curr.word.toLowerCase().replace(/[ao]s?$/, '');

      if (subjFem && !curr.word.toLowerCase().endsWith('a') && !curr.word.toLowerCase().endsWith('as')) {
        const expected = partBase + (subjPl ? 'as' : 'a');
        if (expected !== curr.word.toLowerCase()) {
          errors.push({
            word: curr.word,
            expected: preserveCase(curr.word, expected),
            message: `Erro de concordância do particípio: na voz passiva, o particípio deve concordar com o sujeito "${subjectToken.word}" (feminino). Use "${expected}" em vez de "${curr.word}".`,
            position: curr.position,
            ruleId: 'CONCORDANCIA_PARTICIPIO_PASSIVA',
          });
        }
      }

      if (subjPl === false && curr.word.toLowerCase().endsWith('s') && !curr.word.toLowerCase().endsWith('ss')) {
        const expectedSingular = curr.word.toLowerCase().replace(/s$/, '');
        if (expectedSingular !== curr.word.toLowerCase() && (subjFem === true || subjFem === null)) {
          errors.push({
            word: curr.word,
            expected: preserveCase(curr.word, expectedSingular),
            message: `Erro de concordância do particípio: na voz passiva com sujeito singular, use a forma singular.`,
            position: curr.position,
            ruleId: 'CONCORDANCIA_PARTICIPIO_PASSIVA',
          });
        }
      }
    }
  }

  return errors;
}

function deriveMasculineFromParticiple(part: string): string {
  const lower = part.toLowerCase();
  if (lower.endsWith('ada')) return part.slice(0, -3) + 'ado';
  if (lower.endsWith('ada')) return part.slice(0, -3) + 'ado';
  if (lower.endsWith('ida')) return part.slice(0, -3) + 'ido';
  if (lower.endsWith('adas')) return part.slice(0, -4) + 'ados';
  if (lower.endsWith('idas')) return part.slice(0, -4) + 'idos';
  if (lower.endsWith('ados')) return part.slice(0, -4) + 'ados';
  if (lower.endsWith('a') && !lower.endsWith('ea') && !lower.endsWith('ia') && !lower.endsWith('oa')) return part.slice(0, -1) + 'o';
  if (lower.endsWith('as') && !lower.endsWith('eas') && !lower.endsWith('ias')) return part.slice(0, -2) + 'os';
  const irregular: Record<string, string> = {
    'feita': 'feito', 'feitas': 'feitos',
    'dita': 'dito', 'ditas': 'ditos',
    'escrita': 'escrito', 'escritas': 'escritos',
    'aberta': 'aberto', 'abertas': 'abertos',
    'coberta': 'coberto', 'cobertas': 'cobertos',
    'vista': 'visto', 'vistas': 'vistos',
    'posta': 'posto', 'postas': 'postos',
    'gasta': 'gasto', 'gastas': 'gastos',
    'paga': 'pago', 'pagas': 'pagos',
    'dada': 'dado', 'dadas': 'dados',
    'rota': 'roto', 'rotas': 'rotos',
    'frita': 'frito', 'fritas': 'fritos',
    'eleita': 'eleito', 'eleitas': 'eleitos',
    'solta': 'solto', 'soltas': 'soltos',
  };
  if (irregular[lower]) return preserveCase(part, irregular[lower]);
  return part;
}

function detectPronounAntecedentAgreement(tagged: TaggedToken[]): AgreementError[] {
  const errors: AgreementError[] = [];

  for (let i = 0; i < tagged.length; i++) {
    const curr = tagged[i];
    if (!isPossessive(curr.word, curr.tag)) continue;
    if (i >= tagged.length - 1) continue;

    const next = tagged[i + 1];
    if (next.tag !== 'N') continue;

    const result = possessiveAgreement(curr.word, next.word);
    if (result && result.expected !== curr.word) {
      errors.push({
        word: curr.word,
        expected: result.expected,
        message: `Erro de concordância pronome-antecedente: "${curr.word}" não concorda com "${next.word}". Sugestão: "${result.expected}".`,
        position: curr.position,
        ruleId: 'CONCORDANCIA_PRONOME_ANTECEDENTE',
      });
    }
  }

  return errors;
}

function detectIndefinitePronounAgreement(tagged: TaggedToken[]): AgreementError[] {
  const errors: AgreementError[] = [];

  for (let i = 0; i < tagged.length - 1; i++) {
    const curr = tagged[i];
    const next = tagged[i + 1];

    const currLower = curr.word.toLowerCase();
    if (!INDEFINITE_PRONOUN_AGREEMENT.has(currLower) && curr.tag !== 'PDEN') continue;
    if (!INDEFINITE_PRONOUN_AGREEMENT.has(currLower)) continue;
    if (next.tag !== 'N') continue;

    const nextPl = likelyPlural(next.word);
    const nextFem = likelyFeminine(next.word);

    const currPl = currLower.endsWith('s');
    const currFem = currLower.endsWith('a') || currLower.endsWith('as');

    if (currLower.endsWith('s') && !nextPl) {
      const singular = currLower.replace(/s$/, '');
      if (INDEFINITE_BASE_TO_PLURAL[singular] || INDEFINITE_BASE_TO_PLURAL[currLower]) {
        errors.push({
          word: curr.word,
          expected: singular,
          message: `Erro de concordância: "${curr.word}" (plural) exige substantivo plural. "${next.word}" está no singular. Use "${singular}" em vez de "${curr.word}".`,
          position: curr.position,
          ruleId: 'CONCORDANCIA_PRONOME_INDEFINIDO',
        });
      }
    }

    if (!currLower.endsWith('s') && currLower !== 'bastante' && nextPl && currLower !== 'cada') {
      const plural = currLower.endsWith('a') ? currLower + 's' : currLower + 's';
      if (INDEFINITE_BASE_TO_PLURAL[plural] || INDEFINITE_PRONOUN_AGREEMENT.has(plural)) {
        errors.push({
          word: curr.word,
          expected: plural,
          message: `Erro de concordância: "${curr.word}" (singular) exige substantivo singular. "${next.word}" está no plural. Use "${plural}" em vez de "${curr.word}".`,
          position: curr.position,
          ruleId: 'CONCORDANCIA_PRONOME_INDEFINIDO',
        });
      }
    }

    if (currFem && nextFem === false) {
      const mascForm = currLower.replace(/a(s?)$/, 'o$1');
      if (INDEFINITE_BASE_TO_PLURAL[mascForm] || INDEFINITE_BASE_TO_PLURAL[currLower]) {
        errors.push({
          word: curr.word,
          expected: mascForm,
          message: `Erro de concordância de gênero: "${curr.word}" (feminino) exige substantivo feminino, mas "${next.word}" é masculino. Use "${mascForm}".`,
          position: curr.position,
          ruleId: 'CONCORDANCIA_PRONOME_INDEFINIDO',
        });
      }
    }
  }

  return errors;
}

function detectAdverbialAgreement(text: string): AgreementError[] {
  const errors: AgreementError[] = [];

  const re = /\bem\s+anexa\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    errors.push({
      word: 'anexa',
      position: m.index + 3,
      expected: 'anexo',
      message: 'A locução adverbial "em anexo" é invariável (masculino singular). Use "em anexo", não "em anexa".',
      ruleId: 'CONCORDANCIA_ADVERBIAL_ANEXO',
    });
  }

  return errors;
}

export async function validateConcordancia(text: string): Promise<{ errors: AgreementError[] }> {
  if (!text.trim()) return { errors: [] };

  const tagged = await tagText(text);
  const errors = [
    ...detectSubjectVerbAgreement(tagged),
    ...detectDistanceSubjectVerbAgreement(tagged),
    ...detectArticleNounAgreement(tagged),
    ...detectNounAdjectiveAgreement(tagged),
    ...detectNominalPredicativeAgreement(tagged),
    ...detectPastParticipleAgreement(tagged),
    ...detectPronounAntecedentAgreement(tagged),
    ...detectIndefinitePronounAgreement(tagged),
    ...detectAdverbialAgreement(text),
  ];

  const uniqueErrors = errors.filter((err, index, self) =>
    index === self.findIndex(e =>
      e.position === err.position && e.ruleId === err.ruleId
    )
  );

  return { errors: uniqueErrors };
}
