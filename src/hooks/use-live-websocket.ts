"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { buildSystemInstruction, toolDeclarations } from "@/lib/live-setup";
import type { VoiceActionHandlers } from "@/components/voice-chat/types";

export interface UseLiveWebSocketOptions {
  onRefreshToken: () => Promise<string>;
  systemParams: {
    assistantName: string;
    userName: string;
    personality: string;
    verbosity: string;
    speechSpeed: string;
    poemContext: ReturnType<VoiceActionHandlers["getPoemContext"]>;
  };
  onSetupComplete: () => void;
  onAudioResponse: (buffer: ArrayBuffer) => void;
  onAudioResponseBase64: (base64: string) => void;
  onToolCall: (toolCall: any, ws: WebSocket | null) => void;
  onTranscription: (text: string, isFinal: boolean) => void;
  onAssistantText: (text: string) => void;
  onInterrupted: () => void;
  onError: (error: string) => void;
  onEndConversation: () => void;
  onQueueStateChange?: (queueLength: number) => void;
}

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const MAX_RECONNECT_ATTEMPTS = 10;
const CONNECTION_TIMEOUT = 10000;
const HEARTBEAT_INTERVAL = 15000;
const MAX_AUDIO_QUEUE = 200;
const AUDIO_DRAIN_INTERVAL = 100;

function getReconnectDelay(attempt: number): number {
  const delay = Math.min(
    INITIAL_RECONNECT_DELAY * Math.pow(2, attempt - 1),
    MAX_RECONNECT_DELAY,
  );
  const jitter = delay * 0.1 * (Math.random() - 0.5);
  return Math.round(delay + jitter);
}

export function useLiveWebSocket(options: UseLiveWebSocketOptions) {
  const {
    onRefreshToken,
    systemParams,
    onSetupComplete,
    onAudioResponse,
    onAudioResponseBase64,
    onToolCall,
    onTranscription,
    onAssistantText,
    onInterrupted,
    onError,
    onEndConversation,
    onQueueStateChange,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disconnectIntentRef = useRef(false);
  const setupSentRef = useRef(false);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const drainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const callbacksRef = useRef({
    onSetupComplete,
    onAudioResponse,
    onAudioResponseBase64,
    onToolCall,
    onTranscription,
    onAssistantText,
    onInterrupted,
    onError,
    onEndConversation,
    onRefreshToken,
    onQueueStateChange,
  });
  callbacksRef.current = {
    onSetupComplete,
    onAudioResponse,
    onAudioResponseBase64,
    onToolCall,
    onTranscription,
    onAssistantText,
    onInterrupted,
    onError,
    onEndConversation,
    onRefreshToken,
    onQueueStateChange,
  };

  const systemParamsRef = useRef(systemParams);
  systemParamsRef.current = systemParams;

  const drainQueue = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (audioQueueRef.current.length === 0) return;

    const chunk = audioQueueRef.current.shift()!;
    ws.send(chunk);

    callbacksRef.current.onQueueStateChange?.(audioQueueRef.current.length);

    if (audioQueueRef.current.length > 0) {
      drainTimerRef.current = setTimeout(drainQueue, AUDIO_DRAIN_INTERVAL);
    }
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(async (overrideToken?: string) => {
    disconnectIntentRef.current = false;
    setupSentRef.current = false;

    const currentToken = overrideToken;
    if (!currentToken) {
      onError("Token não disponível");
      return;
    }

    setIsConnecting(true);

    try {
      const ws = new WebSocket(
        `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?access_token=${encodeURIComponent(currentToken)}`,
      );
      ws.binaryType = "arraybuffer";

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      }, CONNECTION_TIMEOUT);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);

        const params = systemParamsRef.current;
        const instruction = buildSystemInstruction({
          assistantName: params.assistantName,
          userName: params.userName,
          personality: params.personality,
          verbosity: params.verbosity,
          speechSpeed: params.speechSpeed,
          poemContext: {
            title: params.poemContext.title,
            tone: params.poemContext.tone,
            structure: params.poemContext.structure,
            rhyme: params.poemContext.rhyme,
            poemList: params.poemContext.poemList.map((p) => p.title),
          },
        });

        ws.send(
          JSON.stringify({
            setup: {
              model: "models/gemini-3.1-flash-live-preview",
              generationConfig: {
                responseModalities: ["AUDIO"],
                thinkingLevel: "minimal",
              },
              systemInstruction: {
                parts: [{ text: instruction }],
              },
              tools: [{ functionDeclarations: toolDeclarations }],
            },
          }),
        );

        setupSentRef.current = true;
        reconnectAttemptRef.current = 0;

        drainQueue();

        stopHeartbeat();
        heartbeatTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ realtimeInput: { text: "" } }));
          } else {
            stopHeartbeat();
          }
        }, HEARTBEAT_INTERVAL);
      };

      ws.onmessage = (event) => {
        const cb = callbacksRef.current;

        if (event.data instanceof ArrayBuffer) {
          if (event.data.byteLength > 100) {
            cb.onAudioResponse(event.data);
          }
          return;
        }

        let msg: any;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.setupComplete) {
          cb.onSetupComplete();
          setIsConnected(true);
          setIsConnecting(false);
          return;
        }

        if (msg.error) {
          const text =
            typeof msg.error === "string"
              ? msg.error
              : "Erro na conexão com a Live API";
          cb.onError(text);
          ws.close();
          return;
        }

        const parts = msg.serverContent?.modelTurn?.parts;

        if (parts) {
          for (const part of parts) {
            if (part.inlineData?.data) {
              cb.onAudioResponseBase64(part.inlineData.data);
            }
            if (part.text && part.text.trim()) {
              cb.onAssistantText(part.text);
            }
          }
        }

        if (msg.serverContent?.interrupted) {
          cb.onInterrupted();
        }

        if (msg.toolCall) {
          cb.onToolCall(msg.toolCall, ws);
        }

        if (msg.serverContent?.inputTranscription?.text?.trim()) {
          const text = msg.serverContent.inputTranscription.text.trim();
          const finished =
            msg.serverContent.inputTranscription.finished === true;
          cb.onTranscription(text, finished);
        }

        if (msg.serverContent?.turnComplete) {
          // no-op
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onclose = () => {
        clearTimeout(connectionTimeout);
        stopHeartbeat();
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;

        if (!disconnectIntentRef.current) {
          handleReconnect();
        }
      };

      wsRef.current = ws;
    } catch (err) {
      setIsConnecting(false);
      if (!disconnectIntentRef.current) {
        handleReconnect();
      }
    }
  }, [onError, drainQueue, stopHeartbeat]);

  const handleReconnect = useCallback(() => {
    if (disconnectIntentRef.current) return;

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    reconnectAttemptRef.current += 1;

    if (reconnectAttemptRef.current > MAX_RECONNECT_ATTEMPTS) {
      callbacksRef.current.onError(
        "Conexão perdida. Máximo de tentativas excedido.",
      );
      return;
    }

    const delay = getReconnectDelay(reconnectAttemptRef.current);

    reconnectTimerRef.current = setTimeout(async () => {
      try {
        const freshToken = await callbacksRef.current.onRefreshToken();
        connect(freshToken);
      } catch {
        handleReconnect();
      }
    }, delay);
  }, [connect]);

  const disconnect = useCallback(() => {
    disconnectIntentRef.current = true;

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (drainTimerRef.current) {
      clearTimeout(drainTimerRef.current);
      drainTimerRef.current = null;
    }

    stopHeartbeat();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    audioQueueRef.current = [];
    callbacksRef.current.onQueueStateChange?.(0);

    setIsConnected(false);
    setIsConnecting(false);
    reconnectAttemptRef.current = 0;
  }, [stopHeartbeat]);

  const sendMessage = useCallback((msg: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const sendAudio = useCallback((pcmBuffer: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(pcmBuffer);
    } else if (audioQueueRef.current.length < MAX_AUDIO_QUEUE) {
      audioQueueRef.current.push(pcmBuffer.slice(0));
      callbacksRef.current.onQueueStateChange?.(audioQueueRef.current.length);
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    wsRef,
    connect,
    disconnect,
    sendMessage,
    sendAudio,
    isConnected,
    isConnecting,
    reconnectAttemptRef,
  };
}
