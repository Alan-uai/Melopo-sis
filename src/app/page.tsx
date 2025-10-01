"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Editor } from "@/components/editor";
import { SuggestionList } from "@/components/suggestion-list";
import { generateContextualSuggestions } from "@/ai/flows/generate-contextual-suggestions";
import type { GenerateContextualSuggestionsOutput } from "@/ai/flows/generate-contextual-suggestions";
import { useToast } from "@/hooks/use-toast";

export type Suggestion = GenerateContextualSuggestionsOutput["suggestions"][0];

export default function Home() {
  const [text, setText] = useState<string>("");
  const [tone, setTone] = useState<string>("Melancólico");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleGenerateSuggestions = useCallback(
    async (currentText: string, currentTone: string) => {
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
    },
    [toast]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      handleGenerateSuggestions(text, tone);
    }, 1500); // Debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [text, tone, handleGenerateSuggestions]);

  const handleAccept = (suggestionToAccept: Suggestion) => {
    setText(currentText => {
      // Use a regex to replace only the first occurrence to avoid unintended replacements
      const regex = new RegExp(suggestionToAccept.originalText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
      return currentText.replace(regex, suggestionToAccept.correctedText);
    });
    // After accepting, remove the suggestion
    setSuggestions((currentSuggestions) =>
      currentSuggestions.filter((s) => s !== suggestionToAccept)
    );
  };

  const handleDismiss = (suggestionToDismiss: Suggestion) => {
    setSuggestions((currentSuggestions) =>
      currentSuggestions.filter((s) => s !== suggestionToDismiss)
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
          text={text}
          onTextChange={setText}
          isLoading={isLoading}
          tone={tone}
          onToneChange={setTone}
          grammarSuggestions={grammarSuggestions}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
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
