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
    const consecutive = countConsecutiveRepetitions(lines, lineIndex, curStart);
    const confidence = Math.min(0.7 + consecutive * 0.05, 0.95);
    return { type: 'anaphora', line: lineIndex + 1, confidence, evidence: `"${curStart}" repete-se em ${consecutive + 1} versos consecutivos` };
  }
  return null;
}

function countConsecutiveRepetitions(lines: string[], start: number, word: string): number {
  let count = 0;
  for (let i = start - 1; i >= 0; i--) {
    const first = lines[i].trim().match(/^[^\s,;:.!?]+/)?.[0] || '';
    if (first === word) count++;
    else break;
  }
  return count;
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
    ['guerra', 'paz'], ['paz', 'guerra'],
    ['rico', 'pobre'], ['pobre', 'rico'],
    ['branco', 'preto'], ['preto', 'branco'],
    ['quente', 'frio'], ['frio', 'quente'],
    ['jovem', 'velho'], ['velho', 'jovem'],
    ['nascer', 'morrer'], ['morrer', 'nascer'],
    ['início', 'fim'], ['fim', 'inicio'],
    ['abertura', 'encerramento'], ['criação', 'destruição'],
    ['construção', 'ruína'], ['ruína', 'construção'],
    ['lembrança', 'esquecimento'], ['esquecimento', 'lembranca'],
    ['presença', 'ausência'], ['ausência', 'presença'],
    ['esperança', 'desespero'], ['desespero', 'esperanca'],
    ['fé', 'dúvida'], ['dúvida', 'fé'],
    ['razão', 'emoção'], ['emoção', 'razao'],
    ['mente', 'coração'], ['coração', 'mente'],
    ['homem', 'deus'], ['deus', 'homem'],
    ['céu', 'terra'], ['terra', 'céu'],
    ['mar', 'terra'], ['terra', 'mar'],
    ['fogo', 'água'], ['água', 'fogo'],
    ['calma', 'tempestade'], ['tempestade', 'calma'],
    ['silêncio', 'barulho'], ['barulho', 'silêncio'],
    ['som', 'silêncio'], ['silêncio', 'som'],
    ['doce', 'amargo'], ['amargo', 'doce'],
    ['suave', 'áspero'], ['aspero', 'suave'],
    ['leve', 'pesado'], ['pesado', 'leve'],
    ['cheio', 'vazio'], ['vazio', 'cheio'],
    ['abundância', 'escassez'], ['escassez', 'abundancia'],
    ['ordem', 'caos'], ['caos', 'ordem'],
    ['liberdade', 'cativeiro'], ['cativeiro', 'liberdade'],
    ['riso', 'choro'], ['choro', 'riso'],
    ['sorriso', 'lágrima'], ['lagrima', 'sorriso'],
    ['ganho', 'perda'], ['perda', 'ganho'],
    ['união', 'separação'], ['separção', 'uniao'],
    ['encontro', 'despedida'], ['despedida', 'encontro'],
    ['chegada', 'partida'], ['partida', 'chegada'],
    ['sonho', 'realidade'], ['realidade', 'sonho'],
    ['ilusão', 'verdade'], ['verdade', 'ilusao'],
    ['mentira', 'verdade'], ['verdade', 'mentira'],
    ['artifício', 'natureza'], ['natureza', 'artificio'],
    ['cultura', 'natureza'], ['natureza', 'cultura'],
    ['civilização', 'barbárie'], ['barbárie', 'civilizacao'],
    ['dentro', 'fora'], ['fora', 'dentro'],
    ['antes', 'depois'], ['depois', 'antes'],
    ['saber', 'ignorância'], ['ignorância', 'saber'],
    ['ciência', 'fé'], ['fé', 'ciencia'],
    ['belo', 'feio'], ['feio', 'belo'],
    ['perfeição', 'imperfeição'], ['imperfeição', 'perfeicao'],
    ['eterno', 'efêmero'], ['efemero', 'eterno'],
    ['infinito', 'finito'], ['finito', 'infinito'],
    ['absoluto', 'relativo'], ['relativo', 'absoluto'],
    ['todo', 'parte'], ['parte', 'todo'],
    ['união', 'divisão'], ['divisao', 'uniao'],
    ['concórdia', 'discórdia'], ['discordia', 'concordia'],
    ['harmonia', 'dissonância'], ['dissonância', 'harmonia'],
    ['sim', 'não'], ['nao', 'sim'],
    ['afirmação', 'negação'], ['negacao', 'afirmacao'],
  ];
  const lower = line.toLowerCase();
  let matchCount = 0;
  let evidence = '';
  for (const [a, b] of antithesePairs) {
    if (lower.includes(a) && lower.includes(b)) {
      matchCount++;
      if (!evidence) evidence = `oposição "${a}" / "${b}"`;
    }
  }
  if (matchCount > 0) {
    const confidence = Math.min(0.7 + matchCount * 0.05, 0.95);
    return { type: 'antithese', line: lineIndex + 1, confidence, evidence: matchCount > 1 ? `${evidence} (mais ${matchCount - 1} par(es))` : evidence };
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
  const entities = 'vento|noite|morte|tempo|amor|dor|saudade|vida|alma|mar|ceu|terra|sol|lua|estrela|sombra|silêncio|escuridão|treva|abismo|aurora|destino|natureza|floresta|montanha|rio|oceano|trovão|relâmpago|primavera|outono|inverno|chuva|neblina|bruma|madrugada|entardecer|crepúsculo|horizonte|caminho|estrada|rua|cidade|casa|porta|janela|parede|muro|torre|ponte|relógio|ampulheta|balança|espada|escudo|cruz|templo|igreja|sepultura|memória|consciência|razão|loucura|esperança|desespero|saudade|solidão|tristeza|alegria|fome|sede|fome|peste|guerra|fama|glória|morte|fortuna|fé|pátria|liberdade|justiça|verdade|mentira|poesia|musa|inspiração';
  const actions = 'chora|sorri|canta|dança|grita|suspira|chama|abraca|abraça|fala|diz|geme|ri|clama|uiva|murmura|sussurra|veste|despe|anda|caminha|corre|vem|vai|pede|roga|implora|ordena|manda|chora|chora|abraça|beija|abraça|acorda|dorme|sonha|acena|chora|chora|foge|persegue|abraça|morde|devora|protege|ameaça|convida|expulsa|chama|empurra|atrai|repele|esconde|revela|sussurra|grita|acalma|provoca|ensina|aprende|esquece|lembra|nasce|morre|renasce|transforma|muda|cura|fere|mata|salva|condena|absolve|abandona|espera|parte|volta|fecha|abre|quebra|constrói|destrói|enfeita|despe|enche|vazia|acende|apaga|aquece|esfria|molha|seca|alimenta|envenena';
  const patterns = [
    new RegExp(`\\b(?:${entities})\\s+(?:${actions})\\b`, 'i'),
    new RegExp(`\\b(?:${actions})\\s+(?:o\\s+|a\\s+|os\\s+|as\\s+|se\\s+)?(?:${entities})\\b`, 'i'),
    new RegExp(`\\b(?:${entities})\\s+(?:que)\\s+(?:${actions})\\b`, 'i'),
  ];
  for (const pattern of patterns) {
    const m = line.match(pattern);
    if (m) {
      const confidence = m[0].length > 20 ? 0.8 : 0.7;
      return { type: 'prosopopeia', line: lineIndex + 1, confidence, evidence: `"${m[0].slice(0, 40)}" — atribuição de ação humana a entidade não-humana` };
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

function detectMetaphor(line: string, lineIndex: number): FigureMatch | null {
  const metaphorPatterns = [
    /\b(?:é|são|era|ser)\s+(?:um|uma|o|a)\s+[a-záàâãéèêíïóôõöúüç]+\b(?:\.|,|;|$)/i,
    /\b(?:é|são)\s+como\s+(?:um|uma)\s+[a-záàâãéèêíïóôõöúüç]+/i,
    /\b[a-záàâãéèêíïóôõöúü]+\s+de\s+(?:fogo|gelo|pedra|seda|veludo|aço|cristal|ouro|prata|chumbo|barro|vidro|neve|carvão|sangue|leite|mel|fel|veneno|ouro|prata|ferro|bronze|marfim|cera|papel|sombra|luz|treva|chama|cinza|pó|nuvem|raio|trovão|mar|rio|vento|brasa|lava|gelo|neve|fumo|espuma|areia|poeira|musgo|ferrugem)\b/i,
    /\b[a-záàâãéèêíïóôõöúüç]+\s+(?:de\s+)?[a-záàâãéèêíïóôõöúü]+\s+é\s+(?:um|uma)\s+[a-záàâãéèêíïóôõöúüç]+/i,
  ];
  for (const pattern of metaphorPatterns) {
    const m = line.match(pattern);
    if (m) {
      return { type: 'metaphor', line: lineIndex + 1, confidence: 0.6, evidence: `construção metafórica: "${m[0].trim().slice(0, 50)}"` };
    }
  }
  return null;
}

function detectMetonymy(line: string, lineIndex: number): FigureMatch | null {
  const metonymyPatterns = [
    /\bleu\s+(?:a|o|os|as)\s+(?:livro|romance|poema|obra|texto)/i,
    /\blerei\s+(?:a|o|os|as)\s+(?:poesia|obra|página|verso)/i,
    /\b(?:beber|bebi|bebe)\s+(?:um|uma|o|a)\s+(?:copo|taça|xícara|cálice|canequinha)/i,
    /\b(?:comer|comi|come)\s+(?:um|uma|o|a)\s+(?:prato|tigela|panela)/i,
    /\b(?:ouvir|ouvi|ouve)\s+(?:o|a|os|as)\s+(?:violino|piano|guitarra|flauta|bateria|som|música|sinfonia|melodia)/i,
    /\b(?:assistir|vi|ver)\s+(?:o|a|os|as)\s+(?:teatro|filme|palco|tela|novela|série|cinema)/i,
    /\b(?:cidade|país|nação|pátria)\s+(?:decidiu|declarou|anunciou|comemorou|chora|chora|chora|lamenta|reage|reagiu)/i,
    /\ba\s+(?:coroa|casa|empresa|igreja|escola|faculdade|governo|presidência|trono|altar)\s+(?:decidiu|vai|está|estava|foi)/i,
    /\b(?:caneta|pena|tinta|teclado)\s+que\s+(?:escreve|ditou|assinou|registrou)/i,
    /\b(?:mão|braço|dedo)\s+(?:que|o)\s+(?:empunha|toca|guia|conduz|escreve|pinta|modela|tece|bordou)/i,
  ];
  for (const pattern of metonymyPatterns) {
    if (pattern.test(line)) {
      return { type: 'metonymy', line: lineIndex + 1, confidence: 0.65, evidence: 'substituição por adjacência semântica (metonímia)' };
    }
  }
  return null;
}

function detectSynecdoche(line: string, lineIndex: number): FigureMatch | null {
  const patterns = [
    /\b(?:teto|telhado)\s+(?:que|para|sem|de|em)\b.*\b(?:casa|lar|morada)/i,
    /\b(?:vela|mastro|remo|leme)\b.*\b(?:barco|navio|embarcação|bote)/i,
    /\b(?:asa|pena|pluma)\b.*\b(?:pássaro|ave|gaivota|andorinha)/i,
    /\b(?:lâmina|fio|gume|aço)\b.*\b(?:espada|faca|punhal|cutelo)/i,
    /\b(?:cabeça|mente|cérebro)\s+(?:que|o)\s+(?:pensa|planeja|cria|idealiza|concebe)/i,
    /\b(?:olho|olhos|vista|visão)\s+(?:que|o)\s+(?:vê|viu|observa|contempla|percebe|enxerga)/i,
    /\b(?:coração|peito|alma)\s+(?:que|o)\s+(?:sente|ama|dói|chora|alegra|pulsa|bate|palpita)/i,
    /\b(?:boca|lábios|voz|garganta)\s+(?:que|o)\s+(?:fala|canta|grita|sussurra|diz|clama)/i,
    /\b(?:pé|perna|passo|pegada)\s+(?:que|o)\s+(?:anda|caminha|vai|vem|segue|percorre|trilha)/i,
  ];
  for (const pattern of patterns) {
    if (pattern.test(line)) {
      return { type: 'synecdoche', line: lineIndex + 1, confidence: 0.6, evidence: 'parte representando o todo (sinédoque)' };
    }
  }
  return null;
}

function detectEllipsis(lines: string[], lineIndex: number): FigureMatch | null {
  if (lineIndex === 0) return null;
  const currParts = lines[lineIndex].trim().split(/[,;:—–\s]+/).filter(Boolean);
  const prevEnd = lines[lineIndex - 1].trimEnd();
  const currStart = lines[lineIndex].trimStart();

  const ellipsisCues = [
    prevEnd.endsWith(',') && !currStart.match(/^(?:e|mas|ou|pois|que)/i),
    prevEnd.endsWith(':') && currStart.match(/^[a-zà-ú]/) && !currStart.match(/^[A-ZÀ-Ú]/),
    currParts.length <= 2 && currParts[0] && /^[a-zà-ú]/.test(currParts[0]) && !currStart.match(/^(?:e|mas|ou|pois)/i),
  ];

  const cueCount = ellipsisCues.filter(Boolean).length;
  if (cueCount >= 2) {
    return { type: 'ellipsis', line: lineIndex + 1, confidence: 0.5, evidence: 'possível elipse — verso sintaticamente dependente do anterior' };
  }
  return null;
}

function detectPleonasm(line: string, lineIndex: number): FigureMatch | null {
  const pleonasmPatterns = [
    /\b(?:vi\s+com\s+os\s+próprios|vi\s+com\s+meus)\s+olhos\b/i,
    /\b(?:ouvi\s+com\s+os\s+próprios|ouvi\s+com\s+meus)\s+ouvidos\b/i,
    /\bsubir\s+(?:para\s+)?(?:cima|acima)\b/i,
    /\bdescer\s+(?:para\s+)?(?:baixo|abaixo)\b/i,
    /\bentrar\s+(?:para\s+)?(?:dentro|adentro)\b/i,
    /\bsair\s+(?:para\s+)?(?:fora|afora)\b/i,
    /\b(?:repetir|repete|repetiu)\s+(?:de\s+)?novo\b/i,
    /\b(?:monopólio|exclusivo)\s+(?:exclusivo|único)\b/i,
    /\b(?:elo\s+de\s+ligação|ligação)\b/i,
    /\b(?:certeza|certeza)\s+absoluta\b/i,
    /\b(?:multidão|multidao)\s+de\s+pessoas\b/i,
    /\b(?:hemorragia)\s+de\s+sangue\b/i,
    /\b(?:riso)\s+(?:sarcástico|ironico)\s+de\s+(?:rir|zombaria)\b/i,
    /\b(?:gritar|gritei|grita)\s+(?:alto|bem\s+alto)\b/i,
    /\b(?:sorrir|sorri)\s+(?:com\s+)?(?:um\s+)?sorriso\b/i,
  ];
  for (const pattern of pleonasmPatterns) {
    const m = line.match(pattern);
    if (m) {
      return { type: 'pleonasm', line: lineIndex + 1, confidence: 0.8, evidence: `redundância enfática: "${m[0].trim()}"` };
    }
  }
  return null;
}

function detectPolysyndeton(line: string, lineIndex: number): FigureMatch | null {
  const conjCount = (line.match(/\be\b/gi) || []).length;
  const eCluster = line.match(/(\be\b\s+){2,}/i);
  if (conjCount >= 3 && eCluster) {
    return { type: 'polysyndeton', line: lineIndex + 1, confidence: 0.8, evidence: `${conjCount} ocorrências de "e" — polissíndeto` };
  }
  const ouCount = (line.match(/\bou\b/gi) || []).length;
  if (ouCount >= 3) {
    return { type: 'polysyndeton', line: lineIndex + 1, confidence: 0.8, evidence: `${ouCount} ocorrências de "ou" — polissíndeto` };
  }
  return null;
}

function detectAsyndeton(line: string, lineIndex: number): FigureMatch | null {
  const words = line.replace(/[,;:—–]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length < 4) return null;
  const commaGroups = line.match(/[a-záàâãéèêíïóôõöúüç]+\s*,\s*[a-záàâãéèêíïóôõöúüç]+/gi);
  if (commaGroups && commaGroups.length >= 3) {
    const hasE = /\be\b/i.test(line);
    if (!hasE) {
      return { type: 'asyndeton', line: lineIndex + 1, confidence: 0.7, evidence: `${commaGroups.length + 1} termos justapostos sem conjunção — assíndeto` };
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
  (lines, i) => detectMetaphor(lines[i], i),
  (lines, i) => detectMetonymy(lines[i], i),
  (lines, i) => detectSynecdoche(lines[i], i),
  (lines, i) => detectEllipsis(lines, i),
  (lines, i) => detectPleonasm(lines[i], i),
  (lines, i) => detectPolysyndeton(lines[i], i),
  (lines, i) => detectAsyndeton(lines[i], i),
];
