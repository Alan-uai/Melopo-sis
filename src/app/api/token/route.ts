import { GoogleGenAI, Modality } from "@google/genai";

const DEFAULT_VOICE = process.env.GEMINI_VOICE || "Aoede";
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-live-preview";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey, apiVersion: "v1alpha" });

  try {
    const res = await ai.authTokens.create({
      config: {
        liveConnectConstraints: {
          model: "models/" + DEFAULT_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: DEFAULT_VOICE,
                },
              },
            },
          },
        },
      },
    });

    return Response.json({ token: res.name as string });
  } catch (err: any) {
    const message = err?.message || "Unknown error";
    return Response.json(
      { error: "Token creation failed: " + message },
      { status: 500 },
    );
  }
}
