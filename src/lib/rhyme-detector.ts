export interface RhymeAnalysis {
  scheme: string;
  matches: RhymeMatch[];
  errors: RhymeError[];
  stanzaSchemes: string[];
  dominantScheme: string;
  schemeName: string;
  consistency: number;
  rhymeRatio: number;
  hasEcho: boolean;
  clichePairs: number;
}

export interface RhymeMatch {
  lineA: number;
  lineB: number;
  rhymeGroup: string;
  perfect: boolean;
}

export interface RhymeError {
  lineA: number;
  lineB: number;
  expectedRhyme: string;
  actualEndingA: string;
  actualEndingB: string;
  message: string;
}

const KNOWN_SCHEMES: Record<string, string> = {
  'ABBAABBACDCDCD': 'soneto italiano (ABBA ABBA CDC DCD)',
  'ABBAABBACDECDE': 'soneto italiano (ABBA ABBA CDE CDE)',
  'ABBAABBACDCCDC': 'soneto italiano (ABBA ABBA CDC CDC)',
  'ABABCDCDEFEFGG': 'soneto inglês (ABAB CDCD EFEF GG)',
};

const CLICHE_RHYME_PAIRS = new Set([
  'amor,calor', 'amor,clamor', 'amor,dor', 'amor,flor', 'amor,fulgor',
  'amor,sabor', 'amor,temor',
  'calor,amor', 'calor,flor', 'calor,dor',
  'caminho,carinho', 'caminho,destino', 'caminho,menino', 'caminho,ninho',
  'caminho,sozinho',
  'cantar,mar',
  'carinho,caminho',
  'canto,pranto',
  'céu,fiel', 'céu,mel', 'céu,papel', 'céu,véu',
  'chão,coração',
  'cidade,saudade',
  'clamor,amor',
  'coice,noite',
  'consorte,morte',
  'coração,chão', 'coração,emoção', 'coração,ilusão', 'coração,mão',
  'coração,paixão', 'coração,razão', 'coração,solidão',
  'cruz,luz',
  'deduz,luz',
  'destino,caminho', 'destino,divino', 'destino,fino', 'destino,menino',
  'dia,alegria', 'dia,fantasia', 'dia,mania', 'dia,poesia',
  'divino,destino',
  'dom,som',
  'dor,amor', 'dor,calor', 'dor,flor', 'dor,sabor',
  'emoção,coração', 'emoção,paixão',
  'eram,eram',
  'esquecida,vida',
  'estar,mar',
  'estrela,bela', 'estrela,donzela', 'estrela,janela',
  'fantasia,dia',
  'farol,sol',
  'fecondo,mundo',
  'ferida,vida',
  'fiel,céu',
  'fino,destino',
  'flor,amor', 'flor,calor', 'flor,dor', 'flor,palor', 'flor,sabor',
  'foice,noite',
  'forte,morte',
  'franqueza,tristeza',
  'fulgor,amor',
  'girassol,sol',
  'idade,saudade',
  'ilusão,coração', 'ilusão,paixão', 'ilusão,solidão',
  'janela,estrela',
  'lágrima,máxima', 'lágrima,pálida', 'lágrima,última',
  'lamento,sentimento', 'lamento,sofrimento', 'lamento,vento',
  'lençol,sol',
  'lento,tempo',
  'liberdade,saudade',
  'linho,caminho',
  'lua,nua', 'lua,rua', 'lua,sua', 'lua,tua',
  'luz,cruz', 'luz,deduz', 'luz,produz',
  'mania,dia',
  'manto,pranto',
  'mar,amar', 'mar,cantar', 'mar,estar', 'mar,olhar',
  'máxima,lágrima',
  'medida,vida',
  'mel,céu',
  'menino,destino',
  'momento,sentimento', 'momento,sofrimento', 'momento,tempo', 'momento,vento',
  'morte,consorte', 'morte,forte', 'morte,porte', 'morte,sorte',
  'mão,paixão', 'mão,chão',
  'mundo,fecondo', 'mundo,profundo', 'mundo,segundo',
  'natureza,tristeza',
  'ninho,caminho',
  'noite,coice', 'noite,foice',
  'nua,lua',
  'olhar,mar',
  'paixão,coração', 'paixão,emoção', 'paixão,ilusão', 'paixão,mão',
  'paixão,razão', 'paixão,visão',
  'palor,flor',
  'pálida,lágrima',
  'papel,céu',
  'partida,vida',
  'pobreza,tristeza',
  'poesia,dia',
  'porte,morte',
  'pranto,canto', 'pranto,manto', 'pranto,quanto',
  'produz,luz',
  'profundo,mundo',
  'quanto,pranto',
  'querida,vida',
  'razão,coração', 'razão,paixão', 'razão,solidão',
  'relento,tempo',
  'rol,sol',
  'rua,lua',
  'sabor,amor', 'sabor,flor', 'sabor,dor',
  'saudade,cidade', 'saudade,idade', 'saudade,liberdade', 'saudade,vontade',
  'segundo,mundo',
  'sentimento,lamento', 'sentimento,momento', 'sentimento,vento',
  'sofrimento,lamento', 'sofrimento,momento', 'sofrimento,tormento', 'sofrimento,vento',
  'solidão,coração', 'solidão,ilusão', 'solidão,manhã', 'solidão,razão',
  'sol,farol', 'sol,girassol', 'sol,amol', 'sol,lençol', 'sol,rol',
  'sorte,morte',
  'sozinho,caminho',
  'temor,amor',
  'tempo,lento', 'tempo,momento', 'tempo,relento', 'tempo,vento',
  'ternura,ventura',
  'tom,som',
  'tormento,sofrimento',
  'tristeza,certeza', 'tristeza,franqueza', 'tristeza,natureza', 'tristeza,pobreza',
  'tua,lua',
  'última,lágrima',
  'véu,céu',
  'vento,lamento', 'vento,momento', 'vento,sentimento', 'vento,sofrimento', 'vento,tempo',
  'ventura,ternura',
  'vida,esquecida', 'vida,ferida', 'vida,medida', 'vida,partida', 'vida,querida',
  'visão,paixão',
  'vontade,saudade',
  'amol,sol',
  'bela,estrela',
  'batom,som',
  'donzela,estrela',
  'alegria,dia',
  'amar,mar',
]);

function getRhymeEnding(word: string): string {
  const lower = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (/[aeiou]([aeiou]m)$/.test(lower)) return lower.slice(-3);

  if (/[aeiou][ns]$/.test(lower)) return lower.slice(-2);

  const tonicMatch = lower.match(/([aeiou][^aeiou]*)$/);
  if (tonicMatch) return tonicMatch[1];

  return lower.slice(-3);
}

export function extractLastWord(line: string): string {
  const clean = line.replace(/[^\wáàâãéèêíïóôõöúçñü\s-]/gi, '').trim();
  const words = clean.split(/[\s-]+/);
  return words[words.length - 1] || '';
}

export function analyzeRhymeScheme(text: string): RhymeAnalysis {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) {
    return { scheme: '', matches: [], errors: [], stanzaSchemes: [], dominantScheme: '', schemeName: '', consistency: 0, rhymeRatio: 0, hasEcho: false, clichePairs: 0 };
  }

  const lastWords = lines.map(extractLastWord);
  const endings = lastWords.map(w => getRhymeEnding(w));

  const assignedLetters: string[] = [];
  const endingToLetter: Record<string, string> = {};
  let nextLetter = 'A';

  for (const ending of endings) {
    if (!ending) {
      assignedLetters.push('');
      continue;
    }
    if (endingToLetter[ending]) {
      assignedLetters.push(endingToLetter[ending]);
    } else {
      const letter = nextLetter;
      endingToLetter[ending] = letter;
      assignedLetters.push(letter);
      nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
    }
  }

  const scheme = assignedLetters.join('');

  const matches: RhymeMatch[] = [];
  const letterGroups: Record<string, number[]> = {};
  for (let i = 0; i < assignedLetters.length; i++) {
    const l = assignedLetters[i];
    if (!l) continue;
    if (!letterGroups[l]) letterGroups[l] = [];
    letterGroups[l].push(i);
  }

  for (const [, indices] of Object.entries(letterGroups)) {
    if (indices.length >= 2) {
      for (let i = 0; i < indices.length; i++) {
        for (let j = i + 1; j < indices.length; j++) {
          const endingA = endings[indices[i]];
          const endingB = endings[indices[j]];
          matches.push({
            lineA: indices[i] + 1,
            lineB: indices[j] + 1,
            rhymeGroup: assignedLetters[indices[i]],
            perfect: endingA === endingB,
          });
        }
      }
    }
  }

  const stanzas = splitIntoStanzas(text);
  const stanzaSchemes: string[] = [];
  const errors: RhymeError[] = [];

  let globalLineOffset = 0;
  for (const stanza of stanzas) {
    if (stanza.length < 2) {
      globalLineOffset += stanza.length;
      continue;
    }

    const stanzaWords = stanza.map(extractLastWord);
    const stanzaEndings = stanzaWords.map(w => getRhymeEnding(w));
    const stanzaLetters: string[] = [];
    const stanzaEndingToLetter: Record<string, string> = {};
    let stanzaLetter = 'A';

    for (const ending of stanzaEndings) {
      if (!ending) { stanzaLetters.push(''); continue; }
      if (stanzaEndingToLetter[ending]) {
        stanzaLetters.push(stanzaEndingToLetter[ending]);
      } else {
        const l = stanzaLetter;
        stanzaEndingToLetter[ending] = l;
        stanzaLetters.push(l);
        stanzaLetter = String.fromCharCode(l.charCodeAt(0) + 1);
      }
    }
    stanzaSchemes.push(stanzaLetters.join(''));
    globalLineOffset += stanza.length;
  }

  const { dominantScheme, schemeName } = detectDominantScheme(assignedLetters, stanzas, text);
  const consistency = computeConsistency(stanzaSchemes);
  const rhymeRatio = computeRhymeRatio(assignedLetters);
  const hasEcho = detectEcho(lastWords);
  const clichePairs = countClichePairs(matches, lastWords);

  return { scheme, matches, errors, stanzaSchemes, dominantScheme, schemeName, consistency, rhymeRatio, hasEcho, clichePairs };
}

function detectDominantScheme(
  assignedLetters: string[],
  stanzas: string[][],
  text: string
): { dominantScheme: string; schemeName: string } {
  const fullScheme = assignedLetters.join('');

  if (fullScheme.length === 14) {
    for (const [pattern, name] of Object.entries(KNOWN_SCHEMES)) {
      if (fullScheme.startsWith(pattern)) {
        return { dominantScheme: pattern, schemeName: name };
      }
    }
  }

  if (fullScheme.length === 14) {
    const first4 = fullScheme.slice(0, 4);
    const second4 = fullScheme.slice(4, 8);
    const last6 = fullScheme.slice(8);

    if (first4.length === 4 && second4.length === 4) {
      const f1 = first4[0], f2 = first4[1], f3 = first4[2], f4 = first4[3];
      const s1 = second4[0], s2 = second4[1], s3 = second4[2], s4 = second4[3];

      if (f1 === f4 && f2 === f3 && s1 === f1 && s2 === f2 && s4 === f4) {
        return { dominantScheme: 'ABBA ABBA', schemeName: 'soneto italiano (quartetos ABBA ABBA)' };
      }
      if (f1 === f3 && f2 === f4 && s1 === f1 && s2 === f2 && s3 === f1 && s4 === f2) {
        return { dominantScheme: 'ABAB ABAB', schemeName: 'soneto inglês (quartetos ABAB ABAB)' };
      }
    }
  }

  if (stanzas.length > 0) {
    const firstScheme = analyzeStanzaScheme(stanzas[0]);
    if (firstScheme) {
      const allSame = stanzas.every(s => analyzeStanzaScheme(s) === firstScheme);
      if (allSame) {
        return { dominantScheme: firstScheme, schemeName: getSchemeName(firstScheme) };
      }
    }

    const schemeCounts: Record<string, number> = {};
    for (const stanza of stanzas) {
      const s = analyzeStanzaScheme(stanza);
      if (s) schemeCounts[s] = (schemeCounts[s] || 0) + 1;
    }

    let bestScheme = '';
    let bestCount = 0;
    for (const [s, c] of Object.entries(schemeCounts)) {
      if (c > bestCount) { bestCount = c; bestScheme = s; }
    }
    if (bestScheme) {
      const stanzasCount = Math.max(Math.floor(stanzas.length * 0.5), 1);
      if (bestCount >= stanzasCount) {
        return { dominantScheme: bestScheme, schemeName: getSchemeName(bestScheme) + ` (predominante em ${bestCount}/${stanzas.length} estrofes)` };
      }
    }
  }

  return { dominantScheme: 'free', schemeName: 'verso livre com rima ocasional' };
}

function analyzeStanzaScheme(stanza: string[]): string | null {
  if (stanza.length < 2) return null;
  const words = stanza.map(extractLastWord).filter(w => w.length > 0);
  if (words.length < 2) return null;

  const endings = words.map(w => getRhymeEnding(w));
  if (!endings.some(e => e)) return null;

  const letters: string[] = [];
  const endingToLetter: Record<string, string> = {};
  let next = 'A';
  for (const ending of endings) {
    if (!ending) { letters.push(''); continue; }
    if (endingToLetter[ending]) {
      letters.push(endingToLetter[ending]);
    } else {
      endingToLetter[ending] = next;
      letters.push(next);
      next = String.fromCharCode(next.charCodeAt(0) + 1);
    }
  }
  return letters.join('');
}

function getSchemeName(scheme: string): string {
  if (scheme === 'ABAB') return 'rima alternada (ABAB)';
  if (scheme === 'AABB') return 'rima emparelhada (AABB)';
  if (scheme === 'ABBA') return 'rima interpolada (ABBA)';
  if (scheme === 'ABCB') return 'rima de balada (ABCB)';
  if (/^A(.)C\1D\1$/.test(scheme) && scheme.length === 6) return 'sextilha de cordel';
  return `esquema ${scheme}`;
}

function computeConsistency(stanzaSchemes: string[]): number {
  if (stanzaSchemes.length <= 1) return 1;
  const counts: Record<string, number> = {};
  for (const s of stanzaSchemes) {
    counts[s] = (counts[s] || 0) + 1;
  }
  const maxCount = Math.max(...Object.values(counts));
  return maxCount / stanzaSchemes.length;
}

function computeRhymeRatio(assignedLetters: string[]): number {
  const unique = new Set(assignedLetters.filter(l => l));
  const nonRhyming = assignedLetters.filter(l => {
    const count = assignedLetters.filter(x => x === l).length;
    return count === 1;
  });
  return assignedLetters.length > 0 ? 1 - nonRhyming.length / assignedLetters.length : 0;
}

function detectEcho(lastWords: string[]): boolean {
  for (let i = 0; i < lastWords.length; i++) {
    for (let j = i + 1; j < lastWords.length; j++) {
      if (lastWords[i] && lastWords[j] && lastWords[i].toLowerCase() === lastWords[j].toLowerCase()) {
        return true;
      }
    }
  }
  return false;
}

function countClichePairs(matches: RhymeMatch[], lastWords: string[]): number {
  let count = 0;
  for (const match of matches) {
    const wordA = (lastWords[match.lineA - 1] || '').toLowerCase();
    const wordB = (lastWords[match.lineB - 1] || '').toLowerCase();
    const pair = `${wordA},${wordB}`;
    if (CLICHE_RHYME_PAIRS.has(pair)) count++;
  }
  return count;
}

function splitIntoStanzas(text: string): string[][] {
  const blocks = text.split(/\n\s*\n/);
  return blocks
    .map(b => b.split('\n').filter(l => l.trim()))
    .filter(s => s.length > 0);
}

export function detectRhymeErrors(text: string, expectedScheme?: string): RhymeError[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const lastWords = lines.map(extractLastWord);
  const endings = lastWords.map(w => getRhymeEnding(w));

  const errors: RhymeError[] = [];

  const stanzas = splitIntoStanzas(text);
  let lineNum = 1;
  for (const stanza of stanzas) {
    if (stanza.length >= 2) {
      const scheme = expectedScheme || 'alternating';
      const stanzaEndings = stanza.map((_, i) => endings[lineNum - 1 + i]);

      if (scheme === 'alternating' || scheme === 'ABAB') {
        for (let i = 0; i < stanzaEndings.length - 2; i += 2) {
          if (stanzaEndings[i] && stanzaEndings[i + 2] && stanzaEndings[i] !== stanzaEndings[i + 2]) {
            errors.push({
              lineA: lineNum + i,
              lineB: lineNum + i + 2,
              expectedRhyme: stanzaEndings[i],
              actualEndingA: stanzaEndings[i],
              actualEndingB: stanzaEndings[i + 2],
              message: `O verso ${lineNum + i + 2} deveria rimar com o verso ${lineNum + i + 1} (esquema esperado: ${stanzaEndings[i]}).`,
            });
          }
        }
      }
    }
    lineNum += stanza.length;
  }

  return errors;
}

export function getRhymeEndingForValidation(word: string): string {
  const lower = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/[aeiou]([aeiou]m)$/.test(lower)) return lower.slice(-3);
  if (/[aeiou][ns]$/.test(lower)) return lower.slice(-2);
  const tonicMatch = lower.match(/([aeiou][^aeiou]*)$/);
  if (tonicMatch) return tonicMatch[1];
  return lower.slice(-3);
}
