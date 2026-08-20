import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const client = new GoogleGenAI({ apiKey: process.env.OPENAI_API_KEY });
const DEFAULT_MODEL = process.env.LLM_MODEL || 'gemini-3.6-flash';

export const callLLM = async (
  messages: any[],
  model: string = DEFAULT_MODEL
): Promise<string> => {
  const isMockMode = process.env.OPENAI_API_KEY === 'your_openai_api_key_here' || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy_key_for_testing';
  if (isMockMode) {
    return JSON.stringify({
      correctedCode: "// Mock corrected code\nint main() {\n  return 0;\n}",
      explanations: [{ lines: "1-3", explanation: "This is a mock explanation because no API key was provided." }]
    });
  }

  try {
    let system_instruction = '';
    let inputParts = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        system_instruction += msg.content + '\n';
      } else if (msg.role === 'assistant') {
        inputParts.push(`Assistant: ${msg.content}`);
      } else {
        inputParts.push(`User: ${msg.content}`);
      }
    }

    const input = inputParts.join('\n\n');

    const interaction = await client.interactions.create({
      model,
      input,
      system_instruction: system_instruction || undefined,
    });

    return interaction.output_text || '';
  } catch (error: any) {
    console.error('LLM API Error:', error);
    if (error.status === 429 || error.statusCode === 429 || (error.message && error.message.includes('quota'))) {
      throw new Error('Rate limit exceeded. Please wait about a minute and try again.');
    }
    throw new Error('Failed to generate response from LLM');
  }
};

export const streamLLM = async (
  messages: any[],
  res: any,
  model: string = DEFAULT_MODEL
) => {
  const isMockMode = process.env.OPENAI_API_KEY === 'your_openai_api_key_here' || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy_key_for_testing';
  if (isMockMode) {
    res.write(`data: ${JSON.stringify({ content: "This is a **mock response** because you haven't set an OpenAI API key in the `.env` file. " })}\n\n`);
    res.write(`data: ${JSON.stringify({ content: "The system is functioning correctly in demo mode!" })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  try {
    let system_instruction = '';
    let inputParts = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        system_instruction += msg.content + '\n';
      } else if (msg.role === 'assistant') {
        inputParts.push(`Assistant: ${msg.content}`);
      } else {
        inputParts.push(`User: ${msg.content}`);
      }
    }

    const input = inputParts.join('\n\n');

    const stream = await client.interactions.create({
      model,
      input,
      system_instruction: system_instruction || undefined,
      stream: true,
    });

    for await (const event of stream) {
      if (event.event_type === "step.delta" && event.delta.type === "text") {
        const content = event.delta.text;
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('LLM Streaming Error:', error);
    if (error.status === 429 || error.statusCode === 429 || (error.message && error.message.includes('quota'))) {
      res.write(`data: ${JSON.stringify({ error: 'Rate limit exceeded. Please wait about a minute and try again.' })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  }
};
