"use client";

import { Check, X, RefreshCw } from "lucide-react";
import {
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { Suggestion } from "@/app/page";
import { Separator } from "./ui/separator";

interface SuggestionPopoverProps {
  suggestion: Suggestion;
  onAccept: () => void;
  onDismiss: () => void;
  onResuggest: () => void;
}

export function SuggestionPopover({
  suggestion,
  onAccept,
  onDismiss,
  onResuggest,
}: SuggestionPopoverProps) {

  return (
     <PopoverContent className="w-80" align="start" side="bottom" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Correção Gramatical</p>
            <p className="text-sm text-muted-foreground">
              {suggestion.explanation}
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Sugerido:</p>
            <blockquote className="border-l-2 border-primary pl-3 text-sm italic">
                {suggestion.correctedText}
            </blockquote>
          </div>
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
