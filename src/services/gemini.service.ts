
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
    const apiKey = provider?.apiKey || process.env['API_KEY'] || '';
    const baseUrl = provider?.baseUrl || undefined;
    
    const options: any = { apiKey };
    if (baseUrl) {
        options.baseUrl = baseUrl;
    }
    
    return new GoogleGenAI(options);
  }

  private cleanJson(text: string): any {
      try {
          return JSON.parse(text);
      } catch (e) {
          const match = text.match(/```json\s*([\s\S]*?)\s*```/);
          if (match && match[1]) {
              try { return JSON.parse(match[1]); } catch(e2) {}
          }
          const matchGeneric = text.match(/```\s*([\s\S]*?)\s*```/);
          if (matchGeneric && matchGeneric[1]) {
              try { return JSON.parse(matchGeneric[1]); } catch(e3) {}
          }
          throw new Error("Failed to parse JSON from AI response");
      }
  }

  // 1. OCR Task
  async recognizeQuestionFromImage(base64Image: string, removeHandwriting: boolean = true) {
    const assignment = this.settings.settings().assignments.ocr;
    const ai = this.getClient(assignment.providerId);
    const model = assignment.modelId;
    const systemPrompt = this.settings.settings().prompts.ocr;
    
    const schema = {
      type: Type.OBJECT,
      properties: {
        questionText: { type: Type.STRING, description: "The clean transcribed text of the question (preserve original language, NO handwriting)" },
        subject: { type: Type.STRING, description: "Subject in Chinese (e.g. 数学, 物理)" },
        type: { type: Type.STRING, enum: ['choice', 'indeterminate_choice', 'fill', 'short'], description: "Question format" },
        options: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "If choice question, list options (content only) here. Empty for other types." 
        },
        diagramSVG: { 
            type: Type.STRING, 
            description: "A clean, self-contained SVG string representing the scientific diagram/model in the image (geometry, circuit, forces, etc.). Remove all handwriting/scribbles. Use black lines, transparent fill. Start with <svg> tag. Leave empty if no diagram." 
        }
      },
      required: ["questionText", "subject", "type"]
    };

    const userInstructions = removeHandwriting 
        ? "Extract the question text. IMPORTANT: The image contains student handwriting (answers/marks). IGNORE all handwriting and transcribe only the printed question text. If a physical/math diagram exists, RECREATE it as SVG code in diagramSVG field."
        : "Extract the question text and metadata from the image.";

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                { text: userInstructions }
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
  async solveAndAnalyze(question: string, wrongAnswer: string | undefined, subject: string, imageContext?: string) {
    const assignment = this.settings.settings().assignments.reasoning;
    const ai = this.getClient(assignment.providerId);
    const model = assignment.modelId;
    const systemPrompt = this.settings.settings().prompts.analysis;
    
    // Dynamic Schema: If wrongAnswer is provided, require diagnosis. If not, don't.
    const properties: any = {
        correctAnswer: { type: Type.STRING, description: "The correct answer." },
        explanation: { type: Type.STRING, description: "Detailed step-by-step solution in Chinese. Use LaTeX for math." },
        coreConcept: { type: Type.STRING, description: "The main academic concept tested (in Chinese)." },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Relevant tags in Chinese" },
        difficultyRating: { type: Type.INTEGER, description: "1-5 scale" }
    };

    const required = ["correctAnswer", "explanation", "coreConcept", "tags"];

    if (wrongAnswer) {
        properties.errorDiagnosis = { type: Type.STRING, description: "Why the student likely got it wrong (in Chinese)." };
        required.push("errorDiagnosis");
    }

    const schema = {
      type: Type.OBJECT,
      properties,
      required
    };

    let userPrompt = `
      Subject: ${subject}
      Question: ${question}
    `;

    if (wrongAnswer) {
        userPrompt += `\nStudent's Wrong Answer: ${wrongAnswer}`;
    } else {
        userPrompt += `\n(No student answer provided. Just solve it.)`;
    }

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
