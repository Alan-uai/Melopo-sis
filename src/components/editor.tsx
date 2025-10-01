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
import React, { useMemo, useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Button } from "./ui/button";

interface EditorProps {
  text: string;
  onTextChange: (newText: string) => void;
  isLoading: boolean;
  tone: string;
  onToneChange: (newTone: string) => void;
  grammarSuggestions: Suggestion[];
  onAccept: (suggestion: Suggestion) => void;
  onDismiss: (suggestion: Suggestion) => void;
  suggestionMode: SuggestionMode;
  onSuggestionModeChange: (mode: SuggestionMode) => void;
  onFinalSuggestion: () => void;
}

export interface EditorRef {
  getCursorPosition: () => number | null;
  getCurrentLine: (text: string, cursorPosition: number | null) => string;
}

export const Editor = forwardRef<EditorRef, EditorProps>(({
  text,
  onTextChange,
  isLoading,
  tone,
  onToneChange,
  grammarSuggestions,
  onAccept,
  onDismiss,
  suggestionMode,
  onSuggestionModeChange,
  onFinalSuggestion
}, ref) => {
  const tones = ["Melancólico", "Romântico", "Reflexivo", "Jubiloso", "Sombrio"];
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

  const handleScroll = () => {
    if (textareaRef.current && highlightsRef.current) {
      highlightsRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightsRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const editorContent = useMemo(() => {
    let content: (string | React.ReactNode)[] = [text];
    
    if (grammarSuggestions.length > 0) {
        const suggestionMap = new Map<string, Suggestion>();
        grammarSuggestions.forEach(s => {
          if (s && s.originalText) {
            suggestionMap.set(s.originalText.trim(), s);
          }
        });
        
        // This regex will split the text by any of the suggestion texts, keeping the delimiters
        const originals = Array.from(suggestionMap.keys());
        if (originals.length > 0) {
            const regex = new RegExp(`(${originals.map(o => o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
            const parts = text.split(regex);
            
            content = parts.map((part, index) => {
                const suggestion = suggestionMap.get(part.trim());
                if (suggestion) {
                    return (
                        <SuggestionPopover
                            key={`${index}-${suggestion.originalText}`}
                            suggestion={suggestion}
                            onAccept={() => onAccept(suggestion)}
                            onDismiss={() => onDismiss(suggestion)}
                        >
                            <span
                                className="bg-destructive/20 underline decoration-destructive decoration-wavy underline-offset-2 cursor-pointer"
                            >
                                {part}
                            </span>
                        </SuggestionPopover>
                    );
                }
                return part;
            });
        }
    }

    return content.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>);
}, [text, grammarSuggestions, onAccept, onDismiss]);


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

        <div 
          className="relative grid"
          onClick={() => textareaRef.current?.focus()}
        >
          <div
            ref={highlightsRef}
            className="pointer-events-none col-start-1 row-start-1 min-h-[50vh] w-full resize-none whitespace-pre-wrap rounded-md border border-transparent bg-input p-4 text-base leading-relaxed"
            style={{ wordWrap: 'break-word' }}
            aria-hidden="true"
          >
              {editorContent}
              {/* Add a non-breaking space to ensure the div has the same height as the textarea */}
              &nbsp;
          </div>
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onScroll={handleScroll}
            placeholder="Escreva seu poema aqui..."
            className="col-start-1 row-start-1 min-h-[50vh] w-full resize-none bg-transparent p-4 text-base leading-relaxed text-transparent caret-foreground selection:bg-primary/20 selection:text-foreground"
            aria-label="Editor de Poesia"
          />
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
