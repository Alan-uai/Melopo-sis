"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Editor, EditorRef } from "@/components/editor";
import { SuggestionList } from "@/components/suggestion-list";
import { generateContextualSuggestions } from "@/ai/flows/generate-contextual-suggestions";
import type { GenerateContextualSuggestionsOutput } from "@/ai/flows/generate-contextual-suggestions";
import { useToast } from "@/hooks/use-toast";
import React from 'react';

export type Suggestion = GenerateContextualSuggestionsOutput["suggestions"][0];
export type SuggestionMode = "gradual" | "final";

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
  const [grammarSuggestions, setGrammarSuggestions] = useState<Suggestion[]>([]);
  const [toneSuggestions, setToneSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestionMode, setSuggestionMode] = useState<SuggestionMode>("gradual");
  const [activeGrammarSuggestion, setActiveGrammarSuggestion] = useState<Suggestion | null>(null);
  const { toast } = useToast();
  const editorRef = useRef<EditorRef>(null);

  const generateSuggestions = useCallback(async (
    currentText: string, 
    currentTone: string,
  ): Promise<GenerateContextualSuggestionsOutput> => {
    if (!currentText.trim()) {
      return { suggestions: [] };
    }
  
    try {
      const result = await generateContextualSuggestions({ 
        text: currentText, 
        tone: currentTone, 
        suggestionType: 'all' 
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

  const fetchAllSuggestions = useCallback(async (currentText: string, currentTone: string) => {
    if (!currentText.trim()) {
      setGrammarSuggestions([]);
      setToneSuggestions([]);
      return;
    }

    setIsLoading(true);
    const result = await generateSuggestions(currentText, currentTone);

    const newGrammarSuggestions = result.suggestions.filter(s => s.type === 'grammar');
    const newToneSuggestions = result.suggestions.filter(s => s.type === 'tone');
    
    // Logic to merge line-by-line suggestions with existing ones.
    setGrammarSuggestions(prevSuggestions => {
      const isFullTextCheck = currentText === text;
      // If checking the full text, replace all suggestions.
      if (isFullTextCheck) {
          return newGrammarSuggestions;
      }
      
      // If checking a single line, keep suggestions from other lines.
      const otherLinesSuggestions = prevSuggestions.filter(s => !currentText.includes(s.originalText));
      const uniqueNewSuggestions = newGrammarSuggestions.filter(ns => !otherLinesSuggestions.some(os => os.originalText === ns.originalText));
      
      return [...otherLinesSuggestions, ...uniqueNewSuggestions];
    });


    setToneSuggestions(newToneSuggestions);

    setIsLoading(false);
  }, [generateSuggestions, text]);


  const debouncedFetchAllSuggestions = useCallback(debounce(fetchAllSuggestions, 2000), [fetchAllSuggestions]);


  const handleTextChange = (newText: string) => {
    const oldText = text;
    setText(newText);
    
    const isPaste = (newText.length - oldText.length) > 20 || newText.split('\n').length > oldText.split('\n').length + 1;

    if (suggestionMode === "gradual") {
      if (isPaste) {
        debouncedFetchAllSuggestions(newText, tone);
      } else {
        const cursorPosition = editorRef.current?.getCursorPosition();
        const currentLine = editorRef.current?.getCurrentLine(newText, cursorPosition) ?? "";
        debouncedFetchAllSuggestions(currentLine, tone);
      }
    } else {
      if (toneSuggestions.length > 0) setToneSuggestions([]);
    }
  };

  const handleSuggestionModeChange = (mode: SuggestionMode) => {
    setSuggestionMode(mode);
    setGrammarSuggestions([]);
    setToneSuggestions([]);
    setActiveGrammarSuggestion(null);
    if (mode === 'final' && text.trim()) {
      fetchAllSuggestions(text, tone);
    }
  };

  const handleGenerateFinalToneSuggestions = () => {
    fetchAllSuggestions(text, tone);
  };
  
  const handleToneChange = (newTone: string) => {
    setTone(newTone);
    setGrammarSuggestions([]);
    setToneSuggestions([]);
    setActiveGrammarSuggestion(null);
    
    if (text.trim()) {
      if (suggestionMode === 'gradual') {
        const cursorPosition = editorRef.current?.getCursorPosition();
        const currentLine = editorRef.current?.getCurrentLine(text, cursorPosition) ?? "";
        fetchAllSuggestions(currentLine, newTone);
      } else {
        fetchAllSuggestions(text, newTone);
      }
    }
  }

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
            fetchAllSuggestions(currentLine, tone);
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
  
  
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Editor
          ref={editorRef}
          text={text}
          onTextChange={handleTextChange}
          onCursorChange={checkActiveSuggestion}
          isLoading={isLoading} // Only show global loader for tone suggestions
          tone={tone}
          onToneChange={handleToneChange}
          grammarSuggestions={grammarSuggestions}
          activeGrammarSuggestion={activeGrammarSuggestion}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
          suggestionMode={suggestionMode}
          onSuggestionModeChange={handleSuggestionModeChange}
          onFinalSuggestion={handleGenerateFinalToneSuggestions}
          onSuggestionClick={setActiveGrammarSuggestion}
        />
        <SuggestionList
          suggestions={toneSuggestions}
          isLoading={isLoading}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
        />
      </div>
    </div>
  );
}
    