import { GoogleGenAI } from "@google/genai";

// Singleton instance not always ideal for live due to re-connection logic, 
// but good for static calls.
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateText = async (prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
  // API Key is handled by GoogleGenAI instance from process.env.API_KEY
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating content. Please check your API key.";
  }
};