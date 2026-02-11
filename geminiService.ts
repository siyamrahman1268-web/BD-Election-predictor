
import { GoogleGenAI, Type } from "@google/genai";
import { PredictionData, PartyColor } from "./types";

const API_KEY = process.env.API_KEY || "";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchElectionPrediction = async (electionDate: string, retries = 3): Promise<PredictionData> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `
    Analyze the political landscape for the Bangladesh general election for ${electionDate}.
    
    CRITICAL INSTRUCTION: Do NOT collect or use information from traditional Bangladesh news media outlets.
    
    INSTEAD: Rely exclusively on "people impression" by scanning Facebook and YouTube.
    
    Format the response as a JSON object with this exact structure:
    {
      "predictions": [
        {"party": "Awami League", "percentage": number, "leader": "Sheikh Hasina", "color": "${PartyColor.AL}"},
        {"party": "BNP", "percentage": number, "leader": "Tarique Rahman", "color": "${PartyColor.BNP}"},
        {"party": "Jatiya Party", "percentage": number, "leader": "G.M. Quader", "color": "${PartyColor.JP}"},
        {"party": "Jamaat-e-Islami", "percentage": number, "leader": "Dr. Shafiqur Rahman", "color": "${PartyColor.JAM}"},
        {"party": "Others", "percentage": number, "leader": "Various", "color": "${PartyColor.OTH}"}
      ],
      "analysis": "A brief analysis of the current digital pulse.",
      "likelyPrimeMinister": "Name of the person most likely to be Prime Minister",
      "sentimentFeed": [
        {
          "platform": "facebook" | "youtube",
          "username": "Generic BD name",
          "content": "A short, representative comment or post content reflecting current public pulse",
          "sentiment": "pro-al" | "pro-bnp" | "pro-jam" | "neutral",
          "timestamp": "Just now"
        }
      ]
    }
    
    Provide 4 items in the sentimentFeed that act as "evidence" for the current shift.
    Ensure percentages sum to 100.
  `;

  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Switched to Flash for higher rate limits (RPM/TPM)
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response");
      
      const cleanText = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanText);

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: any[] = groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title,
          uri: chunk.web.uri
        }));

      return {
        ...parsed,
        sources,
        timestamp: new Date().toLocaleTimeString()
      };
    } catch (err: any) {
      console.warn(`Attempt ${i + 1} failed:`, err);
      lastError = err;
      
      // If it's a 429, we should definitely back off longer
      const isRateLimit = err.message?.includes("429") || err.status === "RESOURCE_EXHAUSTED";
      if (isRateLimit && i < retries - 1) {
        await sleep(5000 * (i + 1)); // Aggressive backoff for rate limits
        continue;
      }

      if (i < retries - 1) await sleep(Math.pow(2, i) * 1000);
    }
  }
  throw lastError || new Error("Failed to fetch prediction");
};
