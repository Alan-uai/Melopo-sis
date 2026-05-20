"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const BINARY_HEADER = new Uint8Array([0x01]);

export interface UseAudioCaptureOptions {
  onAudioData: (pcmBuffer: ArrayBuffer) => void;
  audioCtx?: AudioContext;
  bufferSize?: number;
}

export function useAudioCapture(options: UseAudioCaptureOptions) {
  const { onAudioData, audioCtx: externalCtx, bufferSize = 2048 } = options;
  const [isCapturing, setIsCapturing] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const isCapturingRef = useRef(false);
  const isPausedRef = useRef(false);
  const onAudioDataRef = useRef(onAudioData);
  onAudioDataRef.current = onAudioData;

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && !externalCtx) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, [externalCtx]);

  const startCapture = useCallback(async () => {
    if (isCapturingRef.current) return;

    try {
      const audioCtx = externalCtx || new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      await audioCtx.audioWorklet.addModule("/audio-worklet-processor.js");

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const workletNode = new AudioWorkletNode(audioCtx, "pcm-capture");
      workletNodeRef.current = workletNode;
      workletNode.port.postMessage({ bufferSize });

      const header = BINARY_HEADER;

      workletNode.port.onmessage = (event) => {
        if (!isCapturingRef.current || isPausedRef.current) return;

        const pcmData = event.data as ArrayBuffer;

        const wsMessage = new Uint8Array(header.length + pcmData.byteLength);
        wsMessage.set(header);
        wsMessage.set(new Uint8Array(pcmData), header.length);

        onAudioDataRef.current(wsMessage.buffer);
      };

      source.connect(workletNode);

      isCapturingRef.current = true;
      setIsCapturing(true);
    } catch (err) {
      console.error("Audio capture start failed:", err);
      cleanup();
      throw err;
    }
  }, [externalCtx, bufferSize, cleanup]);

  const stopCapture = useCallback(() => {
    isCapturingRef.current = false;
    setIsCapturing(false);
    cleanup();
  }, [cleanup]);

  const pauseCapture = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  const resumeCapture = useCallback(() => {
    isPausedRef.current = false;
  }, []);

  return {
    startCapture,
    stopCapture,
    pauseCapture,
    resumeCapture,
    isCapturing,
    audioCtxRef,
  };
}
