"use client";

import { useState, useCallback, useMemo, useRef } from "react";
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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestionMode, setSuggestionMode] = useState<SuggestionMode>("gradual");
  const { toast } = useToast();
  const editorRef = useRef<EditorRef>(null);

  const generateSuggestions = useCallback(async (currentText: string, currentTone: string) => {
    if (!currentText.trim()) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const result = await generateContextualSuggestions({ text: currentText, tone: currentTone });
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast({
        title: "Erro ao Gerar Sugestões",
        description:
          "Houve um problema ao se comunicar com a IA. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const debouncedGenerateSuggestions = useCallback(debounce(generateSuggestions, 1500), [generateSuggestions]);

  const handleTextChange = (newText: string) => {
    setText(newText);
    if (suggestionMode === "gradual") {
      const cursorPosition = editorRef.current?.getCursorPosition();
      if (cursorPosition !== null && cursorPosition !== undefined) {
        const lines = newText.substring(0, cursorPosition).split('\n');
        const currentLine = lines[lines.length - 1];
        debouncedGenerateSuggestions(currentLine, tone);
      }
    } else {
        // In final mode, suggestions are cleared on text change
        if (suggestions.length > 0) {
            setSuggestions([]);
        }
    }
  };

  const handleSuggestionModeChange = (mode: SuggestionMode) => {
    setSuggestionMode(mode);
    setSuggestions([]);
  };

  const handleFinalSuggestion = () => {
    generateSuggestions(text, tone);
  };
  
  const handleToneChange = (newTone: string) => {
    setTone(newTone);
    setSuggestions([]);
  }

  const handleAccept = (suggestionToAccept: Suggestion) => {
    const newText = text.replace(suggestionToAccept.originalText, suggestionToAccept.correctedText);
    setText(newText);
    
    // Remove the accepted suggestion and any other suggestions for the same original text
    setSuggestions((currentSuggestions) =>
      currentSuggestions.filter(
        (s) => s.originalText !== suggestionToAccept.originalText
      )
    );
  };

  const handleDismiss = (suggestionToDismiss: Suggestion) => {
    setSuggestions((currentSuggestions) =>
      currentSuggestions.filter((s) => s.originalText !== suggestionToDismiss.originalText)
    );
  };

  const { grammarSuggestions, toneSuggestions } = useMemo(() => {
    const grammarSuggestions = suggestions.filter((s) => s.type === "grammar");
    const toneSuggestions = suggestions.filter((s) => s.type === "tone");
    return { grammarSuggestions, toneSuggestions };
  }, [suggestions]);

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
          grammarSuggestions={grammarSuggestions}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
          suggestionMode={suggestionMode}
          onSuggestionModeChange={handleSuggestionModeChange}
          onFinalSuggestion={handleFinalSuggestion}
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
