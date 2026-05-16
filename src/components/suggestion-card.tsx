"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  onSwapAlternative?: (suggestion: Suggestion, alternativeIndex: number) => void;
}

const severityVariant: Record<string, "destructive" | "secondary" | "default"> = {
  alta: 'destructive',
  media: 'secondary',
  baixa: 'default',
};

export function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
  onResuggest,
  onToggleExcludedPhrase,
  excludedPhrases = [],
  onSwapAlternative,
}: SuggestionCardProps) {
  const isGrammar = suggestion.type === 'grammar';
  const triggerText = isGrammar ? "Correção para:" : "Sugestão para:";
  const Icon = isGrammar ? BookText : Lightbulb;

  const [swapVersion, setSwapVersion] = useState(0);
  const lastCorrectedRef = useRef(suggestion.correctedText);

  useEffect(() => {
    if (lastCorrectedRef.current !== suggestion.correctedText) {
      setSwapVersion(v => v + 1);
      lastCorrectedRef.current = suggestion.correctedText;
    }
  }, [suggestion.correctedText]);

  const handleSwapAlternative = useCallback((index: number) => {
    onSwapAlternative?.(suggestion, index);
  }, [onSwapAlternative, suggestion]);

  const correctedTextParts = suggestion.correctedText.split(/(\s+|[,.;:!?])/g).filter(Boolean);

  return (
    <Accordion type="single" collapsible className="w-full" defaultValue={`item-${suggestion.originalText}`}>
      <AccordionItem
        value={`item-${suggestion.originalText}`}
        className="rounded-lg border-none bg-secondary/30"
      >
        <AccordionTrigger className="rounded-lg px-4 text-left text-secondary-foreground hover:bg-secondary/50 hover:no-underline">
          <div className="flex w-full items-start justify-between gap-2">
            <div className="flex items-start gap-2 overflow-hidden">
               <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
               <span className="text-left">{triggerText} <em className="font-normal text-muted-foreground">"{suggestion.originalText}"</em></span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {suggestion.severity && (
                <Badge variant={severityVariant[suggestion.severity]} className="text-[10px] px-1.5 py-0">
                  {suggestion.severity}
                </Badge>
              )}
              <Badge variant={isGrammar ? "destructive" : "secondary"} className="whitespace-nowrap">
                {isGrammar ? "Gramática" : "Tom"}
              </Badge>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-2">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {suggestion.explanation}
            </p>
            {suggestion.context && (
              <div className="text-xs text-muted-foreground italic border-l-2 border-muted-foreground/30 pl-2">
                Contexto: "{suggestion.context}"
              </div>
            )}
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
                <blockquote key={`corrected-${swapVersion}`} className="whitespace-pre-wrap border-l-2 border-primary pl-4 italic animate-swap-flash">
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
            {suggestion.alternatives && suggestion.alternatives.length > 1 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Alternativas:</p>
                <ul className="text-xs space-y-0.5">
                  {suggestion.alternatives.map((alt, i) => (
                    <li key={`alt-${i}-${swapVersion}`}>
                      <button
                        type="button"
                        onClick={() => handleSwapAlternative(i)}
                        className="w-full text-left border-l-2 border-muted-foreground/20 pl-2 italic text-xs transition-all hover:border-accent hover:bg-accent/10 hover:scale-[1.01] rounded-sm py-0.5 animate-swap-flash"
                      >
                        {alt}
                      </button>
                    </li>
                  ))}
                </ul>
                {!isGrammar && (
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Clique em uma alternativa para trocá-la com a sugestão atual
                  </p>
                )}
              </div>
            )}
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
