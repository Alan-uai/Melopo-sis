"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Editor, EditorRef } from "@/components/editor";
import { SuggestionList } from "@/components/suggestion-list";
import { useToast } from "@/hooks/use-toast";
import React from 'react';
import { generateContextualSuggestions } from "@/ai/flows/generate-contextual-suggestions";
import { checkGrammarLocal } from "@/app/actions/check-grammar-local";
import { useSpellCheck } from "@/hooks/use-spell-check";
import type { Suggestion, SuggestionInput, SuggestionMode, TextStructure } from "@/ai/types";
import { useAuth, useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarItem, SidebarList, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider } from "@/components/ui/sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, LogOut, PlusCircle, LoaderCircle, Trash2, ArrowUpDown, ArrowDownAZ } from "lucide-react";
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import VoiceChatPanel from '@/components/voice-chat/voice-chat-panel';
import type { VoiceActionHandlers } from '@/components/voice-chat/types';
import { saveJobToLocal, generateJobId, hashText } from '@/lib/background-verification';
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
const MODEL_STORAGE_KEY = "melopoeisis_preferred_ai_model";

type Poem = {
  id: string;
  title?: string;
  text: string;
  tone: string;
  structure: TextStructure;
  rhyme: boolean;
  createdAt: any;
  updatedAt: any;
  grammarSuggestions?: Suggestion[];
  toneSuggestions?: Suggestion[];
  appliedToneSuggestions?: Suggestion[];
  appliedGrammarSuggestions?: Suggestion[];
  excludedPhrasesMap?: Record<string, string[]>;
  currentSuggestionIndex?: number | null;
  isSpellingAnalyzed?: boolean;
  forceSpellingRefresh?: boolean;
  activeJobId?: string;
  activeJobType?: 'grammar' | 'tone';
};

const LOCAL_DEBOUNCE_MS = 300;
const AI_DEBOUNCE_MS = 800;

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
  const [appliedGrammarSuggestions, setAppliedGrammarSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestionMode, setSuggestionMode] = useState<SuggestionMode>("final");

  const [preferredModel, setPreferredModel] = useState<string | null>(null);

  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState<number | null>(null);
  const [isSpellingAnalyzed, setIsSpellingAnalyzed] = useState(false);
  const [forceSpellingRefresh, setForceSpellingRefresh] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | undefined>(undefined);
  const [activeJobType, setActiveJobType] = useState<'grammar' | 'tone' | undefined>(undefined);
  const activeGrammarSuggestion = currentSuggestionIndex !== null ? grammarSuggestions[currentSuggestionIndex] : null;

  const [pastStates, setPastStates] = useState<string[]>([]);
  const [futureStates, setFutureStates] = useState<string[]>([]);
  const MAX_UNDO = 50;

  const [lastAcceptedOrigin, setLastAcceptedOrigin] = useState<string | null>(null);

  const [poemSearchQuery, setPoemSearchQuery] = useState("");
  const [poemFilterStructure, setPoemFilterStructure] = useState("");
  const [poemSortBy, setPoemSortBy] = useState<"updatedAt" | "title">("updatedAt");
  const [poemSortOrder, setPoemSortOrder] = useState<"asc" | "desc">("desc");

  const { toast } = useToast();
  const spellCheck = useSpellCheck();
  const editorRef = useRef<EditorRef>(null);
  const [excludedPhrasesMap, setExcludedPhrasesMap] = useState<Record<string, string[]>>({});

  const localTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const localCheckCacheRef = useRef<Map<string, Suggestion[]>>(new Map());
  const perfRef = useRef({
    localCheckCount: 0,
    localCacheHit: 0,
    localCacheMiss: 0,
    localCheckTotalMs: 0,
  });

  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const poemsCollection = useMemoFirebase(
    () => (user && firestore ? collection(firestore, `users/${user.uid}/poems`) : null),
    [firestore, user]
  );
  const { data: poems, isLoading: isLoadingPoems } = useCollection<Poem>(poemsCollection);

  const getLocalCheckCacheKey = useCallback((inputText: string) => {
    let hash = 0;
    for (let i = 0; i < inputText.length; i++) {
      const char = inputText.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `${textStructure}|${rhyme}|${hash.toString(36)}`;
  }, [textStructure, rhyme]);

  const runLocalCheckCached = useCallback(async (inputText: string) => {
    const cacheKey = getLocalCheckCacheKey(inputText);
    const cached = localCheckCacheRef.current.get(cacheKey);
    if (cached) {
      perfRef.current.localCheckCount += 1;
      perfRef.current.localCacheHit += 1;
      return cached;
    }

    const start = performance.now();
    const localResult = await checkGrammarLocal(inputText, textStructure, rhyme);
    const duration = performance.now() - start;
    perfRef.current.localCheckCount += 1;
    perfRef.current.localCacheMiss += 1;
    perfRef.current.localCheckTotalMs += duration;
    localCheckCacheRef.current.set(cacheKey, localResult.suggestions);
    if (localCheckCacheRef.current.size > 200) {
      const firstKey = localCheckCacheRef.current.keys().next().value;
      if (firstKey) localCheckCacheRef.current.delete(firstKey);
    }
    return localResult.suggestions;
  }, [getLocalCheckCacheKey, rhyme, textStructure]);

  const resetLocalCacheForCurrentConfig = useCallback(() => {
    const prefix = `${textStructure}|${rhyme}|`;
    for (const key of localCheckCacheRef.current.keys()) {
      if (key.startsWith(prefix)) {
        localCheckCacheRef.current.delete(key);
      }
    }
  }, [rhyme, textStructure]);

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
          const parsed = JSON.parse(savedData);
          const { text, title, tone: savedTone, textStructure: savedStructure, rhyme: savedRhyme, grammarSuggestions, toneSuggestions, appliedToneSuggestions, excludedPhrasesMap, currentSuggestionIndex, isSpellingAnalyzed, forceSpellingRefresh, activeJobId, activeJobType } = parsed;
          if (text) setText(text);
          if (title !== undefined) setPoemTitle(title);
          if (savedTone) setTone(savedTone);
          if (savedStructure) setTextStructure(savedStructure as TextStructure);
          if (savedRhyme !== undefined) setRhyme(savedRhyme);
          if (grammarSuggestions) setGrammarSuggestions(grammarSuggestions);
          if (toneSuggestions) setToneSuggestions(toneSuggestions);
          if (appliedToneSuggestions) setAppliedToneSuggestions(appliedToneSuggestions);
          if (parsed.appliedGrammarSuggestions) setAppliedGrammarSuggestions(parsed.appliedGrammarSuggestions);
          if (excludedPhrasesMap) setExcludedPhrasesMap(excludedPhrasesMap);
          if (currentSuggestionIndex !== undefined) setCurrentSuggestionIndex(currentSuggestionIndex);
          if (isSpellingAnalyzed !== undefined) setIsSpellingAnalyzed(isSpellingAnalyzed);
          if (forceSpellingRefresh !== undefined) setForceSpellingRefresh(forceSpellingRefresh);
          if (activeJobId !== undefined) setActiveJobId(activeJobId);
          if (activeJobType !== undefined) setActiveJobType(activeJobType);
        }
      } catch (error) {
        console.error("Falha ao ler do localStorage", error);
      }
    }
    setIsMounted(true);
  }, [activePoem]);

  useEffect(() => {
    const stored = localStorage.getItem(MODEL_STORAGE_KEY);
    if (stored) setPreferredModel(stored);
  }, []);

  useEffect(() => {
    if (isMounted && !activePoem) {
      try {
        const dataToSave = JSON.stringify({
          text, title: poemTitle, tone, textStructure, rhyme,
          grammarSuggestions, toneSuggestions, appliedToneSuggestions, appliedGrammarSuggestions,
          excludedPhrasesMap, currentSuggestionIndex, isSpellingAnalyzed, forceSpellingRefresh,
          activeJobId, activeJobType,
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, dataToSave);
      } catch (error) {
        console.error("Falha ao escrever no localStorage", error);
      }
    }
  }, [text, poemTitle, tone, textStructure, rhyme, isMounted, activePoem, grammarSuggestions, toneSuggestions, appliedToneSuggestions, appliedGrammarSuggestions, excludedPhrasesMap, currentSuggestionIndex, isSpellingAnalyzed, forceSpellingRefresh, activeJobId, activeJobType]);

  useEffect(() => {
    if (!isMounted) return;
    if (activeJobType === 'grammar' && activeJobId && grammarSuggestions.length === 0) {
      toast({
        title: "Verificação anterior não concluída",
        description: "A correção ortográfica não foi finalizada. Clique em 'Corrigir Ortografia' para tentar novamente.",
      });
    } else if (activeJobType === 'tone' && activeJobId && toneSuggestions.length === 0) {
      toast({
        title: "Análise de tom não concluída",
        description: "A análise de tom anterior não foi finalizada. Clique em 'Sugerir Tom' para tentar novamente.",
      });
    }
  }, [isMounted, activeJobType, activeJobId, grammarSuggestions.length, toneSuggestions.length, toast]);

  const loadPoem = (poem: Poem) => {
    setActivePoem(poem);
    setText(poem.text);
    setPoemTitle(poem.title || "");
    setTone(poem.tone);
    setTextStructure(poem.structure);
    setRhyme(poem.rhyme);
    setPastStates([]);
    setFutureStates([]);
    setGrammarSuggestions(poem.grammarSuggestions ?? []);
    setToneSuggestions(poem.toneSuggestions ?? []);
    setAppliedToneSuggestions(poem.appliedToneSuggestions ?? []);
    setAppliedGrammarSuggestions(poem.appliedGrammarSuggestions ?? []);
    setExcludedPhrasesMap(poem.excludedPhrasesMap ?? {});
    setCurrentSuggestionIndex(poem.currentSuggestionIndex ?? null);
    setIsSpellingAnalyzed(poem.isSpellingAnalyzed ?? false);
    setForceSpellingRefresh(poem.forceSpellingRefresh ?? false);
    setActiveJobId(poem.activeJobId ?? undefined);
    setActiveJobType(poem.activeJobType ?? undefined);
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
    setAppliedToneSuggestions([]);
    setAppliedGrammarSuggestions([]);
    setIsSpellingAnalyzed(false);
    setForceSpellingRefresh(false);
    setActiveJobId(undefined);
    setActiveJobType(undefined);
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
    suggestionType: 'grammar' | 'tone',
    suppressLoading?: boolean,
  ) => {
    const requestId = ++requestIdRef.current;
    if (!suppressLoading) setIsLoading(true);
    try {
      const currentText = text;
      const input: SuggestionInput = {
        text: currentText,
        tone: tone,
        structure: textStructure,
        rhyme: rhyme,
        suggestionType: suggestionType,
        excludedPhrases: [],
        preferredModel: preferredModel || undefined,
        forceRefresh: suggestionType === 'grammar' ? forceSpellingRefresh : undefined,
      };
      const result = await generateContextualSuggestions(input);

      if (requestId !== requestIdRef.current) return;
      if (text !== currentText) {
        if (!suppressLoading) {
          toast({
            title: "Texto alterado",
            description: "Você continuou a escrever. As sugestões foram descartadas.",
          });
        }
        if (!suppressLoading) setIsLoading(false);
        return;
      }

      if (result.modelUsed && result.modelUsed !== preferredModel) {
        setPreferredModel(result.modelUsed);
        localStorage.setItem(MODEL_STORAGE_KEY, result.modelUsed);
      }

      const withIds = result.suggestions.map((s, i) => ({
        ...s,
        id: s.id || `sug-${Date.now()}-${i}`,
      }));

      const poemId = activePoem?.id;
      saveJobToLocal({
        jobId: `ai_${Date.now()}`,
        poemId,
        type: suggestionType,
        status: 'completed',
        textHash: hashText(currentText),
        createdAt: Date.now(),
        completedAt: Date.now(),
        result: { suggestions: result.suggestions, modelUsed: result.modelUsed },
      });

      if (suggestionType === 'grammar') {
        setIsSpellingAnalyzed(true);
        setForceSpellingRefresh(false);
        setAppliedGrammarSuggestions([]);
        setGrammarSuggestions(withIds);
        setToneSuggestions([]);
        setCurrentSuggestionIndex(null);
        if (withIds.length > 0) {
          setCurrentSuggestionIndex(0);
          if (!suppressLoading) {
            toast({
              title: "Correções Ortográficas Encontradas",
              description: `Encontramos ${withIds.length} correções.`,
            });
          }
        } else {
          if (!suppressLoading) {
            toast({
              title: "Nenhum Erro Ortográfico",
              description: "Seu texto parece correto.",
            });
          }
        }
      } else {
        setToneSuggestions(withIds);
        setGrammarSuggestions([]);
        setCurrentSuggestionIndex(null);
        if (withIds.length > 0) {
          toast({
            title: "Sugestões de Tom e Estilo",
            description: `Encontramos ${withIds.length} sugestões para aprimorar seu poema.`,
          });
        } else {
          toast({
            title: "Nenhuma Sugestão de Estilo",
            description: "Seu texto parece ótimo!",
          });
        }
      }
    } catch (error: any) {
      if (requestId !== requestIdRef.current) return;
      console.error("Failed to generate suggestions:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Gerar Sugestões",
        description: error.message || "Não foi possível obter sugestões da IA. Verifique sua conexão ou tente novamente mais tarde.",
      });
    } finally {
      if (!suppressLoading) setIsLoading(false);
    }
  }, [text, tone, textStructure, rhyme, toast, preferredModel]);

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Servidor não respondeu em ${ms / 1000}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer!));
};

const handleCheckSpelling = async () => {
    if (!text.trim() || isLoading) return;
    setGrammarSuggestions([]);
    setToneSuggestions([]);
    setCurrentSuggestionIndex(null);

    setIsLoading(true);

    try {
      const result = await withTimeout(
        spellCheck.checkSpelling(text),
        30000
      );

      const suggestions: Suggestion[] = result.errors.map((err, i) => ({
        originalText: err.word,
        correctedText: err.suggestions[0] || err.word,
        explanation: err.suggestions.length > 0
          ? `Erro ortográfico: "${err.word}" não encontrado no dicionário. Sugestões: ${err.suggestions.join(', ')}.`
          : `Erro ortográfico: "${err.word}" não encontrado no dicionário.`,
        type: 'grammar',
        severity: 'alta',
        context: text.slice(Math.max(0, err.position - 20), err.position + err.word.length + 20),
        id: `sug-local-${Date.now()}-${i}`,
        alternatives: err.suggestions.map(s => ({ text: s, explanation: `Alternativa ortográfica para "${err.word}".` })),
      }));

      setIsSpellingAnalyzed(true);
      setForceSpellingRefresh(false);
      setAppliedGrammarSuggestions([]);
      setGrammarSuggestions(suggestions);
      setCurrentSuggestionIndex(suggestions.length > 0 ? 0 : null);

      if (suggestions.length > 0) {
        toast({
          title: "Correções Ortográficas Encontradas",
          description: `Encontramos ${suggestions.length} correções locais.`,
        });
      } else {
        toast({
          title: "Nenhum Erro Ortográfico",
          description: "Seu texto parece correto (checagem local).",
        });
      }
    } catch (error) {
      console.error("Falha na checagem local de ortografia:", error);
      toast({
        variant: "default",
        title: "Checagem local indisponível",
        description: "Usando IA como fallback...",
      });
      await generateSuggestions('grammar', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestTone = async () => {
    if (!text.trim() || isLoading) return;
    setGrammarSuggestions([]);
    setToneSuggestions([]);
    setCurrentSuggestionIndex(null);

    const jobId = `tone_${Date.now()}`;
    setActiveJobId(jobId);
    setActiveJobType('tone');

    try {
      await generateSuggestions('tone');
    } finally {
      setActiveJobId(undefined);
      setActiveJobType(undefined);
    }
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
      if (localTimerRef.current) clearTimeout(localTimerRef.current);
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);

      localTimerRef.current = setTimeout(() => {
        const reqId = ++requestIdRef.current;
        runLocalCheckCached(newText).then(localSuggestions => {
          if (reqId !== requestIdRef.current) return;
          if (localSuggestions.length > 0) {
            const withIds = localSuggestions.map((s, i) => ({
              ...s,
              id: s.id || `sug-${Date.now()}-${i}`,
            }));
            setGrammarSuggestions(withIds);
            setCurrentSuggestionIndex(0);
          }
        }).catch(() => {});
      }, LOCAL_DEBOUNCE_MS);

      aiTimerRef.current = setTimeout(() => {
        setIsLoading(true);
        generateContextualSuggestions({
          text: newText,
          tone: tone,
          structure: textStructure,
          rhyme: rhyme,
          suggestionType: 'grammar',
          excludedPhrases: [],
          preferredModel: preferredModel || undefined,
          forceRefresh: forceSpellingRefresh,
        }).then(result => {
          if (result.modelUsed && result.modelUsed !== preferredModel) {
            setPreferredModel(result.modelUsed);
            localStorage.setItem(MODEL_STORAGE_KEY, result.modelUsed);
          }
          const withIds = result.suggestions.map((s, i) => ({
            ...s,
            id: s.id || `sug-${Date.now()}-${i}`,
          }));
          setGrammarSuggestions(withIds);
          if (withIds.length > 0) {
            setCurrentSuggestionIndex(0);
          }
        }).catch(() => {}).finally(() => {
          setIsLoading(false);
        });
      }, AI_DEBOUNCE_MS);
    }
  };

  useEffect(() => {
    if (!isMounted) return;
    const warmupText = text.trim();
    if (warmupText.length < 4) return;
    runLocalCheckCached(warmupText).catch(() => {});
  }, [isMounted, text, runLocalCheckCached]);

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
      grammarSuggestions: grammarSuggestions,
      toneSuggestions: toneSuggestions,
      appliedToneSuggestions: appliedToneSuggestions,
      excludedPhrasesMap: excludedPhrasesMap,
      currentSuggestionIndex: currentSuggestionIndex,
      appliedGrammarSuggestions: appliedGrammarSuggestions,
      isSpellingAnalyzed: isSpellingAnalyzed,
      forceSpellingRefresh: forceSpellingRefresh,
      activeJobId: activeJobId,
      activeJobType: activeJobType,
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
    resetLocalCacheForCurrentConfig();
    handleConfigChange();
  };

  const handleTextStructureChange = (newStructure: TextStructure) => {
    setTextStructure(newStructure);
    resetLocalCacheForCurrentConfig();
    handleConfigChange();
  };

  const handleRhymeChange = (newRhyme: boolean) => {
    setRhyme(newRhyme);
    resetLocalCacheForCurrentConfig();
    handleConfigChange();
  };

  const advanceToNextSuggestion = useCallback(() => {
    if (currentSuggestionIndex !== null && currentSuggestionIndex < grammarSuggestions.length - 1) {
      setCurrentSuggestionIndex(currentSuggestionIndex + 1);
    } else {
      setCurrentSuggestionIndex(null);
      setGrammarSuggestions([]);
      setIsSpellingAnalyzed(false);
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

    setLastAcceptedOrigin(suggestionToAccept.originalText);

    if (suggestionToAccept.type === 'grammar') {
      setAppliedGrammarSuggestions(prev => [...prev, suggestionToAccept]);
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
            preferredModel: preferredModel || undefined,
            forceRefresh: true,
        };
        const result = await generateContextualSuggestions(input);

        if (result.modelUsed && result.modelUsed !== preferredModel) {
          setPreferredModel(result.modelUsed);
          localStorage.setItem(MODEL_STORAGE_KEY, result.modelUsed);
        }

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
    const alternatives = suggestionToSwap.alternatives;
    if (!alternatives || alternativeIndex >= alternatives.length) return;

    const swapId = suggestionToSwap.id;
    if (!swapId) return;

    const oldCorrectedText = suggestionToSwap.correctedText;
    const newCorrectedText = alternatives[alternativeIndex].text;
    const oldExplanation = suggestionToSwap.explanation;
    const newExplanation = alternatives[alternativeIndex].explanation;

    const updater = (s: Suggestion) => {
      if (s.id !== swapId) return s;
      const newAlternatives = [...(s.alternatives || [])];
      newAlternatives[alternativeIndex] = { text: oldCorrectedText, explanation: oldExplanation };
      return { ...s, correctedText: newCorrectedText, explanation: newExplanation, alternatives: newAlternatives };
    };

    if (suggestionToSwap.type === 'grammar') {
      setGrammarSuggestions(prev => prev.map(updater));
    } else {
      setToneSuggestions(prev => prev.map(updater));
    }
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

  const totalSuggestionCount = grammarSuggestions.length + toneSuggestions.length;
const hasAppliedSuggestions = appliedToneSuggestions.length > 0 || appliedGrammarSuggestions.length > 0;

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

  const voiceActions: VoiceActionHandlers = useMemo(() => ({
    setTitle: setPoemTitle,
    setTone: handleToneChange,
    setStructure: handleTextStructureChange,
    setRhyme: handleRhymeChange,
    appendText: (t: string) => setText(prev => prev + t),
    replaceText: setText,
    setSuggestionMode: handleSuggestionModeChange,
    newPoem: handleNewPoem,
    savePoem: handleSavePoem,
    copyPoem: handleCopy,
    checkSpelling: handleCheckSpelling,
    suggestTone: handleSuggestTone,
    undo: handleUndo,
    acceptSuggestion: () => {
      if (activeGrammarSuggestion) handleAccept(activeGrammarSuggestion);
      else if (toneSuggestions.length > 0) handleAccept(toneSuggestions[0]);
    },
    dismissSuggestion: () => {
      if (currentSuggestionIndex !== null) advanceToNextSuggestion();
    },
    getPoemContext: () => ({
      text, title: poemTitle, tone, structure: textStructure, rhyme,
      hasGrammarSuggestions: grammarSuggestions.length > 0,
      hasToneSuggestions: toneSuggestions.length > 0,
      grammarSuggestionCount: grammarSuggestions.length,
      toneSuggestionCount: toneSuggestions.length,
      poemList: (filteredPoems || []).map(p => ({ id: p.id, title: p.title || 'Sem título' })),
    }),
    loadPoemByTitle: (title: string) => {
      const poem = filteredPoems?.find(p =>
        p.title?.toLowerCase().includes(title.toLowerCase())
      );
      if (poem) { loadPoem(poem); return true; }
      return false;
    },
  }), [text, poemTitle, tone, textStructure, rhyme, handleToneChange, handleTextStructureChange, handleRhymeChange, handleNewPoem, handleSavePoem, handleCopy, handleCheckSpelling, handleSuggestTone, handleUndo, grammarSuggestions, toneSuggestions, activeGrammarSuggestion, handleAccept, currentSuggestionIndex, advanceToNextSuggestion, filteredPoems, loadPoem, setPoemTitle, handleSuggestionModeChange]);

  return (
    <>
    <SidebarProvider>
      <div className="flex h-full w-full">
        <Sidebar collapsible="offcanvas">
          <SidebarHeader>
            <h2 className="text-xl font-semibold">Meus Poemas</h2>
          </SidebarHeader>
          <SidebarContent className="p-2 preserve-3d perspective-near">
              <motion.div
                whileHover={{ rotateX: -5, z: 10 }}
                whileTap={{ scale: 0.97 }}
                style={{ transformStyle: "preserve-3d" } as any}
              >
                <Button
                  className="w-full relative overflow-hidden"
                  onClick={handleNewPoem}
                >
                  <motion.span
                    className="mr-2 inline-flex"
                    whileHover={{
                      rotate: [0, -15, 15, -5, 0],
                      scale: [1, 1.2, 1.1, 1],
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </motion.span>
                  Novo Poema
                </Button>
              </motion.div>
              <motion.div
                className="mt-3 space-y-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 25 }}
              >
                <div className="search-container">
                  <div className="glow" />
                  <div className="darkBorderBg" />
                  <div className="darkBorderBg" />
                  <div className="darkBorderBg" />
                  <div className="white" />
                  <div className="border" />
                  <div id="main">
                    <input
                      placeholder="Buscar poemas..."
                      type="text"
                      value={poemSearchQuery}
                      onChange={(e) => setPoemSearchQuery(e.target.value)}
                      className="input"
                    />
                    <div id="input-mask" />
                    <div id="pink-mask" />
                    <div className="filterBorder" />
                    <div id="filter-icon">
                      <svg preserveAspectRatio="none" height="27" width="27" viewBox="4.8 4.56 14.832 15.408" fill="none">
                        <path d="M8.16 6.65002H15.83C16.47 6.65002 16.99 7.17002 16.99 7.81002V9.09002C16.99 9.56002 16.7 10.14 16.41 10.43L13.91 12.64C13.56 12.93 13.33 13.51 13.33 13.98V16.48C13.33 16.83 13.1 17.29 12.81 17.47L12 17.98C11.24 18.45 10.2 17.92 10.2 16.99V13.91C10.2 13.5 9.97 12.98 9.73 12.69L7.52 10.36C7.23 10.08 7 9.55002 7 9.20002V7.87002C7 7.17002 7.52 6.65002 8.16 6.65002Z" stroke="#d6d6e6" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </div>
                    <div id="search-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" height="24" fill="none">
                        <circle stroke="url(#search)" r="8" cy="11" cx="11" />
                        <line stroke="url(#searchl)" y2="16.65" y1="22" x2="16.65" x1="22" />
                        <defs>
                          <linearGradient gradientTransform="rotate(50)" id="search">
                            <stop stop-color="#f8e7f8" offset="0%" />
                            <stop stop-color="#b6a9b7" offset="50%" />
                          </linearGradient>
                          <linearGradient id="searchl">
                            <stop stop-color="#b6a9b7" offset="0%" />
                            <stop stop-color="#837484" offset="50%" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
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
              </motion.div>
              <AnimatePresence mode="popLayout">
              <SidebarMenu className="mt-4 preserve-3d perspective-near">
              {isLoadingPoems && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-muted-foreground p-2"
                >
                  Carregando...
                </motion.p>
              )}
              {!isLoadingPoems && filteredPoems?.map((poem, idx) => {
                // Stable random angle per poem id for shelf variety
                const hashCode = poem.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                const shelfAngle = ((hashCode % 7) - 3) * 0.8; // -2.4 to +2.4 degrees
                return (
                <motion.div
                  key={poem.id}
                  layout
                  initial={{ rotateX: 80, rotateZ: shelfAngle * 2, opacity: 0, x: 40, y: 20 }}
                  animate={{
                    rotateX: 0,
                    rotateZ: shelfAngle,
                    opacity: 1,
                    x: 0,
                    y: 0,
                    transition: {
                      rotateX: { type: "spring", stiffness: 180, damping: 22, delay: idx * 0.035 },
                      rotateZ: { type: "spring", stiffness: 180, damping: 22, delay: idx * 0.035 },
                      opacity: { duration: 0.2, delay: idx * 0.035 },
                      x: { type: "spring", stiffness: 180, damping: 22, delay: idx * 0.035 },
                      y: { type: "spring", stiffness: 180, damping: 22, delay: idx * 0.035 },
                    },
                  }}
                  exit={{
                    rotateX: 60,
                    rotateZ: 10,
                    opacity: 0,
                    scale: 0.7,
                    y: 30,
                    x: -10,
                    transition: { duration: 0.3, ease: "easeIn" },
                  }}
                  whileHover={{
                    z: 20,
                    rotateX: -2,
                    rotateY: 4,
                    scale: 1.02,
                    transition: { type: "spring", stiffness: 300, damping: 20 },
                  }}
                  className="preserve-3d"
                  style={{
                    transformStyle: "preserve-3d" as any,
                    transformOrigin: "left center",
                  }}
                >
                  <SidebarMenuItem>
                    <div className="flex items-center w-full gap-1 relative">
                      {/* Book spine glow on hover */}
                      <motion.div
                        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r"
                        style={{ backgroundColor: "hsl(var(--accent))" }}
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 0.4, width: 2 }}
                        transition={{ duration: 0.2 }}
                      />
                      <SidebarMenuButton
                          className="flex-1 justify-start truncate"
                          onClick={() => loadPoem(poem)}
                          isActive={activePoem?.id === poem.id}
                      >
                        {poem.title || "Poema sem título"}
                      </SidebarMenuButton>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <motion.div
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </motion.div>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir poema</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir "{poem.title || 'Poema sem título'}"?
                              Esta ação não pode ser feita.
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
                </motion.div>
                );
              })}
              {!isLoadingPoems && (!filteredPoems || filteredPoems.length === 0) && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-muted-foreground p-2 text-center"
                  >
                    {poemSearchQuery || poemFilterStructure ? "Nenhum poema encontrado." : "Nenhum poema salvo."}
                  </motion.p>
              )}
              </SidebarMenu>
              </AnimatePresence>
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
          <div className="w-full overflow-y-auto p-2 sm:p-4 flex flex-col lg:grid lg:grid-cols-2 gap-4 items-start mx-auto max-w-6xl">
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
              lastAcceptedOrigin={lastAcceptedOrigin}
              isSpellingAnalyzed={isSpellingAnalyzed}
              onToggleSpellingAnalyzed={() => {
                setIsSpellingAnalyzed(prev => !prev);
                setForceSpellingRefresh(prev => !prev);
              }}
            />
            <div className="w-full">
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
                appliedToneSuggestions={[...appliedGrammarSuggestions, ...appliedToneSuggestions]}
                onUndoAppliedTone={handleUndoAppliedTone}
                totalSuggestionCount={totalSuggestionCount}
                hasAppliedSuggestions={hasAppliedSuggestions}
              />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
    <VoiceChatPanel actions={voiceActions} />
    </>
  );
}
