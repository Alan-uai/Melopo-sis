"use client";

import { useState, useCallback, useRef } from "react";
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
    setIsGrammarLoading(true);
    const result = await generateSuggestions(currentText, tone, "grammar");
    setGrammarSuggestions(result.suggestions);
    setIsGrammarLoading(false);
  }, [generateSuggestions, tone]);

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
    setText(newText);
    const cursorPosition = editorRef.current?.getCursorPosition();
    const currentLine = editorRef.current?.getCurrentLine(newText, cursorPosition) ?? "";
    
    // Grammar suggestions are always on, line by line, and independent
    debouncedFetchGrammarSuggestions(currentLine);

    if (suggestionMode === "gradual") {
      // Gradual tone suggestions, line by line
      debouncedFetchToneSuggestions(currentLine, tone);
    } else {
      // In final mode, clear tone suggestions on text change
      if (toneSuggestions.length > 0) setToneSuggestions([]);
    }
  };

  const handleSuggestionModeChange = (mode: SuggestionMode) => {
    setSuggestionMode(mode);
    // Clear all suggestions when mode changes to avoid confusion
    setGrammarSuggestions([]);
    setToneSuggestions([]);
  };

  const handleGenerateFinalToneSuggestions = () => {
    // Final tone suggestions are for the whole poem
    fetchToneSuggestions(text, tone);
  };
  
  const handleToneChange = (newTone: string) => {
    setTone(newTone);
    // Clear all suggestions when tone changes
    setGrammarSuggestions([]);
    setToneSuggestions([]);
  }

  const handleAccept = (suggestionToAccept: Suggestion) => {
    // When a suggestion is accepted, the text is updated.
    // The change in text will trigger handleTextChange, which will then
    // re-evaluate the line for both grammar and tone if in gradual mode.
    const newText = text.replace(suggestionToAccept.originalText, suggestionToAccept.correctedText);
    setText(newText);
    
    // Immediately remove the accepted suggestion from the UI for a faster feel.
    if (suggestionToAccept.type === 'grammar') {
        setGrammarSuggestions((currentSuggestions) =>
            currentSuggestions.filter((s) => s.originalText !== suggestionToAccept.originalText)
        );
    } else {
        setToneSuggestions((currentSuggestions) =>
            currentSuggestions.filter((s) => s.originalText !== suggestionToAccept.originalText)
        );
    }
  };

  const handleDismiss = (suggestionToDismiss: Suggestion) => {
    if (suggestionToDismiss.type === 'grammar') {
        setGrammarSuggestions((currentSuggestions) =>
          currentSuggestions.filter((s) => s.originalText !== suggestionToDismiss.originalText)
        );
    } else {
        setToneSuggestions((currentSuggestions) =>
          currentSuggestions.filter((s) => s.originalText !== suggestionToDismiss.originalText)
        );
    }
  };
  
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Editor
          ref={editorRef}
          text={text}
          onTextChange={handleTextChange}
          isLoading={isToneLoading} // The main loading indicator is now only for tone suggestions
          tone={tone}
          onToneChange={handleToneChange}
          grammarSuggestions={grammarSuggestions}
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
