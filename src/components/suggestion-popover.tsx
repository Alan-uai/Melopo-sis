"use client";

import { Check, X, RefreshCw } from "lucide-react";
import {
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { Suggestion } from "@/ai/types";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";

interface SuggestionPopoverProps {
  suggestion: Suggestion;
  onAccept: () => void;
  onDismiss: () => void;
  onResuggest: () => void;
}

const severityLabel: Record<string, { label: string; variant: "destructive" | "secondary" | "default" }> = {
  alta: { label: 'Alta', variant: 'destructive' },
  media: { label: 'Média', variant: 'secondary' },
  baixa: { label: 'Baixa', variant: 'default' },
};

export function SuggestionPopover({
  suggestion,
  onAccept,
  onDismiss,
  onResuggest,
}: SuggestionPopoverProps) {

  const severityInfo = suggestion.severity ? severityLabel[suggestion.severity] : null;

  return (
     <PopoverContent className="w-80" align="start" side="bottom" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Correção Gramatical</p>
            {severityInfo && (
              <Badge variant={severityInfo.variant} className="text-[10px] px-1.5 py-0">
                {severityInfo.label}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {suggestion.explanation}
          </p>
          {suggestion.context && (
            <div className="text-xs text-muted-foreground italic border-l-2 border-muted-foreground/30 pl-2">
              Contexto: "{suggestion.context}"
            </div>
          )}
          <Separator />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Sugerido:</p>
            <blockquote className="border-l-2 border-primary pl-3 text-sm italic">
                {suggestion.correctedText}
            </blockquote>
          </div>
          {suggestion.alternatives && suggestion.alternatives.length > 1 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Alternativas:</p>
              <ul className="text-xs space-y-0.5">
                {suggestion.alternatives.slice(1).map((alt, i) => (
                  <li key={i} className="border-l-2 border-muted-foreground/20 pl-2 italic">
                    {alt.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
             <Button variant="outline" size="icon" className="h-7 w-7" onClick={onResuggest}>
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Resugerir</span>
              </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss}>
              <X className="h-4 w-4" />
              <span className="sr-only">Dispensar</span>
            </Button>
            <Button
              size="icon"
              className="h-7 w-7 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={onAccept}
            >
              <Check className="h-4 w-4" />
              <span className="sr-only">Aceitar</span>
            </Button>
          </div>
        </div>
      </PopoverContent>
  )
}
