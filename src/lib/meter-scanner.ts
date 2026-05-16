export interface StressMark {
  position: number;
  stressed: boolean;
  syllable: string;
  footType: FootType;
}

export type FootType = "iambic" | "trochaic" | "anapestic" | "dactylic" | "spondaic" | "unknown";

export interface MeterScanResult {
  marks: StressMark[];
  dominantFoot: FootType;
  waveform: number[];
}

const STRESSED_VOWELS = /[áâãéêíóôõú]/;
const UNSTRESSED_VOWELS = /[aeiouàèìòù]/;

function classifyWordStress(word: string): boolean[] {
  const syllables: boolean[] = [];
  const normalized = word.toLowerCase();
  const vowelGroups = normalized.match(/[aeiouáâãéêíóôõúàèìòù]+[^aeiouáâãéêíóôõúàèìòù]*/gi);

  if (!vowelGroups || vowelGroups.length === 0) return [false];

  for (const group of vowelGroups) {
    const hasStress = STRESSED_VOWELS.test(group);
    syllables.push(hasStress);
  }

  if (syllables.length > 1 && !syllables.some(s => s)) {
    syllables[syllables.length - 1] = true;
  }

  return syllables;
}

function detectFoot(mark: boolean[]): FootType {
  if (mark.length >= 2) {
    if (!mark[0] && mark[1]) return "iambic";
    if (mark[0] && !mark[1]) return "trochaic";
    if (mark[0] && mark[1]) return "spondaic";
  }
  if (mark.length >= 3) {
    if (!mark[0] && !mark[1] && mark[2]) return "anapestic";
    if (mark[0] && !mark[1] && !mark[2]) return "dactylic";
  }
  return "unknown";
}

export function scanMeter(text: string): MeterScanResult {
  const words = text.trim().split(/\s+/);
  const marks: StressMark[] = [];
  const waveform: number[] = [];
  const footCounts: Record<FootType, number> = {
    iambic: 0, trochaic: 0, anapestic: 0, dactylic: 0, spondaic: 0, unknown: 0,
  };

  let position = 0;

  for (const word of words) {
    const stressPattern = classifyWordStress(word);
    const foot = detectFoot(stressPattern);
    footCounts[foot]++;

    for (let i = 0; i < stressPattern.length; i++) {
      marks.push({
        position,
        stressed: stressPattern[i],
        syllable: word,
        footType: foot,
      });
      waveform.push(stressPattern[i] ? 1 : 0.3);
      position++;
    }

    position++;
  }

  const dominantFoot = (Object.entries(footCounts) as [FootType, number][])
    .filter(([type]) => type !== "unknown")
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown";

  return { marks, dominantFoot, waveform };
}
