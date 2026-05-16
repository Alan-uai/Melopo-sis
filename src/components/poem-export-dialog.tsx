"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Image, Share2, Copy, FileText, Palette, QrCode, Eye } from "lucide-react";
import { toPng } from "html-to-image";
import { useToast } from "@/hooks/use-toast";
import { loadExportConfig, saveExportConfig, FONT_OPTIONS, BG_COLOR_PRESETS, type ExportConfig } from "@/lib/export-config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";


interface PoemExportDialogProps {
  title: string;
  text: string;
  tone: string;
}

const TONE_GRADIENTS: Record<string, string> = {
  "Melancólico": "linear-gradient(135deg, #1e1b4b, #0f172a)",
  "Romântico": "linear-gradient(135deg, #500724, #2d0a33)",
  "Reflexivo": "linear-gradient(135deg, #0f2e2e, #111827)",
  "Jubiloso": "linear-gradient(135deg, #78350f, #422006)",
  "Sombrio": "linear-gradient(135deg, #0a0a0a, #171717)",
  "Saudoso": "linear-gradient(135deg, #0c1f3e, #172554)",
  "Épico": "linear-gradient(135deg, #450a0a, #7c2d12)",
  "Lírico": "linear-gradient(135deg, #3b0764, #581c87)",
  "Satírico": "linear-gradient(135deg, #1a2e05, #0f1a02)",
  "Filosófico": "linear-gradient(135deg, #1c1917, #292524)",
  "Intimista": "linear-gradient(135deg, #4a044e, #701a75)",
  "Nostálgico": "linear-gradient(135deg, #451a03, #7c2d12)",
  "Visionário": "linear-gradient(135deg, #172554, #1e3a5f)",
  "Conciso": "linear-gradient(135deg, #111827, #1f2937)",
  "Erótico": "linear-gradient(135deg, #4c0519, #7f1d1d)",
  "Grotesco / Degradação": "linear-gradient(135deg, #0a0a0a, #171717)",
  "Sagrado / Místico": "linear-gradient(135deg, #422006, #78350f)",
};

function getToneGradient(tone: string): string {
  return TONE_GRADIENTS[tone] || "linear-gradient(135deg, #0f172a, #1e293b)";
}

export function PoemExportDialog({ title, text, tone }: PoemExportDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [config, setConfig] = useState<ExportConfig>(loadExportConfig);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    saveExportConfig(config);
  }, [config]);

  useEffect(() => {
    if (config.showQRCode && typeof window !== "undefined") {
      import("qrcode").then((QRCode) => {
        QRCode.toDataURL(config.qrCodeUrl, {
          width: 80,
          margin: 1,
          color: { dark: "#ffffffcc", light: "#0000" },
        }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
      });
    } else {
      setQrDataUrl(null);
    }
  }, [config.showQRCode, config.qrCodeUrl]);

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

  const captureCard = useCallback(async (pixelRatio: number = 2): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    setIsCapturing(true);
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio });
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

  const downloadPdf = useCallback(async () => {
    const blob = await captureCard(3);
    if (!blob) return;
    try {
      const mod = await import("jspdf");
      const JsPDF = (mod as any).default || mod;
      const pdf = Reflect.construct(JsPDF, [{ orientation: "portrait", unit: "px", format: [400, 600] }]) as any;
      const imgData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.addEventListener("loadend", () => resolve(reader.result as string));
        reader.readAsDataURL(blob);
      });
      const img = document.createElement("img");
      img.src = imgData;
      await new Promise<void>((resolve) => { img.onload = () => resolve(); });
      const imgW = 380;
      const imgH = (img.height / img.width) * imgW;
      if (imgH > 580) {
        const scale = 580 / imgH;
        pdf.addImage(imgData, "PNG", 10, 10, imgW * scale, 580);
      } else {
        pdf.addImage(imgData, "PNG", 10, 10, imgW, imgH);
      }
      pdf.save(`${poemTitle}.pdf`);
      toast({ title: "PDF baixado!", description: `"${poemTitle}.pdf" foi baixado.` });
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível gerar o PDF." });
    }
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

  const cardStyle: React.CSSProperties = {
    background: config.useGradient ? getToneGradient(tone) : config.bgColor,
    fontFamily: config.fontFamily,
    fontSize: `${config.fontSize}px`,
    lineHeight: config.lineHeight,
    position: "relative",
    overflow: "hidden",
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={!hasContent && !title}>
          <Image className="h-4 w-4" />
          <span className="sr-only">Exportar poema</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar Poema</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            ref={cardRef}
            className="rounded-xl p-8 text-center text-pretty border border-white/10"
            style={cardStyle}
          >
            {poemTitle && (
              <h3
                className="font-bold mb-6 leading-snug text-white/90"
                style={{ fontSize: `${config.fontSize + 8}px`, fontFamily: config.fontFamily }}
              >
                {poemTitle}
              </h3>
            )}
            <div
              className="leading-relaxed whitespace-pre-line text-white/80"
              style={{ fontSize: `${config.fontSize}px`, fontFamily: config.fontFamily, lineHeight: config.lineHeight }}
            >
              {text || "..."}
            </div>

            <div className="mt-6 flex items-end justify-between">
              {config.showWatermark && (
                <div className="text-xs text-white/40 tracking-widest uppercase flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
                    <path d="M22.6455 58.7454C21.2588 58.0515 20 56.5929 20 54.5C20 49.2533 30.2547 43.4149 34.9999 41.5C39.7451 39.5851 45.4166 33.3562 43.1662 25.5C41.222 18.7505 32.5598 16.3331 29.8333 22C28.4124 25.0416 29.1559 29.4173 30.4999 32.5C23.4999 30.5 17.5849 21.9149 22.4162 13.5C27.2475 5.08511 38.9999 5.49999 44.9999 15.5C50.9999 25.5 45.8327 40.0851 34.9999 46C29.7451 48.9149 24.0322 59.4392 22.6455 58.7454Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Melopoësis
                </div>
              )}
              {config.showQRCode && qrDataUrl && (
                <img src={qrDataUrl} alt="QR Code" className="w-12 h-12" />
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Palette className="h-4 w-4" />
              Personalizar
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Cor de fundo</Label>
                <div className="flex gap-1 flex-wrap">
                  {BG_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      title={preset.label}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        config.bgColor === preset.value ? "border-accent scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: preset.value }}
                      onClick={() => setConfig((c) => ({ ...c, bgColor: preset.value }))}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Gradiente por tom</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.useGradient ? "bg-accent" : "bg-muted"
                    }`}
                    onClick={() => setConfig((c) => ({ ...c, useGradient: !c.useGradient }))}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        config.useGradient ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <Input
                    type="color"
                    value={config.bgColor}
                    onChange={(e) => setConfig((c) => ({ ...c, bgColor: e.target.value, useGradient: false }))}
                    className="w-10 h-8 p-0.5 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Fonte</Label>
                <select
                  value={config.fontFamily}
                  onChange={(e) => setConfig((c) => ({ ...c, fontFamily: e.target.value }))}
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                >
                  {FONT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ fontFamily: opt.value }}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tamanho ({config.fontSize}px)</Label>
                <input
                  type="range"
                  min={12}
                  max={28}
                  value={config.fontSize}
                  onChange={(e) => setConfig((c) => ({ ...c, fontSize: Number(e.target.value) }))}
                  className="w-full h-1.5 accent-accent"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Altura linha ({config.lineHeight.toFixed(1)})</Label>
                <input
                  type="range"
                  min={1.2}
                  max={2.4}
                  step={0.1}
                  value={config.lineHeight}
                  onChange={(e) => setConfig((c) => ({ ...c, lineHeight: Number(e.target.value) }))}
                  className="w-full h-1.5 accent-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  Marca d&apos;água
                </Label>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.showWatermark ? "bg-accent" : "bg-muted"
                  }`}
                  onClick={() => setConfig((c) => ({ ...c, showWatermark: !c.showWatermark }))}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      config.showWatermark ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1.5">
                  <QrCode className="h-3.5 w-3.5" />
                  QR Code
                </Label>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.showQRCode ? "bg-accent" : "bg-muted"
                  }`}
                  onClick={() => setConfig((c) => ({ ...c, showQRCode: !c.showQRCode }))}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      config.showQRCode ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            {config.showQRCode && (
              <div className="space-y-1.5">
                <Label className="text-xs">URL do QR Code</Label>
                <Input
                  type="url"
                  value={config.qrCodeUrl}
                  onChange={(e) => setConfig((c) => ({ ...c, qrCodeUrl: e.target.value }))}
                  className="h-8 text-xs"
                  placeholder="https://melopoesis.vercel.app"
                />
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={downloadPng} disabled={isCapturing || !hasContent} className="flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Baixar PNG
            </Button>
            <Button variant="outline" size="sm" onClick={downloadPdf} disabled={isCapturing || !hasContent} className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Baixar PDF
            </Button>
            <Button variant="outline" size="sm" onClick={copyImage} disabled={isCapturing || !hasContent} className="flex items-center gap-1.5">
              <Image className="h-3.5 w-3.5" />
              Copiar Imagem
            </Button>
            <Button variant="outline" size="sm" onClick={sharePoem} disabled={!hasContent} className="flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5" />
              Compartilhar
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={downloadTxt} disabled={!hasContent} className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Baixar .txt
            </Button>
            <Button variant="secondary" size="sm" onClick={copyText} disabled={!hasContent} className="flex items-center gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              Copiar Texto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
