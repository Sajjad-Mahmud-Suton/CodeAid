import express from 'express';
import { streamLLM, callLLM } from '../services/llmService';
import { buildGeneralQuestionPrompt } from '../prompts/general';
import { buildQuestionFromCodePrompt } from '../prompts/questionFromCode';
import { buildHelpWriteCodePrompt } from '../prompts/helpWriteCode';
import { buildHelpFixCodeInternalPrompt, buildHelpFixCodeExplanationPrompt } from '../prompts/helpFixCode';
import { buildExplainCodePrompt } from '../prompts/explainCode';
import { generateDiff } from '../services/diffService';
import { Feedback } from '../models/Feedback';

const router = express.Router();

router.post('/general', async (req, res) => {
  const { question, conversationHistory = [] } = req.body;
  const prompt = buildGeneralQuestionPrompt(question);
  
  const messages = [
    { role: 'system', content: prompt },
    ...conversationHistory,
    { role: 'user', content: question }
  ];
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  await streamLLM(messages as any, res);
});

router.post('/question-from-code', async (req, res) => {
  const { code, question, conversationHistory = [] } = req.body;
  const prompt = buildQuestionFromCodePrompt(code, question);
  
  const messages = [
    { role: 'system', content: prompt },
    ...conversationHistory,
    { role: 'user', content: question }
  ];
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  await streamLLM(messages as any, res);
});

router.post('/help-write-code', async (req, res) => {
  const { task } = req.body;
  const prompt = buildHelpWriteCodePrompt(task);
  
  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: task }
  ];
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  await streamLLM(messages as any, res);
});

router.post('/help-fix-code', async (req, res) => {
  try {
    const { buggyCode, errorOrIntention } = req.body;
    
    // Step 1: Internal correction
    const internalPrompt = buildHelpFixCodeInternalPrompt(buggyCode, errorOrIntention);
    const internalResponseStr = await callLLM([{ role: 'user', content: internalPrompt }]);
    
    // Parse JSON
    let correctedCode = buggyCode;
    try {
      const match = internalResponseStr.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        correctedCode = parsed.correctedCode || buggyCode;
      }
    } catch (e) {
      console.log("Failed to parse internal correction:", internalResponseStr);
    }
    
    // Step 2: Generate diff
    const diff = generateDiff(buggyCode, correctedCode);
    
    // Step 3: Explanation
    const explanationPrompt = buildHelpFixCodeExplanationPrompt(diff);
    const explanationStr = await callLLM([{ role: 'user', content: explanationPrompt }]);
    
    let explanations = [];
    try {
      const match = explanationStr.match(/\[[\s\S]*\]/);
      if (match) {
        explanations = JSON.parse(match[0]);
      }
    } catch (e) {
      console.log("Failed to parse explanation array:", explanationStr);
    }

    res.json({ diff, explanations });
  } catch (error: any) {
    console.error("Help Fix Code Route Error:", error);
    res.status(500).json({ error: 'Help Fix Code failed', details: error.message || String(error) });
  }
});

router.post('/explain-code', async (req, res) => {
  try {
    const { code } = req.body;
    const prompt = buildExplainCodePrompt(code);
    const responseStr = await callLLM([{ role: 'user', content: prompt }]);
    
    let explanations = [];
    try {
      const match = responseStr.match(/\[[\s\S]*\]/);
      if (match) {
        explanations = JSON.parse(match[0]);
      }
    } catch (e) {
      console.log("Failed to parse explain-code array:", responseStr);
    }

    res.json({ explanations });
  } catch (error: any) {
    console.error("Explain Code Route Error:", error);
    res.status(500).json({ error: 'Explain Code failed', details: error.message || String(error) });
  }
});

router.post('/feedback', async (req, res) => {
  try {
    const feedback = new Feedback(req.body);
    await feedback.save();
    res.json({ success: true });
  } catch (error: any) {
    console.error("Feedback Route Error:", error);
    res.status(500).json({ error: 'Feedback save failed', details: error.message || String(error) });
  }
});

export default router;
