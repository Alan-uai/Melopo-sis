import express from "express";
import { createServer } from "http";
import next from "next";
import { parse } from "url";
import { WebSocketServer } from "ws";
import { GoogleGenAI, Modality, Type, type LiveServerMessage } from "@google/genai";
import { evaluate } from "mathjs";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "9002", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);

  const wss = new WebSocketServer({ server, path: "/live" });

  wss.on("connection", (clientWs) => {
    let session: any = null;

    clientWs.on("message", async (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "init") {
          const {
            voiceName,
            personality,
            initialPrompt,
            userName,
            assistantName,
            verbosity,
            speechSpeed,
            poemContext,
          } = msg.config || {};

          const aiInstance = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: { headers: { "User-Agent": "melopoesis" } },
          });

          const baseInstruction = `You are a specialized poetry assistant for Melopoësis, a Brazilian Portuguese poetry writing platform.

Your name is '${assistantName || "Poeta"}'. The user's preferred name is ${userName || "Poeta"} — address them by this name.

Your personality: ${personality || "Warm, poetic, and encouraging, like a fellow poet helping a friend."}.
Your response style: ${verbosity || "concise"}.
Your speech speed: ${speechSpeed || "normal"}.

Current poem state:
- Title: ${poemContext?.title || "Sem título"}
- Tone: ${poemContext?.tone || "Melancólico"}
- Structure: ${poemContext?.structure || "poema"}
- Rhyme forced: ${poemContext?.rhyme !== undefined ? poemContext.rhyme : false}

Saved poems in library: ${(poemContext?.poemList || []).join(", ")}

Your roles:
1) Help the user write, edit, and improve their poems using the available tools
2) Answer questions about poetry forms, meter, rhyme schemes, and literary devices
3) Execute commands to modify the poem (change title, tone, structure, etc.)
4) Provide creative feedback and suggestions on the user's poetry
5) ALWAYS speak in Brazilian Portuguese
6) Be poetic and eloquent but concise when speaking aloud
7) Maintain deep knowledge about all major poetry forms: soneto, haicai, cordel, redondilha, decassilabo, trova, oitava, decima, elegia, ode, verso-livre

Available tools: setPoemTitle, setPoemTone, setPoemStructure, setRhyme, appendPoemText, replacePoemText, setSuggestionMode, checkGrammar, suggestToneImprovements, newPoem, savePoem, copyPoemText, undoLastChange, getPoemContext, acceptSuggestion, dismissSuggestion, loadPoem, endConversation, calculate

SILENCE AND WAKE WORD BEHAVIOR:
- If you just activated and the user is completely silent for 2 seconds, gently ask "Sim?", "E então?" or "O que você precisa?".
- If the user remains silent for another 5 seconds after you asked, use the endConversation tool to turn off automatically.
- If the user gave a command right after the wake word, execute it immediately.`;

          const poemTools = {
            functionDeclarations: [
              {
                name: "setPoemTitle",
                description: "Define ou altera o título do poema atual",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: "O novo título para o poema",
                    },
                  },
                  required: ["title"],
                },
              },
              {
                name: "setPoemTone",
                description:
                  "Altera o tom/estilo do poema. Opções: Melancólico, Romântico, Reflexivo, Jubiloso, Sombrio, Saudoso, Épico, Lírico, Satírico, Filosófico, Intimista, Nostálgico, Visionário, Conciso, Erótico, Grotesco / Degradação, Sagrado / Místico",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    tone: {
                      type: Type.STRING,
                      description: "O novo tom do poema",
                    },
                  },
                  required: ["tone"],
                },
              },
              {
                name: "setPoemStructure",
                description:
                  "Altera a estrutura poética do poema. Opções: poema, poesia, soneto, haicai, cordel, redondilha, decassilabo, trova, oitava, decima, elegia, ode, verso-livre",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    structure: {
                      type: Type.STRING,
                      description: "A nova estrutura poética",
                    },
                  },
                  required: ["structure"],
                },
              },
              {
                name: "setRhyme",
                description:
                  "Ativa ou desativa a verificação de rimas no poema",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    enabled: {
                      type: Type.BOOLEAN,
                      description:
                        "true para ativar verificação de rima, false para desativar",
                    },
                  },
                  required: ["enabled"],
                },
              },
              {
                name: "appendPoemText",
                description:
                  "Adiciona texto ao final do poema atual. Use para continuar escrevendo o poema, adicionar novos versos.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    text: {
                      type: Type.STRING,
                      description:
                        "O texto a ser adicionado ao final do poema",
                    },
                  },
                  required: ["text"],
                },
              },
              {
                name: "replacePoemText",
                description:
                  "Substitui todo o texto do poema por um novo conteúdo. Use quando o usuário ditar um poema completo.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    text: {
                      type: Type.STRING,
                      description:
                        "O novo texto completo do poema",
                    },
                  },
                  required: ["text"],
                },
              },
              {
                name: "setSuggestionMode",
                description:
                  "Altera o modo de sugestão entre 'gradual' (automático) e 'final' (manual)",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    mode: {
                      type: Type.STRING,
                      enum: ["gradual", "final"],
                      description:
                        "Modo de sugestão: 'gradual' para automático ao digitar, 'final' para verificação manual",
                    },
                  },
                  required: ["mode"],
                },
              },
              {
                name: "checkGrammar",
                description:
                  "Inicia uma verificação ortográfica e gramatical do poema",
                parameters: { type: Type.OBJECT, properties: {} },
              },
              {
                name: "suggestToneImprovements",
                description:
                  "Gera sugestões de melhoria de tom e estilo para o poema atual",
                parameters: { type: Type.OBJECT, properties: {} },
              },
              {
                name: "newPoem",
                description:
                  "Limpa o editor e começa um novo poema do zero",
                parameters: { type: Type.OBJECT, properties: {} },
              },
              {
                name: "savePoem",
                description:
                  "Salva o poema atual na conta do usuário (Firestore)",
                parameters: { type: Type.OBJECT, properties: {} },
              },
              {
                name: "copyPoemText",
                description:
                  "Copia o texto do poema para a área de transferência",
                parameters: { type: Type.OBJECT, properties: {} },
              },
              {
                name: "undoLastChange",
                description: "Desfaz a última alteração no texto do poema",
                parameters: { type: Type.OBJECT, properties: {} },
              },
              {
                name: "getPoemContext",
                description:
                  "Obtém o contexto completo do poema atual (texto, título, tom, estrutura, sugestões ativas, lista de poemas salvos)",
                parameters: { type: Type.OBJECT, properties: {} },
              },
              {
                name: "acceptSuggestion",
                description:
                  "Aceita e aplica a sugestão ativa atual (ortografia ou tom)",
                parameters: { type: Type.OBJECT, properties: {} },
              },
              {
                name: "dismissSuggestion",
                description:
                  "Dispensa ou pula a sugestão ativa atual sem aplicá-la",
                parameters: { type: Type.OBJECT, properties: {} },
              },
              {
                name: "loadPoem",
                description:
                  "Carrega um poema salvo pelo título. O usuário precisa fornecer o título exato ou aproximado.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description:
                        "O título do poema a ser carregado",
                    },
                  },
                  required: ["title"],
                },
              },
              {
                name: "endConversation",
                description:
                  "Encerra a sessão de voz. Use quando o usuário disser tchau, 'é só', 'obrigado por enquanto', ou implicar que terminou.",
                parameters: { type: Type.OBJECT, properties: {} },
              },
              {
                name: "calculate",
                description:
                  "Calcula expressões matemáticas usando math.js",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    expression: {
                      type: Type.STRING,
                      description:
                        "A expressão matemática a ser calculada",
                    },
                  },
                  required: ["expression"],
                },
              },
            ],
          };

          const activeTools: any[] = [poemTools];

          session = await aiInstance.live.connect({
            model: "gemini-3.1-flash-live-preview",
            callbacks: {
              onmessage: (message: LiveServerMessage) => {
                const parts =
                  message.serverContent?.modelTurn?.parts;
                if (parts) {
                  for (const part of parts) {
                    if (part.text) {
                      if (clientWs.readyState === clientWs.OPEN) {
                        clientWs.send(
                          JSON.stringify({
                            textResponse: part.text,
                          }),
                        );
                      }
                    }
                    if (part.inlineData?.data) {
                      if (clientWs.readyState === clientWs.OPEN) {
                        clientWs.send(
                          JSON.stringify({
                            audio: part.inlineData.data,
                          }),
                        );
                      }
                    }
                  }
                }
                if (message.serverContent?.interrupted) {
                  if (clientWs.readyState === clientWs.OPEN) {
                    clientWs.send(
                      JSON.stringify({ interrupted: true }),
                    );
                  }
                }
                if (message.toolCall) {
                  const clientTools: any = { functionCalls: [] };
                  const serverResponses: any = {
                    functionResponses: [],
                  };

                  for (const call of message.toolCall
                    .functionCalls || []) {
                    if (call.name === "calculate") {
                      try {
                        const result = evaluate(
                          (call.args as any).expression,
                        );
                        serverResponses.functionResponses.push({
                          name: "calculate",
                          id: call.id,
                          response: { result },
                        });
                      } catch (err: any) {
                        serverResponses.functionResponses.push({
                          name: "calculate",
                          id: call.id,
                          response: { error: err.message },
                        });
                      }
                    } else {
                      clientTools.functionCalls.push(call);
                    }
                  }

                  if (serverResponses.functionResponses.length > 0) {
                    session?.sendToolResponse(serverResponses);
                  }
                  if (clientTools.functionCalls.length > 0) {
                    if (clientWs.readyState === clientWs.OPEN) {
                      clientWs.send(
                        JSON.stringify({ toolCall: clientTools }),
                      );
                    }
                  }
                }
              },
              onerror: (e: any) => {
                console.error("Live API error:", e);
                try {
                  if (clientWs.readyState === clientWs.OPEN) {
                    clientWs.send(JSON.stringify({ type: "error", message: "Live API error" }));
                  }
                } catch (_) {}
              },
              onclose: (e: any) => {
                console.log("Live API closed:", e?.code, e?.reason);
                try {
                  if (clientWs.readyState === clientWs.OPEN) {
                    clientWs.send(JSON.stringify({ type: "error", message: "Live API closed" }));
                  }
                } catch (_) {}
              },
            },
            config: {
              responseModalities: [Modality.AUDIO, "TEXT" as any],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: voiceName || "Aoede",
                  },
                },
              },
              systemInstruction: baseInstruction,
              tools: activeTools,
            },
          });
          clientWs.send(JSON.stringify({ type: "ready" }));

          if (initialPrompt && initialPrompt.length > 0) {
            session.sendClientContent({
              turns: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `Comando inicial detectado junto com a palavra de ativação: "${initialPrompt}". Por favor, execute isso agora e responda.`,
                    },
                  ],
                },
              ],
              turnComplete: true,
            });
          } else {
            session.sendClientContent({
              turns: [
                {
                  role: "user",
                  parts: [
                    {
                      text: "Ativação detectada. Estou em silêncio por enquanto. Se eu não falar nada em 2 segundos, pergunte 'Sim?' ou algo similar. Se após mais 5 segundos não houver resposta, execute a ferramenta endConversation.",
                    },
                  ],
                },
              ],
              turnComplete: true,
            });
          }
        }

        if (msg.audio && session) {
          session.sendRealtimeInput({
            audio: {
              data: msg.audio,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        }
        if (msg.toolResponse && session) {
          session.sendToolResponse({
            functionResponses: msg.toolResponse,
          });
        }
      } catch (e) {
        console.error("Error processing message", e);
      }
    });

    clientWs.on("close", () => {
      try {
        if (session && typeof session.close === "function") {
          session.close();
        }
      } catch (e) {
        /* ignore */
      }
    });
  });

  expressApp.all(/.*/, (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
