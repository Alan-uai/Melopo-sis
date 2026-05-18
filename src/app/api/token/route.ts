import { GoogleGenAI } from "@google/genai";

export async function GET() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
    apiVersion: "v1alpha",
  });

  const res = await (ai.authTokens as any).create({
    config: {
      liveConnectConstraints: {
        model: "models/gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede",
              },
            },
          },
        },
      },
    },
  });

  return Response.json({ token: res.name as string });
}
