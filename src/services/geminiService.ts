import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { Mode, UserPreferences } from "../types";

const apiKey = process.env.GEMINI_API_KEY!;

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateResponse(
    prompt: string,
    mode: Mode,
    preferences: UserPreferences,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
    attachments: { data: string; mimeType: string }[] = []
  ) {
    const modelName = mode === 'pro' || mode === 'think' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';
    
    let systemInstruction = `You are Koma AI, a sophisticated AI companion. 
    User's name: ${preferences.name}. 
    Your personality: ${preferences.personality}. 
    Language: ${preferences.language}.`;

    if (mode === 'study') {
      systemInstruction += " You are in Study Mode. Provide educational, clear explanations. Always end your response with a concise summary of the key points discussed.";
    } else if (mode === 'think') {
      systemInstruction += " You are in Think Mode. Provide deep analytical reasoning, exploring multiple facets of the problem.";
    } else if (mode === 'pro') {
      systemInstruction += " You are in Pro Mode. Provide advanced, high-level technical responses with precision.";
    }

    const config: any = {
      systemInstruction,
    };

    if (mode === 'think') {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const contents = [...history];
    const currentParts: any[] = [{ text: prompt }];
    
    for (const attachment of attachments) {
      currentParts.push({
        inlineData: {
          data: attachment.data.split(',')[1], // Remove data:mime/type;base64,
          mimeType: attachment.mimeType,
        }
      });
    }

    contents.push({ role: 'user', parts: currentParts });

    const response = await this.ai.models.generateContent({
      model: modelName,
      contents,
      config,
    });

    return response.text;
  }

  // Pollinations.ai for image generation
  generateImage(prompt: string) {
    const encodedPrompt = encodeURIComponent(prompt);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&enhance=true`;
  }
}

export const geminiService = new GeminiService();
