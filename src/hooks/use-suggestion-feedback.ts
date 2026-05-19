'use client';

import { useState, useCallback } from 'react';
import type { Suggestion } from '@/ai/types';

const LOCAL_STORAGE_KEY = 'melopoesis_suggestion_feedback_v1';

interface FeedbackEntry {
  originalText: string;
  correctedText: string;
  accepted: boolean;
  type: string;
  severity?: string;
  timestamp: number;
}

interface SuggestionFeedback {
  accepted: Set<number>;
  dismissed: Set<number>;
  history: FeedbackEntry[];
  frequency: Record<string, { count: number; accepted: number }>;
}

function loadFeedback(): SuggestionFeedback {
  if (typeof window === 'undefined') {
    return { accepted: new Set(), dismissed: new Set(), history: [], frequency: {} };
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return { accepted: new Set(), dismissed: new Set(), history: [], frequency: {} };
    const parsed = JSON.parse(raw);
    return {
      accepted: new Set(parsed.accepted || []),
      dismissed: new Set(parsed.dismissed || []),
      history: parsed.history || [],
      frequency: parsed.frequency || {},
    };
  } catch {
    return { accepted: new Set(), dismissed: new Set(), history: [], frequency: {} };
  }
}

function saveFeedback(feedback: SuggestionFeedback): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
    accepted: [...feedback.accepted],
    dismissed: [...feedback.dismissed],
    history: feedback.history,
    frequency: feedback.frequency,
  }));
}

function getKey(suggestion: Suggestion): number {
  const str = `${suggestion.originalText}:${suggestion.correctedText}:${suggestion.type}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

export function useSuggestionFeedback() {
  const [feedback, setFeedback] = useState<SuggestionFeedback>(loadFeedback);

  const accept = useCallback((suggestion: Suggestion) => {
    setFeedback(prev => {
      const key = getKey(suggestion);
      if (prev.accepted.has(key)) return prev;

      const freqKey = `${suggestion.originalText}→${suggestion.correctedText}`;
      const freq = prev.frequency[freqKey] || { count: 0, accepted: 0 };

      const next: SuggestionFeedback = {
        accepted: new Set(prev.accepted).add(key),
        dismissed: new Set(prev.dismissed),
        history: [...prev.history, {
          originalText: suggestion.originalText,
          correctedText: suggestion.correctedText,
          accepted: true,
          type: suggestion.type,
          severity: suggestion.severity,
          timestamp: Date.now(),
        }],
        frequency: {
          ...prev.frequency,
          [freqKey]: { count: freq.count + 1, accepted: freq.accepted + 1 },
        },
      };

      saveFeedback(next);
      return next;
    });
  }, []);

  const dismiss = useCallback((suggestion: Suggestion) => {
    setFeedback(prev => {
      const key = getKey(suggestion);
      if (prev.dismissed.has(key)) return prev;

      const freqKey = `${suggestion.originalText}→${suggestion.correctedText}`;
      const freq = prev.frequency[freqKey] || { count: 0, accepted: 0 };

      const next: SuggestionFeedback = {
        accepted: new Set(prev.accepted),
        dismissed: new Set(prev.dismissed).add(key),
        history: [...prev.history, {
          originalText: suggestion.originalText,
          correctedText: suggestion.correctedText,
          accepted: false,
          type: suggestion.type,
          severity: suggestion.severity,
          timestamp: Date.now(),
        }],
        frequency: {
          ...prev.frequency,
          [freqKey]: { count: freq.count + 1, accepted: freq.accepted },
        },
      };

      saveFeedback(next);
      return next;
    });
  }, []);

  const isAccepted = useCallback((suggestion: Suggestion) => {
    return feedback.accepted.has(getKey(suggestion));
  }, [feedback.accepted]);

  const isDismissed = useCallback((suggestion: Suggestion) => {
    return feedback.dismissed.has(getKey(suggestion));
  }, [feedback.dismissed]);

  const clearHistory = useCallback(() => {
    const empty: SuggestionFeedback = {
      accepted: new Set(), dismissed: new Set(), history: [], frequency: {},
    };
    saveFeedback(empty);
    setFeedback(empty);
  }, []);

  const getStats = useCallback(() => {
    const total = feedback.history.length;
    const acceptedCount = feedback.history.filter(h => h.accepted).length;
    const topAccepted = Object.entries(feedback.frequency)
      .filter(([, v]) => v.accepted > 0)
      .sort(([, a], [, b]) => b.accepted - a.accepted)
      .slice(0, 10)
      .map(([pair, v]) => ({ pair, count: v.count, accepted: v.accepted }));

    return { total, acceptedCount, dismissedCount: total - acceptedCount, topAccepted };
  }, [feedback]);

  return {
    accept,
    dismiss,
    isAccepted,
    isDismissed,
    clearHistory,
    getStats,
    history: feedback.history,
  };
}
