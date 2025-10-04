"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Editor, EditorRef } from "@/components/editor";
import { SuggestionList } from "@/components/suggestion-list";
import { useToast } from "@/hooks/use-toast";
import React from 'react';
import { generateContextualSuggestions } from "@/ai/flows/generate-contextual-suggestions";
import type { Suggestion, SuggestionInput, SuggestionMode, TextStructure } from "@/ai/types";

// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      clearTimeout(timeout);
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

export default function Home() {
  const [text, setText] = useState<string>("");
  const [tone, setTone] = useState<string>("Melancólico");
  const [textStructure, setTextStructure] = useState<TextStructure>("poema");
  const [rhyme, setRhyme] = useState<boolean>(false);
  const [grammarSuggestions, setGrammarSuggestions] = useState<Suggestion[]>([]);
  const [toneSuggestions, setToneSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestionMode, setSuggestionMode] = useState<SuggestionMode>("gradual");
  const [activeGrammarSuggestion, setActiveGrammarSuggestion] = useState<Suggestion | null>(null);
  const { toast } = useToast();
  const editorRef = useRef<EditorRef>(null);
  const [excludedPhrasesMap, setExcludedPhrasesMap] = useState<Record<string, string[]>>({});

  const generateSuggestions = useCallback(async (
    currentText: string,
    currentTone: string,
    currentStructure: TextStructure,
    currentRhyme: boolean,
    suggestionType: 'all' | 'grammar' | 'tone',
    excludedPhrases?: string[]
  ) => {
    setIsLoading(true);
    try {
      const input: SuggestionInput = {
        text: currentText,
        tone: currentTone,
        structure: currentStructure,
        rhyme: currentRhyme,
        suggestionType: suggestionType,
        excludedPhrases: excludedPhrases || [],
      };
      const result = await generateContextualSuggestions(input);
      return result;
    } catch (error: any) {
      console.error("Failed to generate suggestions:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Gerar Sugestões",
        description: error.message.includes('503') 
          ? "O modelo de IA está sobrecarregado. Por favor, tente novamente em alguns instantes."
          : "Não foi possível obter sugestões da IA. Verifique sua conexão ou tente novamente mais tarde.",
      });
      return { suggestions: [] };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const fetchAndSetGradualSuggestions = useCallback(async (fetchText: string, currentTone: string, currentStructure: TextStructure, currentRhyme: boolean) => {
    if (!fetchText.trim()) {
        setGrammarSuggestions([]);
        setToneSuggestions([]);
        return;
    }

    const result = await generateSuggestions(fetchText, currentTone, currentStructure, currentRhyme, 'all');
    
    const newGrammarSuggestions = result.suggestions.filter(s => s.type === 'grammar');
    const newToneSuggestions = result.suggestions.filter(s => s.type === 'tone');
    
    setGrammarSuggestions(newGrammarSuggestions);
    if (newGrammarSuggestions.length > 0) {
        setToneSuggestions([]);
    } else {
        setToneSuggestions(newToneSuggestions);
    }
  }, [generateSuggestions]);


  const debouncedFetchGradualSuggestions = useCallback(debounce((...args: Parameters<typeof fetchAndSetGradualSuggestions>) => fetchAndSetGradualSuggestions(...args), 1500), [fetchAndSetGradualSuggestions]);

  const handleTextChange = (newText: string) => {
    setText(newText);
    
    if (suggestionMode === "gradual") {
      const cursorPosition = editorRef.current?.getCursorPosition();
      const currentLine = editorRef.current?.getCurrentLine(newText, cursorPosition) ?? "";
      // debouncedFetchGradualSuggestions(currentLine, tone, textStructure, rhyme);
    }
  };

  const handleSuggestionModeChange = (mode: SuggestionMode) => {
    setSuggestionMode(mode);
    setGrammarSuggestions([]);
    setToneSuggestions([]);
    setActiveGrammarSuggestion(null);
  };
  
  const handleGenerateFinalSuggestions = async () => {
    if (suggestionMode !== 'final' || !text.trim() || isLoading) return;
  
    const result = await generateSuggestions(text, tone, textStructure, rhyme, 'all');
    
    const newGrammarSuggestions = result.suggestions.filter(s => s.type === 'grammar');
    const newToneSuggestions = result.suggestions.filter(s => s.type === 'tone');
    
    // Prioritize grammar suggestions. Only show tone suggestions if no grammar issues are found.
    if (newGrammarSuggestions.length > 0) {
      setGrammarSuggestions(newGrammarSuggestions);
      setToneSuggestions([]);
      toast({
        title: "Correções Gramaticais Encontradas",
        description: `Encontramos ${newGrammarSuggestions.length} correções para seu texto.`,
      });
    } else if (newToneSuggestions.length > 0) {
      setGrammarSuggestions([]);
      setToneSuggestions(newToneSuggestions);
      toast({
        title: "Sugestões de Tom e Estilo",
        description: `Encontramos ${newToneSuggestions.length} sugestões para aprimorar seu poema.`,
      });
    } else {
      setGrammarSuggestions([]);
      setToneSuggestions([]);
      toast({
        title: "Nenhuma Sugestão Encontrada",
        description: "Seu texto parece ótimo! Nenhuma correção ou sugestão foi necessária.",
      });
    }
  };
  
  const handleConfigChange = () => {
    setGrammarSuggestions([]);
    setToneSuggestions([]);
    setActiveGrammarSuggestion(null);
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

  const handleAccept = (suggestionToAccept: Suggestion) => {
    if (!suggestionToAccept) return;
    const newText = text.replace(suggestionToAccept.originalText, suggestionToAccept.correctedText);
    setText(newText);
    
    // Remove the accepted suggestion from the list without re-fetching
    if (suggestionToAccept.type === 'grammar') {
        setGrammarSuggestions((currentSuggestions) =>
            currentSuggestions.filter((s) => s.originalText !== suggestionToAccept.originalText)
        );
        setActiveGrammarSuggestion(null);
    } else {
        setToneSuggestions((currentSuggestions) =>
            currentSuggestions.filter((s) => s.originalText !== suggestionToAccept.originalText)
        );
    }
  };

  const handleDismiss = (suggestionToDismiss: Suggestion) => {
    if (!suggestionToDismiss) return;
    if (suggestionToDismiss.type === 'grammar') {
        setGrammarSuggestions((currentSuggestions) =>
          currentSuggestions.filter((s) => s.originalText !== suggestionToDismiss.originalText)
        );
        setActiveGrammarSuggestion(null);
    } else {
        setToneSuggestions((currentSuggestions) =>
          currentSuggestions.filter((s) => s.originalText !== suggestionToDismiss.originalText)
        );
    }
  };

  const checkActiveSuggestion = useCallback(() => {
    const cursorPosition = editorRef.current?.getCursorPosition();
    if (cursorPosition === null || !grammarSuggestions.length) {
        if (activeGrammarSuggestion) setActiveGrammarSuggestion(null);
        return;
    }

    const activeSuggestion = grammarSuggestions.find(suggestion => {
        const startIndex = text.indexOf(suggestion.originalText);
        if (startIndex === -1) return false;
        const endIndex = startIndex + suggestion.originalText.length;
        return cursorPosition >= startIndex && cursorPosition <= endIndex;
    });

    if (activeSuggestion) {
      if (activeGrammarSuggestion?.originalText !== activeSuggestion.originalText) {
        setActiveGrammarSuggestion(activeSuggestion);
      }
    } else {
      if (activeGrammarSuggestion) {
        setActiveGrammarSuggestion(null);
      }
    }
  }, [text, grammarSuggestions, activeGrammarSuggestion]);


  useEffect(() => {
    const handler = setTimeout(checkActiveSuggestion, 100);
    return () => clearTimeout(handler);
  }, [text, checkActiveSuggestion]);

  const handleResuggest = async (suggestionToResuggest: Suggestion) => {
    const excludedPhrases = excludedPhrasesMap[suggestionToResuggest.originalText] || [];

    const result = await generateSuggestions(
      suggestionToResuggest.originalText,
      tone,
      textStructure,
      rhyme,
      suggestionToResuggest.type,
      excludedPhrases
    );

    const newSuggestion = result.suggestions[0];

    if (newSuggestion) {
        if (suggestionToResuggest.type === 'grammar') {
            setGrammarSuggestions(current => current.map(s => s.originalText === suggestionToResuggest.originalText ? newSuggestion : s));
            setActiveGrammarSuggestion(newSuggestion);
        } else {
            setToneSuggestions(current => current.map(s => s.originalText === suggestionToResuggest.originalText ? newSuggestion : s));
        }
    } else {
        toast({
            variant: "destructive",
            title: "Não foi possível gerar uma nova sugestão.",
        });
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
          onCursorChange={checkActiveSuggestion}
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
          onFinalSuggestion={handleGenerateFinalSuggestions}
          onSuggestionClick={setActiveGrammarSuggestion}
        />
        <SuggestionList
          suggestions={toneSuggestions}
          isLoading={isLoading && grammarSuggestions.length === 0} 
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
