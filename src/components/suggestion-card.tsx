"use client";

import { Check, X, BookText, Lightbulb } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { Suggestion } from "@/app/page";
import { Card, CardContent, CardDescription, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: () => void;
  onDismiss: () => void;
}

export function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
}: SuggestionCardProps) {
  const isGrammar = suggestion.type === 'grammar';
  const triggerText = isGrammar ? "Correção para:" : "Sugestão para:";
  const Icon = isGrammar ? BookText : Lightbulb;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem
        value={`item-${suggestion.originalText}`}
        className="rounded-lg border-none bg-secondary/30"
      >
        <AccordionTrigger className="rounded-lg px-4 text-left text-secondary-foreground hover:bg-secondary/50 hover:no-underline">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
               <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
               <span className="text-left">{triggerText} <em className="font-normal text-muted-foreground">"{suggestion.originalText}"</em></span>
            </div>
            <Badge variant={isGrammar ? "destructive" : "secondary"} className="whitespace-nowrap">
              {isGrammar ? "Gramática" : "Tom"}
            </Badge>
          </div>
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
