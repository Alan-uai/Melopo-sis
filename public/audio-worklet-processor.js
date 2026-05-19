class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this.buffer = [];
    this.port.onmessage = (event) => {
      if (event.data.bufferSize) {
        this.bufferSize = event.data.bufferSize;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) return true;

    const channelData = input[0];

    this.buffer.push(new Float32Array(channelData));

    const totalSamples = this.buffer.reduce((sum, arr) => sum + arr.length, 0);

    if (totalSamples >= this.bufferSize) {
      const combined = new Float32Array(totalSamples);
      let offset = 0;
      for (const arr of this.buffer) {
        combined.set(arr, offset);
        offset += arr.length;
      }
      this.buffer = [];

      const pcm16 = new Int16Array(this.bufferSize);
      for (let i = 0; i < this.bufferSize; i++) {
        const s = Math.max(-1, Math.min(1, combined[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      this.port.postMessage(
        pcm16.buffer,
        [pcm16.buffer],
      );
    }

    return true;
  }
}

registerProcessor("pcm-capture", PcmCaptureProcessor);
