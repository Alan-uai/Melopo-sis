export const toolDeclarations = [
  {
    name: "setPoemTitle",
    description: "Define ou altera o título do poema atual",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "O novo título para o poema" },
      },
      required: ["title"],
    },
  },
  {
    name: "setPoemTone",
    description: "Altera o tom/estilo do poema. Opções: Melancólico, Romântico, Reflexivo, Jubiloso, Sombrio, Saudoso, Épico, Lírico, Satírico, Filosófico, Intimista, Nostálgico, Visionário, Conciso, Erótico, Grotesco / Degradação, Sagrado / Místico",
    parameters: {
      type: "object",
      properties: {
        tone: { type: "string", description: "O novo tom do poema" },
      },
      required: ["tone"],
    },
  },
  {
    name: "setPoemStructure",
    description: "Altera a estrutura poética do poema. Opções: poema, poesia, soneto, haicai, cordel, redondilha, decassilabo, trova, oitava, decima, elegia, ode, verso-livre",
    parameters: {
      type: "object",
      properties: {
        structure: { type: "string", description: "A nova estrutura poética" },
      },
      required: ["structure"],
    },
  },
  {
    name: "setRhyme",
    description: "Ativa ou desativa a verificação de rimas no poema",
    parameters: {
      type: "object",
      properties: {
        enabled: { type: "boolean", description: "true para ativar verificação de rima, false para desativar" },
      },
      required: ["enabled"],
    },
  },
  {
    name: "appendPoemText",
    description: "Adiciona texto ao final do poema atual. Use para continuar escrevendo o poema, adicionar novos versos.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "O texto a ser adicionado ao final do poema" },
      },
      required: ["text"],
    },
  },
  {
    name: "replacePoemText",
    description: "Substitui todo o texto do poema por um novo conteúdo. Use quando o usuário ditar um poema completo.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "O novo texto completo do poema" },
      },
      required: ["text"],
    },
  },
  {
    name: "setSuggestionMode",
    description: "Altera o modo de sugestão entre 'gradual' (automático) e 'final' (manual)",
    parameters: {
      type: "object",
      properties: {
        mode: {
          type: "string",
          enum: ["gradual", "final"],
          description: "Modo de sugestão: 'gradual' para automático ao digitar, 'final' para verificação manual",
        },
      },
      required: ["mode"],
    },
  },
  {
    name: "checkGrammar",
    description: "Inicia uma verificação ortográfica e gramatical do poema",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "suggestToneImprovements",
    description: "Gera sugestões de melhoria de tom e estilo para o poema atual",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "newPoem",
    description: "Limpa o editor e começa um novo poema do zero",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "savePoem",
    description: "Salva o poema atual na conta do usuário (Firestore)",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "copyPoemText",
    description: "Copia o texto do poema para a área de transferência",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "undoLastChange",
    description: "Desfaz a última alteração no texto do poema",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "getPoemContext",
    description: "Obtém o contexto completo do poema atual (texto, título, tom, estrutura, sugestões ativas, lista de poemas salvos)",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "acceptSuggestion",
    description: "Aceita e aplica a sugestão ativa atual (ortografia ou tom)",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "dismissSuggestion",
    description: "Dispensa ou pula a sugestão ativa atual sem aplicá-la",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "loadPoem",
    description: "Carrega um poema salvo pelo título. O usuário precisa fornecer o título exato ou aproximado.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "O título do poema a ser carregado" },
      },
      required: ["title"],
    },
  },
  {
    name: "endConversation",
    description: "Encerra a sessão de voz. Use quando o usuário disser tchau, 'é só', 'obrigado por enquanto', ou implicar que terminou.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "calculate",
    description: "Calcula expressões matemáticas usando math.js",
    parameters: {
      type: "object",
      properties: {
        expression: { type: "string", description: "A expressão matemática a ser calculada" },
      },
      required: ["expression"],
    },
  },
];

export interface SystemInstructionParams {
  assistantName?: string;
  userName?: string;
  personality?: string;
  verbosity?: string;
  speechSpeed?: string;
  poemContext?: {
    title?: string;
    tone?: string;
    structure?: string;
    rhyme?: boolean;
    poemList?: string[];
  };
}

export function buildSystemInstruction(params: SystemInstructionParams): string {
  const {
    assistantName = "Poeta",
    userName = "Poeta",
    personality = "Warm, poetic, and encouraging, like a fellow poet helping a friend.",
    verbosity = "concise",
    speechSpeed = "normal",
    poemContext = {},
  } = params;

  return `You are a specialized poetry assistant for Melopoësis, a Brazilian Portuguese poetry writing platform.

Your name is '${assistantName}'. The user's preferred name is ${userName} — address them by this name.

Your personality: ${personality}.
Your response style: ${verbosity}.
Your speech speed: ${speechSpeed}.

Current poem state:
- Title: ${poemContext?.title || "Sem título"}
- Tone: ${poemContext?.tone || "Melancólico"}
- Structure: ${poemContext?.structure || "poema"}
- Rhyme forced: ${poemContext?.rhyme !== undefined ? poemContext.rhyme : false}

Saved poems in library: ${(poemContext?.poemList || []).join(", ")}

Your roles:
1) Help the user write, edit, and improve their poems using the available tools
2) Answer questions about poetry forms, meter, rhyme schemes, and literary devices
3) Execute commands to modify the poem (change title, tone, structure, etc.)
4) Provide creative feedback and suggestions on the user's poetry
5) ALWAYS speak in Brazilian Portuguese
6) Be poetic and eloquent but concise when speaking aloud
7) Maintain deep knowledge about all major poetry forms: soneto, haicai, cordel, redondilha, decassilabo, trova, oitava, decima, elegia, ode, verso-livre

Available tools: setPoemTitle, setPoemTone, setPoemStructure, setRhyme, appendPoemText, replacePoemText, setSuggestionMode, checkGrammar, suggestToneImprovements, newPoem, savePoem, copyPoemText, undoLastChange, getPoemContext, acceptSuggestion, dismissSuggestion, loadPoem, endConversation, calculate

SILENCE AND WAKE WORD BEHAVIOR:
- If you just activated and the user is completely silent for 2 seconds, gently ask "Sim?", "E então?" or "O que você precisa?".
- If the user remains silent for another 5 seconds after you asked, use the endConversation tool to turn off automatically.
- If the user gave a command right after the wake word, execute it immediately.`;
}
