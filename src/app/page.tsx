"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Editor, EditorRef } from "@/components/editor";
import { SuggestionList } from "@/components/suggestion-list";
import { generateContextualSuggestions } from "@/ai/flows/generate-contextual-suggestions";
import type { GenerateContextualSuggestionsInput, GenerateContextualSuggestionsOutput } from "@/ai/flows/generate-contextual-suggestions";
import { useToast } from "@/hooks/use-toast";
import React from 'react';

export type Suggestion = GenerateContextualSuggestionsOutput["suggestions"][0];
export type SuggestionMode = "gradual" | "final";
export type TextStructure = GenerateContextualSuggestionsInput["textStructure"];


// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      clearTimeout(timeout);
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

export default function Home() {
  const [text, setText] = useState<string>("");
  const [tone, setTone] = useState<string>("Melancólico");
  const [textStructure, setTextStructure] = useState<TextStructure>("poema");
  const [rhyme, setRhyme] = useState<boolean>(false);
  const [grammarSuggestions, setGrammarSuggestions] = useState<Suggestion[]>([]);
  const [toneSuggestions, setToneSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestionMode, setSuggestionMode] = useState<SuggestionMode>("gradual");
  const [activeGrammarSuggestion, setActiveGrammarSuggestion] = useState<Suggestion | null>(null);
  const { toast } = useToast();
  const editorRef = useRef<EditorRef>(null);
  const [excludedPhrasesMap, setExcludedPhrasesMap] = useState<Record<string, string[]>>({});

  const generateSuggestions = useCallback(async (
    currentText: string, 
    currentTone: string,
    currentStructure: TextStructure,
    currentRhyme: boolean,
    suggestionType: 'all' | 'grammar' | 'tone',
    excludedPhrases?: string[]
  ): Promise<GenerateContextualSuggestionsOutput> => {
    if (!currentText.trim()) {
      return { suggestions: [] };
    }
  
    try {
      const result = await generateContextualSuggestions({ 
        text: currentText, 
        tone: currentTone,
        textStructure: currentStructure,
        rhyme: currentRhyme,
        suggestionType,
        excludedPhrases
      });
      return result;
    } catch (error: any) {
      console.error(`Error generating suggestions:`, error);
      
      const errorMessage = error.message || "Houve um problema ao se comunicar com a IA.";
      let errorDescription = "Por favor, tente novamente mais tarde.";

      if (errorMessage.includes("503") || errorMessage.includes("model is overloaded")) {
        errorDescription = "O modelo de IA está sobrecarregado no momento. Por favor, aguarde um pouco e tente novamente.";
      }

      toast({
        title: `Erro ao Gerar Sugestões`,
        description: errorDescription,
        variant: "destructive",
      });
      return { suggestions: [] };
    }
  }, [toast]);
  
  const fetchAndSetSuggestions = useCallback(async (fetchText: string, currentTone: string, currentStructure: TextStructure, currentRhyme: boolean) => {
    if (!fetchText.trim()) {
        setGrammarSuggestions([]);
        setToneSuggestions([]);
        return;
    }

    setIsLoading(true);
    // Request 'all' suggestions. The AI prompt will prioritize grammar.
    const result = await generateSuggestions(fetchText, currentTone, currentStructure, currentRhyme, 'all');
    
    const newGrammarSuggestions = result.suggestions.filter(s => s.type === 'grammar');
    const newToneSuggestions = result.suggestions.filter(s => s.type === 'tone');
    
    setGrammarSuggestions(newGrammarSuggestions);
    if (newGrammarSuggestions.length > 0) {
        setToneSuggestions([]);
    } else {
        setToneSuggestions(newToneSuggestions);
    }

    setIsLoading(false);
  }, [generateSuggestions]);


  const debouncedFetchGradualSuggestions = useCallback(debounce((...args: Parameters<typeof fetchAndSetSuggestions>) => fetchAndSetSuggestions(...args), 1500), [fetchAndSetSuggestions]);


  const handleTextChange = (newText: string) => {
    setText(newText);
    
    if (suggestionMode === "gradual") {
      const cursorPosition = editorRef.current?.getCursorPosition();
      const currentLine = editorRef.current?.getCurrentLine(newText, cursorPosition) ?? "";
      debouncedFetchGradualSuggestions(currentLine, tone, textStructure, rhyme);
    }
  };

  const handleSuggestionModeChange = (mode: SuggestionMode) => {
    setSuggestionMode(mode);
    setGrammarSuggestions([]);
    setToneSuggestions([]);
    setActiveGrammarSuggestion(null);
    if(mode === 'final' && text.trim()){
      fetchAndSetSuggestions(text, tone, textStructure, rhyme)
    }
  };
  
  const handleGenerateFinalSuggestions = () => {
    if (suggestionMode === 'final' && text.trim()) {
      fetchAndSetSuggestions(text, tone, textStructure, rhyme);
    }
  };
  
  const handleToneChange = (newTone: string) => {
    setTone(newTone);
    setToneSuggestions([]);
    if (suggestionMode === 'final' && text.trim() && grammarSuggestions.length === 0) {
      fetchAndSetSuggestions(text, newTone, textStructure, rhyme);
    }
  }

  const handleTextStructureChange = (newStructure: TextStructure) => {
    setTextStructure(newStructure);
    if(suggestionMode === 'final' && text.trim()){
      fetchAndSetSuggestions(text, tone, newStructure, rhyme);
    }
  }

  const handleRhymeChange = (newRhyme: boolean) => {
    setRhyme(newRhyme);
     if(suggestionMode === 'final' && text.trim()){
      fetchAndSetSuggestions(text, tone, textStructure, newRhyme);
    }
  }

  const handleAccept = (suggestionToAccept: Suggestion) => {
    if (!suggestionToAccept) return;
    const newText = text.replace(suggestionToAccept.originalText, suggestionToAccept.correctedText);
    setText(newText);
    
    if (suggestionToAccept.type === 'grammar') {
        setGrammarSuggestions((currentSuggestions) =>
            currentSuggestions.filter((s) => s.originalText !== suggestionToAccept.originalText)
        );
        setActiveGrammarSuggestion(null);
        
        if (suggestionMode === 'gradual') {
            const currentLine = newText.split('\n').find(line => line.includes(suggestionToAccept.correctedText)) ?? '';
            fetchAndSetSuggestions(currentLine, tone, textStructure, rhyme);
        }
    } else {
        setToneSuggestions((currentSuggestions) =>
            currentSuggestions.filter((s) => s.originalText !== suggestionToAccept.originalText)
        );
    }
  };

  const handleDismiss = (suggestionToDismiss: Suggestion) => {
    if (!suggestionToDismiss) return;
    if (suggestionToDismiss.type === 'grammar') {
        setGrammarSuggestions((currentSuggestions) =>
          currentSuggestions.filter((s) => s.originalText !== suggestionToDismiss.originalText)
        );
        setActiveGrammarSuggestion(null);
    } else {
        setToneSuggestions((currentSuggestions) =>
          currentSuggestions.filter((s) => s.originalText !== suggestionToDismiss.originalText)
        );
    }
  };

  const checkActiveSuggestion = useCallback(() => {
    const cursorPosition = editorRef.current?.getCursorPosition();
    if (cursorPosition === null || !grammarSuggestions.length) {
        if (activeGrammarSuggestion) setActiveGrammarSuggestion(null);
        return;
    }

    const activeSuggestion = grammarSuggestions.find(suggestion => {
        const startIndex = text.indexOf(suggestion.originalText);
        if (startIndex === -1) return false;
        const endIndex = startIndex + suggestion.originalText.length;
        return cursorPosition >= startIndex && cursorPosition <= endIndex;
    });

    if (activeSuggestion) {
      if (activeGrammarSuggestion?.originalText !== activeSuggestion.originalText) {
        setActiveGrammarSuggestion(activeSuggestion);
      }
    } else {
      if (activeGrammarSuggestion) {
        setActiveGrammarSuggestion(null);
      }
    }
  }, [text, grammarSuggestions, activeGrammarSuggestion]);


  useEffect(() => {
    const handler = setTimeout(checkActiveSuggestion, 100);
    return () => clearTimeout(handler);
  }, [text, checkActiveSuggestion]);

  const handleResuggest = async (suggestionToResuggest: Suggestion) => {
    setIsLoading(true);
    const originalText = suggestionToResuggest.originalText;
    const excludedPhrases = [...(excludedPhrasesMap[originalText] || []), suggestionToResuggest.correctedText];
    
    const result = await generateSuggestions(
        originalText,
        tone,
        textStructure,
        rhyme,
        suggestionToResuggest.type,
        excludedPhrases
    );

    if (result.suggestions.length > 0) {
        const newSuggestion = result.suggestions[0];
        const updateFunction = suggestionToResuggest.type === 'grammar' ? setGrammarSuggestions : setToneSuggestions;

        updateFunction(prev => 
            prev.map(s => s.originalText === originalText ? newSuggestion : s)
        );
        
        if (activeGrammarSuggestion?.originalText === originalText) {
            setActiveGrammarSuggestion(newSuggestion);
        }
        
        setExcludedPhrasesMap(prev => ({
          ...prev,
          [originalText]: [...(prev[originalText] || []), newSuggestion.correctedText]
        }));


    } else {
        toast({
            title: "Nenhuma nova sugestão",
            description: "A IA não conseguiu encontrar uma alternativa. Tente remover algumas palavras excluídas.",
            variant: "default",
        });
    }

    setIsLoading(false);
  };
  
  const handleToggleExcludedPhrase = (originalText: string, phrase: string) => {
    setExcludedPhrasesMap(prev => {
        const currentExcluded = prev[originalText] || [];
        const newExcluded = currentExcluded.includes(phrase)
            ? currentExcluded.filter(p => p !== phrase)
            : [...currentExcluded, phrase];
        return { ...prev, [originalText]: newExcluded };
    });
  };
  
  
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Editor
          ref={editorRef}
          text={text}
          onTextChange={handleTextChange}
          onCursorChange={checkActiveSuggestion}
          isLoading={isLoading} 
          tone={tone}
          onToneChange={handleToneChange}
          textStructure={textStructure}
          onTextStructureChange={handleTextStructureChange}
          rhyme={rhyme}
          onRhymeChange={handleRhymeChange}
          grammarSuggestions={grammarSuggestions}
          activeGrammarSuggestion={activeGrammarSuggestion}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
          onResuggest={handleResuggest}
          suggestionMode={suggestionMode}
          onSuggestionModeChange={handleSuggestionModeChange}
          onFinalSuggestion={handleGenerateFinalSuggestions}
          onSuggestionClick={setActiveGrammarSuggestion}
        />
        <SuggestionList
          suggestions={toneSuggestions}
          isLoading={isLoading && grammarSuggestions.length === 0} 
          onAccept={handleAccept}
          onDismiss={handleDismiss}
          onResuggest={handleResuggest}
          onToggleExcludedPhrase={handleToggleExcludedPhrase}
          excludedPhrasesMap={excludedPhrasesMap}
        />
      </div>
    </div>
  );
}
    

    


