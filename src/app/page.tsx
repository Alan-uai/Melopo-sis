"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Editor, EditorRef } from "@/components/editor";
import { SuggestionList } from "@/components/suggestion-list";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import React from 'react';
import { generateContextualSuggestions } from "@/ai/flows/generate-contextual-suggestions";
import type { Suggestion, SuggestionInput, SuggestionMode, TextStructure } from "@/ai/types";
import { useAuth, useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarItem, SidebarList, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider } from "@/components/ui/sidebar";
import { LogIn, LogOut, PlusCircle, LoaderCircle, Trash2, Search, ArrowUpDown, ArrowDownAZ } from "lucide-react";
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const LOCAL_STORAGE_KEY = "melopoeisis_data_v2";

type Poem = {
  id: string;
  title?: string;
  text: string;
  tone: string;
  structure: TextStructure;
  rhyme: boolean;
  createdAt: any;
  updatedAt: any;
};

const GRADUAL_DEBOUNCE_MS = 800;

const POEM_STRUCTURES: { value: string; label: string }[] = [
  { value: 'poema', label: 'Poema' },
  { value: 'poesia', label: 'Poesia' },
  { value: 'soneto', label: 'Soneto' },
  { value: 'haicai', label: 'Haicai' },
  { value: 'cordel', label: 'Cordel' },
  { value: 'redondilha', label: 'Redondilha' },
  { value: 'decassilabo', label: 'Decassílabo' },
  { value: 'trova', label: 'Trova / Quadra' },
  { value: 'oitava', label: 'Oitava' },
  { value: 'decima', label: 'Décima' },
  { value: 'elegia', label: 'Elegia' },
  { value: 'ode', label: 'Ode' },
  { value: 'verso-livre', label: 'Verso Livre' },
];

export default function Home() {
  const [activePoem, setActivePoem] = useState<Poem | null>(null);
  const [text, setText] = useState<string>("");
  const [poemTitle, setPoemTitle] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [tone, setTone] = useState<string>("Melancólico");
  const [textStructure, setTextStructure] = useState<TextStructure>("poema");
  const [rhyme, setRhyme] = useState<boolean>(false);
  const [grammarSuggestions, setGrammarSuggestions] = useState<Suggestion[]>([]);
  const [toneSuggestions, setToneSuggestions] = useState<Suggestion[]>([]);
  const [appliedToneSuggestions, setAppliedToneSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestionMode, setSuggestionMode] = useState<SuggestionMode>("final");

  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState<number | null>(null);
  const activeGrammarSuggestion = currentSuggestionIndex !== null ? grammarSuggestions[currentSuggestionIndex] : null;

  const [pastStates, setPastStates] = useState<string[]>([]);
  const [futureStates, setFutureStates] = useState<string[]>([]);
  const MAX_UNDO = 50;

  const [poemSearchQuery, setPoemSearchQuery] = useState("");
  const [poemFilterStructure, setPoemFilterStructure] = useState("");
  const [poemSortBy, setPoemSortBy] = useState<"updatedAt" | "title">("updatedAt");
  const [poemSortOrder, setPoemSortOrder] = useState<"asc" | "desc">("desc");

  const { toast } = useToast();
  const editorRef = useRef<EditorRef>(null);
  const [excludedPhrasesMap, setExcludedPhrasesMap] = useState<Record<string, string[]>>({});

  const gradualTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const poemsCollection = useMemoFirebase(
    () => (user && firestore ? collection(firestore, `users/${user.uid}/poems`) : null),
    [firestore, user]
  );
  const { data: poems, isLoading: isLoadingPoems } = useCollection<Poem>(poemsCollection);

  const handleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (!firestore) return;
      const userRef = doc(firestore, "users", user.uid);
      setDocumentNonBlocking(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
      }, { merge: true });
      toast({
        title: "Login bem-sucedido!",
        description: `Bem-vindo(a) de volta, ${user.displayName}!`,
      });
    } catch (error) {
      console.error("Erro no login com Google:", error);
      toast({
        variant: "destructive",
        title: "Erro de Login",
        description: "Não foi possível fazer login com o Google.",
      });
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setActivePoem(null);
      handleNewPoem();
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta.",
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  useEffect(() => {
    if (!activePoem) {
      try {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
          const { text, title, tone: savedTone, textStructure: savedStructure, rhyme: savedRhyme } = JSON.parse(savedData);
          if (text) setText(text);
          if (title !== undefined) setPoemTitle(title);
          if (savedTone) setTone(savedTone);
          if (savedStructure) setTextStructure(savedStructure as TextStructure);
          if (savedRhyme !== undefined) setRhyme(savedRhyme);
        }
      } catch (error) {
        console.error("Falha ao ler do localStorage", error);
      }
    }
    setIsMounted(true);
  }, [activePoem]);

  useEffect(() => {
    if (isMounted && !activePoem) {
      try {
        const dataToSave = JSON.stringify({ text, title: poemTitle, tone, textStructure, rhyme });
        localStorage.setItem(LOCAL_STORAGE_KEY, dataToSave);
      } catch (error) {
        console.error("Falha ao escrever no localStorage", error);
      }
    }
  }, [text, poemTitle, tone, textStructure, rhyme, isMounted, activePoem]);

  const loadPoem = (poem: Poem) => {
    setActivePoem(poem);
    setText(poem.text);
    setPoemTitle(poem.title || "");
    setTone(poem.tone);
    setTextStructure(poem.structure);
    setRhyme(poem.rhyme);
    setPastStates([]);
    setFutureStates([]);
    resetSuggestions();
    toast({
      title: "Poema Carregado",
      description: `"${poem.title || 'Poema sem título'}" carregado no editor.`,
    });
  };

  const handleNewPoem = () => {
    setActivePoem(null);
    setText("");
    setPoemTitle("");
    setTone("Melancólico");
    setTextStructure("poema");
    setRhyme(false);
    setPastStates([]);
    setFutureStates([]);
    resetSuggestions();
    editorRef.current?.focus();
  };

  const handleDeletePoem = async (poemId: string) => {
    if (!firestore || !user) return;
    const poemRef = doc(firestore, `users/${user.uid}/poems`, poemId);
    deleteDocumentNonBlocking(poemRef);
    if (activePoem?.id === poemId) {
      handleNewPoem();
    }
    toast({
      title: "Poema Removido",
      description: "O poema foi excluído permanentemente.",
    });
  };

  const generateSuggestions = useCallback(async (
    suggestionType: 'grammar' | 'tone'
  ) => {
    setIsLoading(true);
    try {
      const currentText = text;
      const input: SuggestionInput = {
        text: currentText,
        tone: tone,
        structure: textStructure,
        rhyme: rhyme,
        suggestionType: suggestionType,
        excludedPhrases: [],
      };
      const result = await generateContextualSuggestions(input);

      if (text !== currentText) {
        toast({
          title: "Texto alterado",
          description: "Você continuou a escrever. As sugestões foram descartadas.",
        });
        setIsLoading(false);
        return;
      }

      if (suggestionType === 'grammar') {
        setGrammarSuggestions(result.suggestions);
        setToneSuggestions([]);
        setCurrentSuggestionIndex(null);
        if (result.suggestions.length > 0) {
          setCurrentSuggestionIndex(0);
          toast({
            title: "Correções Ortográficas Encontradas",
            description: `Encontramos ${result.suggestions.length} correções.`,
          });
        } else {
          toast({
            title: "Nenhum Erro Ortográfico",
            description: "Seu texto parece correto.",
          });
        }
      } else {
        setToneSuggestions(result.suggestions);
        setGrammarSuggestions([]);
        setCurrentSuggestionIndex(null);
        if (result.suggestions.length > 0) {
          toast({
            title: "Sugestões de Tom e Estilo",
            description: `Encontramos ${result.suggestions.length} sugestões para aprimorar seu poema.`,
          });
        } else {
          toast({
            title: "Nenhuma Sugestão de Estilo",
            description: "Seu texto parece ótimo!",
          });
        }
      }
    } catch (error: any) {
      console.error("Failed to generate suggestions:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Gerar Sugestões",
        description: error.message || "Não foi possível obter sugestões da IA. Verifique sua conexão ou tente novamente mais tarde.",
      });
    } finally {
        setIsLoading(false);
    }
  }, [text, tone, textStructure, rhyme, toast]);

  const handleCheckSpelling = async () => {
    if (!text.trim() || isLoading) return;
    setGrammarSuggestions([]);
    setToneSuggestions([]);
    setCurrentSuggestionIndex(null);
    await generateSuggestions('grammar');
  };

  const handleSuggestTone = async () => {
    if (!text.trim() || isLoading) return;
    setGrammarSuggestions([]);
    setToneSuggestions([]);
    setCurrentSuggestionIndex(null);
    await generateSuggestions('tone');
  };

  const resetSuggestions = () => {
    setGrammarSuggestions([]);
    setToneSuggestions([]);
    setCurrentSuggestionIndex(null);
  };

  const handleTextChange = (newText: string) => {
    setPastStates(prev => {
      const next = [...prev, text];
      return next.length > MAX_UNDO ? next.slice(-MAX_UNDO) : next;
    });
    setFutureStates([]);
    setText(newText);
    resetSuggestions();

    if (suggestionMode === 'gradual' && newText.trim().length > 3) {
      if (gradualTimerRef.current) {
        clearTimeout(gradualTimerRef.current);
      }
      gradualTimerRef.current = setTimeout(() => {
        setIsLoading(true);
        generateContextualSuggestions({
          text: newText,
          tone: tone,
          structure: textStructure,
          rhyme: rhyme,
          suggestionType: 'grammar',
          excludedPhrases: [],
        }).then(result => {
          setGrammarSuggestions(result.suggestions);
          if (result.suggestions.length > 0) {
            setCurrentSuggestionIndex(0);
          }
        }).catch(() => {}).finally(() => {
          setIsLoading(false);
        });
      }, GRADUAL_DEBOUNCE_MS);
    }
  };

  const lowSeverityCount = grammarSuggestions.filter(s => s.severity === 'baixa').length;

  const handleAcceptAllLowSeverity = useCallback(() => {
    const lowSeverity = grammarSuggestions.filter(s => s.severity === 'baixa');
    let updatedText = text;
    for (const s of lowSeverity) {
      updatedText = updatedText.replace(s.originalText, s.correctedText);
    }
    setText(updatedText);
    const remaining = grammarSuggestions.filter(s => s.severity !== 'baixa');
    setGrammarSuggestions(remaining);
    if (remaining.length === 0) {
      setCurrentSuggestionIndex(null);
    } else if (currentSuggestionIndex !== null) {
      const remainingIndex = remaining.findIndex(s =>
        grammarSuggestions.indexOf(s) === currentSuggestionIndex
      );
      setCurrentSuggestionIndex(remainingIndex >= 0 ? remainingIndex : 0);
    }
    toast({
      title: "Correções Aplicadas",
      description: `${lowSeverity.length} correções simples foram aplicadas automaticamente.`,
    });
  }, [grammarSuggestions, text, currentSuggestionIndex, toast]);

  const handleClear = () => {
    handleNewPoem();
    toast({
      title: "Editor Limpo",
      description: "O conteúdo do editor foi apagado.",
    });
  };

  const handleUndo = useCallback(() => {
    if (pastStates.length === 0) return;
    const prev = pastStates[pastStates.length - 1];
    setPastStates(prev => prev.slice(0, -1));
    setFutureStates(prev => [...prev, text]);
    setText(prev);
    resetSuggestions();
  }, [pastStates, text]);

  const handleRedo = useCallback(() => {
    if (futureStates.length === 0) return;
    const next = futureStates[futureStates.length - 1];
    setFutureStates(prev => prev.slice(0, -1));
    setPastStates(prev => [...prev, text]);
    setText(next);
    resetSuggestions();
  }, [futureStates, text]);

  const handleSavePoem = async () => {
    if (!user || !poemsCollection) {
      toast({
        variant: "destructive",
        title: "Login Necessário",
        description: "Você precisa fazer login para salvar seus poemas.",
      });
      return;
    }

    if (!text.trim()) {
      toast({
        variant: "destructive",
        title: "Poema Vazio",
        description: "Você não pode salvar um poema sem conteúdo.",
      });
      return;
    }

    const finalTitle = poemTitle.trim() || text.split('\n')[0].trim().substring(0, 50) || "Poema sem título";

    const poemData = {
      title: finalTitle,
      text: text,
      tone: tone,
      structure: textStructure,
      rhyme: rhyme,
      authorId: user.uid,
      updatedAt: serverTimestamp(),
    };

    setIsLoading(true);
    try {
      if (activePoem) {
        if (!firestore) return;
        const poemRef = doc(firestore, `users/${user.uid}/poems`, activePoem.id);
        updateDocumentNonBlocking(poemRef, poemData);
        setActivePoem(prev => prev ? { ...prev, title: finalTitle } : null);
        toast({
          title: "Poema Atualizado!",
          description: `"${finalTitle}" foi atualizado com sucesso.`,
        });
      } else {
        const docRef = await addDocumentNonBlocking(poemsCollection, {
          ...poemData,
          createdAt: serverTimestamp(),
        });
        if(docRef) {
          setActivePoem({ id: docRef.id, ...poemData, createdAt: new Date(), updatedAt: new Date() });
        }
        toast({
          title: "Poema Salvo!",
          description: `"${finalTitle}" foi salvo em sua coleção.`,
        });
      }
    } catch (error: any) {
        console.error("Erro ao salvar o poema:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Salvar",
            description: error.message || "Não foi possível salvar o poema.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!text && !poemTitle) return;
    const copyContent = poemTitle.trim()
      ? `${poemTitle}\n\n${text}`
      : text;
    navigator.clipboard.writeText(copyContent).then(() => {
      toast({
        title: "Texto Copiado!",
        description: "O título e o poema foram copiados para a área de transferência.",
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({
        variant: "destructive",
        title: "Erro ao Copiar",
        description: "Não foi possível copiar o texto.",
      });
    });
  };

  const handleSuggestionModeChange = (mode: SuggestionMode) => {
    setSuggestionMode(mode);
    resetSuggestions();
  };

  const handleConfigChange = () => {
    resetSuggestions();
  };

  const handleToneChange = (newTone: string) => {
    setTone(newTone);
    handleConfigChange();
  };

  const handleTextStructureChange = (newStructure: TextStructure) => {
    setTextStructure(newStructure);
    handleConfigChange();
  };

  const handleRhymeChange = (newRhyme: boolean) => {
    setRhyme(newRhyme);
    handleConfigChange();
  };

  const advanceToNextSuggestion = useCallback(() => {
    if (currentSuggestionIndex !== null && currentSuggestionIndex < grammarSuggestions.length - 1) {
      setCurrentSuggestionIndex(currentSuggestionIndex + 1);
    } else {
      setCurrentSuggestionIndex(null);
      setGrammarSuggestions([]);
    }
  }, [currentSuggestionIndex, grammarSuggestions]);

  const applyCorrection = useCallback((originalText: string, correctedText: string) => {
    setText(prevText => {
      const newText = prevText.replace(originalText, correctedText);
      return newText;
    });
    advanceToNextSuggestion();
  }, [advanceToNextSuggestion]);

  const handleAccept = useCallback((suggestionToAccept: Suggestion) => {
    if (!suggestionToAccept) return;

    if (suggestionToAccept.type === 'grammar') {
      applyCorrection(suggestionToAccept.originalText, suggestionToAccept.correctedText);
    } else {
      setText(prevText => {
        const newText = prevText.replace(suggestionToAccept.originalText, suggestionToAccept.correctedText);

        setToneSuggestions(currentSuggestions =>
          currentSuggestions.filter(s => s.originalText !== suggestionToAccept.originalText)
        );

        setAppliedToneSuggestions(prev => [...prev, suggestionToAccept]);

        return newText;
      });
    }
  }, [applyCorrection]);

  const handleDismiss = useCallback((suggestionToDismiss: Suggestion) => {
    if (!suggestionToDismiss) return;
    if (suggestionToDismiss.type === 'grammar') {
      advanceToNextSuggestion();
    } else {
      setToneSuggestions(current => current.filter(s => s.originalText !== suggestionToDismiss.originalText));
    }
  }, [advanceToNextSuggestion]);

  const handleResuggest = async (suggestionToResuggest: Suggestion) => {
    const excludedPhrases = excludedPhrasesMap[suggestionToResuggest.originalText] || [];

    setIsLoading(true);
    try {
        const input: SuggestionInput = {
            text: suggestionToResuggest.context
              ? suggestionToResuggest.context
              : suggestionToResuggest.originalText,
            tone: tone,
            structure: textStructure,
            rhyme: rhyme,
            suggestionType: suggestionToResuggest.type,
            excludedPhrases: excludedPhrases,
        };
        const result = await generateContextualSuggestions(input);
        const newSuggestion = result.suggestions[0];

        if (newSuggestion) {
            if (suggestionToResuggest.type === 'grammar' && currentSuggestionIndex !== null) {
                setGrammarSuggestions(current => {
                  const newSuggestions = [...current];
                  newSuggestions[currentSuggestionIndex] = newSuggestion;
                  return newSuggestions;
                });
            } else {
                setToneSuggestions(current => current.map(s => s.originalText === suggestionToResuggest.originalText ? newSuggestion : s));
            }
        } else {
            toast({
                variant: "destructive",
                title: "Não foi possível gerar uma nova sugestão.",
            });
        }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erro ao Resugerir",
            description: "Não foi possível obter uma nova sugestão.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleToggleExcludedPhrase = (originalText: string, phrase: string) => {
    setExcludedPhrasesMap(prev => {
        const currentExcluded = prev[originalText] || [];
        const newExcluded = currentExcluded.includes(phrase)
            ? currentExcluded.filter(p => p !== phrase)
            : [...currentExcluded, phrase];
        return { ...prev, [originalText]: newExcluded };
    });
  };

  const handleSwapAlternative = useCallback((suggestionToSwap: Suggestion, alternativeIndex: number) => {
    if (suggestionToSwap.type !== 'tone') return;
    const alternatives = suggestionToSwap.alternatives;
    if (!alternatives || alternativeIndex >= alternatives.length) return;

    const oldCorrectedText = suggestionToSwap.correctedText;
    const newCorrectedText = alternatives[alternativeIndex];

    setToneSuggestions(current => current.map(s => {
      if (s.originalText !== suggestionToSwap.originalText) return s;
      const newAlternatives = [...(s.alternatives || [])];
      newAlternatives[alternativeIndex] = oldCorrectedText;
      return { ...s, correctedText: newCorrectedText, alternatives: newAlternatives };
    }));
  }, []);

  const handleUndoAppliedTone = useCallback((suggestionToUndo: Suggestion) => {
    setText(prevText => prevText.replace(suggestionToUndo.correctedText, suggestionToUndo.originalText));
    setToneSuggestions(prev => [...prev, suggestionToUndo]);
    setAppliedToneSuggestions(prev => prev.filter(s => s.originalText !== suggestionToUndo.originalText));
  }, []);

  const keyHandlersRef = useRef({} as {
    handleSavePoem: () => void;
    handleUndo: () => void;
    handleRedo: () => void;
    handleCheckSpelling: () => void;
    handleSuggestTone: () => void;
    handleNewPoem: () => void;
    handleCopy: () => void;
  });
  keyHandlersRef.current = {
    handleSavePoem, handleUndo, handleRedo,
    handleCheckSpelling, handleSuggestTone,
    handleNewPoem, handleCopy,
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const h = keyHandlersRef.current;
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === 's') { e.preventDefault(); h.handleSavePoem(); return; }
      if (isMod && !e.shiftKey && e.key === 'z') { e.preventDefault(); h.handleUndo(); return; }
      if (isMod && e.shiftKey && e.key === 'z') { e.preventDefault(); h.handleRedo(); return; }
      if (isMod && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); h.handleCheckSpelling(); return; }
      if (isMod && e.shiftKey && e.key === 'Enter') { e.preventDefault(); h.handleSuggestTone(); return; }
      if (isMod && e.key === 'n') { e.preventDefault(); h.handleNewPoem(); return; }
      if (isMod && e.shiftKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); h.handleCopy(); return; }
      if (e.key === 'Escape') {
        resetSuggestions();
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isMobile = useIsMobile();
  const totalSuggestionCount = grammarSuggestions.length + toneSuggestions.length;

  const filteredPoems: Poem[] | undefined = useMemo(() => {
    if (!poems) return undefined;
    let result = [...poems];

    if (poemSearchQuery.trim()) {
      const q = poemSearchQuery.toLowerCase();
      result = result.filter(p =>
        (p.title || "").toLowerCase().includes(q) ||
        (p.text || "").toLowerCase().includes(q)
      );
    }

    if (poemFilterStructure) {
      result = result.filter(p => p.structure === poemFilterStructure);
    }

    result.sort((a, b) => {
      if (poemSortBy === "title") {
        const cmp = (a.title || "").localeCompare(b.title || "");
        return poemSortOrder === "asc" ? cmp : -cmp;
      }
      const dateA = a.updatedAt?.toDate?.() ?? new Date(0);
      const dateB = b.updatedAt?.toDate?.() ?? new Date(0);
      return poemSortOrder === "asc"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

    return result;
  }, [poems, poemSearchQuery, poemFilterStructure, poemSortBy, poemSortOrder]);

  return (
    <SidebarProvider>
      <div className="flex h-full w-full">
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-xl font-semibold">Meus Poemas</h2>
          </SidebarHeader>
          <SidebarContent className="p-2">
              <Button className="w-full" onClick={handleNewPoem}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Poema
              </Button>
              <div className="mt-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Buscar poemas..."
                    value={poemSearchQuery}
                    onChange={(e) => setPoemSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
                <div className="flex gap-1.5">
                  <Select value={poemFilterStructure} onValueChange={(v) => setPoemFilterStructure(v === "todas" ? "" : v)}>
                    <SelectTrigger className="flex-1 h-8 text-xs">
                      <SelectValue placeholder="Estrutura: Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      {POEM_STRUCTURES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    <Button
                      variant={poemSortBy === "updatedAt" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        if (poemSortBy === "updatedAt") {
                          setPoemSortOrder(prev => prev === "desc" ? "asc" : "desc");
                        } else {
                          setPoemSortBy("updatedAt");
                          setPoemSortOrder("desc");
                        }
                      }}
                      title="Ordenar por data"
                    >
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant={poemSortBy === "title" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        if (poemSortBy === "title") {
                          setPoemSortOrder(prev => prev === "asc" ? "desc" : "asc");
                        } else {
                          setPoemSortBy("title");
                          setPoemSortOrder("asc");
                        }
                      }}
                      title="Ordenar por nome"
                    >
                      <ArrowDownAZ className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
              <SidebarMenu className="mt-4">
              {isLoadingPoems && <p className="text-sm text-muted-foreground p-2">Carregando...</p>}
              {!isLoadingPoems && filteredPoems?.map(poem => (
                  <SidebarMenuItem key={poem.id}>
                    <div className="flex items-center w-full gap-1">
                      <SidebarMenuButton
                          className="flex-1 justify-start truncate"
                          onClick={() => loadPoem(poem)}
                          isActive={activePoem?.id === poem.id}
                      >
                        {poem.title || "Poema sem título"}
                      </SidebarMenuButton>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir poema</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir "{poem.title || 'Poema sem título'}"?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePoem(poem.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </SidebarMenuItem>
              ))}
              {!isLoadingPoems && (!filteredPoems || filteredPoems.length === 0) && (
                  <p className="text-sm text-muted-foreground p-2 text-center">
                    {poemSearchQuery || poemFilterStructure ? "Nenhum poema encontrado." : "Nenhum poema salvo."}
                  </p>
              )}
              </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
              {isUserLoading ? (
                  <div className="flex items-center justify-center p-2">
                      <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
              ) : user ? (
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="flex items-center justify-start gap-2 w-full p-2 h-14">
                              <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'Usuário'}/>
                                  <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                              </Avatar>
                              <span className="truncate">{user.displayName}</span>
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end" forceMount>
                          <DropdownMenuLabel className="font-normal">
                              <div className="flex flex-col space-y-1">
                                  <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                              </div>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleLogout}>
                              <LogOut className="mr-2 h-4 w-4"/>
                              <span>Sair</span>
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              ) : (
                  <Button variant="outline" className="w-full" onClick={handleLogin}>
                    <LogIn className="mr-2 h-4 w-4"/>
                      Login com Google
                  </Button>
              )}
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex overflow-hidden">
          <div className={`w-full overflow-y-auto p-4 ${isMobile ? "flex flex-col" : "grid grid-cols-1 lg:grid-cols-2 gap-4 items-start"}`}>
            <Editor
              ref={editorRef}
              text={text}
              onTextChange={handleTextChange}
              title={poemTitle}
              onTitleChange={setPoemTitle}
              isLoading={isLoading}
              tone={tone}
              onToneChange={handleToneChange}
              textStructure={textStructure}
              onTextStructureChange={handleTextStructureChange}
              rhyme={rhyme}
              onRhymeChange={handleRhymeChange}
              grammarSuggestions={grammarSuggestions}
              activeGrammarSuggestion={activeGrammarSuggestion}
              onAccept={handleAccept}
              onDismiss={handleDismiss}
              onResuggest={handleResuggest}
              suggestionMode={suggestionMode}
              onSuggestionModeChange={handleSuggestionModeChange}
              onCheckSpelling={handleCheckSpelling}
              onSuggestTone={handleSuggestTone}
              onClear={handleClear}
              onCopy={handleCopy}
              onSavePoem={handleSavePoem}
              isPoemSaved={!!activePoem}
              toneSuggestions={toneSuggestions}
              onAcceptAllLowSeverity={handleAcceptAllLowSeverity}
              lowSeverityCount={lowSeverityCount}
            />
            {isMobile ? (
              totalSuggestionCount > 0 && (
                <Accordion type="single" collapsible className="mt-2">
                  <AccordionItem value="suggestions">
                    <AccordionTrigger className="text-sm font-medium py-3">
                      Sugestões ({totalSuggestionCount})
                    </AccordionTrigger>
                    <AccordionContent>
                      <SuggestionList
                        suggestions={
                          grammarSuggestions.length > 0
                            ? grammarSuggestions
                            : toneSuggestions
                        }
                        isLoading={isLoading}
                        onAccept={handleAccept}
                        onDismiss={handleDismiss}
                        onResuggest={handleResuggest}
                        onToggleExcludedPhrase={handleToggleExcludedPhrase}
                        excludedPhrasesMap={excludedPhrasesMap}
                        onSwapAlternative={handleSwapAlternative}
                        appliedToneSuggestions={appliedToneSuggestions}
                        onUndoAppliedTone={handleUndoAppliedTone}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )
            ) : (
              <SuggestionList
                suggestions={
                  grammarSuggestions.length > 0
                    ? grammarSuggestions
                    : toneSuggestions
                }
                isLoading={isLoading}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
                onResuggest={handleResuggest}
                onToggleExcludedPhrase={handleToggleExcludedPhrase}
                excludedPhrasesMap={excludedPhrasesMap}
                onSwapAlternative={handleSwapAlternative}
                appliedToneSuggestions={appliedToneSuggestions}
                onUndoAppliedTone={handleUndoAppliedTone}
              />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
