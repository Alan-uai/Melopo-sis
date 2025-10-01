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
  const [isGrammarLoading, setIsGrammarLoading] = useState<boolean>(false);
  const [isToneLoading, setIsToneLoading] = useState<boolean>(false);
  const [suggestionMode, setSuggestionMode] = useState<SuggestionMode>("gradual");
  const [activeGrammarSuggestion, setActiveGrammarSuggestion] = useState<Suggestion | null>(null);
  const { toast } = useToast();
  const editorRef = useRef<EditorRef>(null);

  const generateSuggestions = useCallback(async (
    currentText: string, 
    currentTone: string, 
    suggestionType: 'grammar' | 'tone' | 'all'
  ) => {
    if (!currentText.trim()) {
      return { suggestions: [] };
    }
  
    try {
      const result = await generateContextualSuggestions({ 
        text: currentText, 
        tone: currentTone, 
        suggestionType 
      });
      return result;
    } catch (error) {
      console.error(`Error generating ${suggestionType} suggestions:`, error);
      toast({
        title: `Erro ao Gerar Sugestões (${suggestionType})`,
        description:
          "Houve um problema ao se comunicar com a IA. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
      return { suggestions: [] };
    }
  }, [toast]);

  const fetchGrammarSuggestions = useCallback(async (currentText: string) => {
    if (!currentText.trim()) {
      setGrammarSuggestions([]);
      return;
    }
    // No visual loading state for grammar to be less intrusive
    const result = await generateSuggestions(currentText, tone, "grammar");
    
    // When checking the whole text, we want to replace suggestions, not append.
    const isFullTextCheck = currentText === text;
    
    setGrammarSuggestions(prevSuggestions => {
      if (!isFullTextCheck) {
         // This logic attempts to merge line-by-line suggestions with existing ones.
        const otherLinesSuggestions = prevSuggestions.filter(s => !currentText.includes(s.originalText));
        return [...otherLinesSuggestions, ...result.suggestions];
      } else {
        // It's a full-text check (paste or initial load), so replace all previous suggestions
        return result.suggestions;
      }
    });

  }, [generateSuggestions, tone, text]);

  const fetchToneSuggestions = useCallback(async (currentText: string, currentTone: string) => {
    if (!currentText.trim() || !currentTone) {
      setToneSuggestions([]);
      return;
    }
    setIsToneLoading(true);
    const result = await generateSuggestions(currentText, currentTone, "tone");
    setToneSuggestions(result.suggestions);
    setIsToneLoading(false);
  }, [generateSuggestions]);

  const debouncedFetchGrammarSuggestions = useCallback(debounce(fetchGrammarSuggestions, 1500), [fetchGrammarSuggestions]);
  const debouncedFetchToneSuggestions = useCallback(debounce(fetchToneSuggestions, 2000), [fetchToneSuggestions]);


  const handleTextChange = (newText: string) => {
    const oldText = text;
    setText(newText);
    
    // A simple heuristic for detecting a paste operation
    const isPaste = (newText.length - oldText.length) > 20 || newText.split('\n').length > oldText.split('\n').length + 1;

    if (isPaste) {
      // If it's a paste, check the whole text for grammar
      debouncedFetchGrammarSuggestions(newText);
    } else {
      // Otherwise, just check the current line for grammar
      const cursorPosition = editorRef.current?.getCursorPosition();
      const currentLine = editorRef.current?.getCurrentLine(newText, cursorPosition) ?? "";
      debouncedFetchGrammarSuggestions(currentLine);
    }

    if (suggestionMode === "gradual") {
      const cursorPosition = editorRef.current?.getCursorPosition();
      const currentLine = editorRef.current?.getCurrentLine(newText, cursorPosition) ?? "";
      debouncedFetchToneSuggestions(currentLine, tone);
    } else {
      // Clear previous suggestions if not in gradual mode
      if (toneSuggestions.length > 0) setToneSuggestions([]);
    }
  };

  const handleSuggestionModeChange = (mode: SuggestionMode) => {
    setSuggestionMode(mode);
    setGrammarSuggestions([]);
    setToneSuggestions([]);
    setActiveGrammarSuggestion(null);
    // Immediately fetch suggestions if switching to 'final' with existing text
    if (mode === 'final' && text.trim()) {
      fetchGrammarSuggestions(text);
    }
  };

  const handleGenerateFinalToneSuggestions = () => {
    fetchToneSuggestions(text, tone);
  };
  
  const handleToneChange = (newTone: string) => {
    setTone(newTone);
    // Invalidate old suggestions
    setGrammarSuggestions([]);
    setToneSuggestions([]);
    setActiveGrammarSuggestion(null);
    // Re-evaluate text with new tone/rules
    if (text.trim()) {
      fetchGrammarSuggestions(text);
      if (suggestionMode === 'gradual') {
        const cursorPosition = editorRef.current?.getCursorPosition();
        const currentLine = editorRef.current?.getCurrentLine(text, cursorPosition) ?? "";
        fetchToneSuggestions(currentLine, newTone);
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
            fetchToneSuggestions(currentLine, tone);
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

    setActiveGrammarSuggestion(activeSuggestion || null);
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
          isLoading={isToneLoading} // Only show global loader for tone suggestions
          tone={tone}
          onToneChange={handleToneChange}
          grammarSuggestions={grammarSuggestions}
          activeGrammarSuggestion={activeGrammarSuggestion}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
          suggestionMode={suggestionMode}
          onSuggestionModeChange={handleSuggestionModeChange}
          onFinalSuggestion={handleGenerateFinalToneSuggestions}
        />
        <SuggestionList
          suggestions={toneSuggestions}
          isLoading={isToneLoading}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
        />
      </div>
    </div>
  );
}
    