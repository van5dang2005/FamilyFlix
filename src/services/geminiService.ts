import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function getFamilyRecommendation(contentList: any[], profileName: string) {
  try {
    const ai = getAI();
    const contentSummary = contentList.map(c => `- ${c.title} (${c.category}, ${c.type})`).join('\n');

    const prompt = `
      You are a friendly "Family Memory Assistant" for a private streaming app named FamilyFlix.
      The current profile is "${profileName}".
      
      Here is a list of family memories (videos and photo albums) available:
      ${contentSummary}

      Please pick ONE memory (title) and write a short, heartwarming 1-sentence recommendation for why the family should watch it today. 
      Maybe it's a "Throwback Thursday", or "relive the magic of the holidays".
      
      Return ONLY a JSON object with the following structure:
      {
        "contentTitle": "Exact Title of the Content",
        "message": "The heartwarming recommendation message"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini Recommendation Error:", error);
    return null;
  }
}
