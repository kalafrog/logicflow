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
                    content: `You are an expert workflow architect. Analyze the provided operational text and generate a branching flowchart and optimization recommendations.

Respond ONLY with a raw JSON object containing two keys: "mermaidCode" and "recommendations".

RULES FOR "mermaidCode":
- Use valid Mermaid.js syntax (graph TD).
- Every decision/condition node MUST branch into two distinct paths using labeled edges like:
  A{"Slot Available?"} -->|Yes| B["Book Slot"]
  A{"Slot Available?"} -->|No| C["Join Waitlist"]
- Make sure both branches eventually flow to logical next steps or End nodes.
- Do NOT wrap in markdown code blocks.

RULES FOR "recommendations":
- Provide 2-3 concise actionable tips to improve, automate, or optimize the parsed process.
- Return as an array of strings.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            response_format: { type: "json_object" }
        });

        const rawResponse = chatCompletion.choices[0]?.message?.content || "{}";
        const parsedData = JSON.parse(rawResponse);

        res.json({
            mermaidCode: parsedData.mermaidCode || "",
            recommendations: parsedData.recommendations || []
        });
    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(500).json({ error: "Failed to generate workflow" });
    }
});

app.listen(port, () => {
    console.log(`LogicFlow server running on port ${port}`);
});
