const express = require('express');
const path = require('path');
const { OpenAI } = require('openai');

// Load environment variables (Supports your .env file)
try {
  require('dotenv').config();
} catch (e) {
  // Fallback for Node.js v24 built-in env loader if dotenv is not installed
  if (process.loadEnvFile) process.loadEnvFile(path.join(__dirname, '.env'));
}

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Groq client using the OpenAI package
const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// Middleware
app.use(express.json()); // Parse incoming JSON requests
app.use(express.static(path.join(__dirname, 'public'))); // Serve the HTML/CSS/JS frontend

// API Route for Workflow Generation
app.post('/workflow/detect', async (req, res) => {
  const userPrompt = req.body.prompt;
  
  if (!userPrompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  console.log(`[Groq Cloud Processing] Generating workflow for: "${userPrompt.substring(0, 50)}..."`);

  const systemPrompt = `You are an expert AI workflow architect. Convert the user's process description into a JSON workflow object.
You must respond with ONLY valid JSON.
Schema requirement:
{
  "nodes": [ { "id": "A", "label": "Start Process", "type": "trigger" } ],
  "edges": [ { "source": "A", "target": "B" } ]
}
Node types must strictly be 'trigger', 'transform', or 'action'.`;

  try {
    const response = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a workflow graph for: "${userPrompt}"` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    // Parse the JSON returned by the Groq LLM
    const parsedWorkflow = JSON.parse(response.choices[0].message.content);
    
    console.log('[Groq Cloud Processing] Success! Sending data to frontend.');
    res.json(parsedWorkflow);
    
  } catch (error) {
    console.error('LLM Workflow Detection Error:', error.message);
    res.status(500).json({ error: 'Failed to generate workflow via Groq' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 LogicFlow AI Server is running!`);
  console.log(`🌐 Open in browser: http://localhost:${PORT}`);
  console.log(`=========================================`);
});