"use client";

import { Feather, LoaderCircle, Wand2 } from "lucide-react";
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
import type { Suggestion, SuggestionMode, TextStructure } from "@/app/page";
import React, { useMemo, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { Checkbox } from "./ui/checkbox";

interface EditorProps {
  text: string;
  onTextChange: (newText: string) => void;
  onCursorChange: () => void;
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
  onSuggestionClick: (suggestion: Suggestion) => void;
}

export interface EditorRef {
  getCursorPosition: () => number | null;
  getCurrentLine: (text: string, cursorPosition: number | null) => string;
}

export const Editor = forwardRef<EditorRef, EditorProps>(({
  text,
  onTextChange,
  onCursorChange,
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
  onSuggestionClick
}, ref) => {
  const tones = ["Melancólico", "Romântico", "Reflexivo", "Jubiloso", "Sombrio"];
  const structures: { value: TextStructure, label: string }[] = [
    { value: 'poema', label: 'Poema' },
    { value: 'poesia', label: 'Poesia' },
  ];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightsRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
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
    syncScroll();
  };

  const editorContent = useMemo(() => {
    let lastIndex = 0;
    const parts: (string | React.ReactNode)[] = [];

    const uniqueSuggestions = grammarSuggestions.filter((suggestion, index, self) => 
      index === self.findIndex((s) => s.originalText === suggestion.originalText)
    );
    
    uniqueSuggestions.sort((a, b) => text.indexOf(a.originalText) - text.indexOf(b.originalText));

    uniqueSuggestions.forEach((suggestion, i) => {
        const startIndex = text.indexOf(suggestion.originalText, lastIndex);
        if (startIndex === -1) return;

        // Add text part before the suggestion
        if (startIndex > lastIndex) {
            parts.push(text.substring(lastIndex, startIndex).replace(/\n/g, '\n\u200B'));
        }

        const isSuggestionActive = activeGrammarSuggestion?.originalText === suggestion.originalText;
        const AnchorComponent = isSuggestionActive ? PopoverAnchor : 'span';
        
        parts.push(
            <AnchorComponent key={`anchor-${i}`} className="relative">
                <span 
                  className="bg-destructive/20 underline decoration-destructive decoration-wavy underline-offset-2 cursor-pointer"
                  onClick={() => onSuggestionClick(suggestion)}
                >
                    {suggestion.originalText.replace(/\n/g, '\n\u200B')}
                </span>
            </AnchorComponent>
        );

        lastIndex = startIndex + suggestion.originalText.length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex).replace(/\n/g, '\n\u200B'));
    }

    // When there's no text, we need a zero-width space to maintain height
    if (text === "") {
      return '\u200B';
    }

    return parts.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>);
}, [text, grammarSuggestions, activeGrammarSuggestion, onSuggestionClick]);


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Feather className="h-8 w-8 text-primary" />
            <CardTitle className="font-headline text-3xl">
              Verso Correto
            </CardTitle>
          </div>
          {isLoading && (
            <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
          )}
        </div>
        <CardDescription className="pt-2">
          Seu assistente de poesia para o português brasileiro, compatível com as
          normas da ABNT.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Checkbox id="rhyme-check" checked={rhyme} onCheckedChange={onRhymeChange} />
                    <Label htmlFor="rhyme-check" className="font-normal">Forçar Rima</Label>
                </div>
            </div>
            <div className="space-y-2">
              <Label>Modo de Sugestão de Tom</Label>
              <RadioGroup
                value={suggestionMode}
                onValueChange={(value) => onSuggestionModeChange(value as SuggestionMode)}
                className="flex items-center space-x-4 pt-2"
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
            </div>
          </div>
        
        <div className="relative">
            <Popover open={!!activeGrammarSuggestion} onOpenChange={(open) => !open && activeGrammarSuggestion && onDismiss(activeGrammarSuggestion)}>
                <div className="relative grid">
                    <Textarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleTextareaChange}
                        onScroll={syncScroll}
                        onSelect={onCursorChange}
                        onKeyDown={onCursorChange}
                        onClick={onCursorChange}
                        placeholder="Escreva seu poema aqui..."
                        className="col-start-1 row-start-1 min-h-[50vh] w-full resize-none bg-transparent p-4 font-body text-base leading-relaxed caret-foreground selection:bg-primary/20"
                        style={{ WebkitTextFillColor: 'transparent' }}
                        aria-label="Editor de Poesia"
                    />
                    <div
                        ref={highlightsRef}
                        className="pointer-events-none col-start-1 row-start-1 min-h-[50vh] w-full resize-none overflow-auto whitespace-pre-wrap rounded-md border border-transparent bg-transparent p-4 font-body text-base leading-relaxed text-foreground"
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
          <div className="flex justify-end">
            <Button onClick={onFinalSuggestion} disabled={isLoading}>
              <Wand2 className="mr-2 h-4 w-4" />
              {isLoading ? "Gerando..." : "Gerar Sugestões"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

Editor.displayName = 'Editor';

    