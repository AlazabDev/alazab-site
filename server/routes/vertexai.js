'use strict';

const express = require('express');
const router = express.Router();
const logger = require('../logger');
const { VertexAI } = require('@google-cloud/vertexai');

// Initialize Vertex AI with your Cloud project and location
// You need to set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_CLOUD_LOCATION in your .env file
// Also ensure GOOGLE_APPLICATION_CREDENTIALS points to your service account JSON file
const project = process.env.GOOGLE_CLOUD_PROJECT_ID || 'your-project-id';
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

let generativeModel;

try {
  const vertex_ai = new VertexAI({ project: project, location: location });
  const model = 'gemini-1.5-pro-preview-0409'; // Ensure this model exists in your region
  
  generativeModel = vertex_ai.preview.getGenerativeModel({
    model: model,
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7,
      topP: 0.95,
    },
  });
} catch (error) {
  logger.error('[VertexAI] Initialization error:', { error: error.message });
}

// ── GET /api/vertexai/health (Check Service Status) ──────────────
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'Vertex AI integration is healthy',
    project: project,
    location: location,
    initialized: !!generativeModel
  });
});

// ── POST /api/vertexai/generate (Generate Content) ───────────────
router.post('/generate', async (req, res) => {
  try {
    if (!generativeModel) {
      return res.status(500).json({ error: 'Vertex AI model is not properly initialized. Check your credentials and config.' });
    }

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const reqData = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    };

    const streamingResp = await generativeModel.generateContentStream(reqData);
    let fullResponse = '';
    
    for await (const item of streamingResp.stream) {
      if (item.candidates && item.candidates[0].content.parts[0].text) {
        fullResponse += item.candidates[0].content.parts[0].text;
      }
    }

    const aggregatedResponse = await streamingResp.response;

    logger.info('[VertexAI] Generated content successfully');
    
    res.status(200).json({
      success: true,
      data: fullResponse,
      metadata: aggregatedResponse.usageMetadata
    });
  } catch (error) {
    logger.error('[VertexAI] Generate error:', { error: error.message });
    res.status(500).json({ error: 'Failed to generate content from Vertex AI', details: error.message });
  }
});

module.exports = router;
