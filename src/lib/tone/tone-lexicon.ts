import { StemmerPt, TokenizerPt } from '@nlpjs/lang-pt';
import { AhoCorasick } from './aho-corasick';
import { getToneProfiles } from './tone-profiles';
import { FORMAL_MARKERS, INFORMAL_MARKERS } from './lexicons/register-lexicon';

const stemmer = new StemmerPt();
const tokenizer = new TokenizerPt();

export interface ToneAutomaton {
  name: string;
  ac: AhoCorasick;
  keywords: string[];
  profileCodes: string[];
}

let cachedAutomatons: ToneAutomaton[] | null = null;
let cachedAntiPattern: AhoCorasick | null = null;
let cachedRegister: AhoCorasick | null = null;

function buildToneAutomatons(): ToneAutomaton[] {
  const sections = getToneProfiles();
  return sections.map(section => {
    const allKeywords = section.profiles.flatMap(p => p.keywords);
    const stemmed = [...new Set(allKeywords.map(k => {
      try { return stemmer.stem(k.toLowerCase()); }
      catch { return k.toLowerCase(); }
    }))];
    const ac = new AhoCorasick(stemmed);
    return {
      name: section.name,
      ac,
      keywords: stemmed,
      profileCodes: section.profiles.map(p => p.code),
    };
  });
}

function buildAntiPatternAutomaton(): AhoCorasick {
  const sections = getToneProfiles();
  const antiKeywords: string[] = [];
  for (const section of sections) {
    for (const profile of section.profiles) {
      if (profile.category === 'anti-padrao') {
        antiKeywords.push(...profile.keywords);
      }
    }
  }
  const stemmed = [...new Set(antiKeywords.map(k => {
    try { return stemmer.stem(k.toLowerCase()); }
    catch { return k.toLowerCase(); }
  }))];
  return new AhoCorasick(stemmed);
}

function buildRegisterAutomaton(): AhoCorasick {
  const all = [
    ...Array.from(FORMAL_MARKERS),
    ...Array.from(INFORMAL_MARKERS),
  ];
  const stemmed = [...new Set(all.map(k => {
    try { return stemmer.stem(k.toLowerCase()); }
    catch { return k.toLowerCase(); }
  }))];
  return new AhoCorasick(stemmed);
}

export function getToneAutomatons(): ToneAutomaton[] {
  if (!cachedAutomatons) cachedAutomatons = buildToneAutomatons();
  return cachedAutomatons;
}

export function getAntiPatternAutomaton(): AhoCorasick {
  if (!cachedAntiPattern) cachedAntiPattern = buildAntiPatternAutomaton();
  return cachedAntiPattern;
}

export function getRegisterAutomaton(): AhoCorasick {
  if (!cachedRegister) cachedRegister = buildRegisterAutomaton();
  return cachedRegister;
}

export { stemmer, tokenizer };
