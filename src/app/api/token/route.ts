import { GoogleGenAI } from "@google/genai";

export async function POST() {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { apiVersion: "v1alpha" },
    });

    const now = new Date();
    const expireTime = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(now.getTime() + 1 * 60 * 1000).toISOString();

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
      },
    });

    return Response.json({ token: token.name });
  } catch (error: any) {
    console.error("Token generation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
