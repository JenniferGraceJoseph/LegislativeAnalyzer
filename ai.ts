import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface CompressedChunk {
  provisions: string[];
  definitions: Record<string, string>;
  obligations: string[];
  penalties: string[];
  stakeholders: string[];
}

export interface LawSummary {
  oneLiner: string;
  shortPoints: string[];
  detailed: string;
  impact: {
    who: string;
    whatChanges: string;
    whenApplies: string;
  };
  faqs: { q: string; a: string }[];
}

export interface LawMetadata {
  title: string;
  category: "Tax" | "Education" | "Digital Law" | "Environment" | "Labor" | "Other";
  date: string;
}

export const extractMetadata = async (text: string): Promise<LawMetadata> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract the title, category, and date of the following legal document.
    Text: ${text.slice(0, 10000)}`, // Use first 10k chars for metadata
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          category: { 
            type: Type.STRING, 
            enum: ["Tax", "Education", "Digital Law", "Environment", "Labor", "Other"] 
          },
          date: { type: Type.STRING, description: "ISO 8601 date format (YYYY-MM-DD)" },
        },
        required: ["title", "category", "date"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export const compressChunk = async (text: string): Promise<CompressedChunk> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract key information from this legal text. Remove boilerplate.
    Text: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          provisions: { type: Type.ARRAY, items: { type: Type.STRING } },
          definitions: { type: Type.OBJECT, additionalProperties: { type: Type.STRING } },
          obligations: { type: Type.ARRAY, items: { type: Type.STRING } },
          penalties: { type: Type.ARRAY, items: { type: Type.STRING } },
          stakeholders: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["provisions", "definitions", "obligations", "penalties", "stakeholders"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export const generateFinalSummary = async (compressedData: CompressedChunk[]): Promise<LawSummary> => {
  const combinedText = JSON.stringify(compressedData);
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Based on these compressed legal provisions, generate a citizen-friendly summary.
    Data: ${combinedText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          oneLiner: { type: Type.STRING },
          shortPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          detailed: { type: Type.STRING },
          impact: {
            type: Type.OBJECT,
            properties: {
              who: { type: Type.STRING },
              whatChanges: { type: Type.STRING },
              whenApplies: { type: Type.STRING },
            },
            required: ["who", "whatChanges", "whenApplies"],
          },
          faqs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                q: { type: Type.STRING },
                a: { type: Type.STRING },
              },
              required: ["q", "a"],
            },
          },
        },
        required: ["oneLiner", "shortPoints", "detailed", "impact", "faqs"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export const queryLaw = async (query: string, context: CompressedChunk[]): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Answer the user query based on the provided legal context.
    Context: ${JSON.stringify(context)}
    Query: ${query}`,
  });
  return response.text || "No answer found.";
};
