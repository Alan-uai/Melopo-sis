"use client";

import type { Suggestion } from "@/app/page";
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
}

export function SuggestionList({
  suggestions,
  isLoading,
  onAccept,
  onDismiss,
}: SuggestionListProps) {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Sugestões de Tom</CardTitle>
         <CardDescription>
          Sugestões para aprimorar o tom e estilo do seu poema.
        </CardDescription>
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
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
