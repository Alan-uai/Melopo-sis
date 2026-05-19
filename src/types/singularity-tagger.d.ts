declare module 'singularity-tagger' {
  interface PosTaggerInstance {
    analyzeString(text: string): Promise<string[]>;
    analyzeStream(streamInput: unknown, streamOutput: unknown): Promise<void>;
  }

  function PosTagger(): Promise<PosTaggerInstance>;
  export default PosTagger;
}
