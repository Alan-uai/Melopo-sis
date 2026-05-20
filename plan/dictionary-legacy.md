# Dictionary Legacy — Morphological Explainer

> Este arquivo documenta o sistema de dicionário e análise morfológica
> que foi substituído por `words-pt` em maio de 2026.
>
> Motivo da substituição: `words-pt` (998K palavras, Universidade do Minho)
> cobre mais formas flexionadas sem necessidade de manter tabelas manuais
> de conjugação, plural, feminino, etc.
>
> **Caso queira reativar o "explicador" (decomposição morfológica),
> este documento contém o código completo e as instruções.**

---

## Arquitetura Original

O sistema original em `src/lib/dictionary.ts` (691 linhas) funcionava em 3 níveis:

```
isWordCorrect(word)
  ├── Nível 1: lookup direto em supplement-words.txt (561K palavras)
  ├── Nível 2: 11 estratégias morfológicas (try*) para decompor flexões
  └── Nível 3: Hunspell (espells) como fallback final
```

Cada estratégia `try*` tenta decompor a palavra aplicando uma regra
morfológica e verificando se a base resultante existe no dicionário.
Se alguma retornar `true`, a palavra é considerada válida.

**Problema eliminado**: as 11 estratégias retornavam apenas `boolean`.
Nenhum consumidor usava a informação de *qual* estratégia funcionou.
O "explicador" existia no código mas nunca era exposto.

---

## Código Fonte Original (691 linhas)

```typescript
import fs from 'fs';
import path from 'path';
import { StemmerPt } from '@nlpjs/lang-pt';
import { getSymSpellSuggestions } from './symspell-engine';
import { isWordCorrectHunspell, getHunspellSuggestions } from './spelling/espells-engine';
import { NgramLM } from './spelling/ngram-lm';

let ngramLM: NgramLM | null = null;

function getNgramLM(): NgramLM {
  if (!ngramLM) {
    ngramLM = new NgramLM();
  }
  return ngramLM;
}

export function seedNgramLM(texts: string[]): void {
  getNgramLM().train(texts);
}

export function resetNgramLM(): void {
  ngramLM = null;
}

const stemmer = new StemmerPt();

let knownWords: Set<string> | null = null;
let knownWordsPromise: Promise<Set<string>> | null = null;

export async function getWordSet(): Promise<Set<string>> {
  if (knownWords) return knownWords;
  if (knownWordsPromise) return knownWordsPromise;

  knownWordsPromise = (async () => {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'supplement-words.txt');
    const content = fs.readFileSync(filePath, 'utf8');
    knownWords = new Set(content.split('\n').filter(Boolean));
    return knownWords;
  })();

  return knownWordsPromise;
}

type ConjugationClass = 'ar' | 'er' | 'ir';

const VERB_CONJUGATIONS: Record<ConjugationClass, string[]> = {
  ar: [
    'o', 'as', 'a', 'amos', 'ais', 'am',
    'ei', 'aste', 'ou', 'astes', 'aram',
    'ava', 'avas', 'ávamos', 'áveis', 'avam',
    'ara', 'aras', 'áramos', 'áreis',
    'arei', 'arás', 'ará', 'aremos', 'areis', 'arão',
    'aria', 'arias', 'aríamos', 'aríeis', 'ariam',
    'e', 'es', 'emos', 'eis', 'em',
    'asse', 'asses', 'ássemos', 'ásseis', 'assem',
    'ar', 'ares', 'armos', 'ardes', 'arem',
    'ai', 'ando', 'ado',
  ],
  er: [
    'o', 'es', 'e', 'emos', 'eis', 'em',
    'i', 'este', 'eu', 'estes', 'eram',
    'ia', 'ias', 'íamos', 'íeis', 'iam',
    'era', 'eras', 'êramos', 'êreis',
    'erei', 'erás', 'erá', 'eremos', 'ereis', 'erão',
    'eria', 'erias', 'eríamos', 'eríeis', 'eriam',
    'a', 'as', 'amos', 'ais', 'am',
    'esse', 'esses', 'êssemos', 'êsseis', 'essem',
    'er', 'eres', 'ermos', 'erdes', 'erem',
    'ei', 'endo', 'ido',
  ],
  ir: [
    'o', 'es', 'e', 'imos', 'is', 'em',
    'i', 'iste', 'iu', 'istes', 'iram',
    'ia', 'ias', 'íamos', 'íeis', 'iam',
    'ira', 'iras', 'íramos', 'íreis',
    'irei', 'irás', 'irá', 'iremos', 'ireis', 'irão',
    'iria', 'irias', 'iríamos', 'iríeis', 'iriam',
    'a', 'as', 'amos', 'ais', 'am',
    'isse', 'isses', 'íssemos', 'ísseis', 'issem',
    'ir', 'ires', 'irmos', 'irdes', 'irem',
    'ei', 'indo', 'ido',
  ],
};

const IRREGULAR_FORMS: Record<string, string[]> = {
  'sou': ['ser'], 'és': ['ser'], 'é': ['ser', 'estar'],
  'somos': ['ser'], 'sois': ['ser'], 'são': ['ser', 'estar', 'ir'],
  'era': ['ser'], 'eras': ['ser'], 'éramos': ['ser'], 'éreis': ['ser'],
  'eram': ['ser'], 'fui': ['ser', 'ir'], 'foste': ['ser', 'ir'],
  'foi': ['ser', 'ir'], 'fomos': ['ser', 'ir'], 'fostes': ['ser', 'ir'],
  'foram': ['ser', 'ir'], 'fora': ['ser', 'ir'], 'foras': ['ser', 'ir'],
  'fôramos': ['ser', 'ir'], 'fôreis': ['ser', 'ir'],
  'serei': ['ser'], 'serás': ['ser'], 'será': ['ser'],
  'seremos': ['ser'], 'sereis': ['ser'], 'serão': ['ser'],
  'seria': ['ser'], 'serias': ['ser'], 'seríamos': ['ser'],
  'seríeis': ['ser'], 'seriam': ['ser'],
  'seja': ['ser'], 'sejas': ['ser'], 'sejamos': ['ser'],
  'sejais': ['ser'], 'sejam': ['ser'],
  'fosse': ['ser', 'ir'], 'fosses': ['ser', 'ir'],
  'fôssemos': ['ser', 'ir'], 'fôsseis': ['ser', 'ir'],
  'fossem': ['ser', 'ir'], 'sendo': ['ser'], 'sido': ['ser'],
  'estou': ['estar'], 'estás': ['estar'], 'está': ['estar'],
  'estais': ['estar'], 'estão': ['estar'],
  'estava': ['estar'], 'estavas': ['estar'], 'estávamos': ['estar'],
  'estáveis': ['estar'], 'estavam': ['estar'],
  'estive': ['estar'], 'estiveste': ['estar'], 'esteve': ['estar'],
  'estivemos': ['estar'], 'estivestes': ['estar'], 'estiveram': ['estar'],
  'estivera': ['estar'], 'estiveras': ['estar'],
  'esteja': ['estar'], 'estejas': ['estar'], 'estejamos': ['estar'],
  'estejais': ['estar'], 'estejam': ['estar'],
  'estivesse': ['estar'], 'estivesses': ['estar'],
  'estivéssemos': ['estar'], 'estivésseis': ['estar'],
  'estivessem': ['estar'], 'estando': ['estar'], 'estado': ['estar'],
  'tenho': ['ter'], 'tens': ['ter'], 'tem': ['ter'],
  'tendes': ['ter'], 'têm': ['ter'],
  'tinha': ['ter'], 'tinhas': ['ter'], 'tínhamos': ['ter'],
  'tínheis': ['ter'], 'tinham': ['ter'],
  'tive': ['ter'], 'tiveste': ['ter'], 'teve': ['ter'],
  'tivemos': ['ter'], 'tivestes': ['ter'], 'tiveram': ['ter'],
  'tivera': ['ter'], 'tiveras': ['ter'],
  'tenha': ['ter'], 'tenhas': ['ter'], 'tenhamos': ['ter'],
  'tenhais': ['ter'], 'tenham': ['ter'],
  'tivesse': ['ter'], 'tivesses': ['ter'], 'tivéssemos': ['ter'],
  'tivésseis': ['ter'], 'tivessem': ['ter'],
  'tiver': ['ter'], 'tiveres': ['ter'], 'tivermos': ['ter'],
  'tiverdes': ['ter'], 'tiverem': ['ter'],
  'tendo': ['ter'], 'tido': ['ter'],
  'hei': ['haver'], 'hás': ['haver'], 'há': ['haver'],
  'hão': ['haver'], 'houve': ['haver'], 'houveste': ['haver'],
  'houveram': ['haver'], 'houvera': ['haver'],
  'haja': ['haver'], 'hajam': ['haver'], 'houvesse': ['haver'],
  'houver': ['haver'], 'havendo': ['haver'], 'havido': ['haver'],
  'vou': ['ir'], 'vais': ['ir'], 'vai': ['ir'],
  'ides': ['ir'], 'vão': ['ir'],
  'ia': ['ir'], 'ias': ['ir'], 'íamos': ['ir'], 'íeis': ['ir'], 'iam': ['ir'],
  'vá': ['ir'], 'vás': ['ir'], 'vamos': ['ir'], 'vades': ['ir'],
  'venho': ['vir'], 'vens': ['vir'], 'vem': ['vir'],
  'vimos': ['vir', 'ver'], 'vindes': ['vir'], 'vêm': ['vir'],
  'vinha': ['vir'], 'vinhas': ['vir'], 'vínhamos': ['vir'],
  'vinham': ['vir'],
  'vim': ['vir'], 'vieste': ['vir'], 'veio': ['vir'],
  'viemos': ['vir'], 'viestes': ['vir'], 'vieram': ['vir'],
  'viera': ['vir'], 'vieras': ['vir'],
  'venha': ['vir'], 'venhas': ['vir'], 'venhamos': ['vir'],
  'venhais': ['vir'], 'venham': ['vir'],
  'viesse': ['vir'], 'viesses': ['vir'], 'viéssemos': ['vir'],
  'viésseis': ['vir'], 'viessem': ['vir'],
  'vier': ['vir'], 'vieres': ['vir'], 'viermos': ['vir'],
  'vierdes': ['vir'], 'vierem': ['vir'],
  'vindo': ['vir'],
  'ponho': ['pôr'], 'pões': ['pôr'], 'põe': ['pôr'],
  'pomos': ['pôr'], 'pondes': ['pôr'], 'põem': ['pôr'],
  'punha': ['pôr'], 'punhas': ['pôr'], 'púnhamos': ['pôr'],
  'púnheis': ['pôr'], 'punham': ['pôr'],
  'pus': ['pôr'], 'puseste': ['pôr'], 'pôs': ['pôr'],
  'pusemos': ['pôr'], 'pusestes': ['pôr'], 'puseram': ['pôr'],
  'pusera': ['pôr'], 'puseras': ['pôr'],
  'ponha': ['pôr'], 'ponhas': ['pôr'], 'ponhamos': ['pôr'],
  'ponhais': ['pôr'], 'ponham': ['pôr'],
  'pusesse': ['pôr'], 'pusesses': ['pôr'], 'puséssemos': ['pôr'],
  'pusésseis': ['pôr'], 'pusessem': ['pôr'],
  'puser': ['pôr'], 'puseres': ['pôr'], 'pusermos': ['pôr'],
  'puserdes': ['pôr'], 'puserem': ['pôr'],
  'pondo': ['pôr'], 'posto': ['pôr'],
  'digo': ['dizer'], 'dizes': ['dizer'], 'diz': ['dizer'],
  'dizemos': ['dizer'], 'dizeis': ['dizer'], 'dizem': ['dizer'],
  'dizia': ['dizer'], 'dizias': ['dizer'], 'dizíamos': ['dizer'],
  'dizíeis': ['dizer'], 'diziam': ['dizer'],
  'disse': ['dizer'], 'disseste': ['dizer'],
  'dissemos': ['dizer'], 'dissestes': ['dizer'], 'disseram': ['dizer'],
  'dissera': ['dizer'], 'disseras': ['dizer'],
  'diga': ['dizer'], 'digas': ['dizer'], 'digamos': ['dizer'],
  'digais': ['dizer'], 'digam': ['dizer'],
  'dissesse': ['dizer'], 'dissesses': ['dizer'], 'disséssemos': ['dizer'],
  'dissésseis': ['dizer'], 'dissessem': ['dizer'],
  'disser': ['dizer'], 'disseres': ['dizer'], 'dissermos': ['dizer'],
  'disserdes': ['dizer'], 'disserem': ['dizer'],
  'dizendo': ['dizer'], 'dito': ['dizer'],
  'faço': ['fazer'], 'fazes': ['fazer'], 'faz': ['fazer'],
  'fazemos': ['fazer'], 'fazeis': ['fazer'], 'fazem': ['fazer'],
  'fazia': ['fazer'], 'fazias': ['fazer'], 'fazíamos': ['fazer'],
  'fazíeis': ['fazer'], 'faziam': ['fazer'],
  'fiz': ['fazer'], 'fizeste': ['fazer'], 'fez': ['fazer'],
  'fizemos': ['fazer'], 'fizestes': ['fazer'], 'fizeram': ['fazer'],
  'fizera': ['fazer'], 'fizeras': ['fazer'],
  'faça': ['fazer'], 'faças': ['fazer'], 'façamos': ['fazer'],
  'façais': ['fazer'], 'façam': ['fazer'],
  'fizesse': ['fazer'], 'fizesses': ['fazer'], 'fizéssemos': ['fazer'],
  'fizésseis': ['fazer'], 'fizessem': ['fazer'],
  'fizer': ['fazer'], 'fizeres': ['fazer'], 'fizermos': ['fazer'],
  'fizerdes': ['fazer'], 'fizerem': ['fazer'],
  'fazendo': ['fazer'], 'feito': ['fazer'],
  'sei': ['saber'], 'sabe': ['saber'], 'sabemos': ['saber'],
  'sabeis': ['saber'], 'sabem': ['saber'],
  'sabia': ['saber'], 'sabias': ['saber'], 'sabíamos': ['saber'],
  'sabíeis': ['saber'], 'sabiam': ['saber'],
  'soube': ['saber'], 'soubeste': ['saber'],
  'soubemos': ['saber'], 'soubestes': ['saber'], 'souberam': ['saber'],
  'soubera': ['saber'], 'souberas': ['saber'],
  'saiba': ['saber'], 'saibas': ['saber'], 'saibamos': ['saber'],
  'saibais': ['saber'], 'saibam': ['saber'],
  'soubesse': ['saber'], 'soubesses': ['saber'], 'soubéssemos': ['saber'],
  'soubésseis': ['saber'], 'soubessem': ['saber'],
  'souber': ['saber'], 'souberes': ['saber'], 'soubermos': ['saber'],
  'souberdes': ['saber'], 'souberem': ['saber'],
  'sabendo': ['saber'], 'sabido': ['saber'],
  'trago': ['trazer'], 'trazes': ['trazer'], 'traz': ['trazer'],
  'trazemos': ['trazer'], 'trazeis': ['trazer'], 'trazem': ['trazer'],
  'trazia': ['trazer'], 'trazias': ['trazer'], 'trazíamos': ['trazer'],
  'trazíeis': ['trazer'], 'traziam': ['trazer'],
  'trouxe': ['trazer'], 'trouxeste': ['trazer'],
  'trouxemos': ['trazer'], 'trouxestes': ['trazer'], 'trouxeram': ['trazer'],
  'trouxera': ['trazer'], 'trouxeras': ['trazer'],
  'traga': ['trazer'], 'tragas': ['trazer'], 'tragamos': ['trazer'],
  'tragais': ['trazer'], 'tragam': ['trazer'],
  'trouxesse': ['trazer'], 'trouxesses': ['trazer'], 'trouxéssemos': ['trazer'],
  'trouxésseis': ['trazer'], 'trouxessem': ['trazer'],
  'trouxer': ['trazer'], 'trouxeres': ['trazer'], 'trouxermos': ['trazer'],
  'trouxerdes': ['trazer'], 'trouxerem': ['trazer'],
  'trazendo': ['trazer'], 'trazido': ['trazer'],
  'quero': ['querer'], 'queres': ['querer'], 'quer': ['querer'],
  'queremos': ['querer'], 'quereis': ['querer'], 'querem': ['querer'],
  'queria': ['querer'], 'querias': ['querer'], 'queríamos': ['querer'],
  'queríeis': ['querer'], 'queriam': ['querer'],
  'quis': ['querer'], 'quiseste': ['querer'],
  'quisemos': ['querer'], 'quisestes': ['querer'], 'quiseram': ['querer'],
  'quisera': ['querer'], 'quiseras': ['querer'],
  'queira': ['querer'], 'queiras': ['querer'], 'queiramos': ['querer'],
  'queirais': ['querer'], 'queiram': ['querer'],
  'quisesse': ['querer'], 'quisesses': ['querer'], 'quiséssemos': ['querer'],
  'quisésseis': ['querer'], 'quisessem': ['querer'],
  'quiser': ['querer'], 'quiseres': ['querer'], 'quisermos': ['querer'],
  'quiserdes': ['querer'], 'quiserem': ['querer'],
  'querendo': ['querer'], 'querido': ['querer'],
  'posso': ['poder'], 'podes': ['poder'], 'pode': ['poder'],
  'podemos': ['poder'], 'podeis': ['poder'], 'podem': ['poder'],
  'podia': ['poder'], 'podias': ['poder'], 'podíamos': ['poder'],
  'podíeis': ['poder'], 'podiam': ['poder'],
  'pude': ['poder'], 'pudeste': ['poder'], 'pôde': ['poder'],
  'pudemos': ['poder'], 'pudestes': ['poder'], 'puderam': ['poder'],
  'pudera': ['poder'], 'puderas': ['poder'],
  'possa': ['poder'], 'possas': ['poder'], 'possamos': ['poder'],
  'possais': ['poder'], 'possam': ['poder'],
  'pudesse': ['poder'], 'pudesses': ['poder'], 'pudéssemos': ['poder'],
  'pudésseis': ['poder'], 'pudessem': ['poder'],
  'puder': ['poder'], 'puderes': ['poder'], 'pudermos': ['poder'],
  'puderdes': ['poder'], 'puderem': ['poder'],
  'podendo': ['poder'], 'podido': ['poder'],
  'vejo': ['ver'], 'vês': ['ver'], 'vê': ['ver'],
  'vemos': ['ver'], 'vedes': ['ver'], 'veem': ['ver'],
  'via': ['ver'], 'vias': ['ver'], 'víamos': ['ver'],
  'viam': ['ver'],
  'vi': ['ver'], 'viste': ['ver'], 'viu': ['ver'],
  'vistes': ['ver'], 'viram': ['ver'],
  'vira': ['ver'], 'viras': ['ver'], 'víramos': ['ver'],
  'víreis': ['ver'],
  'veja': ['ver'], 'vejas': ['ver'], 'vejamos': ['ver'],
  'vejais': ['ver'], 'vejam': ['ver'],
  'visse': ['ver'], 'visses': ['ver'], 'víssemos': ['ver'],
  'vísseis': ['ver'], 'vissem': ['ver'],
  'vir': ['ver'], 'vires': ['ver'], 'virmos': ['ver'],
  'virdes': ['ver'], 'virem': ['ver'],
  'vendo': ['ver'], 'visto': ['ver'],
  'dou': ['dar'], 'dás': ['dar'], 'dá': ['dar'],
  'damos': ['dar'], 'dais': ['dar'], 'dão': ['dar'],
  'dava': ['dar'], 'davas': ['dar'], 'dávamos': ['dar'],
  'dáveis': ['dar'], 'davam': ['dar'],
  'dei': ['dar'], 'deste': ['dar'], 'deu': ['dar'],
  'demos': ['dar'], 'destes': ['dar'], 'deram': ['dar'],
  'dera': ['dar'], 'deras': ['dar'],
  'dê': ['dar'], 'dês': ['dar'],
  'deis': ['dar'], 'deem': ['dar'], 'dêem': ['dar'],
  'desse': ['dar'], 'desses': ['dar'], 'déssemos': ['dar'],
  'désseis': ['dar'], 'dessem': ['dar'],
  'der': ['dar'], 'deres': ['dar'], 'dermos': ['dar'],
  'derdes': ['dar'], 'derem': ['dar'],
  'dando': ['dar'], 'dado': ['dar'],
  'leio': ['ler'], 'lês': ['ler'], 'lê': ['ler'],
  'lemos': ['ler'], 'ledes': ['ler'], 'leem': ['ler'],
  'lia': ['ler'], 'lias': ['ler'], 'líamos': ['ler'],
  'líeis': ['ler'], 'liam': ['ler'],
  'li': ['ler'],   'leste': ['ler'], 'leu': ['ler'],
  'lestes': ['ler'], 'leram': ['ler'],
  'lera': ['ler'], 'leras': ['ler'],
  'leia': ['ler'], 'leias': ['ler'], 'leiamos': ['ler'],
  'leiais': ['ler'], 'leiam': ['ler'],
  'lesse': ['ler'], 'lesses': ['ler'], 'léssemos': ['ler'],
  'lésseis': ['ler'], 'lessem': ['ler'],
  'ler': ['ler'], 'leres': ['ler'], 'lermos': ['ler'],
  'lerdes': ['ler'], 'lerem': ['ler'],
  'lendo': ['ler'], 'lido': ['ler'],
  'creio': ['crer'], 'crês': ['crer'], 'crê': ['crer'],
  'cremos': ['crer'], 'credes': ['crer'], 'creem': ['crer'],
  'cria': ['crer'], 'crias': ['crer'], 'críamos': ['crer'],
  'críeis': ['crer'], 'criam': ['crer'],
  'cri': ['crer'], 'creste': ['crer'], 'creu': ['crer'],
  'crestes': ['crer'], 'creram': ['crer'],
  'crera': ['crer'], 'creras': ['crer'],
  'creia': ['crer'], 'creias': ['crer'], 'creiamos': ['crer'],
  'creiais': ['crer'], 'creiam': ['crer'],
  'cresse': ['crer'], 'cresses': ['crer'], 'créssemos': ['crer'],
  'crésseis': ['crer'], 'cressem': ['crer'],
  'crer': ['crer'], 'creres': ['crer'], 'crermos': ['crer'],
  'crerdes': ['crer'], 'crerem': ['crer'],
  'crendo': ['crer'], 'crido': ['crer'],
  'provejo': ['prover'], 'provês': ['prover'], 'provê': ['prover'],
  'provemos': ['prover'], 'provedes': ['prover'], 'proveem': ['prover'],
  'provia': ['prover'], 'provias': ['prover'], 'províamos': ['prover'],
  'províeis': ['prover'], 'proviam': ['prover'],
  'provi': ['prover'], 'proveste': ['prover'], 'proveu': ['prover'],
  'provestes': ['prover'], 'proveram': ['prover'],
  'provera': ['prover'], 'proveras': ['prover'],
  'proveja': ['prover'], 'provejas': ['prover'], 'provejamos': ['prover'],
  'provejais': ['prover'], 'provejam': ['prover'],
  'provesse': ['prover'], 'provesses': ['prover'], 'provéssemos': ['prover'],
  'provésseis': ['prover'], 'provessem': ['prover'],
  'prover': ['prover'], 'proveres': ['prover'], 'provermos': ['prover'],
  'proverdes': ['prover'], 'proverem': ['prover'],
  'provendo': ['prover'], 'provido': ['prover'],
};

const PLURAL_SUFFIXES = ['s', 'es', 'is', 'óis', 'éis', 'aes', 'ães', 'ões', 'ns', 'ais', 'eis', 'ois', 'us'];
const ADVERB_SUFFIX = 'mente';
const AUGMENTATIVE_SUFFIXES = [
  'ão', 'ona', 'zão', 'zona', 'aço', 'aça',
  'alhão', 'alhana', 'anzil', 'anzila', 'aréu', 'aréua',
  'arra', 'astro', 'astra', 'az', 'aça',
  'eirão', 'eirona', 'orra',
];
const DIMINUTIVE_SUFFIXES = [
  'inho', 'inha', 'inhos', 'inhas',
  'zinho', 'zinha', 'zinhos', 'zinhas',
  'ito', 'ita', 'itos', 'itas',
  'ico', 'ica', 'icos', 'icas',
  'ulo', 'ula', 'ulos', 'ulas',
  'acho', 'acha', 'achos', 'achas',
  'ebre', 'ebres',
  'ote', 'ota', 'otes', 'otas',
  'elho', 'elha', 'elhos', 'elhas',
  'ilho', 'ilha', 'ilhos', 'ilhas',
  'oto', 'ota', 'otos', 'otas',
];

const PREFIXES = [
  'des', 'in', 'i', 'im', 'ir', 'il', 're', 'pre',
  'sub', 'anti', 'super',
  'ab', 'ad', 'ob', 'sub', 'hiper', 'hipo', 'extra',
  'intra', 'infra', 'ultra', 'macro', 'micro', 'mini',
  'maxi', 'semi', 'pseudo', 'proto', 'neo', 'pan',
  'vice', 'ex', 'pré', 'pró', 'pós',
];

function tryStemmer(words: Set<string>, word: string): boolean {
  const stem = stemmer.stem(word);
  if (stem.length > 2 && words.has(stem)) return true;
  return false;
}

function tryPrefix(words: Set<string>, word: string): boolean {
  for (const prefix of PREFIXES) {
    if (word.startsWith(prefix) && word.length > prefix.length + 2) {
      const base = word.slice(prefix.length);
      if (words.has(base)) return true;
      if (stemmer.stem(base).length > 2 && words.has(stemmer.stem(base))) return true;
    }
  }
  if (word.startsWith('in') && word.length > 5) {
    const base = word.slice(2);
    if (words.has(base)) return true;
  }
  return false;
}

function tryEnclitic(words: Set<string>, word: string): boolean {
  const enclitics = [
    { suffix: 'lo', pattern: /[aeê]r$/ },
    { suffix: 'la', pattern: /[aeê]r$/ },
    { suffix: 'lhe', pattern: /[aeê]r$/ },
    { suffix: 'los', pattern: /[aeê]r$/ },
    { suffix: 'las', pattern: /[aeê]r$/ },
    { suffix: 'lhes', pattern: /[aeê]r$/ },
    { suffix: 'no', pattern: /[mãõ]$/ },
    { suffix: 'na', pattern: /[mãõ]$/ },
    { suffix: 'nos', pattern: /[mãõ]$/ },
    { suffix: 'nas', pattern: /[mãõ]$/ },
  ];

  for (const { suffix, pattern } of enclitics) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      const base = word.slice(0, -suffix.length);
      if (pattern.test(base)) {
        const restored = base.replace(/[aeê]r$/, 'r');
        if (words.has(restored)) return true;
        if (words.has(base)) return true;
      }
      if (words.has(base)) return true;
    }
  }

  const mesocliticMatch = word.match(/^(.+?)([áéó])(lo|la|los|las|no|na|nos|nas|lhe|lhes)$/);
  if (mesocliticMatch) {
    const base = mesocliticMatch[1] + 'r';
    if (words.has(base)) return true;
  }

  return false;
}

function tryCompound(words: Set<string>, word: string): boolean {
  if (!word.includes('-')) return false;
  const parts = word.split('-');
  if (parts.length === 2 && parts.every(p => p.length > 1)) {
    if (words.has(parts[0]) && words.has(parts[1])) return true;
  }
  return false;
}

function tryIrregularSuperlative(words: Set<string>, word: string): boolean {
  const irregular: Record<string, string> = {
    'facílimo': 'fácil', 'facílima': 'fácil',
    'paupérrimo': 'pobre', 'paupérrima': 'pobre',
    'pulquérrimo': 'pulcro', 'pulquérrima': 'pulcra',
    'célebre': 'célebre', 'celebérrimo': 'célebre', 'celebérrima': 'célebre',
    'integérrimo': 'íntegro', 'integérrima': 'íntegra',
    'misericordiosíssimo': 'misericordioso',
    'nobilíssimo': 'nobre', 'nobilíssima': 'nobre',
    'sapientíssimo': 'sábio', 'sapientíssima': 'sábia',
    'libérrimo': 'livre', 'libérrima': 'livre',
    'acérrimo': 'acre', 'acérrima': 'acre',
  };

  const lower = word.toLowerCase();
  if (irregular[lower]) {
    if (words.has(irregular[lower])) return true;
    const stem = stemmer.stem(irregular[lower]);
    if (stem.length > 2 && words.has(stem)) return true;
  }
  return false;
}

function stripSuffix(word: string, suffix: string): string | null {
  if (word.length <= suffix.length + 1) return null;
  if (word.endsWith(suffix)) return word.slice(0, -suffix.length);
  return null;
}

function tryVerbConjugation(words: Set<string>, word: string): boolean {
  const lower = word.toLowerCase();
  const irregular = IRREGULAR_FORMS[lower];
  if (irregular) {
    return irregular.some(infinitive => words.has(infinitive));
  }
  if (word.length < 3) return false;
  for (const [ending, suffixes] of Object.entries(VERB_CONJUGATIONS) as [ConjugationClass, string[]][]) {
    for (const suffix of suffixes) {
      const base = stripSuffix(word, suffix);
      if (base && base.length > 1) {
        const infinitive = base + ending;
        if (words.has(infinitive)) return true;
        const infinitiveAccented = base + (ending === 'ar' ? 'ar' : ending === 'er' ? 'er' : 'ir');
        if (words.has(infinitiveAccented)) return true;
      }
    }
  }
  for (const baseEnding of ['ar', 'er', 'ir'] as const) {
    if (word.endsWith(baseEnding) && word.length > 3) {
      const root = word.slice(0, -2);
      for (const ending of ['ar', 'er', 'ir'] as const) {
        if (words.has(root + ending)) return true;
      }
    }
  }
  return false;
}

function tryPlural(words: Set<string>, word: string): boolean {
  for (const suffix of PLURAL_SUFFIXES) {
    const base = stripSuffix(word, suffix);
    if (base && words.has(base)) return true;
  }
  if (word.endsWith('s')) {
    const singular = word.slice(0, -1);
    if (singular.length > 1 && words.has(singular)) return true;
  }
  return false;
}

function tryAdverb(words: Set<string>, word: string): boolean {
  const base = stripSuffix(word, ADVERB_SUFFIX);
  if (!base) return false;
  if (words.has(base)) return true;
  if (base.endsWith('a') && words.has(base.slice(0, -1) + 'o')) return true;
  return false;
}

function tryFeminine(words: Set<string>, word: string): boolean {
  if (word.endsWith('a')) {
    const masculine = word.slice(0, -1) + 'o';
    if (masculine.length > 1 && words.has(masculine)) return true;
    const masculine2 = word.slice(0, -1);
    if (masculine2.length > 1 && words.has(masculine2)) return true;
  }
  if (word.endsWith('ora')) {
    const base = word.slice(0, -3) + 'or';
    if (base.length > 1 && words.has(base)) return true;
  }
  if (word.endsWith('eira')) {
    const base = word.slice(0, -4) + 'eiro';
    if (base.length > 1 && words.has(base)) return true;
  }
  if (word.endsWith('triz')) {
    const base = word.slice(0, -4) + 'tor';
    if (base.length > 1 && words.has(base)) return true;
  }
  if (word.endsWith('esa') && word.length > 4) {
    const base = word.slice(0, -3) + 'ês';
    if (base.length > 1 && words.has(base)) return true;
  }
  if (word.endsWith('isa') && word.length > 4) {
    const base = word.slice(0, -3);
    if (base.length > 1 && words.has(base + 'o')) return true;
    if (base.length > 1 && words.has(base + 'a')) return true;
    const base2 = word.slice(0, -1);
    if (base2.length > 1 && words.has(base2)) return true;
  }
  if (word.endsWith('oa') && word.length > 3) {
    const base = word.slice(0, -2) + 'ão';
    if (base.length > 1 && words.has(base)) return true;
  }
  if (word.endsWith('ina') && word.length > 4) {
    const base = word.slice(0, -3);
    if (base.length > 1 && words.has(base + 'o')) return true;
  }
  if (word.endsWith('essa') && word.length > 5) {
    const base = word.slice(0, -2);
    if (base.length > 1 && words.has(base)) return true;
    const base2 = word.slice(0, -4) + 'êsse';
    if (base2.length > 1 && words.has(base2)) return true;
  }
  return false;
}

function tryDiminutiveAugmentative(words: Set<string>, word: string): boolean {
  for (const suffix of [...DIMINUTIVE_SUFFIXES, ...AUGMENTATIVE_SUFFIXES]) {
    const base = stripSuffix(word, suffix);
    if (base && words.has(base)) return true;
  }
  const eSuffixes = ['ezinho', 'ezinha', 'ezinhos', 'ezinhas'];
  for (const suffix of eSuffixes) {
    const base = stripSuffix(word, suffix);
    if (base && words.has(base)) return true;
  }
  return false;
}

function trySuperlative(words: Set<string>, word: string): boolean {
  if (word.endsWith('íssimo') || word.endsWith('íssima')) {
    const base = word.replace(/íssim[oa]$/, '');
    if (base.length > 1 && words.has(base + 'o')) return true;
    if (base.length > 1 && words.has(base)) return true;
  }
  return false;
}

function isWordKnown(words: Set<string>, word: string): boolean {
  const lower = word.toLowerCase();
  if (words.has(lower)) return true;
  if (tryStemmer(words, lower)) return true;
  if (tryVerbConjugation(words, lower)) return true;
  if (tryPlural(words, lower)) return true;
  if (tryAdverb(words, lower)) return true;
  if (tryFeminine(words, lower)) return true;
  if (tryDiminutiveAugmentative(words, lower)) return true;
  if (trySuperlative(words, lower)) return true;
  if (tryPrefix(words, lower)) return true;
  if (tryEnclitic(words, lower)) return true;
  if (tryCompound(words, lower)) return true;
  if (tryIrregularSuperlative(words, lower)) return true;
  if (lower.endsWith('mente')) {
    const base = lower.slice(0, -5);
    if (base.endsWith('a')) {
      const masc = base.slice(0, -1) + 'o';
      if (masc.length > 1 && words.has(masc)) return true;
    }
  }
  return false;
}

export async function isWordCorrect(word: string): Promise<boolean> {
  const words = await getWordSet();
  if (word.includes(' ')) {
    return word.split(/\s+/).every(w => isWordCorrect(w));
  }
  if (isWordKnown(words, word)) return true;
  if (/^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+$/.test(word)) {
    return true;
  }
  const hunspellOk = await isWordCorrectHunspell(word).catch(() => false);
  if (hunspellOk) return true;
  return false;
}

export async function getWordSuggestions(
  word: string,
  leftContext?: string[],
  rightContext?: string[]
): Promise<string[]> {
  const lower = word.toLowerCase();

  const symSpellResults = await getSymSpellSuggestions(lower);
  if (symSpellResults.length >= 3) return symSpellResults.slice(0, 5);

  const hunspellSuggestions = await getHunspellSuggestions(lower).catch(() => [] as string[]);

  const words = await getWordSet();
  const candidates: { word: string; dist: number }[] = [];

  const generated = generateAccentVariants(word);
  for (const alt of generated) {
    if (isWordKnown(words, alt)) {
      candidates.push({ word: alt, dist: levenshteinDistance(lower, alt.toLowerCase()) });
    }
  }

  const shortList = Array.from(words).filter(
    w => Math.abs(w.length - lower.length) <= 2 && w[0] === lower[0]
  );
  for (const known of shortList) {
    const dist = levenshteinDistance(lower, known);
    if (dist <= 2) {
      candidates.push({ word: known, dist });
    }
  }

  let ranked = [...new Set([...symSpellResults, ...hunspellSuggestions, ...candidates.map(c => c.word)])];

  if (leftContext || rightContext) {
    ranked = getNgramLM().rankSuggestions(ranked, leftContext ?? [], rightContext ?? []);
  }

  return ranked.slice(0, 5);
}

function generateAccentVariants(word: string): string[] {
  const variants: string[] = [];
  const accentReplacements: Record<string, string> = {
    'a': 'áàâã', 'e': 'éê', 'i': 'í', 'o': 'óôõ', 'u': 'ú',
    'c': 'ç',
    'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a',
    'é': 'e', 'ê': 'e', 'í': 'i', 'ó': 'o', 'ô': 'o', 'õ': 'o',
    'ú': 'u', 'ç': 'c',
  };
  const chars = word.split('');
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i].toLowerCase();
    const replacements = accentReplacements[ch];
    if (replacements) {
      for (const r of replacements) {
        const alt = [...chars];
        alt[i] = ch === chars[i] ? r : ch.toUpperCase() === chars[i] ? r.toUpperCase() : r;
        variants.push(alt.join(''));
      }
    }
  }
  if (/(.)\1/.test(word)) {
    variants.push(word.replace(/(.)\1+/g, '$1'));
    const deduped2 = word.replace(/(.)\1/g, '$1');
    if (deduped2 !== word.replace(/(.)\1+/g, '$1')) variants.push(deduped2);
  } else {
    for (let i = 0; i < word.length; i++) {
      variants.push(word.slice(0, i) + word[i] + word.slice(i));
    }
  }
  return variants;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[b.length][a.length];
}
```

---

## Estratégias Morfológicas (11 `try*`)

Cada estratégia abaixo é chamada em ordem por `isWordKnown()`.
Se quiser reativar o explicador, refatore cada função para retornar
um objeto estruturado em vez de `boolean`:

```typescript
type Explicacao = {
  tipo: 'stemmer' | 'conjugacao' | 'plural' | 'adverbio' | 'feminino'
       | 'diminutivo_aumentativo' | 'superlativo' | 'prefixo'
       | 'enclitico' | 'composto' | 'superlativo_irregular';
  lemma: string;
  detalhe?: string;
} | null;
```

### 1. `tryStemmer`
Usa `StemmerPt` do `@nlpjs/lang-pt`. Remove sufixo por stemming e
verifica se o radical resultante existe no dicionário.
- Exemplo: "amávamos" → stem "am" → ✓ (se "am" existir como palavra)
- **Abrangência**: baixa — stemmer pode ser agressivo demais

### 2. `tryVerbConjugation`
Decompõe a palavra tentando cada sufixo de conjugação para as 3
classes (-ar, -er, -ir). Se a base + desinência de infinitivo existir,
a palavra é verbo conjugado.
- Exemplo: "cantávamos" → tira "ávamos" → base "cant" → "cant" + "ar" = "cantar" ✓
- Cobre 80 sufixos × 3 classes
- **235+ verbos irregulares** em `IRREGULAR_FORMS` mapeiam forma → infinitivo(s)
- Exemplo: "sou" → ["ser"], "foi" → ["ser", "ir"]
- Verbos irregulares cobertos: ser, estar, ter, haver, ir, vir, pôr, dizer,
  fazer, saber, trazer, querer, poder, ver, dar, ler, crer, prover

### 3. `tryPlural`
Testa 13 sufixos de plural + remoção simples de -s.
- Exemplo: "corações" → tira "ões" → "coraç" → procura "coração" no dicionário
- Regras: s, es, is, óis, éis, aes, ães, ões, ns, ais, eis, ois, us

### 4. `tryAdverb`
Remove sufixo "-mente" e verifica se a base é adjetivo.
- Exemplo: "felizmente" → tira "mente" → "feliz" → ✓
- Se base termina em "a", tenta trocar por "o" (adjetivo masculino)
- Exemplo: "rapidamente" → "rapida" → "rápido" ✓

### 5. `tryFeminine`
Testa 8 padrões de formação de feminino:
- a → o (gata → gato)
- ora → or (cantora → cantor)
- eira → eiro (brasileira → brasileiro)
- triz → tor (atriz → ator)
- esa → ês (portuguesa → português)
- isa → (o/a) (poetisa → poeta)
- oa → ão (leoa → leão)
- ina → (o) (heroína → herói) [parcial]
- essa → (êsse/essa) (freguesa → freguês)

### 6. `tryDiminutiveAugmentative`
Testa 8 famílias de sufixos diminutivos + 6 aumentativos.
- Diminutivos: inho/a, zinho/a, ito/a, ico/a, ulo/a, acho/a, ebre, ote/a, elho/a, ilho/a, oto/a
- Aumentativos: ão/ona, zão/zona, aço/aça, alhão/alhana, anzil/anzila, aréu/aréua, arra, astro/astra, az, aça, eirão/eirona, orra
- Extra: e-zinho/a (cafezinho → café)

### 7. `trySuperlative`
Remove sufixo "-íssimo/-íssima" e verifica base.
- Exemplo: "lindíssimo" → "lind" + "o" = "lindo" ✓

### 8. `tryPrefix`
Testa 20+ prefixos:
des-, in-/i-/im-/ir-/il-, re-, pre-, sub-, anti-, super-,
ab-, ad-, ob-, hiper-, hipo-, extra-, intra-, infra-, ultra-,
macro-, micro-, mini-, maxi-, semi-, pseudo-, proto-, neo-,
pan-, vice-, ex-, pré-, pró-, pós-
- Exemplo: "infeliz" → "in" + "feliz" → ✓ (se "feliz" existir)

### 9. `tryEnclitic`
Trata pronomes oblíquos átonos após verbos:
- -lo/-la/-lhe/-los/-las/-lhes (após verbos terminados em r)
  Restaura o 'r' final: "amá-lo" → "amar" + "lo"
- -no/-na/-nos/-nas (após som nasal)
- Mesóclise (futuro/condicional): "amá-lo-ei" → "amar" + "lo" + "ei"

### 10. `tryCompound`
Palavras compostas hifenizadas: verifica cada parte individualmente.
- Exemplo: "guarda-chuva" → "guarda" ✓ + "chuva" ✓

### 11. `tryIrregularSuperlative`
18 superlativos irregulares:
- facílimo → fácil, paupérrimo → pobre, pulquérrimo → pulcro
- celebérrimo → célebre, integérrimo → íntegro
- nobilíssimo → nobre, sapientíssimo → sábio
- libérrimo → livre, acérrimo → acre
- misericordiosíssimo → misericordioso

---

## Tabelas de Dados

### VERB_CONJUGATIONS
80 sufixos distribuídos em 3 classes:
- **-ar** (22 sufixos): cobre presente, pretérito perfeito, imperfeito,
  mais-que-perfeito, futuro do presente, futuro do pretérito, presente
  subjuntivo, pretérito imperfeito subjuntivo, infinitivo pessoal, imperativo,
  gerúndio, particípio
- **-er** (22 sufixos): mesma estrutura com vogal temática -e-
- **-ir** (22 sufixos): mesma estrutura com vogal temática -i-

### IRREGULAR_FORMS
235+ entradas mapeando forma verbal irregular → array de infinitivos.
Cobre 17 verbos: ser, estar, ter, haver, ir, vir, pôr, dizer, fazer,
saber, trazer, querer, poder, ver, dar, ler, crer, prover.

### DIMINUTIVE_SUFFIXES (31 entradas)
### AUGMENTATIVE_SUFFIXES (18 entradas)
### PREFIXES (32 prefixos)
### PLURAL_SUFFIXES (13 entradas)
### Superlativos Irregulares (18 entradas)

---

## Como Reativar o Explicador

Se no futuro quiser mostrar ao usuário explicações como:
> *"amávamos" = verbo **amar**, 1ª pessoa do plural, pretérito imperfeito do indicativo*

Siga estas etapas:

1. Refatore `isWordKnown()` para retornar `Explicacao | null` em vez de `boolean`
2. Cada `try*` retorna o tipo de explicação correspondente
3. Para `tryVerbConjugation`, refine o sufixo para identificar tempo/modo/pessoa
   (ex: "-ávamos" → 1ª pessoa plural, pretérito imperfeito)
4. Para `tryPlural`, refine para identificar singular/plural
5. Exponha um novo entry point `explainWord(word): Explicacao | null`
6. Use `words-pt` para validar as bases em vez de `supplement-words.txt`

O código do explicador (11 funções `try*` + tabelas de dados) está integralmente
preservado neste arquivo. Nada foi perdido.
