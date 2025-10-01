"use client";

import { Feather, LoaderCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface EditorProps {
  text: string;
  onTextChange: (newText: string) => void;
  isLoading: boolean;
}

export function Editor({ text, onTextChange, isLoading }: EditorProps) {
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
      <CardContent>
        <Textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Escreva seu poema aqui..."
          className="min-h-[50vh] w-full rounded-md border-input bg-input p-4 text-base focus-visible:ring-2"
          aria-label="Editor de Poesia"
        />
      </CardContent>
    </Card>
  );
}
