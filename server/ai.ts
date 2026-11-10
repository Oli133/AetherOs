import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Telemetry header required by AI Studio guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface ThinkRequest {
  prompt: string;
  context?: string;
  mode?: 'reason' | 'code' | 'command' | 'sysdiagnostics';
}

export async function processCognitionKernel(req: ThinkRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured in environment. Please check the Secrets panel.',
      thoughts: 'No API key detected in server environment.',
      output: 'Kernel cognition offline: GEMINI_API_KEY is missing.',
    };
  }

  const systemInstruction = `You are AetherOS Cognition Engine, the native deep-reasoning intelligence embedded in AetherOS Desktop.
You assist the user with advanced computing tasks: system architecture, shell script writing, code analysis, performance optimization, filesystem organization, and complex queries.
Be concise, robust, authoritative, and direct. Format code with Markdown code blocks. When proposing commands or scripts, make them compatible with standard POSIX / AetherOS shell.`;

  const fullPrompt = req.context
    ? `[SYSTEM CONTEXT / ENVIRONMENT STATE]:\n${req.context}\n\n[USER TASK]:\n${req.prompt}`
    : req.prompt;

  try {
    // Primary model: gemini-3.8-flash with ThinkingLevel.HIGH as user requested high thinking without paid key
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    // Inspect candidates for thought parts and text parts
    let thoughtText = '';
    let answerText = '';

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if ((part as any).thought) {
        thoughtText += (part as any).text || '';
      } else if (part.text) {
        answerText += part.text;
      }
    }

    if (!answerText && response.text) {
      answerText = response.text;
    }

    return {
      success: true,
      model: 'gemini-3.8-flash (Thinking: HIGH)',
      thoughts: thoughtText.trim(),
      output: answerText.trim(),
    };
  } catch (err: any) {
    console.error('Cognition Kernel error:', err);
    return {
      success: false,
      error: err?.message || 'Cognition Kernel execution failed.',
      output: `Kernel fault: ${err?.message || 'Unknown generation error'}`,
    };
  }
}
