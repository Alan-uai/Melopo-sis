"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  MicOff,
  Loader2,
  Settings,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage, VoiceActionHandlers } from "./types";
import "./voice-chat-animations.css";

const pcmToBase64 = (f32Array: Float32Array) => {
  const i16Array = new Int16Array(f32Array.length);
  for (let i = 0; i < f32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, f32Array[i]));
    i16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const buffer = new ArrayBuffer(i16Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < i16Array.length; i++) {
    view.setInt16(i * 2, i16Array[i], true);
  }
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export default function VoiceChatPanel({
  actions,
}: {
  actions: VoiceActionHandlers;
}) {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const [voiceName, setVoiceName] = useState("Aoede");
  const [personality, setPersonality] = useState(
    "Warm, poetic, and encouraging, like a fellow poet helping a friend.",
  );
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [customWakeWords, setCustomWakeWords] = useState<string[]>([]);
  const [isTrainingWakeWord, setIsTrainingWakeWord] = useState(false);

  const [userName, setUserName] = useState("");
  const [assistantName, setAssistantName] = useState("Poeta");
  const [verbosity, setVerbosity] = useState("concise");
  const [speechSpeed, setSpeechSpeed] = useState("normal");
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [onlineSearchEnabled, setOnlineSearchEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const playingSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoIntervalRef = useRef<any>(null);
  const startVoiceRef = useRef<((p?: string) => Promise<void>) | null>(null);
  const actionsRef = useRef(actions);
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    const savedVoice = localStorage.getItem("vc_voiceName");
    const savedPersonality = localStorage.getItem("vc_personality");
    const savedWakeWord = localStorage.getItem("vc_wakeWord");
    const savedUserName = localStorage.getItem("vc_userName");
    const savedAssistantName = localStorage.getItem("vc_assistantName");
    const savedVerbosity = localStorage.getItem("vc_verbosity");
    const savedSpeechSpeed = localStorage.getItem("vc_speechSpeed");
    const savedSoundEffects = localStorage.getItem("vc_soundEffects");
    const savedOnlineSearch = localStorage.getItem("vc_onlineSearch");
    const savedLocation = localStorage.getItem("vc_location");
    const savedCamera = localStorage.getItem("vc_cameraEnabled");
    const savedChatHistory = localStorage.getItem("vc_chatHistory");

    setTimeout(() => {
      if (savedVoice) setVoiceName(savedVoice);
      if (savedPersonality) setPersonality(savedPersonality);
      if (savedWakeWord) setWakeWordEnabled(savedWakeWord === "true");
      if (savedUserName) setUserName(savedUserName);
      if (savedAssistantName) setAssistantName(savedAssistantName);
      if (savedVerbosity) setVerbosity(savedVerbosity);
      if (savedSpeechSpeed) setSpeechSpeed(savedSpeechSpeed);
      if (savedSoundEffects !== null)
        setSoundEffectsEnabled(savedSoundEffects === "true");
      if (savedOnlineSearch !== null)
        setOnlineSearchEnabled(savedOnlineSearch === "true");
      if (savedLocation !== null)
        setLocationEnabled(savedLocation === "true");
      if (savedCamera !== null) setCameraEnabled(savedCamera === "true");
      if (savedChatHistory !== null) {
        try {
          setChatHistory(JSON.parse(savedChatHistory));
        } catch (e) {}
      }
    }, 0);
  }, []);

  useEffect(() => {
    localStorage.setItem("vc_chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem("vc_voiceName", voiceName);
    localStorage.setItem("vc_personality", personality);
    localStorage.setItem("vc_wakeWord", wakeWordEnabled.toString());
    localStorage.setItem("vc_userName", userName);
    localStorage.setItem("vc_assistantName", assistantName);
    localStorage.setItem("vc_verbosity", verbosity);
    localStorage.setItem("vc_speechSpeed", speechSpeed);
    localStorage.setItem("vc_soundEffects", soundEffectsEnabled.toString());
    localStorage.setItem("vc_onlineSearch", onlineSearchEnabled.toString());
    localStorage.setItem("vc_location", locationEnabled.toString());
    localStorage.setItem("vc_cameraEnabled", cameraEnabled.toString());
  }, [
    voiceName,
    personality,
    wakeWordEnabled,
    userName,
    assistantName,
    verbosity,
    speechSpeed,
    soundEffectsEnabled,
    onlineSearchEnabled,
    locationEnabled,
    cameraEnabled,
  ]);

  useEffect(() => {
    const saved = localStorage.getItem("vc_customWakeWords");
    if (saved) {
      setTimeout(() => {
        try {
          setCustomWakeWords(JSON.parse(saved));
        } catch (e) {}
      }, 0);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "vc_customWakeWords",
      JSON.stringify(customWakeWords),
    );
  }, [customWakeWords]);

  useEffect(() => {
    if (wakeWordEnabled && typeof window !== "undefined") {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => stream.getTracks().forEach((t) => t.stop()))
        .catch(() => console.error("Microphone permission denied"));
    }
  }, [wakeWordEnabled]);

  const trainWakeWord = () => {
    if (customWakeWords.length >= 5) {
      alert(
        "Você atingiu o limite de 5 formas de chamá-lo. Limpe para adicionar novas.",
      );
      return;
    }
    setIsTrainingWakeWord(true);
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = "pt-BR";
      rec.onresult = (e: any) => {
        const resultStr = e.results[0][0].transcript.toLowerCase().trim();
        if (resultStr.split(" ").length <= 3) {
          setCustomWakeWords((prev) =>
            Array.from(new Set([...prev, resultStr])),
          );
        }
        setIsTrainingWakeWord(false);
      };
      rec.onerror = () => setIsTrainingWakeWord(false);
      rec.onend = () => setIsTrainingWakeWord(false);
      try {
        rec.start();
      } catch (err) {
        setIsTrainingWakeWord(false);
      }
    } else {
      setIsTrainingWakeWord(false);
      alert("Seu navegador não suporta reconhecimento de voz.");
    }
  };

  const playSoundEffect = (freq = 880, duration = 0.1) => {
    if (!soundEffectsEnabled) return;
    try {
      const ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  useEffect(() => {
    let recognition: any;
    if (isActive && typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "pt-BR";

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const text = event.results[i][0].transcript.trim();
              if (text) {
                setChatHistory((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    role: "user",
                    text,
                    timestamp: Date.now(),
                  },
                ]);
              }
            }
          }
        };

        recognition.onend = () => {
          if (isActive) {
            try {
              recognition.start();
            } catch (e) {}
          }
        };

        try {
          recognition.start();
        } catch (e) {}
      }
    }

    return () => {
      if (recognition) {
        recognition.onend = null;
        try {
          recognition.stop();
        } catch (e) {}
      }
    };
  }, [isActive]);

  useEffect(() => {
    let recognition: any;
    if (
      wakeWordEnabled &&
      !isActive &&
      !isTrainingWakeWord &&
      typeof window !== "undefined"
    ) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "pt-BR";

        let wakeWordMatchedInCurrentSentence = false;

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript.toLowerCase();
            const isFinal = event.results[i].isFinal;

            const baseMatches = transcript.match(/poeta|p(o|ó)eta/);
            const aliasMatch =
              assistantName &&
              transcript.includes(assistantName.toLowerCase())
                ? assistantName.toLowerCase()
                : null;
            const customMatch = customWakeWords.find((w) =>
              transcript.includes(w),
            );
            const matchStr = baseMatches
              ? baseMatches[0]
              : aliasMatch || customMatch || null;

            if (matchStr) {
              if (!wakeWordMatchedInCurrentSentence) {
                wakeWordMatchedInCurrentSentence = true;
                try {
                  const ctx = new window.AudioContext();
                  const osc = ctx.createOscillator();
                  osc.frequency.value = 880;
                  osc.connect(ctx.destination);
                  osc.start();
                  osc.stop(ctx.currentTime + 0.1);
                } catch (e) {}
              }

              if (isFinal) {
                recognition.stop();
                wakeWordMatchedInCurrentSentence = false;

                const idx = transcript.indexOf(matchStr);
                const remaining = transcript
                  .substring(idx + matchStr.length)
                  .trim();

                startVoiceRef.current?.(remaining);
                break;
              }
            }
          }
        };

        recognition.onerror = (e: any) => {
          console.log("Speech recognition error", e.error);
        };

        try {
          recognition.start();
        } catch (e) {
          console.log("Could not start recognition", e);
        }
      }
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {}
      }
    };
  }, [
    wakeWordEnabled,
    isActive,
    isTrainingWakeWord,
    customWakeWords,
    assistantName,
  ]);

  const toggleVoice = async () => {
    if (isActive) {
      stopVoice();
    } else {
      await startVoice();
    }
  };

  const stopVoice = useCallback(() => {
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    playingSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {}
    });
    playingSourcesRef.current.clear();
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsAiSpeaking(false);
    setIsActive(false);
    setIsConnecting(false);
  }, []);

  const startVoice = async (initialPrompt?: string) => {
    if (initialPrompt && initialPrompt.trim()) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          text: initialPrompt.trim(),
          timestamp: Date.now(),
        },
      ]);
    }

    try {
      setIsConnecting(true);
      const host = window.location.host;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${host}/live`);
      wsRef.current = ws;

      ws.onopen = async () => {
        try {
          let latLng = null;
          if (locationEnabled && "geolocation" in navigator) {
            const getLoc = () =>
              new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  timeout: 3000,
                });
              });
            const pos = await getLoc();
            latLng = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            };
          }

          const ctx = actionsRef.current.getPoemContext();

          ws.send(
            JSON.stringify({
              type: "init",
              config: {
                voiceName,
                personality,
                initialPrompt,
                userName,
                assistantName,
                verbosity,
                speechSpeed,
                onlineSearchEnabled,
                latLng,
                poemContext: {
                  title: ctx.title,
                  tone: ctx.tone,
                  structure: ctx.structure,
                  rhyme: ctx.rhyme,
                  poemList: ctx.poemList.map((p) => p.title),
                },
              },
            }),
          );

          const audioCtx = new AudioContext({ sampleRate: 16000 });
          audioCtxRef.current = audioCtx;
          nextStartTimeRef.current = 0;

          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: cameraEnabled,
          });
          streamRef.current = stream;

          if (cameraEnabled && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();

            videoIntervalRef.current = setInterval(() => {
              if (
                ws.readyState === WebSocket.OPEN &&
                videoRef.current &&
                canvasRef.current
              ) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                if (video.videoWidth > 0 && video.videoHeight > 0) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  const ctx = canvas.getContext("2d");
                  if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const base64 = canvas
                      .toDataURL("image/jpeg", 0.5)
                      .split(",")[1];
                    ws.send(JSON.stringify({ image: base64 }));
                  }
                }
              }
            }, 1000);
          }

          const source = audioCtx.createMediaStreamSource(stream);
          sourceRef.current = source;
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          source.connect(processor);
          processor.connect(audioCtx.destination);

          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
              const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
              ws.send(JSON.stringify({ audio: base64 }));
            }
          };
        } catch (err) {
          console.error("Error in voice chat setup:", err);
          stopVoice();
        }
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === "ready") {
          setIsConnecting(false);
          setIsActive(true);
          playSoundEffect(660, 0.15);
        }

        if (msg.type === "error") {
          console.error("Server error:", msg.message);
          setChatHistory((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              text: `Erro: ${msg.message || "Falha na conexão com o servidor de voz."}`,
              timestamp: Date.now(),
            },
          ]);
          setIsConnecting(false);
        }

        if (msg.audio && audioCtxRef.current) {
          const audioCtx = audioCtxRef.current;
          const binaryArray = Uint8Array.from(atob(msg.audio), (c) =>
            c.charCodeAt(0),
          );
          const i16Array = new Int16Array(binaryArray.buffer);
          const f32Array = new Float32Array(i16Array.length);
          for (let i = 0; i < i16Array.length; i++) {
            f32Array[i] = i16Array[i] / 32768.0;
          }

          const bufSampleRate = 24000;
          const audioBuffer = audioCtx.createBuffer(
            1,
            f32Array.length,
            bufSampleRate,
          );
          audioBuffer.getChannelData(0).set(f32Array);

          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioCtx.destination);

          const wasEmpty = playingSourcesRef.current.size === 0;

          source.onended = () => {
            playingSourcesRef.current.delete(source);
            if (playingSourcesRef.current.size === 0) {
              setIsAiSpeaking(false);
            }
          };
          playingSourcesRef.current.add(source);

          if (wasEmpty) {
            setIsAiSpeaking(true);
          }

          const t = audioCtx.currentTime;
          if (nextStartTimeRef.current < t) nextStartTimeRef.current = t;
          source.start(nextStartTimeRef.current);
          nextStartTimeRef.current += audioBuffer.duration;
        }
        if (msg.interrupted) {
          playingSourcesRef.current.forEach((source) => {
            try {
              source.stop();
            } catch (e) {}
          });
          playingSourcesRef.current.clear();
          nextStartTimeRef.current = audioCtxRef.current?.currentTime || 0;
          setIsAiSpeaking(false);
        }
        if (
          msg.textResponse &&
          typeof msg.textResponse === "string" &&
          msg.textResponse.trim()
        ) {
          setChatHistory((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === "assistant") {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...last,
                text: last.text + msg.textResponse,
              };
              return updated;
            } else {
              return [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  text: msg.textResponse,
                  timestamp: Date.now(),
                },
              ];
            }
          });
        }

        if (msg.toolCall) {
          handleToolCall(msg.toolCall);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      ws.onclose = () => {
        stopVoice();
      };
    } catch (e) {
      console.error(e);
      stopVoice();
    }
  };

  useEffect(() => {
    startVoiceRef.current = startVoice;
  });

  const handleToolCall = (toolCallMsg: any) => {
    const calls = toolCallMsg.functionCalls || [];
    const responses: any[] = [];
    const a = actionsRef.current;

    for (const call of calls) {
      const args = call.args || {};
      let result: any;
      try {
        switch (call.name) {
          case "setPoemTitle":
            a.setTitle(args.title);
            result = {
              success: true,
              message: `Título alterado para: ${args.title}`,
            };
            break;
          case "setPoemTone":
            a.setTone(args.tone);
            result = {
              success: true,
              message: `Tom alterado para: ${args.tone}`,
            };
            break;
          case "setPoemStructure":
            a.setStructure(args.structure as any);
            result = {
              success: true,
              message: `Estrutura alterada para: ${args.structure}`,
            };
            break;
          case "setRhyme":
            a.setRhyme(args.enabled);
            result = {
              success: true,
              message: args.enabled
                ? "Rima ativada"
                : "Rima desativada",
            };
            break;
          case "appendPoemText":
            a.appendText(args.text);
            result = { success: true, message: "Texto adicionado" };
            break;
          case "replacePoemText":
            a.replaceText(args.text);
            result = { success: true, message: "Texto substituído" };
            break;
          case "setSuggestionMode":
            a.setSuggestionMode(args.mode);
            result = {
              success: true,
              message: `Modo alterado para: ${args.mode}`,
            };
            break;
          case "checkGrammar":
            a.checkSpelling();
            result = {
              success: true,
              message: "Verificação ortográfica iniciada",
            };
            break;
          case "suggestToneImprovements":
            a.suggestTone();
            result = {
              success: true,
              message: "Sugestões de tom sendo geradas",
            };
            break;
          case "newPoem":
            a.newPoem();
            result = { success: true, message: "Novo poema criado" };
            break;
          case "savePoem":
            a.savePoem();
            result = { success: true, message: "Salvando poema..." };
            break;
          case "copyPoemText":
            a.copyPoem();
            result = { success: true, message: "Texto copiado" };
            break;
          case "undoLastChange":
            a.undo();
            result = { success: true, message: "Desfeito" };
            break;
          case "getPoemContext": {
            const poemCtx = a.getPoemContext();
            result = {
              text: poemCtx.text,
              title: poemCtx.title,
              tone: poemCtx.tone,
              structure: poemCtx.structure,
              rhyme: poemCtx.rhyme,
              hasGrammarSuggestions: poemCtx.hasGrammarSuggestions,
              hasToneSuggestions: poemCtx.hasToneSuggestions,
              grammarSuggestionCount: poemCtx.grammarSuggestionCount,
              toneSuggestionCount: poemCtx.toneSuggestionCount,
              poemList: poemCtx.poemList.map((p) => p.title),
            };
            break;
          }
          case "acceptSuggestion":
            a.acceptSuggestion();
            result = { success: true, message: "Sugestão aceita" };
            break;
          case "dismissSuggestion":
            a.dismissSuggestion();
            result = { success: true, message: "Sugestão dispensada" };
            break;
          case "loadPoem": {
            const found = a.loadPoemByTitle(args.title);
            result = found
              ? {
                  success: true,
                  message: `Poema carregado: ${args.title}`,
                }
              : {
                  success: false,
                  message: `Poema não encontrado: ${args.title}`,
                };
            break;
          }
          case "endConversation":
            result = { success: true, message: "Encerrando..." };
            stopVoice();
            break;
          default:
            result = { error: `Unknown function: ${call.name}` };
        }
      } catch (err: any) {
        result = { error: err.message };
      }

      responses.push({
        name: call.name,
        id: call.id,
        response: result,
      });
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ toolResponse: responses }));
    }
  };

  return (
    <>
      <video ref={videoRef} autoPlay playsInline className="hidden" muted />
      <canvas ref={canvasRef} className="hidden" />
      {/* Settings button - floating right */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowSettings(true)}
          className="p-2.5 bg-card rounded-full shadow-md text-muted-foreground hover:text-accent transition-colors border border-border disabled:opacity-50"
          disabled={isActive || isConnecting}
          title="Configurações do Assistente"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Orb + Chat - fixed bottom center */}
      <div
        className="container-vao"
        data-active={isActive}
        data-state={
          isActive
            ? isAiSpeaking
              ? "speaking"
              : "listening"
            : "idle"
        }
      >
        {/* SVG gooey filter */}
        <svg
          style={{ position: "absolute", width: 0, height: 0 }}
          aria-hidden="true"
        >
          <filter id="gooey">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="8"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="gooey"
            />
          </filter>
        </svg>

        {/* Chat container */}
        <div className="container-chat-ia">
          <div className="container-title">
            <span>Poeta</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setChatHistory([]);
                }}
                title="Limpar conversa"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
              {isActive && (
                <button
                  onClick={stopVoice}
                  title="Encerrar conversa"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="container-chat">
            <div className="container-chat-limit">
              {chatHistory.length === 0 ? (
                <div className="chats-empty">
                  {isConnecting
                    ? "Conectando..."
                    : "Toque no microfone para começar"}
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={
                      msg.role === "assistant" ? "chat-ia" : "chat-user"
                    }
                  >
                    <p>{msg.text}</p>
                    <span className="chat-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Orb button */}
        <button
          className="orb"
          onClick={toggleVoice}
          disabled={isConnecting}
          aria-label={isActive ? "Desativar microfone" : "Ativar microfone"}
        >
          <div className="icons">
            {isConnecting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isActive ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </div>
          <div className="ball">
            <div className="container-lines">
              <span />
              <span />
              <span />
            </div>
            <div className="container-rings">
              <span />
              <span />
              <span />
            </div>
          </div>
        </button>
      </div>

      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col border border-border"
            >
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50 flex-shrink-0">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Settings className="h-5 w-5 text-accent" />
                  Configurações do Assistente
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors bg-card p-1 rounded-full border border-border"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-2xl bg-card shadow-sm space-y-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Voz do Assistente
                      </label>
                      <select
                        value={voiceName}
                        onChange={(e) => setVoiceName(e.target.value)}
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="Aoede">
                          Feminina Calma (Aoede)
                        </option>
                        <option value="Kore">
                          Feminina Enérgica (Kore)
                        </option>
                        <option value="Puck">
                          Masculina Jovem (Puck)
                        </option>
                        <option value="Charon">
                          Masculina Grave (Charon)
                        </option>
                        <option value="Fenrir">
                          Andrógina (Fenrir)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Personalidade
                      </label>
                      <select
                        value={personality}
                        onChange={(e) => setPersonality(e.target.value)}
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="Warm, poetic, and encouraging, like a fellow poet helping a friend.">
                          Poético e Amigável
                        </option>
                        <option value="Strict, direct, focused on poetic precision and form.">
                          Direto e Preciso
                        </option>
                        <option value="Humorous and playful, using wordplay and wit.">
                          Brincalhão (Humor)
                        </option>
                        <option value="Calm, relaxing, and mindful, like meditation.">
                          Calmo e Minimalista
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-card shadow-sm space-y-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Seu Nome
                      </label>
                      <input
                        type="text"
                        placeholder="Como devo te chamar?"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Nome do Assistente
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Poeta, Alguém, Safo"
                        value={assistantName}
                        onChange={(e) => setAssistantName(e.target.value)}
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Estilo de Resposta
                      </label>
                      <select
                        value={verbosity}
                        onChange={(e) => setVerbosity(e.target.value)}
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="concise">Curtas e Diretas</option>
                        <option value="detailed">
                          Longas e Detalhadas
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-card shadow-sm space-y-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Velocidade da Fala
                      </label>
                      <select
                        value={speechSpeed}
                        onChange={(e) => setSpeechSpeed(e.target.value)}
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="slow">Devagar</option>
                        <option value="normal">Normal</option>
                        <option value="fast">Rápida</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-card shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-0.5">
                          Efeitos Sonoros
                        </label>
                        <p className="text-[10px] text-muted-foreground">
                          Beeps e notificações
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={soundEffectsEnabled}
                          onChange={(e) =>
                            setSoundEffectsEnabled(e.target.checked)
                          }
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:ring-4 peer-focus:ring-accent/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-0.5">
                          Pesquisa na Web
                        </label>
                        <p className="text-[10px] text-muted-foreground">
                          Buscar informações online
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={onlineSearchEnabled}
                          onChange={(e) =>
                            setOnlineSearchEnabled(e.target.checked)
                          }
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:ring-4 peer-focus:ring-accent/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-0.5">
                          Localização
                        </label>
                        <p className="text-[10px] text-muted-foreground">
                          Usar geolocalização
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={locationEnabled}
                          onChange={(e) => {
                            setLocationEnabled(e.target.checked);
                            if (
                              e.target.checked &&
                              "geolocation" in navigator
                            ) {
                              navigator.geolocation.getCurrentPosition(
                                () => {},
                                () => {
                                  alert(
                                    "Permissão de localização negada.",
                                  );
                                  setLocationEnabled(false);
                                },
                              );
                            }
                          }}
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:ring-4 peer-focus:ring-accent/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-0.5">
                          Câmera
                        </label>
                        <p className="text-[10px] text-muted-foreground">
                          Assistente "enxergar" você
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={cameraEnabled}
                          onChange={async (e) => {
                            const checked = e.target.checked;
                            setCameraEnabled(checked);
                            if (checked && navigator.mediaDevices) {
                              try {
                                const stream =
                                  await navigator.mediaDevices.getUserMedia(
                                    { video: true },
                                  );
                                stream
                                  .getTracks()
                                  .forEach((t) => t.stop());
                              } catch (err) {
                                alert(
                                  "Permissão de câmera negada.",
                                );
                                setCameraEnabled(false);
                              }
                            }
                          }}
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:ring-4 peer-focus:ring-accent/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-border rounded-2xl bg-accent/5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="pr-4">
                      <label className="block text-sm font-semibold text-foreground">
                        Palavra de Ativação &quot;{assistantName}&quot;
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ligar a escuta automaticamente dizendo &quot;
                        {assistantName}&quot;.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={wakeWordEnabled}
                        onChange={(e) =>
                          setWakeWordEnabled(e.target.checked)
                        }
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:ring-4 peer-focus:ring-accent/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <label className="block text-sm font-medium text-foreground">
                      Treinamento (Seu Timbre)
                    </label>
                    <p className="text-[11px] text-muted-foreground mb-3 mt-1">
                      Grave até 5 formas que você diz &quot;
                      {assistantName}&quot; para reconhecimento
                      preciso.
                    </p>

                    {isTrainingWakeWord ? (
                      <button
                        onClick={() => setIsTrainingWakeWord(false)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-destructive/10 text-destructive rounded-xl text-sm font-medium border border-destructive/20 transition-colors"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" />{" "}
                        Ouvindo... Diga &quot;{assistantName}&quot;
                      </button>
                    ) : (
                      <button
                        onClick={trainWakeWord}
                        disabled={customWakeWords.length >= 5}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-card text-accent hover:bg-accent/10 rounded-xl text-sm font-medium border border-accent/30 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Mic className="h-4 w-4" /> Gravar nova
                        pronúncia ({customWakeWords.length}/5)
                      </button>
                    )}

                    {customWakeWords.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 bg-card p-2 rounded-lg border border-border">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Aprendeu:
                        </span>
                        {customWakeWords.map((ww, i) => (
                          <span
                            key={i}
                            className="text-[10px] uppercase tracking-wider font-semibold bg-accent/10 text-accent px-2 py-1 rounded-md"
                          >
                            {ww}
                          </span>
                        ))}
                        <button
                          onClick={() => setCustomWakeWords([])}
                          className="text-xs text-destructive hover:text-destructive/80 ml-auto font-medium px-2"
                        >
                          Resetar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border bg-card flex justify-end flex-shrink-0">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2 bg-accent text-accent-foreground rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors shadow-md"
                >
                  Concluído
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
