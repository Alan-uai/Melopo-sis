import { useCallback, useEffect, useRef, useState } from 'react';
import type { Suggestion, VerificationJobStatus } from '@/ai/types';
import {
  saveJobToLocal,
  getJobsFromLocal,
  saveActiveJobId,
  getActiveJobId,
  generateJobId,
  hashText,
  findIncompleteJobs,
  findLatestCompletedJob,
} from '@/lib/background-verification';

type JobState = {
  jobId: string;
  status: VerificationJobStatus;
  type: 'grammar' | 'tone';
  error?: string;
};

interface UseBackgroundVerificationReturn {
  startVerification: (
    type: 'grammar' | 'tone',
    params: {
      text: string;
      tone: string;
      structure: string;
      rhyme: boolean;
      poemId?: string;
      preferredModel?: string;
      forceRefresh?: boolean;
    },
    callbacks: {
      onStart: () => void;
      onGrammarResults: (suggestions: Suggestion[]) => void;
      onToneResults: (suggestions: Suggestion[]) => void;
      onModelChange: (model: string) => void;
      onError: (message: string) => void;
      onFinish: () => void;
    }
  ) => void;
  restorePendingJobs: (
    poemId: string | undefined,
    currentText: string,
    callbacks: {
      onGrammarResults: (suggestions: Suggestion[]) => void;
      onToneResults: (suggestions: Suggestion[]) => void;
      onPending: (type: 'grammar' | 'tone') => void;
    }
  ) => { hasPending: boolean; type?: 'grammar' | 'tone' };
  getCompletedResults: (
    poemId: string | undefined,
    type: 'grammar' | 'tone'
  ) => { suggestions: Suggestion[] } | null;
  clearJobs: (poemId?: string) => void;
}

export function useBackgroundVerification(): UseBackgroundVerificationReturn {
  const activeJobRef = useRef<JobState | null>(null);

  const startVerification = useCallback((
    type: 'grammar' | 'tone',
    params: {
      text: string;
      tone: string;
      structure: string;
      rhyme: boolean;
      poemId?: string;
      preferredModel?: string;
      forceRefresh?: boolean;
    },
    callbacks: {
      onStart: () => void;
      onGrammarResults: (suggestions: Suggestion[]) => void;
      onToneResults: (suggestions: Suggestion[]) => void;
      onModelChange: (model: string) => void;
      onError: (message: string) => void;
      onFinish: () => void;
    }
  ) => {
    const jobId = generateJobId();
    const textHash = hashText(params.text);

    activeJobRef.current = { jobId, status: 'pending', type };
    saveActiveJobId(jobId);

    saveJobToLocal({
      jobId,
      poemId: params.poemId,
      type,
      status: 'pending',
      textHash,
      createdAt: Date.now(),
    });

    callbacks.onStart();

    const serverActionPromise =
      type === 'grammar'
        ? import('@/app/actions/check-grammar-local')
          .then(m => m.checkGrammarLocal(params.text, params.structure, params.rhyme))
          .then(localResult => {
            if (localResult.suggestions.length > 0) {
              saveJobToLocal({
                jobId,
                poemId: params.poemId,
                type,
                status: 'completed',
                textHash,
                createdAt: Date.now(),
                completedAt: Date.now(),
                result: { suggestions: localResult.suggestions },
              });
              activeJobRef.current = { jobId, status: 'completed', type };
              callbacks.onGrammarResults(localResult.suggestions.map((s, i) => ({
                ...s,
                id: s.id || `sug-${Date.now()}-${i}`,
              })));
              callbacks.onFinish();
              return;
            }
            return import('@/ai/flows/generate-contextual-suggestions')
              .then(m => m.generateContextualSuggestions({
                text: params.text,
                tone: params.tone,
                structure: params.structure,
                rhyme: params.rhyme,
                suggestionType: 'grammar',
                excludedPhrases: [],
                preferredModel: params.preferredModel || undefined,
                forceRefresh: params.forceRefresh,
              }));
          })
          .then(aiResult => {
            if (!aiResult) return;
            saveJobToLocal({
              jobId,
              poemId: params.poemId,
              type,
              status: 'completed',
              textHash,
              createdAt: Date.now(),
              completedAt: Date.now(),
              result: { suggestions: aiResult.suggestions, modelUsed: aiResult.modelUsed },
            });
            activeJobRef.current = { jobId, status: 'completed', type };
            if (aiResult.modelUsed && aiResult.modelUsed !== params.preferredModel) {
              callbacks.onModelChange(aiResult.modelUsed);
            }
            callbacks.onGrammarResults(aiResult.suggestions.map((s: any, i: number) => ({
              ...s,
              id: s.id || `sug-${Date.now()}-${i}`,
            })));
            callbacks.onFinish();
          })
        : import('@/ai/flows/generate-contextual-suggestions')
            .then(m => m.generateContextualSuggestions({
              text: params.text,
              tone: params.tone,
              structure: params.structure,
              rhyme: params.rhyme,
              suggestionType: 'tone',
              excludedPhrases: [],
              preferredModel: params.preferredModel || undefined,
            }))
            .then(result => {
              saveJobToLocal({
                jobId,
                poemId: params.poemId,
                type,
                status: 'completed',
                textHash,
                createdAt: Date.now(),
                completedAt: Date.now(),
                result: { suggestions: result.suggestions, modelUsed: result.modelUsed },
              });
              activeJobRef.current = { jobId, status: 'completed', type };
              if (result.modelUsed && result.modelUsed !== params.preferredModel) {
                callbacks.onModelChange(result.modelUsed);
              }
              callbacks.onToneResults(result.suggestions.map((s: any, i: number) => ({
                ...s,
                id: s.id || `sug-${Date.now()}-${i}`,
              })));
              callbacks.onFinish();
            });

    serverActionPromise.catch((error: any) => {
      saveJobToLocal({
        jobId,
        poemId: params.poemId,
        type,
        status: 'failed',
        textHash,
        createdAt: Date.now(),
        error: error.message || 'Erro desconhecido',
      });
      activeJobRef.current = { jobId, status: 'failed', type };
      callbacks.onError(error.message || 'Erro ao processar verificação');
      callbacks.onFinish();
    });
  }, []);

  const restorePendingJobs = useCallback((
    poemId: string | undefined,
    currentText: string,
    callbacks: {
      onGrammarResults: (suggestions: Suggestion[]) => void;
      onToneResults: (suggestions: Suggestion[]) => void;
      onPending: (type: 'grammar' | 'tone') => void;
    }
  ) => {
    const savedJobId = getActiveJobId();
    if (savedJobId) {
      const storedJob = getJobsFromLocal().get(savedJobId);
      if (storedJob) {
        if (storedJob.status === 'completed' && storedJob.result) {
          const withIds = storedJob.result.suggestions.map((s: any, i: number) => ({
            ...s,
            id: s.id || `sug-${Date.now()}-${i}`,
          }));
          if (storedJob.type === 'grammar') {
            callbacks.onGrammarResults(withIds);
          } else {
            callbacks.onToneResults(withIds);
          }
          return { hasPending: false };
        }
        if (storedJob.status === 'failed') {
          return { hasPending: false };
        }
        if (storedJob.status === 'pending' || storedJob.status === 'processing') {
          const textUnchanged = storedJob.textHash === hashText(currentText);
          if (textUnchanged) {
            callbacks.onPending(storedJob.type);
            return { hasPending: true, type: storedJob.type };
          }
        }
      }
    }

    const pendingJobs = findIncompleteJobs(poemId);
    if (pendingJobs.length > 0) {
      const latest = pendingJobs[0];
      callbacks.onPending(latest.type);
      return { hasPending: true, type: latest.type };
    }

    return { hasPending: false };
  }, []);

  const getCompletedResults = useCallback((
    poemId: string | undefined,
    type: 'grammar' | 'tone'
  ): { suggestions: Suggestion[] } | null => {
    const job = findLatestCompletedJob(poemId, type);
    if (job?.result) {
      return { suggestions: job.result.suggestions as Suggestion[] };
    }
    return null;
  }, []);

  const clearJobs = useCallback((poemId?: string) => {
    if (poemId) {
      const jobs = getJobsFromLocal();
      for (const [id, job] of jobs) {
        if (job.poemId === poemId) {
          jobs.delete(id);
        }
      }
      try {
        localStorage.setItem('melopoeisis_verification_jobs', JSON.stringify(Array.from(jobs.entries())));
      } catch {}
    }
    saveActiveJobId(null);
    activeJobRef.current = null;
  }, []);

  return { startVerification, restorePendingJobs, getCompletedResults, clearJobs };
}
