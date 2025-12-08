import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_FLASH_MODEL } from '../constants';
import { AIAnalysis } from '../types';

let genAI: GoogleGenAI | null = null;

const getClient = () => {
  if (!genAI) {
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      genAI = new GoogleGenAI({ apiKey });
    }
  }
  return genAI;
};

export const getMovieComparisonVibe = async (
  movie1Name: string,
  movie1Year: string,
  movie2Name: string,
  movie2Year: string
): Promise<AIAnalysis | null> => {
  const ai = getClient();
  if (!ai) return null;

  try {
    const prompt = `Compare these two movies: "${movie1Name}" (${movie1Year}) and "${movie2Name}" (${movie2Year})".
    Provide a short, fun "vibe check" for each (max 10 words) and 2 key strengths for each.
    Also provide a 1-sentence thought on why this is a tough choice.`;

    const response = await ai.models.generateContent({
      model: GEMINI_FLASH_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            movie1: {
              type: Type.OBJECT,
              properties: {
                vibe: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            movie2: {
              type: Type.OBJECT,
              properties: {
                vibe: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            comparison: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AIAnalysis;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
