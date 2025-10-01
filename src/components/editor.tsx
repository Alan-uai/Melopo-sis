"use client";

import { Feather, LoaderCircle } from "lucide-react";
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
import type { Suggestion } from "@/app/page";
import React, { useMemo } from "react";
import { Textarea } from "./ui/textarea";

interface EditorProps {
  text: string;
  onTextChange: (newText: string) => void;
  isLoading: boolean;
  tone: string;
  onToneChange: (newTone: string) => void;
  grammarSuggestions: Suggestion[];
  onAccept: (suggestion: Suggestion) => void;
  onDismiss: (suggestion: Suggestion) => void;
}

export function Editor({
  text,
  onTextChange,
  isLoading,
  tone,
  onToneChange,
  grammarSuggestions,
  onAccept,
  onDismiss,
}: EditorProps) {
  const tones = ["Melancólico", "Romântico", "Reflexivo", "Jubiloso", "Sombrio"];

  const editorContent = useMemo(() => {
    if (grammarSuggestions.length === 0) {
      // Add a space to prevent collapsing when empty
      return <>{text || ' '}</>;
    }

    const suggestionPhrases = grammarSuggestions.map(s => s.originalText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${suggestionPhrases})`, 'g');
    const parts = text.split(regex);

    const content = parts.map((part, index) => {
      const suggestion = grammarSuggestions.find(s => s.originalText === part);
      if (suggestion) {
        return (
          <SuggestionPopover
            key={`${index}-${suggestion.originalText}`}
            suggestion={suggestion}
            onAccept={() => onAccept(suggestion)}
            onDismiss={() => onDismiss(suggestion)}
          >
            <span className="bg-destructive/20 underline decoration-destructive decoration-wavy underline-offset-2 cursor-pointer">
              {part}
            </span>
          </SuggestionPopover>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
    
    // Add a space to prevent collapsing when empty
    return <>{content.length > 0 ? content : ' '}</>
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
        <div className="space-y-2">
          <Label htmlFor="tone-select">Tom do Poema</Label>
          <Select value={tone} onValueChange={onToneChange}>
            <SelectTrigger id="tone-select" className="w-[180px]">
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

        <div className="relative">
          <div
            className="min-h-[50vh] w-full rounded-md border border-transparent bg-input p-4 text-base whitespace-pre-wrap pointer-events-none"
            aria-hidden="true"
            style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
            >
              {editorContent}
          </div>
          <Textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Escreva seu poema aqui..."
            className="absolute inset-0 min-h-[50vh] w-full rounded-md border-input bg-transparent p-4 text-base text-transparent caret-foreground selection:bg-primary/20 selection:text-transparent"
            aria-label="Editor de Poesia"
          />
        </div>
      </CardContent>
    </Card>
  );
}
