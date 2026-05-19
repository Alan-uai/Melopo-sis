"use client";

import { useCallback, useRef } from "react";
import type { VoiceActionHandlers } from "@/components/voice-chat/types";

export function useLiveToolCalls(actions: VoiceActionHandlers) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const handleToolCall = useCallback(
    (toolCallMsg: any, ws: WebSocket | null) => {
      const calls = toolCallMsg.functionCalls || [];
      const a = actionsRef.current;
      const responses: any[] = [];

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
                message: args.enabled ? "Rima ativada" : "Rima desativada",
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
              break;
            case "calculate":
              result = { success: true, message: "Calculando..." };
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

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            toolResponse: { functionResponses: responses },
          }),
        );
      }
    },
    [],
  );

  return { handleToolCall };
}
