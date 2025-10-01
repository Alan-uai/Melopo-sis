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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "./ui/label";

interface EditorProps {
  text: string;
  onTextChange: (newText: string) => void;
  isLoading: boolean;
  tone: string;
  onToneChange: (newTone: string) => void;
}

export function Editor({
  text,
  onTextChange,
  isLoading,
  tone,
  onToneChange,
}: EditorProps) {
  const tones = ["Melancólico", "Romântico", "Reflexivo", "Jubiloso", "Sombrio"];

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
