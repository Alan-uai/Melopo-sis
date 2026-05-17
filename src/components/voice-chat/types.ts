export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

export interface PoemContext {
  text: string;
  title: string;
  tone: string;
  structure: string;
  rhyme: boolean;
  hasGrammarSuggestions: boolean;
  hasToneSuggestions: boolean;
  grammarSuggestionCount: number;
  toneSuggestionCount: number;
  poemList: { id: string; title: string }[];
}

export type TextStructure = "poesia" | "poema" | "soneto" | "haicai" | "cordel" | "redondilha" | "decassilabo" | "trova" | "oitava" | "decima" | "elegia" | "ode" | "verso-livre" | "poesia-concreta-visual" | "poesia-marginal-slam" | "figuras-linguagem" | "revisao-poetica";

export interface VoiceActionHandlers {
  setTitle: (title: string) => void;
  setTone: (tone: string) => void;
  setStructure: (structure: TextStructure) => void;
  setRhyme: (enabled: boolean) => void;
  appendText: (text: string) => void;
  replaceText: (text: string) => void;
  setSuggestionMode: (mode: "gradual" | "final") => void;
  newPoem: () => void;
  savePoem: () => void;
  copyPoem: () => void;
  checkSpelling: () => void;
  suggestTone: () => void;
  undo: () => void;
  acceptSuggestion: () => void;
  dismissSuggestion: () => void;
  getPoemContext: () => PoemContext;
  loadPoemByTitle: (title: string) => boolean;
}
