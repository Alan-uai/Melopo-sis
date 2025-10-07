"use client";

import { Copy, Feather, Info, Save, Trash2, Wand2 } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
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
}

export interface EditorRef {
  focus: () => void;
  getCursorPosition: () => number | null;
  getCurrentLine: (text: string, cursorPosition: number | null) => string;
}

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
}, ref) => {
  const tones = ["Melancólico", "Romântico", "Reflexivo", "Jubiloso", "Sombrio"];
  const structures: { value: TextStructure, label: string }[] = [
    { value: 'poema', label: 'Poema' },
    { value: 'poesia', label: 'Poesia' },
  ];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightsRef = useRef<HTMLDivElement>(null);

  const [animationState, setAnimationState] = useState<'idle' | 'scanning' | 'generating' | 'finishing'>('idle');
  const beamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading) {
      if (animationState === 'idle') {
        setAnimationState('scanning');
        setTimeout(() => {
          setAnimationState('generating');
        }, 1000); 
      }
    } else {
      if (animationState === 'generating' || animationState === 'scanning') {
        setAnimationState('finishing');
      }
    }
  }, [isLoading, animationState]);

  const handleAnimationEnd = () => {
    if (animationState === 'finishing' || (!isLoading && animationState !== 'idle')) {
      setAnimationState('idle');
    } else if (animationState === 'generating' && isLoading) {
      setAnimationState('idle');
      setTimeout(() => setAnimationState('generating'), 50);
    }
  };

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


  return (
    <Card className="w-full shadow-lg h-full flex flex-col overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
          <SidebarTrigger
              className="p-0 h-8 w-8"
              variant="ghost"
            >
              <Feather className="scale-[2.5]" />
            </SidebarTrigger>
            <CardTitle className="font-headline text-3xl">
              Melopoësis
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={onSavePoem} disabled={isLoading}>
                            <Save className="h-4 w-4" />
                            <span className="sr-only">Salvar Poema</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{isPoemSaved ? 'Atualizar poema' : 'Salvar poema'}</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={onCopy} disabled={!text}>
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copiar Texto</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Copiar texto</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={onClear} disabled={!text}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Limpar Editor</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Limpar editor</p>
                    </TooltipContent>
                </Tooltip>
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
        
        <div className="flex items-end justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="rhyme-check" checked={rhyme} onCheckedChange={(checked) => onRhymeChange(checked as boolean)} />
            <Label htmlFor="rhyme-check" className="font-normal">Forçar Rima</Label>
          </div>

          <div className="flex items-center gap-4">
            <RadioGroup
              value={suggestionMode}
              onValueChange={(value) => onSuggestionModeChange(value as SuggestionMode)}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gradual" id="gradual" disabled />
                <Label htmlFor="gradual" className="font-normal text-muted-foreground">Gradual</Label>
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
                      <b>Modo Gradual (desativado):</b> As sugestões aparecem enquanto você escreve.
                      <br />
                      <b>Modo Final:</b> Clique no botão "Gerar Sugestões" para analisar o texto completo.
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className={cn(
            "relative flex-1 flex flex-col rounded-md border overflow-hidden",
            (animationState === 'scanning' || animationState === 'generating' || animationState === 'finishing') && "animate-border-pulse"
        )}>
            {(animationState === 'scanning' || animationState === 'generating' || animationState === 'finishing') && (
              <div
                ref={beamRef}
                onAnimationEnd={handleAnimationEnd}
                className={cn(
                  "absolute left-0 w-full h-1/4 bg-gradient-to-b from-primary/0 via-primary/20 to-primary/0 pointer-events-none z-10",
                  {
                    "animate-beam-progress animation-duration-1s animation-iteration-count-1 alternate": animationState === 'scanning',
                    "animate-beam-progress animation-duration-15s animation-iteration-count-1 linear": animationState === 'generating',
                    "animate-beam-progress animation-duration-fast animation-iteration-count-1 linear": animationState === 'finishing',
                  }
                )}
              />
            )}
            <Popover open={!!activeGrammarSuggestion} onOpenChange={(isOpen) => {
              if (!isOpen) {
                // Não avance ao clicar fora
              }
            }}>
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
          <div className="flex justify-end pt-4">
            <Button onClick={onFinalSuggestion} disabled={isLoading || text.trim().length === 0}>
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
