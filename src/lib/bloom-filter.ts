export interface BloomFilterConfig {
  size: number;
  hashCount: number;
}

export class BloomFilter {
  private bits: Uint8Array;
  private size: number;
  private hashCount: number;

  constructor(config: BloomFilterConfig)
  constructor(config: BloomFilterConfig, existingBits?: Uint8Array)
  constructor(config: BloomFilterConfig, existingBits?: Uint8Array) {
    this.size = config.size;
    this.hashCount = config.hashCount;
    this.bits = existingBits ?? new Uint8Array(Math.ceil(this.size / 8));
  }

  private hash(str: string, seed: number): number {
    let h1 = seed;
    for (let i = 0; i < str.length; i++) {
      h1 = Math.imul(31, h1) + str.charCodeAt(i) | 0;
    }
    return Math.abs(h1 % this.size);
  }

  add(item: string): void {
    for (let i = 0; i < this.hashCount; i++) {
      const idx = this.hash(item, i * 31337);
      this.bits[Math.floor(idx / 8)] |= 1 << (idx % 8);
    }
  }

  mayContain(item: string): boolean {
    for (let i = 0; i < this.hashCount; i++) {
      const idx = this.hash(item, i * 31337);
      if ((this.bits[Math.floor(idx / 8)] & (1 << (idx % 8))) === 0) {
        return false;
      }
    }
    return true;
  }

  getBits(): Uint8Array {
    return this.bits;
  }

  getState(): { bits: number[]; size: number; hashCount: number } {
    return {
      bits: Array.from(this.bits),
      size: this.size,
      hashCount: this.hashCount,
    };
  }

  static fromState(state: { bits: number[]; size: number; hashCount: number }): BloomFilter {
    const filter = new BloomFilter(
      { size: state.size, hashCount: state.hashCount },
      new Uint8Array(state.bits)
    );
    return filter;
  }
}
