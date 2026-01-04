
import { Injectable, inject } from '@angular/core';
import { GoogleGenAI, Type, SchemaType } from '@google/genai';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private settings = inject(SettingsService);

  constructor() {}

  private getClient(providerId: string) {
    const provider = this.settings.getProvider(providerId);
    
    // Fallback to process.env if provider key is empty (for default provider)
    const apiKey = provider?.apiKey || process.env['API_KEY'] || '';
    const baseUrl = provider?.baseUrl || undefined;
    
    const options: any = { apiKey };
    if (baseUrl) {
        options.baseUrl = baseUrl;
    }
    
    return new GoogleGenAI(options);
  }

  // Helper to safely parse JSON from AI response, handling markdown blocks
  private cleanJson(text: string): any {
      try {
          return JSON.parse(text);
      } catch (e) {
          // Attempt to strip ```json ... ``` markdown
          const match = text.match(/```json\s*([\s\S]*?)\s*```/);
          if (match && match[1]) {
              try { return JSON.parse(match[1]); } catch(e2) {}
          }
          // Attempt to strip generic ``` ... ``` markdown
          const matchGeneric = text.match(/```\s*([\s\S]*?)\s*```/);
          if (matchGeneric && matchGeneric[1]) {
              try { return JSON.parse(matchGeneric[1]); } catch(e3) {}
          }
          throw new Error("Failed to parse JSON from AI response");
      }
  }

  // 1. OCR Task
  async recognizeQuestionFromImage(base64Image: string) {
    const assignment = this.settings.settings().assignments.ocr;
    const ai = this.getClient(assignment.providerId);
    const model = assignment.modelId;
    const systemPrompt = this.settings.settings().prompts.ocr;
    
    const schema = {
      type: Type.OBJECT,
      properties: {
        questionText: { type: Type.STRING, description: "The transcribed text of the question (preserve original language)" },
        subject: { type: Type.STRING, description: "Subject in Chinese (e.g. 数学, 物理)" },
        type: { type: Type.STRING, enum: ['choice', 'indeterminate_choice', 'fill', 'short'], description: "Question format" },
        options: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "If choice question, list options (content only) here. Empty for other types." 
        }
      },
      required: ["questionText", "subject", "type"]
    };

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                { text: "Extract the question text and metadata." }
            ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          systemInstruction: systemPrompt
        }
      });
      
      return this.cleanJson(response.text);
    } catch (e) {
      console.error("AI Vision Error", e);
      throw e;
    }
  }

  // 2. Reasoning Task
  async solveAndAnalyze(question: string, wrongAnswer: string, subject: string, imageContext?: string) {
    const assignment = this.settings.settings().assignments.reasoning;
    const ai = this.getClient(assignment.providerId);
    const model = assignment.modelId;
    const systemPrompt = this.settings.settings().prompts.analysis;
    
    const schema = {
      type: Type.OBJECT,
      properties: {
        correctAnswer: { type: Type.STRING, description: "The correct answer." },
        explanation: { type: Type.STRING, description: "Detailed step-by-step solution in Chinese. Use LaTeX for math." },
        errorDiagnosis: { type: Type.STRING, description: "Why the student likely got it wrong (in Chinese)." },
        coreConcept: { type: Type.STRING, description: "The main academic concept tested (in Chinese)." },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Relevant tags in Chinese" },
        difficultyRating: { type: Type.INTEGER, description: "1-5 scale" }
      },
      required: ["correctAnswer", "explanation", "errorDiagnosis", "coreConcept", "tags"]
    };

    const userPrompt = `
      Subject: ${subject}
      Question: ${question}
      Student's Wrong Answer: ${wrongAnswer}
    `;

    const parts: any[] = [{ text: userPrompt }];
    if (imageContext) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageContext } });
    }

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          systemInstruction: systemPrompt
        }
      });
      
      return this.cleanJson(response.text);
    } catch (e) {
      console.error("AI Analysis Error", e);
      throw e;
    }
  }

  // 3. Notes Task
  async polishNotes(rawNotes: string, context: string) {
     const assignment = this.settings.settings().assignments.notes;
     const ai = this.getClient(assignment.providerId);
     const model = assignment.modelId;
     const systemPrompt = this.settings.settings().prompts.notes;
     
     const userPrompt = `
        Context: The student wrote these notes regarding a ${context} problem.
        Raw Notes: "${rawNotes}"
     `;
     
     try {
       const response = await ai.models.generateContent({
          model: model,
          contents: userPrompt,
          config: {
              systemInstruction: systemPrompt
          }
       });
       return response.text;
     } catch (e) {
       console.error("AI Notes Error", e);
       throw e;
     }
  }
}
