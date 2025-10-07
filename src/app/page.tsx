"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Editor, EditorRef } from "@/components/editor";
import { SuggestionList } from "@/components/suggestion-list";
import { useToast } from "@/hooks/use-toast";
import React from 'react';
import { generateContextualSuggestions } from "@/ai/flows/generate-contextual-suggestions";
import type { Suggestion, SuggestionInput, SuggestionMode, TextStructure } from "@/ai/types";
import { useAuth, useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarItem, SidebarList, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider } from "@/components/ui/sidebar";
import { LogIn, LogOut, PlusCircle, LoaderCircle } from "lucide-react";
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';

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

export default function Home() {
  const [activePoem, setActivePoem] = useState<Poem | null>(null);
  const [text, setText] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [tone, setTone] = useState<string>("Melancólico");
  const [textStructure, setTextStructure] = useState<TextStructure>("poema");
  const [rhyme, setRhyme] = useState<boolean>(false);
  const [grammarSuggestions, setGrammarSuggestions] = useState<Suggestion[]>([]);
  const [toneSuggestions, setToneSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestionMode, setSuggestionMode] = useState<SuggestionMode>("final");
  
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState<number | null>(null);
  const activeGrammarSuggestion = currentSuggestionIndex !== null ? grammarSuggestions[currentSuggestionIndex] : null;

  const { toast } = useToast();
  const editorRef = useRef<EditorRef>(null);
  const [excludedPhrasesMap, setExcludedPhrasesMap] = useState<Record<string, string[]>>({});

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
          const { text, tone, textStructure, rhyme } = JSON.parse(savedData);
          if (text) setText(text);
          if (tone) setTone(tone);
          if (textStructure) setTextStructure(textStructure);
          if (rhyme !== undefined) setRhyme(rhyme);
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
        const dataToSave = JSON.stringify({ text, tone, textStructure, rhyme });
        localStorage.setItem(LOCAL_STORAGE_KEY, dataToSave);
      } catch (error) {
        console.error("Falha ao escrever no localStorage", error);
      }
    }
  }, [text, tone, textStructure, rhyme, isMounted, activePoem]);

  const loadPoem = (poem: Poem) => {
    setActivePoem(poem);
    setText(poem.text);
    setTone(poem.tone);
    setTextStructure(poem.structure);
    setRhyme(poem.rhyme);
    resetSuggestions();
    toast({
      title: "Poema Carregado",
      description: `"${poem.title || 'Poema sem título'}" carregado no editor.`,
    });
  };

  const handleNewPoem = () => {
    setActivePoem(null);
    setText("");
    setTone("Melancólico");
    setTextStructure("poema");
    setRhyme(false);
    resetSuggestions();
    editorRef.current?.focus();
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
          description: "Você continuou a escrever. As sugestões foram descartadas. Clique para gerar novamente quando estiver pronto.",
        });
        setIsLoading(false); // Make sure to stop loading
        return; 
      }

      if (suggestionType === 'grammar') {
        setGrammarSuggestions(result.suggestions);
        if (result.suggestions.length > 0) {
          setCurrentSuggestionIndex(0);
          toast({
            title: "Correções Gramaticais Encontradas",
            description: `Encontramos ${result.suggestions.length} correções. Siga o guia para revisá-las.`,
          });
        } else {
            toast({
              title: "Nenhuma Correção Gramatical Necessária",
              description: "Seu texto parece gramaticalmente correto. Buscando sugestões de estilo...",
            });
            await generateSuggestions('tone');
            return; // Important to return here to not set isLoading to false twice
        }
      } else { // tone
        setToneSuggestions(result.suggestions);
        if (result.suggestions.length > 0) {
          toast({
            title: "Sugestões de Tom e Estilo",
            description: `Encontramos ${result.suggestions.length} sugestões para aprimorar seu poema.`,
          });
        } else {
          toast({
            title: "Nenhuma Sugestão de Estilo Encontrada",
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
  
  const handleGenerateSuggestions = async () => {
    if (!text.trim() || isLoading) return;

    setGrammarSuggestions([]);
    setToneSuggestions([]);
    setCurrentSuggestionIndex(null);

    await generateSuggestions('grammar');
  };
  
  const resetSuggestions = () => {
    setGrammarSuggestions([]);
    setToneSuggestions([]);
    setCurrentSuggestionIndex(null);
  }

  const handleTextChange = (newText: string) => {
    setText(newText);
    resetSuggestions();
  };

  const handleClear = () => {
    handleNewPoem();
    toast({
      title: "Editor Limpo",
      description: "O conteúdo do editor foi apagado.",
    });
  };
  
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

    let poemTitle = activePoem?.title;
    if (!poemTitle) {
      poemTitle = text.split('\n')[0].trim().substring(0, 50) || "Poema sem título";
    }

    const poemData = {
      title: poemTitle,
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
        // Update existing poem
        if (!firestore) return;
        const poemRef = doc(firestore, `users/${user.uid}/poems`, activePoem.id);
        updateDocumentNonBlocking(poemRef, poemData);
        toast({
          title: "Poema Atualizado!",
          description: `"${poemTitle}" foi atualizado com sucesso.`,
        });
      } else {
        // Create new poem
        const docRef = await addDocumentNonBlocking(poemsCollection, {
          ...poemData,
          createdAt: serverTimestamp(),
        });
        if(docRef) {
          setActivePoem({ id: docRef.id, ...poemData, createdAt: new Date(), updatedAt: new Date() });
        }
        toast({
          title: "Poema Salvo!",
          description: `"${poemTitle}" foi salvo em sua coleção.`,
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
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Texto Copiado!",
        description: "O conteúdo do poema foi copiado para a área de transferência.",
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
  }

  const handleToneChange = (newTone: string) => {
    setTone(newTone);
    handleConfigChange();
  }

  const handleTextStructureChange = (newStructure: TextStructure) => {
    setTextStructure(newStructure);
    handleConfigChange();
  }

  const handleRhymeChange = (newRhyme: boolean) => {
    setRhyme(newRhyme);
    handleConfigChange();
  }

  const advanceToNextSuggestion = useCallback(async () => {
    let nextIndex: number | null = null;
    if (currentSuggestionIndex !== null && currentSuggestionIndex < grammarSuggestions.length - 1) {
      nextIndex = currentSuggestionIndex + 1;
    }
    setCurrentSuggestionIndex(nextIndex);
  
    // If we just finished the last grammar suggestion
    if (nextIndex === null && grammarSuggestions.length > 0 && currentSuggestionIndex === grammarSuggestions.length - 1) {
      setGrammarSuggestions([]); 
      
      toast({
          title: "Correções Gramaticais Concluídas!",
          description: "Buscando sugestões de estilo para o texto corrigido...",
      });
      // Await the generation of tone suggestions
      await generateSuggestions('tone');
    }
  }, [currentSuggestionIndex, grammarSuggestions.length, generateSuggestions, toast]);
  

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
      setText(prevText => prevText.replace(suggestionToAccept.originalText, suggestionToAccept.correctedText));
      setToneSuggestions(current => current.filter(s => s.originalText !== suggestionToAccept.originalText));
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
            text: suggestionToResuggest.originalText,
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
              <SidebarMenu className="mt-4">
              {isLoadingPoems && <p className="text-sm text-muted-foreground p-2">Carregando...</p>}
              {!isLoadingPoems && poems?.map(poem => (
                  <SidebarMenuItem key={poem.id}>
                      <SidebarMenuButton
                          className="w-full justify-start"
                          variant="ghost"
                          size="sm"
                          onClick={() => loadPoem(poem)}
                          isActive={activePoem?.id === poem.id}
                      >
                        {poem.title || "Poema sem título"}
                      </SidebarMenuButton>
                  </SidebarMenuItem>
              ))}
              {!isLoadingPoems && poems?.length === 0 && (
                  <p className="text-sm text-muted-foreground p-2 text-center">Nenhum poema salvo.</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start w-full overflow-y-auto p-4">
            <Editor
              ref={editorRef}
              text={text}
              onTextChange={handleTextChange}
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
              onFinalSuggestion={handleGenerateSuggestions}
              onClear={handleClear}
              onCopy={handleCopy}
              onSavePoem={handleSavePoem}
              isPoemSaved={!!activePoem}
              toneSuggestions={toneSuggestions}
            />
            <SuggestionList
              suggestions={toneSuggestions}
              isLoading={isLoading}
              onAccept={handleAccept}
              onDismiss={handleDismiss}
              onResuggest={handleResuggest}
              onToggleExcludedPhrase={handleToggleExcludedPhrase}
              excludedPhrasesMap={excludedPhrasesMap}
            />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
