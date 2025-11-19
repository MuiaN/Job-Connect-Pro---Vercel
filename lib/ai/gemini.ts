import { createGoogleGenerativeAI } from "@ai-sdk/google";

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error("Missing Google Gemini API key. Please add GOOGLE_GENERATIVE_AI_API_KEY to your .env file.");
}

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const gemini = google("models/gemini-2.5-flash");