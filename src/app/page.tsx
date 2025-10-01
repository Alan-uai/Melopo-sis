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
  const [grammarSuggestions, setGrammarSuggestions] = useState<Suggestion[]>([]);
  const [toneSuggestions, setToneSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestionMode, setSuggestionMode] = useState<SuggestionMode>("gradual");
  const { toast } = useToast();
  const editorRef = useRef<EditorRef>(null);

  const generateGrammarSuggestions = useCallback(async (currentText: string) => {
    if (!currentText.trim()) {
      setGrammarSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const result = await generateContextualSuggestions({ text: currentText, tone: "", suggestionType: "grammar" });
      setGrammarSuggestions(result.suggestions);
    } catch (error) {
      console.error("Error generating grammar suggestions:", error);
      toast({
        title: "Erro ao Gerar Sugestões Gramaticais",
        description:
          "Houve um problema ao se comunicar com a IA. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
      setGrammarSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const generateToneSuggestions = useCallback(async (currentText: string, currentTone: string) => {
      if (!currentText.trim() || !currentTone) {
        setToneSuggestions([]);
        return;
      }
      setIsLoading(true);
      try {
        const result = await generateContextualSuggestions({ text: currentText, tone: currentTone, suggestionType: "tone" });
        setToneSuggestions(result.suggestions);
      } catch (error) {
        console.error("Error generating tone suggestions:", error);
        toast({
          title: "Erro ao Gerar Sugestões de Tom",
          description:
            "Houve um problema ao se comunicar com a IA. Por favor, tente novamente mais tarde.",
          variant: "destructive",
        });
        setToneSuggestions([]);
      } finally {
        setIsLoading(false);
      }
  }, [toast]);

  const debouncedGenerateGrammarSuggestions = useCallback(debounce(generateGrammarSuggestions, 1500), [generateGrammarSuggestions]);

  const handleTextChange = (newText: string) => {
    setText(newText);
    if (suggestionMode === "gradual") {
      const cursorPosition = editorRef.current?.getCursorPosition();
      if (cursorPosition !== null && cursorPosition !== undefined) {
        const lines = newText.substring(0, cursorPosition).split('\n');
        const currentLine = lines[lines.length - 1];
        debouncedGenerateGrammarSuggestions(currentLine);
      }
    } else {
        if (grammarSuggestions.length > 0) setGrammarSuggestions([]);
        if (toneSuggestions.length > 0) setToneSuggestions([]);
    }
  };

  const handleSuggestionModeChange = (mode: SuggestionMode) => {
    setSuggestionMode(mode);
    setGrammarSuggestions([]);
    setToneSuggestions([]);
  };

  const handleFinalSuggestion = () => {
    generateToneSuggestions(text, tone);
  };
  
  const handleToneChange = (newTone: string) => {
    setTone(newTone);
    setGrammarSuggestions([]);
    setToneSuggestions([]);
  }

  const handleAccept = (suggestionToAccept: Suggestion) => {
    const newText = text.replace(suggestionToAccept.originalText, suggestionToAccept.correctedText);
    setText(newText);
    
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
