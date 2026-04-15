import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface ValidationResult {
  aiScore: number;
  aiSummary: string;
  isUseful: boolean;
  isUnique: boolean;
}

export const validateDocument = async (title: string, category: string, snippet: string): Promise<ValidationResult> => {
  try {
    const prompt = `Analyze this document for an online library.
    Title: ${title}
    Category: ${category}
    Snippet: ${snippet}

    Return a JSON object with:
    - aiScore (0-10, based on usefulness)
    - aiSummary (Short summary)
    - isUseful (boolean)
    - isUnique (Always true for now, we check hash separately)
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Simple parsing of JSON from text
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

    return {
      aiScore: data.aiScore || 5,
      aiSummary: data.aiSummary || "No summary available",
      isUseful: data.isUseful !== undefined ? data.isUseful : true,
      isUnique: true,
    };
  } catch (error) {
    console.error("AI Validation Error:", error);
    return {
      aiScore: 5,
      aiSummary: "AI evaluation failed, but document accepted as fallback.",
      isUseful: true,
      isUnique: true,
    };
  }
};
