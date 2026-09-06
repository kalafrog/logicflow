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
                    content: `You are an enterprise Workflow Architect. Analyze the input and generate a precise branching process diagram.

You must respond with a raw JSON block in this exact structure, without messy quote escaping:
{
  "mermaidCode": "graph TD\\nA[\"Start\"] --> B[\"Process\"]",
  "recommendations": ["rec1", "rec2"]
}

STRICT RULES:
1. Keep Mermaid strings clean. Use standard single quotes or regular text inside brackets if needed to avoid escaping errors.
2. Return ONLY the JSON object, no markdown wrappers.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "openai/gpt-oss-20b",
            temperature: 0.1
        });

        const rawResponse = chatCompletion.choices[0]?.message?.content || "{}";
        
        // Clean up potential markdown code blocks if the model includes them
        const cleanedJSON = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(cleanedJSON);

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
