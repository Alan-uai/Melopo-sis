import { GoogleGenAI } from "@google/genai";

export async function GET() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  const token = await ai.live.createEphemeralToken({
    model: "gemini-3.1-flash-live-preview",
  });

  return Response.json(token);
}