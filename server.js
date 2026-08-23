const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/generate', async (req, res) => {
    try {
        const { prompt } = req.body;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an expert workflow architect and business process analyst.
Given an operational document, procedure, or text prompt, analyze the core business logic and create a step-by-step flowchart in valid Mermaid.js syntax (graph TD).

RULES:
1. Extract actual real-world operational steps, actions, and decision points.
2. DO NOT analyze the file format, string characters, or technical text structure itself.
3. Keep node labels short, concise, and action-oriented (e.g., "Receive Order", "Check Payment Status?").
4. Output ONLY valid Mermaid flowchart code. Do NOT wrap in markdown code blocks (\`\`\`) or add conversational commentary.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
        });

        let rawContent = chatCompletion.choices[0]?.message?.content || "";
        let mermaidCode = rawContent.replace(/```mermaid/g, '').replace(/```/g, '').trim();

        res.json({ mermaidCode });
    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(500).json({ error: "Failed to generate workflow" });
    }
});

app.listen(port, () => {
    console.log(`LogicFlow server running on port ${port}`);
});
