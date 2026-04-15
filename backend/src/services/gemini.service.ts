import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Check if a new title is semantically a duplicate of existing titles.
 * Returns { isDuplicate: boolean, reason: string }
 */
export async function checkTitleDuplicate(
  newTitle: string,
  existingTitles: string[]
): Promise<{ isDuplicate: boolean; reason: string }> {
  if (existingTitles.length === 0) return { isDuplicate: false, reason: '' };

  const prompt = `You are a library duplicate detection system.
New document title: "${newTitle}"
Existing library titles:
${existingTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Determine if the new title is a duplicate or very close variant of any existing title.
Consider: different editions, slight rewording, same content different title.
Respond ONLY with valid JSON: { "isDuplicate": boolean, "reason": "explanation" }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

/**
 * Generate a short AI summary of document metadata
 */
export async function generateDocumentSummary(title: string, category: string, level?: string): Promise<string> {
  const prompt = `Write a 2-sentence library description for a document titled "${title}" in category "${category}" ${level ? `at ${level} level` : ''}. Be informative and professional.`;
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
