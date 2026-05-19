"use client";

import { useState, useRef, useCallback } from "react";

const TOKEN_REFRESH_INTERVAL = 25 * 60 * 1000;

export function useGeminiLiveToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshToken = useCallback(async (): Promise<string> => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/token");
      if (!res.ok) {
        throw new Error(`Token fetch failed: ${res.status}`);
      }
      const data = await res.json();
      const newToken = data.token as string;
      setToken(newToken);
      return newToken;
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Unknown token error");
      setError(e);
      throw e;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const startAutoRefresh = useCallback(() => {
    stopAutoRefresh();
    refreshIntervalRef.current = setInterval(() => {
      refreshToken().catch(() => {});
    }, TOKEN_REFRESH_INTERVAL);
  }, [refreshToken]);

  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  const clearToken = useCallback(() => {
    setToken(null);
    setError(null);
    stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    token,
    refreshToken,
    isRefreshing,
    error,
    startAutoRefresh,
    stopAutoRefresh,
    clearToken,
  };
}
