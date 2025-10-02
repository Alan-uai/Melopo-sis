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
import type { Suggestion, SuggestionMode } from "@/app/page";
import React, { useMemo, useRef, useImperativeHandle, forwardRef, useEffect, useState } from "react";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover";

interface EditorProps {
  text: string;
  onTextChange: (newText: string) => void;
  onCursorChange: () => void;
  isLoading: boolean;
  tone: string;
  onToneChange: (newTone: string) => void;
  grammarSuggestions: Suggestion[];
  activeGrammarSuggestion: Suggestion | null;
  onAccept: (suggestion: Suggestion) => void;
  onDismiss: (suggestion: Suggestion) => void;
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
  grammarSuggestions,
  activeGrammarSuggestion,
  onAccept,
  onDismiss,
  suggestionMode,
  onSuggestionModeChange,
  onFinalSuggestion,
  onSuggestionClick
}, ref) => {
  const tones = ["Melancólico", "Romântico", "Reflexivo", "Jubiloso", "Sombrio"];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightsRef = useRef<HTMLDivElement>(null);
  const [textareaScroll, setTextareaScroll] = useState({ top: 0, left: 0 });

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

  const handleScroll = () => {
    if (textareaRef.current && highlightsRef.current) {
        const { scrollTop, scrollLeft } = textareaRef.current;
        highlightsRef.current.scrollTop = scrollTop;
        highlightsRef.current.scrollLeft = scrollLeft;
        setTextareaScroll({ top: scrollTop, left: scrollLeft });
    }
  };

  const editorContent = useMemo(() => {
    if (!grammarSuggestions.length) return text;

    let lastIndex = 0;
    const parts: (string | React.ReactNode)[] = [];
    const sortedSuggestions = [...grammarSuggestions].sort((a, b) => text.indexOf(a.originalText) - text.indexOf(b.originalText));
    
    // Create a new array to avoid modifying the sorted one
    const uniqueSuggestions = sortedSuggestions.filter((suggestion, index, self) => 
        index === self.findIndex((s) => s.originalText === suggestion.originalText)
    );

    uniqueSuggestions.forEach((suggestion, i) => {
        const startIndex = text.indexOf(suggestion.originalText, lastIndex);
        if (startIndex === -1) return;

        // Add text before the suggestion
        if (startIndex > lastIndex) {
            parts.push(text.substring(lastIndex, startIndex));
        }

        const isSuggestionActive = activeGrammarSuggestion?.originalText === suggestion.originalText;
        const AnchorComponent = isSuggestionActive ? PopoverAnchor : 'span';
        
        parts.push(
          <Popover open={isSuggestionActive} onOpenChange={(open) => !open && onDismiss(activeGrammarSuggestion!)} key={`popover-${i}`}>
            <PopoverTrigger asChild>
                <span 
                  className="bg-destructive/20 underline decoration-destructive decoration-wavy underline-offset-2 cursor-pointer"
                  onClick={() => onSuggestionClick(suggestion)}
                >
                    {suggestion.originalText}
                </span>
            </PopoverTrigger>
            {isSuggestionActive && (
              <SuggestionPopover
                suggestion={activeGrammarSuggestion}
                onAccept={() => onAccept(activeGrammarSuggestion)}
                onDismiss={() => onDismiss(activeGrammarSuggestion)}
              />
            )}
          </Popover>
        );

        lastIndex = startIndex + suggestion.originalText.length;
    });

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return parts.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>);
}, [text, grammarSuggestions, activeGrammarSuggestion, onDismiss, onAccept, onSuggestionClick]);


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Feather className="h-8 w-8 text-primary" />
            <CardTitle className="font-headline text-3xl">
              Melopoësis
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
             <Textarea
                 ref={textareaRef}
                 value={text}
                 onChange={(e) => onTextChange(e.target.value)}
                 onScroll={handleScroll}
                 onSelect={onCursorChange}
                 onKeyDown={onCursorChange}
                 placeholder="Escreva seu poema aqui..."
                 className="min-h-[50vh] w-full resize-none bg-background p-4 text-base leading-relaxed caret-foreground selection:bg-primary/20 text-transparent"
                 aria-label="Editor de Poesia"
             />
             <div
                 ref={highlightsRef}
                 className="pointer-events-none absolute inset-0 min-h-[50vh] w-full resize-none overflow-auto whitespace-pre-wrap rounded-md border border-transparent bg-transparent p-4 text-base leading-relaxed text-foreground"
                 style={{ wordWrap: 'break-word' }}
                 aria-hidden="true"
             >
                 {editorContent}
                  {/* Add a non-breaking space to ensure the div has the same height as the textarea */}
                 &nbsp;
             </div>
         </div>

        {suggestionMode === "final" && (
          <div className="flex justify-end">
            <Button onClick={onFinalSuggestion} disabled={isLoading}>
              <Wand2 className="mr-2 h-4 w-4" />
              {isLoading ? "Gerando..." : "Gerar Sugestões de Tom"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

Editor.displayName = 'Editor';
