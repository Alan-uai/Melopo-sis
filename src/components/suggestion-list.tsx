"use client";

import type { Suggestion } from "@/ai/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SuggestionCard } from "./suggestion-card";
import { Skeleton } from "./ui/skeleton";

interface SuggestionListProps {
  suggestions: Suggestion[];
  isLoading: boolean;
  onAccept: (suggestion: Suggestion) => void;
  onDismiss: (suggestion: Suggestion) => void;
  onResuggest: (suggestion: Suggestion) => void;
  onToggleExcludedPhrase: (originalText: string, phrase: string) => void;
  excludedPhrasesMap: Record<string, string[]>;
  onSwapAlternative?: (suggestion: Suggestion, alternativeIndex: number) => void;
}

export function SuggestionList({
  suggestions,
  isLoading,
  onAccept,
  onDismiss,
  onResuggest,
  onToggleExcludedPhrase,
  excludedPhrasesMap,
  onSwapAlternative,
}: SuggestionListProps) {
  const hasGrammar = suggestions.some(s => s.type === 'grammar');
  const toneSuggestions = suggestions.filter(s => s.type === 'tone');

  const severityCount = suggestions.reduce((acc, s) => {
    if (s.severity) acc[s.severity] = (acc[s.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">
          {hasGrammar ? "Sugestões de Correção" : "Sugestões de Tom"}
        </CardTitle>
        <CardDescription>
          {hasGrammar
            ? "Correções gramaticais e ortográficas encontradas."
            : "Sugestões para aprimorar o tom e estilo do seu poema."
          }
        </CardDescription>
        {Object.keys(severityCount).length > 0 && (
          <div className="flex gap-2 mt-1">
            {severityCount.alta && (
              <span className="text-xs text-destructive">⚠ {severityCount.alta} alta</span>
            )}
            {severityCount.media && (
              <span className="text-xs text-yellow-600 dark:text-yellow-400">● {severityCount.media} média</span>
            )}
            {severityCount.baixa && (
              <span className="text-xs text-blue-600 dark:text-blue-400">● {severityCount.baixa} baixa</span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          )}
          {!isLoading && suggestions.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              Nenhuma sugestão por enquanto. Comece a escrever para ver a mágica
              acontecer.
            </p>
          )}
          {!isLoading && suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                  <SuggestionCard
                    key={`${index}-${suggestion.originalText}`}
                    suggestion={suggestion}
                    onAccept={() => onAccept(suggestion)}
                    onDismiss={() => onDismiss(suggestion)}
                    onResuggest={() => onResuggest(suggestion)}
                    onToggleExcludedPhrase={(phrase) => onToggleExcludedPhrase(suggestion.originalText, phrase)}
                    excludedPhrases={excludedPhrasesMap[suggestion.originalText] || []}
                    onSwapAlternative={onSwapAlternative}
                  />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
