"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface UseWakeWordOptions {
  assistantName: string;
  customWakeWords: string[];
  isActive: boolean;
  isTrainingWakeWord: boolean;
  onWake: (remaining?: string) => void;
}

export function useWakeWord(options: UseWakeWordOptions) {
  const { assistantName, customWakeWords, isActive, isTrainingWakeWord, onWake } = options;
  const [isWakeListening, setIsWakeListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onWakeRef = useRef(onWake);
  onWakeRef.current = onWake;

  useEffect(() => {
    let recognition: any;

    if (!isActive && !isTrainingWakeWord && typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "pt-BR";
        recognitionRef.current = recognition;

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
              }

              if (isFinal) {
                recognition.stop();
                wakeWordMatchedInCurrentSentence = false;

                const idx = transcript.indexOf(matchStr);
                const remaining = transcript
                  .substring(idx + matchStr.length)
                  .trim();

                onWakeRef.current(remaining);
                break;
              }
            }
          }
        };

        recognition.onerror = () => {};
        recognition.onend = () => {
          if (!isActive && !isTrainingWakeWord) {
            setTimeout(() => {
              try { recognition.start(); } catch (e) {}
            }, 100);
          }
        };

        try {
          recognition.start();
          setIsWakeListening(true);
        } catch (e) {
          setIsWakeListening(false);
        }
      }
    }

    return () => {
      if (recognition) {
        recognition.onend = null;
        try { recognition.stop(); } catch (e) {}
      }
      setIsWakeListening(false);
    };
  }, [assistantName, customWakeWords, isActive, isTrainingWakeWord]);

  return { isWakeListening };
}
