import fs from 'fs';
import path from 'path';
import { BloomFilter } from '../src/lib/bloom-filter';

const WORDS_FILE = path.join(process.cwd(), 'src', 'lib', 'words-pt-list.txt');
const OUTPUT_FILE = path.join(process.cwd(), 'public', 'bloom.json');

const COMMON_MISSING: string[] = ['é', 'quilômetro', 'ônibus'];

const BLOOM_CONFIG = {
  size: 6_000_000,
  hashCount: 7,
};

console.log('[build-bloom] Reading words from:', WORDS_FILE);

if (!fs.existsSync(WORDS_FILE)) {
  console.error('[build-bloom] words-pt-list.txt not found at:', WORDS_FILE);
  process.exit(1);
}

const content = fs.readFileSync(WORDS_FILE, 'latin1');
const words = content.split('\n').filter(Boolean);
console.log(`[build-bloom] Loaded ${words.length} words`);

const bloom = new BloomFilter(BLOOM_CONFIG);

console.log('[build-bloom] Populating bloom filter...');
let count = 0;
for (const w of words) {
  bloom.add(w.toLowerCase());
  count++;
  if (count % 100_000 === 0) {
    console.log(`[build-bloom] ${count}/${words.length} words added`);
  }
}
for (const w of COMMON_MISSING) {
  bloom.add(w.toLowerCase());
}

console.log('[build-bloom] Serializing as base64...');

function toBase64(data: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < data.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(data.slice(i, i + chunkSize)));
  }
  return btoa(binary);
}

const { size, hashCount } = BLOOM_CONFIG;

const output = JSON.stringify({
  bits_b64: toBase64(bloom.getBits()),
  size,
  hashCount,
});
fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');

const fileSizeKb = (Buffer.byteLength(output) / 1024).toFixed(1);
const compressedKb = (Buffer.byteLength(output, 'utf-8') / 1024).toFixed(1);
console.log(`[build-bloom] Written to ${OUTPUT_FILE}`);
console.log(`[build-bloom] Size: ${fileSizeKb} KB (raw), ~${Math.floor(Number(fileSizeKb) * 0.25)} KB gzip`);
console.log(`[build-bloom] Done!`);

export {};
