"use client";

import { Check, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { GenerateContextualSuggestionsOutput } from "@/ai/flows/generate-contextual-suggestions";
import { Card, CardContent, CardDescription, CardHeader } from "./ui/card";

type Suggestion = GenerateContextualSuggestionsOutput["suggestions"][0];

interface SuggestionCardProps {
  suggestion: Suggestion;
  index: number;
  onAccept: () => void;
  onDismiss: () => void;
}

export function SuggestionCard({
  suggestion,
  index,
  onAccept,
  onDismiss,
}: SuggestionCardProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem
        value={`item-${index}`}
        className="rounded-lg border-none bg-secondary/30"
      >
        <AccordionTrigger className="rounded-lg px-4 text-left text-secondary-foreground hover:bg-secondary/50 hover:no-underline">
          <span>Sugestão para: <em className="font-normal text-muted-foreground">"{suggestion.originalText}"</em></span>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-2">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {suggestion.explanation}
            </p>
            <Card className="bg-background/80">
              <CardHeader>
                <CardDescription>Texto sugerido:</CardDescription>
              </CardHeader>
              <CardContent>
                <blockquote className="whitespace-pre-wrap border-l-2 border-primary pl-4 italic">
                  {suggestion.correctedText}
                </blockquote>
              </CardContent>
            </Card>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                <X className="mr-2 h-4 w-4" />
                Dispensar
              </Button>
              <Button
                size="sm"
                onClick={onAccept}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Check className="mr-2 h-4 w-4" />
                Aceitar
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
