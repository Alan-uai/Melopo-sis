import { tokenize } from '@/lib/tokenize';

interface PairError {
  word: string;
  position: number;
  expected: string;
  message: string;
}

interface PairRule {
  matchWord: (word: string) => boolean;
  contextCheck: (tokens: { word: string; position: number }[], i: number) => boolean;
  expected: string;
  message: string;
}

const PAIRS: PairRule[] = [
  // "mais" used as adversative conjunction (before comma or after period)
  {
    matchWord: (w) => /^mais$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0) return true;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      return prev === ',' || prev === '.' || prev === ';' || prev === ':';
    },
    expected: 'mas',
    message: '"mas" (conjunção adversativa) no lugar de "mais" (quantidade)',
  },
  // "mau" before adjective/participle → should be "mal"
  {
    matchWord: (w) => /^mau$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      return /^(aluno|exemplo|humor|gosto|caráter|elemento|resultado|entendido|visto|feito|dito|falado|pensado|comportado|educado|criado|intencionado|cheiro|hábito|comportamento)$/i.test(next || '');
    },
    expected: 'mal',
    message: '"mal" (advérbio) antes de adjetivo/particípio — não "mau" (adjetivo)',
  },
  // "mal" after ser/estar → should be "mau"
  {
    matchWord: (w) => /^mal$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      return /^(é|foi|era|será|seria|seja|fosse|sendo|sou|somos|são|estou|está|estamos|estão|estava|estive|esteve|estivesse|ficou|ficará|permanece|parece|tornou)$/i.test(prev || '');
    },
    expected: 'mau',
    message: '"mau" (adjetivo) após verbo ser/estar — não "mal" (advérbio)',
  },
  // "a" for time elapsed → should be "há"
  {
    matchWord: (w) => /^a$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      return /^(dois|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|catorze|quinze|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|mil|muito|pouco|alguns|algumas|muitos|muitas|bastante|anos|meses|dias|séculos|minutos|horas)$/i.test(next || '');
    },
    expected: 'há',
    message: '"há" (verbo haver = tempo decorrido) no lugar de "a" (preposição)',
  },
  // "porque" in questions → should be "por que"
  {
    matchWord: (w) => /^porque$/i.test(w),
    contextCheck: (_tokens, i) => {
      const next = _tokens[i + 1]?.word;
      if (next && (next.endsWith('?') || next.endsWith('!'))) return true;
      return false;
    },
    expected: 'por que',
    message: '"por que" (pergunta direta) no lugar de "porque" (afirmação)',
  },
  // "onde" with movement verb → should be "aonde"
  {
    matchWord: (w) => /^onde$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      return /^(ir|vou|vai|foi|indo|irei|iria|fui|vamos|vão|ia|íamos|foram|vá|vão)$/i.test(prev || '');
    },
    expected: 'aonde',
    message: '"aonde" (movimento/destino) no lugar de "onde" (localização estática)',
  },
  // "senão" (otherwise) vs "se não" (if not)
  {
    matchWord: (w) => /^senão$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      if (prev === 'se' || prev === ',' || prev === ';') return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (next && /^(não|ter|haver|fazer)$/i.test(next)) return false;
      return true;
    },
    expected: 'se não',
    message: '"se não" (condição + negação) no lugar de "senão" (caso contrário / exceto)',
  },
  // "se não" (if not) written as one when it should be two
  {
    matchWord: (w) => /^s(e|é)\s*não$/i.test(w),
    contextCheck: (tokens, i) => {
      return false;
    },
    expected: 'senão',
    message: '"senão" (caso contrário) no lugar de "se não" (condição + negação)',
  },
  // "acerca de" vs "cerca de" vs "há cerca de"
  {
    matchWord: (w) => /^acerca$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (next !== 'de') return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      if (prev === 'há') return true;
      const nextAfter = tokens[i + 2]?.word?.toLowerCase();
      if (nextAfter && /^(anos|meses|dias|séculos|minutos|horas|mil|cem|cento|dois|três|quatro|cinco|dez|vinte)$/i.test(nextAfter)) {
        return true;
      }
      return false;
    },
    expected: 'cerca de',
    message: '"cerca de" (aproximadamente) no lugar de "acerca de" (sobre a respeito de)',
  },
  {
    matchWord: (w) => /^cerca$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (next !== 'de') return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      if (prev === 'há') return true;
      return false;
    },
    expected: 'há cerca de',
    message: '"há cerca de" (tempo decorrido + aproximadamente) no lugar de "cerca de"',
  },
  // "tampouco" (neither) vs "tão pouco" (so little)
  {
    matchWord: (w) => /^tampouco$/i.test(w),
    contextCheck: (tokens, i) => {
      return true;
    },
    expected: 'tão pouco',
    message: '"tão pouco" (tão pequena quantidade) no lugar de "tampouco" (também não)',
  },
  {
    matchWord: (w) => /^tão\s+pouco$/i.test(w),
    contextCheck: (tokens, i) => {
      return false;
    },
    expected: 'tão pouco',
    message: 'Verifique se é "tampouco" (também não) ou "tão pouco" (tão pequena quantidade)',
  },
  // "demais" (too much) vs "de mais" (more than needed)
  {
    matchWord: (w) => /^demais$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      if (prev === 'os' || prev === 'as' || prev === 'dos' || prev === 'das') return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (next === 'de') return true;
      return false;
    },
    expected: 'de mais',
    message: '"de mais" (a mais, em excesso) no lugar de "demais" (advérbio de intensidade)',
  },
  // "afim" (related/similar) vs "a fim de" (in order to)
  {
    matchWord: (w) => /^afim$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (next === 'de') return true;
      return false;
    },
    expected: 'a fim de',
    message: '"a fim de" (para, com o objetivo de) no lugar de "afim" (semelhante, parente por afinidade)',
  },
  // "por que" vs "por quê" vs "porque" vs "porquê"
  {
    matchWord: (w) => /^por\s+que$/i.test(w),
    contextCheck: (tokens, i) => {
      const next = tokens[i + 1]?.word;
      if (next && (next.endsWith('?') || next.endsWith('!'))) return false;
      if (next && next.endsWith('.')) return false;
      return false;
    },
    expected: 'por que',
    message: '"por que" (pergunta indireta) já está correto',
  },
  // "por quê" (before period) vs "por que"
  {
    matchWord: (w) => /^por\s+quê$/i.test(w),
    contextCheck: (tokens, i) => {
      const word = tokens[i]?.word;
      const next = tokens[i + 1]?.word;
      if (word && word.endsWith('quê') && next && (next === '.' || next === '?' || next === '!' || next === ',')) return true;
      return false;
    },
    expected: 'por quê',
    message: '"por quê" (no final de frase) — use com acento circunflexo',
  },
  // "porquê" (noun) - the reason
  {
    matchWord: (w) => /^porquê$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      return prev === 'o' || prev === 'os' || prev === 'do' || prev === 'dos' || prev === 'no' || prev === 'nos';
    },
    expected: 'porquê',
    message: '"porquê" (substantivo = o motivo) está correto',
  },
  // "aonde" used for static location → should be "onde"
  {
    matchWord: (w) => /^aonde$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      if (/^(ir|vou|vai|foi|indo|irei|iria|fui|vamos|vão|ia|íamos|foram|vá|vão)$/i.test(prev || '')) return false;
      return true;
    },
    expected: 'onde',
    message: '"onde" (localização estática) no lugar de "aonde" (movimento/destino)',
  },
  // "ha" (present) vs "a" (preposition) vs "à" (prep+art)
  {
    matchWord: (w) => /^h[aá]$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (/^(dois|três|quatro|cinco|seis|sete|oito|nove|dez|muito|pouco|alguns|algumas)$/i.test(next || '')) return false;
      const nextTag = undefined;
      return true;
    },
    expected: 'a',
    message: '"a" (preposição) no lugar de "há" (verbo haver existir/tempo)',
  },
  // "viagem" (noun) vs "viajem" (verb)
  {
    matchWord: (w) => /^viajem$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      if (/^(que|quando|se|talvez|espero|tomara)$/i.test(prev || '')) return false;
      return true;
    },
    expected: 'viagem',
    message: '"viagem" (substantivo) no lugar de "viajem" (verbo — 3ª pessoa plural do presente do subjuntivo de viajar)',
  },
  {
    matchWord: (w) => /^viagem$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      if (/^(que|quando|se|talvez|espero|tomara)$/i.test(prev || '')) return true;
      return false;
    },
    expected: 'viajem',
    message: '"viajem" (verbo) no lugar de "viagem" (substantivo)',
  },
  // "sessão" (session) vs "seção" (section) vs "cessão" (cession)
  {
    matchWord: (w) => /^sessão$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (/^(de|do|da|dos|das|no|na|nos|nas)$/i.test(next || '')) {
        const nextAfter = tokens[i + 2]?.word?.toLowerCase();
        if (nextAfter && /^(cinema|filme|sessão|terapia|judicial|câmara|votação|plenário)$/i.test(nextAfter)) return false;
      }
      const prev = tokens[i - 1]?.word?.toLowerCase();
      if (prev && /^(eleitoral|judicial|administrativa|de|da|do)$/i.test(prev)) {
        if (prev === 'de' || prev === 'da' || prev === 'do') return false;
      }
      return false;
    },
    expected: 'sessão',
    message: '"sessão" (intervalo de tempo, reunião) — verifique se não é "seção" (parte, departamento) ou "cessão" (ato de ceder)',
  },
  {
    matchWord: (w) => /^seção$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (/^(de|do|da|dos|das)$/i.test(next || '')) return true;
      return false;
    },
    expected: 'sessão',
    message: '"sessão" (reunião, espetáculo) no lugar de "seção" (departamento, divisão)',
  },
  // "descriminar" (decriminalize) vs "discriminar" (discriminate)
  {
    matchWord: (w) => /^descriminar$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (/^(crime|criminal|penal|ato|conduta|prática)$/i.test(next || '')) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      return !(prev && /^(crime|criminal|penal)$/i.test(prev));
    },
    expected: 'discriminar',
    message: '"discriminar" (diferenciar, segregar) no lugar de "descriminar" (tornar não criminoso)',
  },
  {
    matchWord: (w) => /^discriminar$/i.test(w),
    contextCheck: (tokens, i) => {
      return false;
    },
    expected: 'descriminar',
    message: '"descriminar" (tornar não criminoso) no lugar de "discriminar" (diferenciar, segregar)',
  },
  // "comprimento" (length) vs "cumprimento" (greeting)
  {
    matchWord: (w) => /^comprimento$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      if (/^(dar|damos|dar|receber|enviar|trocamos|trocou)$/i.test(prev || '')) return true;
      return false;
    },
    expected: 'cumprimento',
    message: '"cumprimento" (saudação) no lugar de "comprimento" (extensão, medida)',
  },
  // "trás" vs "traz" vs "atrás"
  {
    matchWord: (w) => /^trás$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      if (/^(de|da|do|dos|das|para|por)$/i.test(prev || '')) return false;
      return true;
    },
    expected: 'traz',
    message: '"traz" (verbo trazer) no lugar de "trás" (parte posterior)',
  },
  {
    matchWord: (w) => /^traz$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      if (/^(de|da|do|dos|das|para|por)$/i.test(prev || '')) return true;
      return false;
    },
    expected: 'trás',
    message: '"trás" (posição) no lugar de "traz" (verbo trazer)',
  },
  // "acender" (light) vs "ascender" (rise)
  {
    matchWord: (w) => /^ascender$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (/^(a|ao|à|para|até|o|os|a|as)$/i.test(next || '')) return false;
      const nextAfter = tokens[i + 2]?.word?.toLowerCase();
      if (nextAfter && /^(fogo|luz|lâmpada|vela|fósforo|chama|fogueira|isqueiro|farol|lanterna)$/i.test(nextAfter)) return true;
      return false;
    },
    expected: 'acender',
    message: '"acender" (pôr fogo, ligar luz) no lugar de "ascender" (subir, elevar-se)',
  },
  {
    matchWord: (w) => /^acender$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (/^(a|ao|à|para|até|ao|aos|à|às)$/i.test(next || '')) return true;
      return false;
    },
    expected: 'ascender',
    message: '"ascender" (subir, elevar-se a cargo superior) no lugar de "acender" (ligar fogo)',
  },
  // "cassar" (annul) vs "caçar" (hunt)
  {
    matchWord: (w) => /^cassar$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (/^(mandato|direitos|licença|registro|diploma|eleição|vaga|título|carteira|habilitação)$/i.test(next || '')) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      if (/^(justiça|tribunal|juiz|lei)$/i.test(prev || '')) return false;
      return true;
    },
    expected: 'caçar',
    message: '"caçar" (perseguir animais) no lugar de "cassar" (anular, revogar)',
  },
  // "concertar" (harmonize) vs "consertar" (fix)
  {
    matchWord: (w) => /^concertar$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (/^(o|a|os|as|um|uma|uns|umas|meu|seu|nosso|este|esse|aquele)$/i.test(next || '')) {
        const nextAfter = tokens[i + 2]?.word?.toLowerCase();
        if (nextAfter && /^(carro|computador|telefone|máquina|aparelho|motor|teto|caneta|relógio|bicicleta|geladeira|televisão|sofá|cadeira|porta|janela)$/i.test(nextAfter)) return true;
      }
      const prev = tokens[i - 1]?.word?.toLowerCase();
      if (/^(carro|computador|telefone|máquina|aparelho|motor)$/i.test(prev || '')) return true;
      return false;
    },
    expected: 'consertar',
    message: '"consertar" (reparar, arrumar) no lugar de "concertar" (harmonizar, combinar)',
  },
  {
    matchWord: (w) => /^consertar$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (/^(instrumentos|vozes|partes|ideias|interesses|posições|diferenças|música|peça|concerto)$/i.test(next || '')) return true;
      return false;
    },
    expected: 'concertar',
    message: '"concertar" (harmonizar, combinar) no lugar de "consertar" (reparar)',
  },
  // "emergir" (emerge) vs "imergir" (submerge)
  {
    matchWord: (w) => /^emergir$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      if (/^(sub|sob|debaixo|fundo|abaixo|profundezas)$/i.test(prev || '')) return true;
      return false;
    },
    expected: 'imergir',
    message: '"imergir" (mergulhar, submergir) no lugar de "emergir" (vir à tona)',
  },
  // "inflação" (inflation) vs "infração" (infraction)
  {
    matchWord: (w) => /^inflação$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (/^(de|no|na|nos|das|dos)$/i.test(next || '')) {
        const nextAfter = tokens[i + 2]?.word?.toLowerCase();
        if (nextAfter && /^(trânsito|trâns|penal|código|multa|penalidades)$/i.test(nextAfter)) return true;
      }
      const prev = tokens[i - 1]?.word?.toLowerCase();
      if (/^(multa|penalidade|cometer|cometeu)$/i.test(prev || '')) return true;
      return false;
    },
    expected: 'infração',
    message: '"infração" (violação de regra) no lugar de "inflação" (aumento geral de preços)',
  },
  {
    matchWord: (w) => /^infração$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (/^(de|no|na|nos|das|dos|anual|alta|baixa)$/i.test(next || '')) return true;
      return false;
    },
    expected: 'inflação',
    message: '"inflação" (indicador econômico) no lugar de "infração" (violação)',
  },
  // "mandado" (court order) vs "mandato" (mandate)
  {
    matchWord: (w) => /^mandado$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (/^(eletivo|político|parlamentar|legislativo|presidencial|governo|senador|deputado|vereador|prefeito)$/i.test(next || '')) return true;
      return false;
    },
    expected: 'mandato',
    message: '"mandato" (período de exercício de cargo eletivo) no lugar de "mandado" (ordem judicial)',
  },
  {
    matchWord: (w) => /^mandato$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (/^(judicial|de|da|do|dos|das|intimação|prisão|busca|citação)$/i.test(next || '')) return true;
      return false;
    },
    expected: 'mandado',
    message: '"mandado" (ordem judicial) no lugar de "mandato" (período de cargo)',
  },
  // "sob" (under) vs "sobre" (over/about)
  {
    matchWord: (w) => /^sob$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (/^(controle|pressão|suspeita|domínio|proteção|guarda|responsabilidade|alegria|tristeza|efeito|influência)$/i.test(next || '')) return false;
      return false;
    },
    expected: 'sob',
    message: '"sob" (debaixo de) já está correto — verifique se não deveria ser "sobre" (acerca de)',
  },
  {
    matchWord: (w) => /^sobre$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      if (/^(controle|pressão|suspeita|domínio|proteção|guarda|responsabilidade|efeito|influência)$/i.test(prev || '')) return false;
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (/^(controle|pressão|suspeita|domínio)$/i.test(next || '')) return true;
      return false;
    },
    expected: 'sob',
    message: '"sob" (debaixo de) no lugar de "sobre" (acima de, acerca de)',
  },
  // "ao encontro de" (towards) vs "de encontro a" (against)
  {
    matchWord: (w) => /^encontro$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i === 0 || i >= tokens.length - 1) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (prev === 'de' && next === 'a') return true;
      return false;
    },
    expected: 'ao encontro de',
    message: '"ao encontro de" (a favor, para junto) no lugar de "de encontro a" (contra)',
  },
  {
    matchWord: (w) => /^encontro$/i.test(w),
    contextCheck: (tokens, i) => {
      if (i >= tokens.length - 1) return false;
      if (i === 0) return false;
      const prev = tokens[i - 1]?.word?.toLowerCase();
      const next = tokens[i + 1]?.word?.toLowerCase();
      if (prev === 'ao' && next === 'de') return false;
      return false;
    },
    expected: 'ao encontro de',
    message: '"ao encontro de" (a favor) — verifique se não é "de encontro a" (contra)',
  },
];

export interface PairValidationResult {
  errors: PairError[];
}

export function validatePairs(text: string): PairValidationResult {
  const tokens = tokenize(text);
  const errors: PairError[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const { word, position } = tokens[i];

    const lowerWord = word.toLowerCase();

    if (lowerWord === 'senão' || lowerWord === 'tampouco' || lowerWord === 'demais' ||
        lowerWord === 'afim' || lowerWord === 'aonde' || lowerWord === 'porquê' ||
        lowerWord === 'porque' || lowerWord === 'ascender' || lowerWord === 'acender' ||
        lowerWord === 'cassar' || lowerWord === 'caçar' || lowerWord === 'concertar' ||
        lowerWord === 'consertar' || lowerWord === 'emergir' || lowerWord === 'imergir' ||
        lowerWord === 'inflação' || lowerWord === 'infração' || lowerWord === 'mandado' ||
        lowerWord === 'mandato' || lowerWord === 'sob' || lowerWord === 'sobre' ||
        lowerWord === 'encontro' || lowerWord === 'viagem' || lowerWord === 'viajem' ||
        lowerWord === 'sessão' || lowerWord === 'seção' || lowerWord === 'descriminar' ||
        lowerWord === 'discriminar' || lowerWord === 'comprimento' || lowerWord === 'cumprimento' ||
        lowerWord === 'trás' || lowerWord === 'traz') {

      for (const pair of PAIRS) {
        if (pair.matchWord(word) && pair.contextCheck(tokens, i)) {
          errors.push({
            word,
            position,
            expected: pair.expected,
            message: pair.message,
          });
        }
      }
    }

    if (lowerWord === 'a' || lowerWord === 'há' || lowerWord === 'mais' ||
                  lowerWord === 'mau' || lowerWord === 'mal' || lowerWord === 'porque' ||
                  lowerWord === 'onde') {
      for (const pair of PAIRS) {
        if (pair.matchWord(word) && pair.contextCheck(tokens, i)) {
          errors.push({
            word,
            position,
            expected: pair.expected,
            message: pair.message,
          });
        }
      }
    }
  }

  const uniqueErrors = errors.filter((err, index, self) =>
    index === self.findIndex(e =>
      e.position === err.position && e.expected === err.expected
    )
  );

  return { errors: uniqueErrors };
}

export type { PairError };
