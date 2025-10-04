"use client";

import { Check, X, BookText, Lightbulb, RefreshCw } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { Suggestion } from "@/ai/types";
import { Card, CardContent, CardDescription, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: () => void;
  onDismiss: () => void;
  onResuggest: () => void;
  onToggleExcludedPhrase: (phrase: string) => void;
  excludedPhrases: string[];
}

export function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
  onResuggest,
  onToggleExcludedPhrase,
  excludedPhrases = [],
}: SuggestionCardProps) {
  const isGrammar = suggestion.type === 'grammar';
  const triggerText = isGrammar ? "Correção para:" : "Sugestão para:";
  const Icon = isGrammar ? BookText : Lightbulb;

  const correctedTextParts = suggestion.correctedText.split(/(\s+|[,.;:!?])/g).filter(Boolean);

  return (
    <Accordion type="single" collapsible className="w-full" defaultValue={`item-${suggestion.originalText}`}>
      <AccordionItem
        value={`item-${suggestion.originalText}`}
        className="rounded-lg border-none bg-secondary/30"
      >
        <AccordionTrigger className="rounded-lg px-4 text-left text-secondary-foreground hover:bg-secondary/50 hover:no-underline">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
               <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
               <span className="truncate">{triggerText} <em className="font-normal text-muted-foreground">"{suggestion.originalText}"</em></span>
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
                <CardDescription>
                  Texto sugerido:
                  <span className="text-xs italic text-muted-foreground/80 ml-2">
                    (clique em uma palavra para excluí-la da próxima sugestão)
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <blockquote className="whitespace-pre-wrap border-l-2 border-primary pl-4 italic">
                  <TooltipProvider>
                    {correctedTextParts.map((part, index) => {
                       const isWord = part.match(/\w/);
                       if (!isWord) return <span key={index}>{part}</span>;
                       
                       const isExcluded = excludedPhrases.includes(part);
                       return (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <button 
                                onClick={() => onToggleExcludedPhrase(part)}
                                className={`rounded px-0.5 py-0 ${isExcluded ? 'line-through bg-destructive/20' : ''} transition-colors hover:bg-accent/20`}
                            >
                                {part}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {isExcluded ? "Incluir" : "Excluir"} esta palavra da próxima sugestão
                            </p>
                          </TooltipContent>
                        </Tooltip>
                       )
                    })}
                  </TooltipProvider>
                </blockquote>
              </CardContent>
            </Card>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                <X className="mr-2 h-4 w-4" />
                Dispensar
              </Button>
               <Button variant="outline" size="sm" onClick={onResuggest}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resugerir
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