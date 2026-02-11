
import { GoogleGenAI, Type } from "@google/genai";
import { PredictionData, PartyColor } from "./types";

export const fetchElectionPrediction = async (electionDate: string): Promise<PredictionData> => {
  // Always initialize GoogleGenAI with process.env.API_KEY directly as per instructions.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze the upcoming 2026 Bangladesh General Election pulse as of today. 
    Focus on social media (Facebook, YouTube) sentiment and trending discussions.
    
    Current Date for Context: ${new Date().toLocaleDateString()}
    Target Election Date: ${electionDate}

    Tasks:
    1. Project vote percentages for Awami League, BNP, Jatiya Party, Jamaat-e-Islami, and Others based on trending sentiment.
    2. Provide a 2-sentence political analysis.
    3. Identify the most likely Prime Ministerial candidate.
    4. Generate 4 mock sentiment examples that represent current online discourse.

    Return JSON structure only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            predictions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  party: { type: Type.STRING },
                  percentage: { type: Type.NUMBER },
                  leader: { type: Type.STRING },
                  color: { type: Type.STRING }
                },
                required: ["party", "percentage", "leader", "color"]
              }
            },
            analysis: { type: Type.STRING },
            likelyPrimeMinister: { type: Type.STRING },
            sentimentFeed: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING },
                  username: { type: Type.STRING },
                  content: { type: Type.STRING },
                  sentiment: { type: Type.STRING },
                  timestamp: { type: Type.STRING }
                },
                required: ["platform", "username", "content", "sentiment", "timestamp"]
              }
            }
          },
          required: ["predictions", "analysis", "likelyPrimeMinister", "sentimentFeed"]
        }
      },
    });

    // Ensure we handle response properly
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const parsed = JSON.parse(text);
    
    // Extract grounding sources as required by instructions
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({ 
        title: chunk.web.title || "External Analysis", 
        uri: chunk.web.uri 
      }))
      .slice(0, 3);

    return { 
      ...parsed, 
      sources, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
    };
  } catch (err: any) {
    // Specific error handling to bubble up 429 status for the UI to handle backoff
    if (err.message?.includes("429") || err.status === 429) {
      throw new Error("API Resource Exhausted (429)");
    }
    throw err;
  }
};
