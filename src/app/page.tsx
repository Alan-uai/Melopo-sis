"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Editor, EditorRef } from "@/components/editor";
import { SuggestionList } from "@/components/suggestion-list";
import { useToast } from "@/hooks/use-toast";
import React from 'react';
import { generateContextualSuggestions } from "@/ai/flows/generate-contextual-suggestions";
import type { Suggestion, SuggestionInput, SuggestionMode, TextStructure } from "@/ai/types";

const LOCAL_STORAGE_KEY = "melopoeisis_data";

export default function Home() {
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

  useEffect(() => {
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
      console.error("Failed to read from localStorage", error);
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        const dataToSave = JSON.stringify({ text, tone, textStructure, rhyme });
        localStorage.setItem(LOCAL_STORAGE_KEY, dataToSave);
      } catch (error) {
        console.error("Failed to write to localStorage", error);
      }
    }
  }, [text, tone, textStructure, rhyme, isMounted]);

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
    setText("");
    resetSuggestions();
    toast({
      title: "Editor Limpo",
      description: "O conteúdo do editor foi apagado.",
    });
  };
  
  const handleSavePoem = () => {
    // TODO: Implement save poem functionality
    toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A capacidade de salvar poemas permanentemente será adicionada em breve.",
    });
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

  const advanceToNextSuggestion = async () => {
    let nextIndex: number | null = null;
    if (currentSuggestionIndex !== null && currentSuggestionIndex < grammarSuggestions.length - 1) {
      nextIndex = currentSuggestionIndex + 1;
    }
    setCurrentSuggestionIndex(nextIndex);
  
    if (nextIndex === null) {
      setGrammarSuggestions([]); 
      
      if (grammarSuggestions.length > 0) {
        toast({
            title: "Correções Gramaticais Concluídas!",
            description: "Buscando sugestões de estilo para o texto corrigido...",
        });
        await generateSuggestions('tone');
      }
    }
  };
  

  const applyCorrection = (originalText: string, correctedText: string) => {
    setText(prevText => {
      const newText = prevText.replace(originalText, correctedText);
      return newText;
    });
    advanceToNextSuggestion();
  };
  
  const handleAccept = (suggestionToAccept: Suggestion) => {
    if (!suggestionToAccept) return;
    
    if (suggestionToAccept.type === 'grammar') {
      applyCorrection(suggestionToAccept.originalText, suggestionToAccept.correctedText);
    } else {
      setText(text.replace(suggestionToAccept.originalText, suggestionToAccept.correctedText));
      setToneSuggestions(current => current.filter(s => s.originalText !== suggestionToAccept.originalText));
    }
  };

  const handleDismiss = (suggestionToDismiss: Suggestion) => {
    if (!suggestionToDismiss) return;
    if (suggestionToDismiss.type === 'grammar') {
      advanceToNextSuggestion();
    } else {
      setToneSuggestions(current => current.filter(s => s.originalText !== suggestionToDismiss.originalText));
    }
  };
  
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
    <div className="w-full min-h-screen p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
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
    </div>
  );
}
