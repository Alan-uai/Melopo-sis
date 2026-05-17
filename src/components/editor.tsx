"use client";

import { motion } from "framer-motion";
import { Feather, Info, CheckCheck } from "lucide-react";
import { LightbulbIcon, type BulbState } from "@/components/animations/lightbulb-icon";
import { WandIcon } from "@/components/animations/wand-icon";
import { BookSaveIcon } from "@/components/animations/book-save-icon";
import { InkCopyIcon } from "@/components/animations/ink-copy-icon";
import { BurnClearIcon } from "@/components/animations/burn-clear-icon";
import { HaikuCounter } from "@/components/haiku-counter";
import { SonnetVisualizer } from "@/components/sonnet-visualizer";
import { MeterVisualizer } from "@/components/meter-visualizer";
import { QuillPen } from "@/components/quill-pen";
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
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TooltipProvider } from "./ui/tooltip";
import { SidebarTrigger } from "./ui/sidebar";
import { PoemExportDialog } from "./poem-export-dialog";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { countPoeticSyllables } from "@/lib/poetic-forms";
import { analyzeRhymeScheme } from "@/lib/rhyme-detector";

interface EditorProps {
  text: string;
  onTextChange: (newText: string) => void;
  title: string;
  onTitleChange: (newTitle: string) => void;
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
  onCheckSpelling: () => void;
  onSuggestTone: () => void;
  onClear: () => void;
  onCopy: () => void;
  onSavePoem: () => void;
  isPoemSaved: boolean;
  toneSuggestions: Suggestion[];
  onAcceptAllLowSeverity?: () => void;
  lowSeverityCount?: number;
  lastAcceptedOrigin?: string | null;
}

export interface EditorRef {
  focus: () => void;
  getCursorPosition: () => number | null;
  getCurrentLine: (text: string, cursorPosition: number | null) => string;
}

type AnimationState = 'idle' | 'generating' | 'correcting' | 'finishing';
type AnimationStage = 'beam' | 'pulse';

const TONES = [
  "Melancólico", "Romântico", "Reflexivo", "Jubiloso", "Sombrio",
  "Saudoso", "Épico", "Lírico", "Satírico", "Filosófico",
  "Intimista", "Nostálgico", "Visionário", "Conciso",
  "Erótico", "Grotesco / Degradação", "Sagrado / Místico",
];

export const Editor = forwardRef<EditorRef, EditorProps>(({
  text,
  onTextChange,
  title,
  onTitleChange,
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
  onCheckSpelling,
  onSuggestTone,
  onClear,
  onCopy,
  onSavePoem,
  isPoemSaved,
  toneSuggestions,
  onAcceptAllLowSeverity,
  lowSeverityCount,
  lastAcceptedOrigin,
}, ref) => {
  const structures: { value: TextStructure, label: string }[] = [
    { value: 'poema', label: 'Poema' },
    { value: 'poesia', label: 'Poesia' },
    { value: 'soneto', label: 'Soneto' },
    { value: 'haicai', label: 'Haicai' },
    { value: 'cordel', label: 'Cordel' },
    { value: 'redondilha', label: 'Redondilha' },
    { value: 'decassilabo', label: 'Decassílabo' },
    { value: 'trova', label: 'Trova / Quadra' },
    { value: 'oitava', label: 'Oitava' },
    { value: 'decima', label: 'Décima' },
    { value: 'elegia', label: 'Elegia' },
    { value: 'ode', label: 'Ode' },
    { value: 'verso-livre', label: 'Verso Livre' },
  ];
  const isMobile = useIsMobile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightsRef = useRef<HTMLDivElement>(null);
  const quillContainerRef = useRef<HTMLDivElement>(null);

  const [quillPos, setQuillPos] = useState<{ top: number; left: number } | null>(null);
  const [quillText, setQuillText] = useState<string | null>(null);
  const prevAcceptedOriginRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastAcceptedOrigin && lastAcceptedOrigin !== prevAcceptedOriginRef.current && textareaRef.current) {
      const ta = textareaRef.current;
      const idx = text.indexOf(lastAcceptedOrigin);
      if (idx !== -1) {
        const textBefore = text.substring(0, idx);
        const lines = textBefore.split('\n');
        const lineNum = lines.length - 1;
        const colNum = lines[lines.length - 1].length;

        const lineHeight = 24;
        const charWidth = 8.5;
        const top = lineNum * lineHeight + 8;
        const left = Math.min(colNum * charWidth, ta.clientWidth - 60);

        setQuillPos({ top, left });
        setQuillText(lastAcceptedOrigin);
        setTimeout(() => {
          setQuillPos(null);
          setQuillText(null);
        }, 1500);
      }
      prevAcceptedOriginRef.current = lastAcceptedOrigin;
    }
  }, [text, lastAcceptedOrigin]);

  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [animationStage, setAnimationStage] = useState<AnimationStage>('beam');
  const prevToneSuggestionsLength = useRef(toneSuggestions.length);

  const [bulbState, setBulbState] = useState<BulbState>("off");
  const [wandActive, setWandActive] = useState(false);
  const [savePhase, setSavePhase] = useState<"idle" | "saving" | "done">("idle");
  const [copyPhase, setCopyPhase] = useState<"idle" | "copying" | "done">("idle");
  const [clearPhase, setClearPhase] = useState<"idle" | "burning" | "done">("idle");

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

  useEffect(() => {
    if (toneSuggestions.length > 0 && prevToneSuggestionsLength.current === 0) {
      setBulbState("pulling");
      setTimeout(() => setBulbState("on"), 400);
    } else if (toneSuggestions.length === 0 && prevToneSuggestionsLength.current > 0) {
      setBulbState("turning-off");
      setTimeout(() => setBulbState("off"), 600);
    } else if (toneSuggestions.length < prevToneSuggestionsLength.current && toneSuggestions.length > 0) {
      setBulbState("blinking");
      setTimeout(() => setBulbState("on"), 800);
    }
    prevToneSuggestionsLength.current = toneSuggestions.length;
  }, [toneSuggestions, setBulbState]);

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

  useEffect(() => {
    syncScroll();
  }, [text, syncScroll]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(e.target.value);
    if(animationState !== 'idle') {
      setAnimationState('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      textareaRef.current?.focus();
    }
  };

  const fixedMetricStructures = new Set([
    'soneto', 'haicai', 'cordel', 'redondilha', 'decassilabo', 'trova', 'oitava', 'decima'
  ]);

  const editorContent = useMemo(() => {
    const hasFixedMetric = fixedMetricStructures.has(textStructure);

    const RHYME_COLORS = [
      'hsl(var(--rhyme-color-0))', 'hsl(var(--rhyme-color-1))',
      'hsl(var(--rhyme-color-2))', 'hsl(var(--rhyme-color-3))',
      'hsl(var(--rhyme-color-4))', 'hsl(var(--rhyme-color-5))',
    ];

    let rhymeScheme: string | null = null;
    if (rhyme) {
      const analysis = analyzeRhymeScheme(text);
      rhymeScheme = analysis.scheme || null;
    }

    const getRhymeColor = (lineIdx: number): string | null => {
      if (!rhymeScheme || lineIdx >= rhymeScheme.length) return null;
      const letter = rhymeScheme[lineIdx];
      if (!letter || letter === ' ') return null;
      const idx = letter.charCodeAt(0) - 'A'.charCodeAt(0);
      return RHYME_COLORS[idx % RHYME_COLORS.length];
    };

    const renderSegment = (
      segment: string, prefix: string, startLineIdx: number
    ): { nodes: (string | React.ReactNode)[]; nextLine: number } => {
      if (!segment) return { nodes: [], nextLine: startLineIdx };
      const lines = segment.split('\n');
      const nodes: (string | React.ReactNode)[] = [];
      lines.forEach((line, j) => {
        const lineIdx = startLineIdx + j;
        if (j > 0) nodes.push('\n');

        const lineContent: React.ReactNode[] = [];

        const rhymeColor = getRhymeColor(lineIdx);
        if (rhymeColor && line.trim()) {
          const rMatch = line.match(/^(.*\s)([\wáàâãéèêíïóôõöúçñü-]+)([^\w]*)$/u);
          if (rMatch) {
            lineContent.push(rMatch[1]);
            lineContent.push(<span key={`rw-${prefix}-${j}`} style={{ color: rhymeColor }}>{rMatch[2]}</span>);
            lineContent.push(rMatch[3]);
          } else {
            lineContent.push(line || '\u200B');
          }
        } else {
          lineContent.push(line || '\u200B');
        }

        if (hasFixedMetric && line.trim()) {
          nodes.push(
            <span key={`wrapper-${prefix}-${j}`} className="relative">
              <span>{lineContent}</span>
              <span key={`syl-${prefix}-${j}`} className="absolute right-1 top-0 text-muted-foreground/60 text-xs font-mono select-none">
                [{countPoeticSyllables(line)}]
              </span>
            </span>
          );
        } else {
          nodes.push(
            <span key={`wrapper-${prefix}-${j}`}>
              {lineContent}
            </span>
          );
        }
      });
      return { nodes, nextLine: startLineIdx + lines.length };
    };

    if (!activeGrammarSuggestion) {
      if (!text) return '\u200B';
      return renderSegment(text, 'syl', 0).nodes;
    }

    const parts: (string | React.ReactNode)[] = [];
    const textToProcess = text;
    let currentLine = 0;
    const { originalText } = activeGrammarSuggestion;

    const startIndex = textToProcess.indexOf(originalText);

    if (startIndex !== -1) {
      if (startIndex > 0) {
        const before = textToProcess.substring(0, startIndex);
        const r = renderSegment(before, 'bef', currentLine);
        parts.push(...r.nodes);
        currentLine = r.nextLine;
      }

      parts.push(
        <PopoverAnchor key={`anchor-${startIndex}`} className="relative">
          <span className="bg-destructive/30 ring-2 ring-destructive/50 rounded-sm underline decoration-destructive decoration-wavy underline-offset-2 cursor-pointer">
            {originalText.replace(/\n/g, '\n\u200B')}
          </span>
        </PopoverAnchor>
      );

      const highlightLines = originalText.split('\n');
      if (hasFixedMetric) {
        const hlFirstLine = highlightLines[0];
        if (hlFirstLine.trim()) {
          parts.push(
            <span key={`syl-h-${startIndex}`} className="ml-2 text-muted-foreground/60 text-xs font-mono select-none">
              [{countPoeticSyllables(hlFirstLine)}]
            </span>
          );
        }
      }
      currentLine += highlightLines.length;

      const afterIndex = startIndex + originalText.length;
      if (afterIndex < textToProcess.length) {
        const after = textToProcess.substring(afterIndex);
        const r = renderSegment(after, 'aft', currentLine);
        parts.push(...r.nodes);
      }
    }

    if (textToProcess === "") {
      return '\u200B';
    }

    return parts.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>);
  }, [text, activeGrammarSuggestion, textStructure, rhyme]);

  const isAnimationActive = animationState !== 'idle';
  const isFinishingBeam = animationState === 'finishing' && animationStage === 'beam';
  const isFinishingPulse = animationState === 'finishing' && animationStage === 'pulse';

  const hasText = text.trim().length > 0;

  return (
    <Card className="w-full shadow-lg h-full flex flex-col overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <CardTitle className="font-headline text-3xl">
              Melopoësis
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 preserve-3d perspective-near p-1 rounded-lg bg-gradient-to-b from-accent/[0.03] to-transparent border border-accent/[0.04] shadow-inner-sm">
             <TooltipProvider>
                <Popover>
                    <PopoverTrigger asChild>
                        <motion.div
                          whileHover={{ rotateX: -10, rotateY: 5, z: 10 }}
                          whileTap={{ scale: 0.9, rotateX: 5 }}
                          style={{ transformStyle: "preserve-3d" } as any}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isLoading}
                            onClick={() => {
                              setSavePhase("saving");
                              setTimeout(() => {
                                onSavePoem();
                                setSavePhase("done");
                                setTimeout(() => setSavePhase("idle"), 2000);
                              }, 1000);
                            }}
                            className="relative"
                          >
                            <BookSaveIcon phase={savePhase} size={16} />
                            <span className="sr-only">Salvar Poema</span>
                          </Button>
                        </motion.div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                        <p className="text-sm">{isPoemSaved ? 'Atualizar poema' : 'Salvar poema'}</p>
                    </PopoverContent>
                </Popover>
                <Popover>
                    <PopoverTrigger asChild>
                        <motion.div
                          whileHover={{ rotateX: -10, rotateY: -5, z: 10 }}
                          whileTap={{ scale: 0.9, rotateX: 5 }}
                          style={{ transformStyle: "preserve-3d" } as any}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={!hasText && !title}
                            onClick={() => {
                              onCopy();
                              setCopyPhase("copying");
                              setTimeout(() => setCopyPhase("done"), 1200);
                              setTimeout(() => setCopyPhase("idle"), 2500);
                            }}
                            className="relative"
                          >
                            <InkCopyIcon phase={copyPhase} size={16} />
                            <span className="sr-only">Copiar Texto</span>
                          </Button>
                        </motion.div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                        <p className="text-sm">Copiar texto</p>
                    </PopoverContent>
                </Popover>
                <motion.div
                  whileHover={{ rotateX: -10, z: 10 }}
                  whileTap={{ scale: 0.9, rotateX: 5 }}
                  style={{ transformStyle: "preserve-3d" } as any}
                >
                  <PoemExportDialog title={title} text={text} tone={tone} />
                </motion.div>
                <Popover>
                    <PopoverTrigger asChild>
                        <motion.div
                          whileHover={{ rotateX: -10, rotateY: 5, z: 10 }}
                          whileTap={{ scale: 0.9, rotateX: 5 }}
                          style={{ transformStyle: "preserve-3d" } as any}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={!hasText}
                            onClick={() => {
                              setClearPhase("burning");
                              setTimeout(() => {
                                onClear();
                                setClearPhase("done");
                                setTimeout(() => setClearPhase("idle"), 1200);
                              }, 800);
                            }}
                            className="relative"
                          >
                            <BurnClearIcon phase={clearPhase} size={16} />
                            <span className="sr-only">Limpar Editor</span>
                          </Button>
                        </motion.div>
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
        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
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
                {TONES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between preserve-3d perspective-near">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ z: 5 }}
            style={{ transformStyle: "preserve-3d" } as any}
          >
            <motion.button
              type="button"
              role="switch"
              aria-checked={rhyme}
              onClick={() => onRhymeChange(!rhyme)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors preserve-3d perspective-near ${
                rhyme ? "bg-accent" : "bg-muted"
              }`}
              whileHover={{ scale: 1.05, rotateX: -5 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: rhyme
                  ? "0 0 12px hsl(var(--accent) / 0.4), 0 0 0 1px hsl(var(--accent) / 0.3)"
                  : "0 0 0px transparent",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <motion.span
                className="inline-block h-5 w-5 rounded-full bg-white"
                animate={{
                  x: rhyme ? 24 : 2,
                  rotateY: rhyme ? 360 : 0,
                  boxShadow: rhyme
                    ? "0 2px 8px hsl(var(--accent) / 0.5)"
                    : "0 1px 3px rgb(0 0 0 / 0.2)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              />
            </motion.button>
            <Label className="font-normal text-sm cursor-pointer" onClick={() => onRhymeChange(!rhyme)}>
              Forçar Rima
            </Label>
          </motion.div>

          <div className="flex items-center gap-3 preserve-3d perspective-near">
            <motion.div
              className="relative flex rounded-lg bg-muted p-0.5 preserve-3d"
              style={{ transformStyle: "preserve-3d" } as any}
            >
              {(["gradual", "final"] as const).map((mode) => (
                <motion.button
                  key={mode}
                  type="button"
                  onClick={() => onSuggestionModeChange(mode)}
                  className={`relative z-10 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    suggestionMode === mode
                      ? "text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  whileHover={suggestionMode !== mode ? { z: 5, scale: 1.05 } : {}}
                  whileTap={{ scale: 0.95 }}
                >
                  {mode === "gradual" ? "Gradual" : "Final"}
                </motion.button>
              ))}
              <motion.div
                className="absolute inset-y-0.5 z-0 rounded-md bg-accent"
                layout
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{
                  width: "50%",
                  left: suggestionMode === "gradual" ? "0.125rem" : "calc(50% - 0.125rem)",
                } as any}
              />
            </motion.div>

            <Popover>
              <PopoverTrigger asChild>
                <motion.button
                  className="flex items-center justify-center h-4 w-4"
                  whileHover={{ rotate: 15, scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                    <Info className="h-full w-full text-muted-foreground" />
                </motion.button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Modo de Sugestão</h4>
                    <p className="text-sm text-muted-foreground">
                      <b>Modo Gradual:</b> Sugestões aparecem automaticamente enquanto você escreve (com pausa).
                      <br />
                      <b>Modo Final:</b> Clique nos botões abaixo para analisar o texto completo.
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

          <div className="flex flex-col flex-1">
            <div className="border-b border-border/40 px-4 pt-3 pb-2">
              <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Título do poema..."
                className="w-full bg-transparent font-headline text-xl font-semibold leading-tight text-foreground placeholder:text-muted-foreground/50 outline-none border-none"
              />
            </div>

            <Popover open={!!activeGrammarSuggestion} onOpenChange={() => {}}>
              <div className="relative grid flex-1" ref={quillContainerRef}>
                  {quillPos && quillText && (
                    <div
                      className="absolute pointer-events-none z-40"
                      style={{ top: quillPos.top, left: quillPos.left }}
                    >
                      <QuillPen width={80} height={24} color="hsl(var(--accent))" />
                    </div>
                  )}
                  <Textarea
                      ref={textareaRef}
                      value={text}
                      onChange={handleTextareaChange}
                      onScroll={syncScroll}
                      placeholder="Escreva seu poema aqui..."
                      className={`col-start-1 row-start-1 w-full resize-none bg-transparent p-4 font-body text-base leading-relaxed text-transparent caret-foreground selection:bg-primary/20 h-full border-0 focus-visible:ring-0 ${isMobile ? "min-h-[300px] pb-16" : ""}`}
                      aria-label="Editor de Poesia"
                  />
                  <div
                      ref={highlightsRef}
                      className="pointer-events-none col-start-1 row-start-1 w-full overflow-hidden whitespace-pre-wrap rounded-md bg-transparent p-4 font-body text-base leading-relaxed text-foreground h-full"
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
        </div>

        {textStructure === "haicai" && text.trim() && (
          <div className="pt-4">
            <HaikuCounter
              lines={(() => {
                const lines = text.split('\n').filter(l => l.trim());
                return [lines[0] ?? "", lines[1] ?? "", lines[2] ?? ""] as [string, string, string];
              })()}
              className="py-2"
            />
          </div>
        )}

        {textStructure === "soneto" && text.trim() && (
          <div className="pt-4 flex justify-center">
            <SonnetVisualizer
              lines={text.split('\n').filter(l => l.trim()).slice(0, 14)}
              className="py-2"
            />
          </div>
        )}

        {text.trim() && (textStructure === "decassilabo" || textStructure === "verso-livre") && (
          <div className="pt-4">
            <MeterVisualizer
              text={text}
              width={300}
              height={48}
              className="py-1"
            />
          </div>
        )}

        {suggestionMode === "final" && (
          <div className="flex flex-col gap-2 pt-4 preserve-3d perspective-near">
            <div className="flex justify-start">
              {onAcceptAllLowSeverity && (lowSeverityCount ?? 0) > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20, rotateY: -20 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  whileHover={{ z: 10, rotateX: -3 }}
                  style={{ transformStyle: "preserve-3d" } as any}
                >
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
                </motion.div>
              )}
            </div>
            <div className="flex justify-end gap-2 preserve-3d perspective-near">
              <motion.div
                initial={{ opacity: 0, x: 20, rotateY: 20 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 25 }}
                whileHover={{ z: 10, rotateX: -3 }}
                whileTap={{ scale: 0.97 }}
                style={{ transformStyle: "preserve-3d" } as any}
              >
                <Button
                  variant="default"
                  onClick={() => {
                    setWandActive(true);
                    setTimeout(() => setWandActive(false), 600);
                    onCheckSpelling();
                  }}
                  disabled={isLoading || !hasText}
                  className="flex items-center gap-1.5 relative"
                >
                  <motion.span
                    className="inline-flex"
                    animate={wandActive ? {
                      scale: [1, 1.2, 1],
                      rotate: [0, -10, 10, 0],
                    } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <WandIcon isActive={wandActive} size={16} />
                  </motion.span>
                  {isLoading ? "Analisando..." : "Corrigir Ortografia"}
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20, rotateY: 20 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 25 }}
                whileHover={{ z: 10, rotateX: -3 }}
                whileTap={{ scale: 0.97 }}
                style={{ transformStyle: "preserve-3d" } as any}
              >
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (bulbState === "on" || bulbState === "blinking") {
                      setBulbState("turning-off");
                      setTimeout(() => {
                        setBulbState("off");
                      }, 600);
                    } else {
                      setBulbState("pulling");
                      setTimeout(() => {
                        setBulbState("on");
                        onSuggestTone();
                      }, 400);
                    }
                  }}
                  disabled={isLoading || !hasText}
                  className="flex items-center gap-1.5 relative"
                >
                  <LightbulbIcon state={bulbState} size={16} />
                  Sugerir Tom
                </Button>
              </motion.div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

Editor.displayName = 'Editor';
