export interface ExportConfig {
  bgColor: string;
  useGradient: boolean;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  showWatermark: boolean;
  showQRCode: boolean;
  qrCodeUrl: string;
}

const STORAGE_KEY = "melopoeisis_export_config";

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  bgColor: "#0f172a",
  useGradient: true,
  fontFamily: "Literata, Georgia, serif",
  fontSize: 16,
  lineHeight: 1.8,
  showWatermark: true,
  showQRCode: false,
  qrCodeUrl: "https://melopoesis.vercel.app",
};

export function loadExportConfig(): ExportConfig {
  if (typeof window === "undefined") return DEFAULT_EXPORT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_EXPORT_CONFIG, ...parsed };
    }
  } catch {
    // ignore corrupt data
  }
  return DEFAULT_EXPORT_CONFIG;
}

export function saveExportConfig(config: ExportConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Storage full or unavailable
  }
}

export const FONT_OPTIONS = [
  { value: "Literata, Georgia, serif", label: "Literata" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Garamond, serif", label: "Garamond" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Helvetica, sans-serif", label: "Helvetica" },
  { value: "Courier New, monospace", label: "Courier New" },
];

export const BG_COLOR_PRESETS = [
  { label: "Slate Escuro", value: "#0f172a" },
  { label: "Azul Noite", value: "#1e1b4b" },
  { label: "Verde Musgo", value: "#052e16" },
  { label: "Borgonha", value: "#2e0a1a" },
  { label: "Cinza Chumbo", value: "#1f2937" },
  { label: "Marrom", value: "#291c14" },
  { label: "Branco Sujo", value: "#fef3c7" },
  { label: "Bege Claro", value: "#faf5eb" },
];
