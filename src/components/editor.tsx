"use client";

import { Copy, Feather, Info, Save, Trash2, Wand2, CheckCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "./ui/label";
import { SuggestionPopover } from "./suggestion-popover";
import type { Suggestion, SuggestionMode, TextStructure } from "@/ai/types";
import React, { useMemo, useRef, useImperativeHandle, forwardRef, useCallback, useState, useEffect } from "react";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Button } from "./ui/button";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "./ui/checkbox";
import { TooltipProvider } from "./ui/tooltip";
import { SidebarTrigger } from "./ui/sidebar";
import { cn } from "@/lib/utils";
interface EditorProps {
  text: string;
  onTextChange: (newText: string) => void;
  isLoading: boolean;
  tone: string;
  onToneChange: (newTone: string) => void;
  textStructure: TextStructure;
  onTextStructureChange: (newStructure: TextStructure) => void;
  rhyme: boolean;
  onRhymeChange: (rhyme: boolean) => void;
  grammarSuggestions: Suggestion[];
  activeGrammarSuggestion: Suggestion | null;
  onAccept: (suggestion: Suggestion) => void;
  onDismiss: (suggestion: Suggestion) => void;
  onResuggest: (suggestion: Suggestion) => void;
  suggestionMode: SuggestionMode;
  onSuggestionModeChange: (mode: SuggestionMode) => void;
  onFinalSuggestion: () => void;
  onClear: () => void;
  onCopy: () => void;
  onSavePoem: () => void;
  isPoemSaved: boolean;
  toneSuggestions: Suggestion[];
  onAcceptAllLowSeverity?: () => void;
  lowSeverityCount?: number;
}

export interface EditorRef {
  focus: () => void;
  getCursorPosition: () => number | null;
  getCurrentLine: (text: string, cursorPosition: number | null) => string;
}

type AnimationState = 'idle' | 'generating' | 'correcting' | 'finishing';
type AnimationStage = 'beam' | 'pulse';

export const Editor = forwardRef<EditorRef, EditorProps>(({
  text,
  onTextChange,
  isLoading,
  tone,
  onToneChange,
  textStructure,
  onTextStructureChange,
  rhyme,
  onRhymeChange,
  grammarSuggestions,
  activeGrammarSuggestion,
  onAccept,
  onDismiss,
  onResuggest,
  suggestionMode,
  onSuggestionModeChange,
  onFinalSuggestion,
  onClear,
  onCopy,
  onSavePoem,
  isPoemSaved,
  toneSuggestions,
  onAcceptAllLowSeverity,
  lowSeverityCount,
}, ref) => {
  const tones = ["Melancólico", "Romântico", "Reflexivo", "Jubiloso", "Sombrio"];
  const structures: { value: TextStructure, label: string }[] = [
    { value: 'poema', label: 'Poema' },
    { value: 'poesia', label: 'Poesia' },
    { value: 'soneto', label: 'Soneto' },
    { value: 'haicai', label: 'Haicai' },
    { value: 'cordel', label: 'Cordel' },
    { value: 'redondilha', label: 'Redondilha' },
    { value: 'decassilabo', label: 'Decassílabo' },
  ];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightsRef = useRef<HTMLDivElement>(null);

  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [animationStage, setAnimationStage] = useState<AnimationStage>('beam');
  const prevToneSuggestionsLength = useRef(toneSuggestions.length);

  useEffect(() => {
    if (isLoading) {
      setAnimationState('generating');
    } else if (grammarSuggestions.length > 0 && activeGrammarSuggestion) {
      setAnimationState('correcting');
    } else if (toneSuggestions.length > 0 && prevToneSuggestionsLength.current === 0) {
      setAnimationState('finishing');
      setAnimationStage('beam');
    } else if (grammarSuggestions.length === 0 && toneSuggestions.length === 0) {
      setAnimationState('idle');
    }

    prevToneSuggestionsLength.current = toneSuggestions.length;
  }, [isLoading, grammarSuggestions, activeGrammarSuggestion, toneSuggestions]);

  useEffect(() => {
    if (animationState === 'finishing') {
      const beamTimer = setTimeout(() => {
        setAnimationStage('pulse');
      }, 800);

      const pulseTimer = setTimeout(() => {
        setAnimationState('idle');
      }, 1500);

      return () => {
        clearTimeout(beamTimer);
        clearTimeout(pulseTimer);
      };
    }
  }, [animationState]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    },
    getCursorPosition: () => {
      return textareaRef.current?.selectionStart ?? null;
    },
    getCurrentLine: (text: string, cursorPosition: number | null) => {
      if (cursorPosition === null) return "";
      const textUpToCursor = text.substring(0, cursorPosition);
      const lastNewlineIndex = textUpToCursor.lastIndexOf('\n');
      const lineStart = lastNewlineIndex === -1 ? 0 : lastNewlineIndex + 1;

      const nextNewlineIndex = text.indexOf('\n', cursorPosition);
      const lineEnd = nextNewlineIndex === -1 ? text.length : nextNewlineIndex;

      return text.substring(lineStart, lineEnd);
    }
  }));

  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightsRef.current) {
      highlightsRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightsRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(e.target.value);
    if(animationState !== 'idle') {
      setAnimationState('idle');
    }
  };

  const handleFinalSuggestion = () => {
    setAnimationState('idle');
    onFinalSuggestion();
  };

  const editorContent = useMemo(() => {
    if (!activeGrammarSuggestion) {
      return text.replace(/\n/g, '\n\u200B') || '\u200B';
    }

    const parts: (string | React.ReactNode)[] = [];
    const textToProcess = text;
    let lastIndex = 0;
    const { originalText } = activeGrammarSuggestion;

    const startIndex = textToProcess.indexOf(originalText, lastIndex);

    if (startIndex !== -1) {
        if (startIndex > lastIndex) {
            parts.push(textToProcess.substring(lastIndex, startIndex).replace(/\n/g, '\n\u200B'));
        }

        parts.push(
            <PopoverAnchor key={`anchor-${startIndex}`} className="relative">
                <span className="bg-destructive/30 ring-2 ring-destructive/50 rounded-sm underline decoration-destructive decoration-wavy underline-offset-2 cursor-pointer">
                    {originalText.replace(/\n/g, '\n\u200B')}
                </span>
            </PopoverAnchor>
        );
        lastIndex = startIndex + originalText.length;
    }

    if (lastIndex < textToProcess.length) {
        parts.push(textToProcess.substring(lastIndex).replace(/\n/g, '\n\u200B'));
    }

    if (textToProcess === "") {
        return '\u200B';
    }

    return parts.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>);
  }, [text, activeGrammarSuggestion]);

  const isAnimationActive = animationState !== 'idle';
  const isFinishingBeam = animationState === 'finishing' && animationStage === 'beam';
  const isFinishingPulse = animationState === 'finishing' && animationStage === 'pulse';

  const severityColor = (severity?: string) => {
    switch (severity) {
      case 'alta': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'media': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'baixa': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full shadow-lg h-full flex flex-col overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="p-0 h-8 w-8">
              <Feather className="scale-[2.5]" />
            </SidebarTrigger>
            <CardTitle className="font-headline text-3xl">
              Melopoësis
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
             <TooltipProvider>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={onSavePoem} disabled={isLoading}>
                            <Save className="h-4 w-4" />
                            <span className="sr-only">Salvar Poema</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                        <p className="text-sm">{isPoemSaved ? 'Atualizar poema' : 'Salvar poema'}</p>
                    </PopoverContent>
                </Popover>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={onCopy} disabled={!text}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copiar Texto</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                        <p className="text-sm">Copiar texto</p>
                    </PopoverContent>
                </Popover>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={onClear} disabled={!text}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Limpar Editor</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                        <p className="text-sm">Limpar editor</p>
                    </PopoverContent>
                </Popover>
            </TooltipProvider>
          </div>
        </div>
        <CardDescription className="pt-2">
          Seu assistente de poesia para o português brasileiro, compatível com as
          normas da ABNT.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
            <Label htmlFor="structure-select">Estrutura do Texto</Label>
            <Select value={textStructure} onValueChange={(v) => onTextStructureChange(v as TextStructure)}>
              <SelectTrigger id="structure-select" className="w-full">
                <SelectValue placeholder="Selecione uma estrutura" />
              </SelectTrigger>
              <SelectContent>
                {structures.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tone-select">Tom do Poema</Label>
            <Select value={tone} onValueChange={onToneChange}>
              <SelectTrigger id="tone-select" className="w-full">
                <SelectValue placeholder="Selecione um tom" />
              </SelectTrigger>
              <SelectContent>
                {tones.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="rhyme-check" checked={rhyme} onCheckedChange={(checked) => onRhymeChange(checked as boolean)} />
            <Label htmlFor="rhyme-check" className="font-normal">Forçar Rima</Label>
          </div>
          <div className="flex items-center space-x-4">
              <RadioGroup
              value={suggestionMode}
              onValueChange={(value) => onSuggestionModeChange(value as SuggestionMode)}
              className="flex items-center space-x-4"
              >
              <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gradual" id="gradual" />
                  <Label htmlFor="gradual" className="font-normal">Gradual</Label>
              </div>
              <div className="flex items-center space-x-2">
                  <RadioGroupItem value="final" id="final" />
                  <Label htmlFor="final" className="font-normal">Final</Label>
              </div>
              </RadioGroup>
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-center h-4 w-4">
                    <Info className="h-full w-full text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Modo de Sugestão</h4>
                    <p className="text-sm text-muted-foreground">
                      <b>Modo Gradual:</b> Sugestões aparecem automaticamente enquanto você escreve (com pausa).
                      <br />
                      <b>Modo Final:</b> Clique no botão "Gerar Sugestões" para analisar o texto completo.
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div
          data-animation-state={animationState}
          className={cn(
            "relative flex-1 flex flex-col rounded-md border overflow-hidden group",
            (animationState === 'generating' || animationState === 'correcting') && "animate-border-pulse",
            animationState === 'generating' && "[--pulse-color:hsl(var(--anim-generate))]",
            animationState === 'correcting' && "[--pulse-color:hsl(var(--anim-correct))]",
            isFinishingPulse && "animate-border-color-pulse"
          )}
        >
          <div className={cn(
            "absolute inset-0 rounded-md pointer-events-none transition-opacity duration-500",
             isAnimationActive ? "opacity-100" : "opacity-0"
          )}>
            <div
              className={cn(
                "absolute inset-0 rounded-md",
                isFinishingBeam && "[--animation-duration:0.8s]",
                (animationState === 'generating' || animationState === 'correcting' || isFinishingBeam) && "animate-border-beam",
                animationState === 'generating' && "[--beam-color:hsl(var(--anim-generate))] [animation-iteration-count:infinite]",
                animationState === 'correcting' && "[--beam-color:hsl(var(--anim-correct))] [animation-iteration-count:infinite]",
                isFinishingBeam && "[--beam-color:hsl(var(--anim-finish))]"
            )}/>
          </div>

          <Popover open={!!activeGrammarSuggestion} onOpenChange={() => {}}>
              <div className="relative grid flex-1">
                  <Textarea
                      ref={textareaRef}
                      value={text}
                      onChange={handleTextareaChange}
                      onScroll={syncScroll}
                      placeholder="Escreva seu poema aqui..."
                      className="col-start-1 row-start-1 w-full resize-none bg-transparent p-4 font-body text-base leading-relaxed text-transparent caret-foreground selection:bg-primary/20 h-full border-0 focus-visible:ring-0"
                      aria-label="Editor de Poesia"
                  />
                  <div
                      ref={highlightsRef}
                      className="pointer-events-none col-start-1 row-start-1 w-full resize-none overflow-auto whitespace-pre-wrap rounded-md bg-transparent p-4 font-body text-base leading-relaxed text-foreground h-full"
                      aria-hidden="true"
                  >
                      {editorContent}
                  </div>
              </div>

              {activeGrammarSuggestion && (
                <SuggestionPopover
                  suggestion={activeGrammarSuggestion}
                  onAccept={() => onAccept(activeGrammarSuggestion)}
                  onDismiss={() => onDismiss(activeGrammarSuggestion)}
                  onResuggest={() => onResuggest(activeGrammarSuggestion)}
                />
              )}
          </Popover>
       </div>

        {suggestionMode === "final" && (
          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-2">
              {onAcceptAllLowSeverity && (lowSeverityCount ?? 0) > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAcceptAllLowSeverity}
                  disabled={isLoading}
                  className="flex items-center gap-1"
                >
                  <CheckCheck className="h-4 w-4" />
                  Aplicar {lowSeverityCount} correções simples
                </Button>
              )}
            </div>
            <Button onClick={handleFinalSuggestion} disabled={isLoading || text.trim().length === 0}>
              <Wand2 className="mr-2 h-4 w-4" />
              {isLoading ? "Analisando..." : "Gerar Sugestões"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

Editor.displayName = 'Editor';
