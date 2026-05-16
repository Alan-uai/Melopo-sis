"use client";

import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Image, Share2, Copy, FileText } from "lucide-react";
import { toPng } from "html-to-image";
import { useToast } from "@/hooks/use-toast";

interface PoemExportDialogProps {
  title: string;
  text: string;
  tone: string;
}

const TONE_GRADIENTS: Record<string, string> = {
  "Melancólico": "from-indigo-950/80 to-slate-900/80",
  "Romântico": "from-rose-950/70 to-pink-950/70",
  "Reflexivo": "from-teal-950/70 to-gray-900/70",
  "Jubiloso": "from-amber-700/70 to-yellow-800/70",
  "Sombrio": "from-gray-950/90 to-neutral-950/90",
  "Saudoso": "from-cyan-950/70 to-blue-950/70",
  "Épico": "from-red-950/70 to-orange-950/70",
  "Lírico": "from-violet-950/70 to-purple-950/70",
  "Satírico": "from-lime-950/70 to-green-950/70",
  "Filosófico": "from-stone-950/80 to-zinc-900/80",
  "Intimista": "from-fuchsia-950/60 to-pink-950/60",
  "Nostálgico": "from-amber-950/70 to-orange-950/70",
  "Visionário": "from-blue-950/70 to-indigo-950/70",
  "Conciso": "from-slate-950/80 to-gray-900/80",
  "Erótico": "from-rose-950/80 to-red-950/80",
  "Grotesco / Degradação": "from-neutral-950/90 to-stone-950/90",
  "Sagrado / Místico": "from-yellow-950/60 to-amber-950/60",
};

export function PoemExportDialog({ title, text, tone }: PoemExportDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { toast } = useToast();

  const gradient = TONE_GRADIENTS[tone] || "from-slate-950/80 to-gray-900/80";
  const poemTitle = title.trim() || "Poema sem título";

  const copyText = useCallback(() => {
    const content = title.trim() ? `${title}\n\n${text}` : text;
    navigator.clipboard.writeText(content).then(() => {
      toast({ title: "Texto copiado!", description: "Poema copiado para a área de transferência." });
    }).catch(() => {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível copiar o texto." });
    });
  }, [title, text, toast]);

  const downloadTxt = useCallback(() => {
    const content = title.trim() ? `${title}\n\n${text}` : text;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${poemTitle}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Arquivo baixado!", description: `"${poemTitle}.txt" foi baixado.` });
  }, [title, text, poemTitle, toast]);

  const captureCard = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    setIsCapturing(true);
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      const res = await fetch(dataUrl);
      return await res.blob();
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível gerar a imagem." });
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [toast]);

  const downloadPng = useCallback(async () => {
    const blob = await captureCard();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${poemTitle}.png`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Imagem baixada!", description: `"${poemTitle}.png" foi baixado.` });
  }, [captureCard, poemTitle, toast]);

  const copyImage = useCallback(async () => {
    const blob = await captureCard();
    if (!blob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      toast({ title: "Imagem copiada!", description: "A imagem do poema foi copiada para a área de transferência." });
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível copiar a imagem." });
    }
  }, [captureCard, toast]);

  const sharePoem = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: poemTitle,
          text: title.trim() ? `${title}\n\n${text}` : text,
        });
        toast({ title: "Compartilhado!" });
      } catch {
        // user cancelled
      }
    } else {
      await copyText();
    }
  }, [poemTitle, title, text, copyText, toast]);

  const hasContent = text.trim().length > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={!hasContent && !title}>
          <Image className="h-4 w-4" />
          <span className="sr-only">Exportar poema</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar Poema</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            ref={cardRef}
            className={`bg-gradient-to-br ${gradient} rounded-xl p-8 text-center text-pretty border border-white/10`}
          >
            {poemTitle && (
              <h3 className="text-2xl font-headline font-bold text-white/90 mb-6 leading-snug">
                {poemTitle}
              </h3>
            )}
            <div className="text-base font-body text-white/80 leading-relaxed whitespace-pre-line">
              {text || "..."}
            </div>
            <div className="mt-8 text-xs font-body text-white/40 tracking-widest uppercase">
              Melopoësis
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={downloadPng} disabled={isCapturing || !hasContent} className="flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Baixar PNG
            </Button>
            <Button variant="outline" size="sm" onClick={copyImage} disabled={isCapturing || !hasContent} className="flex items-center gap-1.5">
              <Image className="h-3.5 w-3.5" />
              Copiar Imagem
            </Button>
            <Button variant="outline" size="sm" onClick={sharePoem} disabled={!hasContent} className="flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5" />
              Compartilhar
            </Button>
            <Button variant="outline" size="sm" onClick={copyText} disabled={!hasContent} className="flex items-center gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              Copiar Texto
            </Button>
          </div>
          <Button variant="secondary" size="sm" onClick={downloadTxt} disabled={!hasContent} className="w-full flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Baixar .txt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
