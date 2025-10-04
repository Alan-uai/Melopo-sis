"use client";

import { useState, useCallback, useRef } from "react";
import { Editor, EditorRef } from "@/components/editor";
import { SuggestionList } from "@/components/suggestion-list";
import { useToast } from "@/hooks/use-toast";
import React from 'react';
import { generateContextualSuggestions } from "@/ai/flows/generate-contextual-suggestions";
import type { Suggestion, SuggestionInput, SuggestionMode, TextStructure } from "@/ai/types";

export default function Home() {
  const [text, setText] = useState<string>("");
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

  const generateSuggestions = useCallback(async (
    suggestionType: 'grammar' | 'tone'
  ) => {
    setIsLoading(true);
    try {
      const input: SuggestionInput = {
        text: text,
        tone: tone,
        structure: textStructure,
        rhyme: rhyme,
        suggestionType: suggestionType,
        excludedPhrases: [], // Excluded phrases handled client-side for resuggestions for now
      };
      const result = await generateContextualSuggestions(input);
      
      if (suggestionType === 'grammar') {
        setGrammarSuggestions(result.suggestions);
        if (result.suggestions.length > 0) {
          setCurrentSuggestionIndex(0);
          toast({
            title: "Correções Gramaticais Encontradas",
            description: `Encontramos ${result.suggestions.length} correções. Siga o guia para revisá-las.`,
          });
        } else {
            // If no grammar mistakes, we can inform the user or directly fetch tone suggestions
            toast({
              title: "Nenhuma Correção Gramatical Necessária",
              description: "Seu texto parece gramaticalmente correto. Buscando sugestões de estilo...",
            });
            return { grammarSuggestionsFound: false };
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
      return { grammarSuggestionsFound: result.suggestions.length > 0 };
    } catch (error: any) {
      console.error("Failed to generate suggestions:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Gerar Sugestões",
        description: error.message.includes('503') 
          ? "O modelo de IA está sobrecarregado. Por favor, tente novamente em alguns instantes."
          : "Não foi possível obter sugestões da IA. Verifique sua conexão ou tente novamente mais tarde.",
      });
      return { grammarSuggestionsFound: false };
    } finally {
      setIsLoading(false);
    }
  }, [text, tone, textStructure, rhyme, toast]);
  
  const handleGenerateSuggestions = async () => {
    if (!text.trim() || isLoading) return;

    // Reset all previous suggestions
    setGrammarSuggestions([]);
    setToneSuggestions([]);
    setCurrentSuggestionIndex(null);

    // First, always check for grammar mistakes
    const { grammarSuggestionsFound } = await generateSuggestions('grammar');
    
    // If no grammar mistakes were found, fetch tone suggestions
    if (!grammarSuggestionsFound) {
      await generateSuggestions('tone');
    }
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

  const advanceToNextSuggestion = () => {
    if (currentSuggestionIndex !== null && currentSuggestionIndex < grammarSuggestions.length - 1) {
      setCurrentSuggestionIndex(currentSuggestionIndex + 1);
    } else {
      // Last suggestion handled
      setCurrentSuggestionIndex(null);
      setGrammarSuggestions([]); // Clear list
      toast({
        title: "Correções Gramaticais Concluídas!",
        description: "Clique em 'Gerar Sugestões' novamente para obter dicas de estilo.",
      });
    }
  };

  const applyCorrection = (originalText: string, correctedText: string) => {
    setText(currentText => currentText.replace(originalText, correctedText));
    advanceToNextSuggestion();
  };

  const handleAccept = (suggestionToAccept: Suggestion) => {
    if (!suggestionToAccept) return;
    
    if (suggestionToAccept.type === 'grammar') {
      applyCorrection(suggestionToAccept.originalText, suggestionToAccept.correctedText);
    } else {
      // Handle tone suggestion acceptance (replace and remove from list)
      setText(text.replace(suggestionToAccept.originalText, suggestionToAccept.correctedText));
      setToneSuggestions(current => current.filter(s => s.originalText !== suggestionToAccept.originalText));
    }
  };

  const handleDismiss = (suggestionToDismiss: Suggestion) => {
    if (!suggestionToDismiss) return;
    if (suggestionToDismiss.type === 'grammar') {
      advanceToNextSuggestion();
    } else {
      // Handle tone suggestion dismissal (just remove from list)
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
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
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
        />
        <SuggestionList
          suggestions={toneSuggestions}
          isLoading={isLoading && grammarSuggestions.length === 0 && toneSuggestions.length === 0}
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
