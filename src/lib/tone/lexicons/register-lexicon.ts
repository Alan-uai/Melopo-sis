export const FORMAL_MARKERS = new Set([
  'portanto', 'entretanto', 'todavia', 'contudo', 'outrossim',
  'ademais', 'outrem', 'alhures', 'doravante',
  'outrora', 'sobejo', 'escopro', 'lusco-fusco', 'alva',
  'conquanto', 'destarte', 'dessarte', 'sobreditos',
  'supracitado', 'sobredito', 'epígrafe', 'epigrafe',
  'consoante', 'mormente', 'sobremaneira',
  'vossemecê', 'vossa', 'vosso', 'vossos',
  'merce', 'imperioso', 'imprescindível', 'imprescindivel',
  'notório', 'notoria', 'consubstanciado', 'consubstanciada',
  'hodierno', 'hodierna', 'litúrgico', 'liturgico',
  'sacrossanto', 'sacrossanta',
]);

export const INFORMAL_MARKERS = new Set([
  'tá', 'pra', 'pro', 'cê', 'né', 'tô', 'vô', 'tava',
  'numa', 'duma', 'mode', 'cuma', 'daí', 'dai',
  'aí', 'ai', 'ih', 'ah', 'ué', 'poxa',
  'mermo', 'trem', 'bão', 'sô', 'sôr',
  'beleza', 'brother', 'mana', 'miga', 'migo',
  'tipo', 'tlgd', 'se liga', 'vacilou', 'vacilo',
  'trampo', 'parada', 'nego', 'minina', 'mininu',
  'caba', 'muié', 'home', 'fessô', 'fessora',
  'oxente', 'visse', 'óia', 'ói', 'uai', 'eita',
  'nóis', 'nois', 'ocê', 'oces', 'cês', 'ces',
]);

export function classifyRegister(token: string): 'formal' | 'informal' | null {
  const lower = token.toLowerCase();
  if (FORMAL_MARKERS.has(lower)) return 'formal';
  if (INFORMAL_MARKERS.has(lower)) return 'informal';
  return null;
}
