"use client";

import { useState, useEffect, useCallback } from "react";
import { Editor } from "@/components/editor";
import { SuggestionList } from "@/components/suggestion-list";
import { generateContextualSuggestions } from "@/ai/flows/generate-contextual-suggestions";
import type { GenerateContextualSuggestionsOutput } from "@/ai/flows/generate-contextual-suggestions";
import { useToast } from "@/hooks/use-toast";

type Suggestion = GenerateContextualSuggestionsOutput["suggestions"][0];

export default function Home() {
  const [text, setText] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleGenerateSuggestions = useCallback(
    async (currentText: string) => {
      if (!currentText.trim()) {
        setSuggestions([]);
        return;
      }
      setIsLoading(true);
      try {
        const result = await generateContextualSuggestions({ text: currentText });
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
    },
    [toast]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      handleGenerateSuggestions(text);
    }, 1500); // Debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [text, handleGenerateSuggestions]);

  const handleAccept = (suggestionToAccept: Suggestion) => {
    setText(suggestionToAccept.correctedText);
  };

  const handleDismiss = (indexToDismiss: number) => {
    setSuggestions((currentSuggestions) =>
      currentSuggestions.filter((_, index) => index !== indexToDismiss)
    );
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Editor text={text} onTextChange={setText} isLoading={isLoading} />
        <SuggestionList
          suggestions={suggestions}
          isLoading={isLoading}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
        />
      </div>
    </div>
  );
}
