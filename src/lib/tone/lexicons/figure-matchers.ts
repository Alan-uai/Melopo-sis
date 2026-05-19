export interface FigureMatch {
  type: string;
  line: number;
  confidence: number;
  evidence: string;
}

function detectAnaphora(lines: string[], lineIndex: number): FigureMatch | null {
  if (lineIndex === 0 || lines.length < 2) return null;
  const current = lines[lineIndex].trim();
  const prev = lines[lineIndex - 1].trim();
  if (!current || !prev) return null;
  const curStart = current.match(/^[^\s,;:.!?]+/)?.[0] || '';
  const prevStart = prev.match(/^[^\s,;:.!?]+/)?.[0] || '';
  if (curStart && curStart === prevStart && curStart.length > 1) {
    return { type: 'anaphora', line: lineIndex + 1, confidence: 0.7, evidence: `"${curStart}" repete início do verso anterior` };
  }
  return null;
}

function detectAntithese(line: string, lineIndex: number): FigureMatch | null {
  const antithesePairs = [
    ['vida', 'morte'], ['amor', 'ódio'], ['ódio', 'amor'],
    ['luz', 'treva'], ['luz', 'sombra'], ['dia', 'noite'],
    ['céu', 'inferno'], ['inferno', 'céu'],
    ['passado', 'presente'], ['presente', 'passado'],
    ['passado', 'futuro'], ['futuro', 'passado'],
    ['alegria', 'tristeza'], ['tristeza', 'alegria'],
    ['carne', 'espírito'], ['espirito', 'carne'],
    ['corpo', 'alma'], ['alma', 'corpo'],
    ['prazer', 'dor'], ['dor', 'prazer'],
    ['belo', 'hediondo'], ['hediondo', 'belo'],
    ['sagrado', 'profano'], ['profano', 'sagrado'],
    ['anjo', 'demônio'], ['demonio', 'anjo'],
  ];
  const lower = line.toLowerCase();
  for (const [a, b] of antithesePairs) {
    if (lower.includes(a) && lower.includes(b)) {
      return { type: 'antithese', line: lineIndex + 1, confidence: 0.8, evidence: `oposição "${a}" / "${b}"` };
    }
  }
  return null;
}

function detectApostrophe(line: string, lineIndex: number): FigureMatch | null {
  if (/^(?:Ó|Oh|Ah)\s+[A-ZÀ-Ú]/.test(line.trim())) {
    return { type: 'apostrophe', line: lineIndex + 1, confidence: 0.9, evidence: 'invocação direta' };
  }
  return null;
}

function detectProsopopeia(line: string, lineIndex: number): FigureMatch | null {
  const patterns = [
    /\b(?:vento|noite|morte|tempo|amor|dor|saudade|vida|alma|mar|ceu|terra|sol|lua|estrela|sombra|silêncio|escuridão|treva|abismo)\s+(?:chora|sorri|canta|dança|grita|suspira|chama|abraca|abraça|fala|diz|chora|geme|ri|chora|clama|uiva|murmura|sussurra|veste|despe|anda|caminha|corre|voo|vem|vai|tem|quere|pede|roga|clama|implora|ordena|manda)/i,
    /\b(?:chora|sorri|canta|dança|grita|suspira|fala|diz|geme|ri|uiva|murmura|sussurra|veste|anda|caminha|corre|pede|roga|clama|implora|ordena)\s+(?:o\s+)?(?:vento|noite|morte|tempo|amor|dor|saudade|vida|alma|mar|ceu|terra|sol|lua|estrela|sombra|silêncio|escuridão|treva|abismo)/i,
  ];
  for (const pattern of patterns) {
    if (pattern.test(line)) {
      return { type: 'prosopopeia', line: lineIndex + 1, confidence: 0.7, evidence: 'atribuição de ação humana a entidade não-humana' };
    }
  }
  return null;
}

function detectSynesthesia(line: string, lineIndex: number): FigureMatch | null {
  const patterns = [
    /\b(?:sabor|gosto|cheiro|aroma|odor|perfume)\s+(?:de\s+)?(?:azul|verde|amarelo|vermelho|roxo|branco|preto|cinza|escuro|claro|luz|sombra|silêncio|som|ruído|barulho)/i,
    /\b(?:som|ruído|barulho|silêncio|voz|canto)\s+(?:de\s+)?(?:azul|verde|vermelho|branco|preto|cinza|doce|amargo|ácido|suave|áspero|rugoso|liso)/i,
    /\b(?:luz|cor|brilho|clarão|sombra|escuro)\s+(?:doce|amargo|áspero|suave|quente|frio|morno)/i,
    /\b(?:toque|textura|pele|carne)\s+(?:de\s+)?(?:luz|sombra|silêncio|som|dor|prazer)/i,
  ];
  for (const pattern of patterns) {
    if (pattern.test(line)) {
      return { type: 'synesthesia', line: lineIndex + 1, confidence: 0.8, evidence: 'cruzamento de sentidos' };
    }
  }
  return null;
}

function detectComparison(line: string, lineIndex: number): FigureMatch | null {
  if (/\b(?:como|qual|feito|tal\s+qual|que\s+nem|mais\s+que|menos\s+que|tão\s+quanto|tão\s+como)\s/i.test(line)) {
    return { type: 'comparison', line: lineIndex + 1, confidence: 0.6, evidence: 'comparação explícita' };
  }
  return null;
}

function detectHyperbato(line: string, lineIndex: number): FigureMatch | null {
  const words = line.replace(/[,\-;:!?()]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length < 4) return null;
  const orderScore = words.reduce((acc, w, i) => {
    if (i < words.length - 2) {
      if (/^(?:em|no|na|de|da|do|por|para|com|sem|sob|entre)$/i.test(w)) {
        const next = words[i + 1];
        const next2 = words[i + 2] || '';
        if (/^(?:artigo|o|a|os|as|um|uma|uns|umas)$/i.test(next) &&
            /^[A-ZÀ-Ú][a-zà-ú]+$/.test(next2)) {
          return acc + 1;
        }
      }
    }
    return acc;
  }, 0);

  if (orderScore >= 1) {
    const verbAtEnd = /[^,;:!?]*\s(?:ser|estar|ter|haver|fazer|dizer|poder|saber|querer|vir|ir)\s*$|^[^,;:!?]+\s(?:ser|estar|ter|haver|fazer|dizer|poder|saber|querer|vir|ir)\s+[^,;:!?]*$/i;
    if (verbAtEnd.test(line)) {
      return { type: 'hyperbato', line: lineIndex + 1, confidence: 0.5, evidence: 'possível inversão sintática' };
    }
  }
  return null;
}

function detectParadox(line: string, lineIndex: number): FigureMatch | null {
  const paradoxPatterns = [
    /\b(?:vida\s+que\s+morre|morte\s+que\s+vive|morto\s+vivo|vivo\s+morto)\b/i,
    /\b(?:luz\s+escura|escura\s+luz|treva\s+clara|clara\s+treva)\b/i,
    /\b(?:silêncio\s+que\s+grita|grito\s+silencioso|silêncio\s+som)\b/i,
    /\b(?:amargo\s+doce|doce\s+amargo)\b/i,
    /\b(?:dor\s+que\s+alegra|alegria\s+que\s+dói|dor\s+prazenteira|prazer\s+doloroso)\b/i,
    /\b(?:frio\s+que\s+queima|fogo\s+que\s+gela|gelo\s+que\s+arde)\b/i,
    /\b(?:ausente\s+presença|presença\s+ausente|ausência\s+presente|presente\s+ausência)\b/i,
    /\b(?:cego\s+que\s+vê|surdo\s+que\s+ouve|mudo\s+que\s+fala)\b/i,
    /\b(?:não\s+ser|ser\s+e\s+não\s+ser|ser\s+o\s+nada|nada\s+ser)\b/i,
  ];
  for (const pattern of paradoxPatterns) {
    if (pattern.test(line)) {
      return { type: 'paradox', line: lineIndex + 1, confidence: 0.85, evidence: 'afirmação contraditória' };
    }
  }
  return null;
}

export const FIGURE_DETECTORS: Array<(lines: string[], lineIndex: number) => FigureMatch | null> = [
  (lines, i) => detectAnaphora(lines, i),
  (lines, i) => detectAntithese(lines[i], i),
  (lines, i) => detectApostrophe(lines[i], i),
  (lines, i) => detectProsopopeia(lines[i], i),
  (lines, i) => detectSynesthesia(lines[i], i),
  (lines, i) => detectComparison(lines[i], i),
  (lines, i) => detectHyperbato(lines[i], i),
  (lines, i) => detectParadox(lines[i], i),
];
