const express = require('express');
const Groq = require('groq-sdk');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/generate', async (req, res) => {
    try {
        const { prompt } = req.body;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert software architect. Given a user request, generate a valid Mermaid.js flowchart code representation (graph TD) of the workflow. Return ONLY valid Mermaid syntax inside a code block or plain text without markdown wrappers if possible, or ensure it can be parsed cleanly."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "qwen-2.5-coder-32b",
            temperature: 0.2,
        });

        let rawContent = chatCompletion.choices[0]?.message?.content || "";
        
        // Clean up markdown blocks if the AI includes them
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
