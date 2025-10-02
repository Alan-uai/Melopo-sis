"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Editor, EditorRef } from "@/components/editor";
import { SuggestionList } from "@/components/suggestion-list";
import { generateContextualSuggestions } from "@/ai/flows/generate-contextual-suggestions";
import type { GenerateContextualSuggestionsInput, GenerateContextualSuggestionsOutput } from "@/ai/flows/generate-contextual-suggestions";
import { useToast } from "@/hooks/use-toast";
import React from 'react';

export type Suggestion = GenerateContextualSuggestionsOutput["suggestions"][0];
export type SuggestionMode = "gradual" | "final";
export type TextStructure = GenerateContextualSuggestionsInput["textStructure"];


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
    suggestionType: 'all' | 'grammar' | 'tone',
    excludedPhrases?: string[]
  ): Promise<GenerateContextualSuggestionsOutput> => {
    if (!currentText.trim()) {
      return { suggestions: [] };
    }
  
    try {
      const result = await generateContextualSuggestions({ 
        text: currentText, 
        tone: currentTone,
        textStructure: currentStructure,
        suggestionType,
        excludedPhrases
      });
      return result;
    } catch (error) {
      console.error(`Error generating suggestions:`, error);
      toast({
        title: `Erro ao Gerar Sugestões`,
        description:
          "Houve um problema ao se comunicar com a IA. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
      return { suggestions: [] };
    }
  }, [toast]);

  const fetchAllSuggestions = useCallback(async (currentText: string, currentTone: string, currentStructure: TextStructure) => {
    if (!currentText.trim()) {
        setGrammarSuggestions([]);
        setToneSuggestions([]);
        return;
    }

    setIsLoading(true);
    // Request 'all' suggestions. The AI prompt will prioritize grammar.
    const result = await generateSuggestions(currentText, currentTone, currentStructure, 'all');

    const newGrammarSuggestions = result.suggestions.filter(s => s.type === 'grammar');
    const newToneSuggestions = result.suggestions.filter(s => s.type === 'tone');
    
    if (suggestionMode === "gradual") {
        const otherLinesSuggestions = grammarSuggestions.filter(s => !currentText.includes(s.originalText));
        const uniqueNewSuggestions = newGrammarSuggestions.filter(ns => !otherLinesSuggestions.some(os => os.originalText === ns.originalText));
        setGrammarSuggestions([...otherLinesSuggestions, ...uniqueNewSuggestions]);
        
        // If there are grammar suggestions for the current line, don't show tone suggestions
        if (newGrammarSuggestions.length > 0) {
            setToneSuggestions([]);
        } else {
            setToneSuggestions(newToneSuggestions);
        }
    } else { // final mode
        setGrammarSuggestions(newGrammarSuggestions);
         // If there are grammar suggestions for the full text, don't show tone suggestions
        if (newGrammarSuggestions.length > 0) {
            setToneSuggestions([]);
        } else {
            setToneSuggestions(newToneSuggestions);
        }
    }


    setIsLoading(false);
  }, [generateSuggestions, suggestionMode, grammarSuggestions]);


  const debouncedFetchAllSuggestions = useCallback(debounce(fetchAllSuggestions, 2000), [fetchAllSuggestions]);


  const handleTextChange = (newText: string) => {
    const oldText = text;
    setText(newText);
    
    const isPaste = (newText.length - oldText.length) > 20 || newText.split('\n').length > oldText.split('\n').length + 1;

    if (suggestionMode === "gradual") {
      if (isPaste) {
        debouncedFetchAllSuggestions(newText, tone, textStructure);
      } else {
        const cursorPosition = editorRef.current?.getCursorPosition();
        const currentLine = editorRef.current?.getCurrentLine(newText, cursorPosition) ?? "";
        debouncedFetchAllSuggestions(currentLine, tone, textStructure);
      }
    } else {
      if (toneSuggestions.length > 0) setToneSuggestions([]);
      if (grammarSuggestions.length > 0) setGrammarSuggestions([]);
    }
  };

  const handleSuggestionModeChange = (mode: SuggestionMode) => {
    setSuggestionMode(mode);
    setGrammarSuggestions([]);
    setToneSuggestions([]);
    setActiveGrammarSuggestion(null);
  };
  
  const handleGenerateFinalToneSuggestions = () => {
    fetchAllSuggestions(text, tone, textStructure);
  };
  
  const handleToneChange = (newTone: string) => {
    setTone(newTone);
    setToneSuggestions([]);
    setActiveGrammarSuggestion(null);
  }

  const handleTextStructureChange = (newStructure: TextStructure) => {
    setTextStructure(newStructure);
    setGrammarSuggestions([]);
    setToneSuggestions([]);
    setActiveGrammarSuggestion(null);
  }

  // This effect will run when the tone or suggestion mode changes.
  useEffect(() => {
    if (!text.trim()) return;
  
    if (suggestionMode === 'final') {
      fetchAllSuggestions(text, tone, textStructure);
    } else if (suggestionMode === 'gradual') {
      const cursorPosition = editorRef.current?.getCursorPosition();
      const currentLine = editorRef.current?.getCurrentLine(text, cursorPosition) ?? "";
      fetchAllSuggestions(currentLine, tone, textStructure);
    }
  }, [tone, textStructure, suggestionMode, text, fetchAllSuggestions]);


  const handleAccept = (suggestionToAccept: Suggestion) => {
    if (!suggestionToAccept) return;
    const newText = text.replace(suggestionToAccept.originalText, suggestionToAccept.correctedText);
    setText(newText);
    
    if (suggestionToAccept.type === 'grammar') {
        setGrammarSuggestions((currentSuggestions) =>
            currentSuggestions.filter((s) => s.originalText !== suggestionToAccept.originalText)
        );
        setActiveGrammarSuggestion(null); // Close popover
        if (suggestionMode === 'gradual') {
            const currentLine = newText.split('\n').find(line => line.includes(suggestionToAccept.correctedText)) ?? '';
            fetchAllSuggestions(currentLine, tone, textStructure);
        }
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
        setActiveGrammarSuggestion(null); // Close popover
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
      // Prevent re-setting the same suggestion to avoid re-renders
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
    // A small debounce to avoid checking on every single key press instantly
    const handler = setTimeout(checkActiveSuggestion, 100);
    return () => clearTimeout(handler);
  }, [text, checkActiveSuggestion]);

  const handleResuggest = async (suggestionToResuggest: Suggestion) => {
    setIsLoading(true);
    const excludedPhrases = excludedPhrasesMap[suggestionToResuggest.originalText] || [];
    
    const result = await generateSuggestions(
        suggestionToResuggest.originalText,
        tone,
        textStructure,
        suggestionToResuggest.type,
        [...excludedPhrases, suggestionToResuggest.correctedText]
    );

    if (result.suggestions.length > 0) {
        const newSuggestion = result.suggestions[0];
        if (suggestionToResuggest.type === 'grammar') {
            setGrammarSuggestions(prev => 
                prev.map(s => s.originalText === newSuggestion.originalText ? newSuggestion : s)
            );
        } else {
            setToneSuggestions(prev => 
                prev.map(s => s.originalText === newSuggestion.originalText ? newSuggestion : s)
            );
        }
        // Also update the active suggestion if it's the one being resuggested
        if (activeGrammarSuggestion?.originalText === newSuggestion.originalText) {
            setActiveGrammarSuggestion(newSuggestion);
        }
    } else {
        toast({
            title: "Nenhuma nova sugestão",
            description: "A IA não conseguiu encontrar uma alternativa. Tente remover algumas palavras excluídas.",
            variant: "default",
        });
    }

    setIsLoading(false);
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
          grammarSuggestions={grammarSuggestions}
          activeGrammarSuggestion={activeGrammarSuggestion}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
          onResuggest={handleResuggest}
          suggestionMode={suggestionMode}
          onSuggestionModeChange={handleSuggestionModeChange}
  onFinalSuggestion={handleGenerateFinalToneSuggestions}
          onSuggestionClick={setActiveGrammarSuggestion}
        />
        <SuggestionList
          suggestions={toneSuggestions}
          isLoading={isLoading && grammarSuggestions.length === 0} // Only show skeleton if no grammar suggestions are present
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
    