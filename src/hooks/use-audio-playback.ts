"use client";

import { useState, useRef, useCallback } from "react";

const JITTER_TARGET_MS = 200;

export function useAudioPlayback(sharedCtx?: AudioContext | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(sharedCtx ?? null);
  const nextStartTimeRef = useRef(0);
  const playingSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const jitterQueueRef = useRef<ArrayBuffer[]>([]);
  const jitterFillingRef = useRef(false);
  const jitterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ensureContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext({ sampleRate: 16000 });
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const flushJitterQueue = useCallback(() => {
    const ctx = ensureContext();
    const queue = jitterQueueRef.current;
    if (queue.length === 0) return;

    const buffer = queue.shift()!;
    const i16Array = new Int16Array(buffer);
    const f32Array = new Float32Array(i16Array.length);
    for (let i = 0; i < i16Array.length; i++) {
      f32Array[i] = i16Array[i] / 32768.0;
    }

    const sampleRate = 24000;
    const audioBuffer = ctx.createBuffer(1, f32Array.length, sampleRate);
    audioBuffer.getChannelData(0).set(f32Array);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const wasEmpty = playingSourcesRef.current.size === 0;
    source.onended = () => {
      playingSourcesRef.current.delete(source);
      if (playingSourcesRef.current.size === 0) {
        setIsPlaying(false);
      }
    };
    playingSourcesRef.current.add(source);
    if (wasEmpty) {
      setIsPlaying(true);
    }

    const t = ctx.currentTime;
    if (nextStartTimeRef.current < t) nextStartTimeRef.current = t;
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;

    if (queue.length > 0) {
      flushJitterQueue();
    }
  }, [ensureContext]);

  const playArrayBuffer = useCallback(
    (buffer: ArrayBuffer, sampleRate = 24000) => {
      jitterQueueRef.current.push(buffer);

      if (jitterFillingRef.current) return;

      const totalMs = jitterQueueRef.current.reduce((sum, buf) => {
        return sum + (buf.byteLength / 2 / sampleRate) * 1000;
      }, 0);

      if (totalMs < JITTER_TARGET_MS) {
        jitterFillingRef.current = true;
        const remainingMs = JITTER_TARGET_MS - totalMs;
        jitterTimerRef.current = setTimeout(() => {
          jitterFillingRef.current = false;
          flushJitterQueue();
        }, remainingMs);
        return;
      }

      flushJitterQueue();
    },
    [flushJitterQueue],
  );

  const stopPlayback = useCallback(() => {
    if (jitterTimerRef.current) {
      clearTimeout(jitterTimerRef.current);
      jitterTimerRef.current = null;
    }
    jitterQueueRef.current = [];
    jitterFillingRef.current = false;

    playingSourcesRef.current.forEach((source) => {
      try { source.stop(); } catch (e) {}
    });
    playingSourcesRef.current.clear();
    if (audioCtxRef.current) {
      nextStartTimeRef.current = audioCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
    setIsPlaying(false);
  }, []);

  const clearQueue = useCallback(() => {
    stopPlayback();
  }, [stopPlayback]);

  const playBase64Audio = useCallback(
    (base64: string, sampleRate = 24000) => {
      const binaryArray = Uint8Array.from(atob(base64), (c) =>
        c.charCodeAt(0),
      );
      playArrayBuffer(binaryArray.buffer, sampleRate);
    },
    [playArrayBuffer],
  );

  const close = useCallback(() => {
    stopPlayback();
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, [stopPlayback]);

  return {
    playArrayBuffer,
    playBase64Audio,
    stopPlayback,
    clearQueue,
    close,
    isPlaying,
    nextStartTimeRef,
    audioCtxRef,
    ensureContext,
  };
}
