"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, BookText, Lightbulb, RefreshCw } from "lucide-react";
import { useAnimationState, useInkOrigin, useReducedMotion } from "@/hooks/use-animation";
import type { SwapIntensity } from "@/lib/animation";
import { PencilStrike } from "@/components/pencil-strike";
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

const durationByIntensity: Record<SwapIntensity, number> = {
  low: 0.6,
  medium: 0.8,
  high: 1.2,
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
  const contentRef = useRef<HTMLDivElement>(null);
  const acceptBtnRef = useRef<HTMLButtonElement>(null);
  const { phase: inkPhase, transitionTo: inkTransition } = useAnimationState();
  const { origin, capture: captureInkOrigin, clear: clearInkOrigin } = useInkOrigin();
  const reducedMotion = useReducedMotion();
  const [showPencilStrike, setShowPencilStrike] = useState(false);

  const intensity: SwapIntensity = suggestion.severity === "alta" ? "high" : suggestion.severity === "media" ? "medium" : "low";
  const animDuration = durationByIntensity[intensity];

  const inkActive = inkPhase === "active" || inkPhase === "finishing";

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

  const isSwapActive = swapVersion > 0;

  return (
    <Accordion type="single" collapsible className="w-full" defaultValue={`item-${suggestion.id || suggestion.originalText}`}>
      <AccordionItem
        value={`item-${suggestion.id || suggestion.originalText}`}
        className="rounded-lg border-none bg-secondary/30"
      >
        <AccordionTrigger className="rounded-lg px-4 text-left text-secondary-foreground hover:bg-secondary/50 hover:no-underline">
          <div className="flex w-full items-start justify-between gap-2">
            <div className="flex items-start gap-2 overflow-hidden">
               <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                <span className="text-left">{triggerText} <em className="font-normal text-muted-foreground">
                  {showPencilStrike ? (
                    <PencilStrike text={suggestion.originalText} width={120} height={20} />
                  ) : (
                    `"${suggestion.originalText}"`
                  )}
                </em></span>
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
                <div ref={contentRef} className="relative">
                  {inkActive && origin && (
                    <div
                      className="ink-bloom-overlay"
                      style={{
                        "--ink-x": origin.x,
                        "--ink-y": origin.y,
                        "--bloom-color": `var(--${suggestion.type === 'grammar' ? 'anim-correct' : 'anim-finish'})`,
                      } as React.CSSProperties}
                    />
                  )}
                  <AnimatePresence mode="wait">
                    <motion.blockquote
                      key={`corrected-${swapVersion}`}
                      initial={reducedMotion ? { opacity: 0 } : {
                        rotateX: -90,
                        opacity: 0,
                        filter: "brightness(1.3)",
                      }}
                      animate={reducedMotion ? { opacity: 1 } : {
                        rotateX: 0,
                        opacity: 1,
                        filter: "brightness(1)",
                        boxShadow: [
                          "0 0 0 0 hsl(var(--accent) / 0.5)",
                          "0 0 0 8px transparent",
                          "0 0 0 4px hsl(var(--accent) / 0.1)",
                          "none",
                        ],
                        transition: {
                          rotateX: { type: "spring", stiffness: 200, damping: 20 },
                          opacity: { duration: 0.3 },
                          filter: { duration: animDuration },
                          boxShadow: { duration: animDuration, ease: "easeOut" },
                        },
                      }}
                      exit={reducedMotion ? { opacity: 0 } : {
                        rotateX: 90,
                        opacity: 0,
                        transition: { duration: 0.2 },
                      }}
                      className="whitespace-pre-wrap border-l-2 border-primary pl-4 italic preserve-3d perspective-near"
                      style={{ transformOrigin: "left center" }}
                    >
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
                    </motion.blockquote>
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
            {suggestion.alternatives && suggestion.alternatives.length > 1 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Alternativas:</p>
                <ul className="text-xs space-y-0.5">
                  {suggestion.alternatives.map((alt, i) => {
                    const wasSwapped = isSwapActive && lastCorrectedRef.current === alt;
                    return (
                      <li key={`alt-${i}`}>
                        <motion.button
                          type="button"
                          onClick={() => handleSwapAlternative(i)}
                          whileTap={{ scale: 0.97 }}
                          className="w-full text-left border-l-2 border-muted-foreground/20 pl-2 italic text-xs transition-all hover:border-accent hover:bg-accent/10 rounded-sm py-0.5"
                        >
                          {alt}
                        </motion.button>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  Clique em uma alternativa para trocá-la com a sugestão atual
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button variant="ghost" size="sm" onClick={onDismiss}>
                  <X className="mr-2 h-4 w-4" />
                  Dispensar
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button variant="outline" size="sm" onClick={onResuggest}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resugerir
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, z: 10 }}
                whileTap={{ scale: 0.95 }}
                style={{ transformStyle: "preserve-3d" } as any}
              >
                <Button
                  size="sm"
                  ref={acceptBtnRef}
                  onClick={(e) => {
                    captureInkOrigin(e as unknown as React.MouseEvent<HTMLElement>);
                    inkTransition("active");
                    setShowPencilStrike(true);
                    setTimeout(() => {
                      onAccept();
                      setTimeout(() => {
                        inkTransition("idle");
                        clearInkOrigin();
                        setShowPencilStrike(false);
                      }, 2000);
                    }, 300);
                  }}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Check className="mr-2 h-4 w-4 icon-draw" />
                  Aceitar
                </Button>
              </motion.div>
            </div>

          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
