import { GoogleGenAI } from '@google/genai';

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: 'Powiedz cześć',
    });
    console.log(response.text);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
