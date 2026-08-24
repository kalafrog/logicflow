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
                    content: `You are an enterprise Workflow Management & Automation Architect.
Analyze the user request or process document and map out a structured workflow diagram with dynamic branching (if/else logic) and automation recommendations.

Return ONLY a JSON object with two keys: "mermaidCode" and "recommendations".

MERMAID RULES:
1. Use standard Mermaid graph syntax: "graph TD"
2. Map out sequential steps and decision points.
3. EVERY decision point MUST use diamond notation with a question and split into two distinct path labels (e.g., Yes/No, Available/Unavailable, Approved/Rejected):
   A["Check Slot Availability"] --> B{"Is Slot Available?"}
   B -->|Yes| C["Confirm Booking & Send Invite"]
   B -->|No| D["Add to Waitlist & Notify User"]
4. Connect all paths to logical completion/end states.
5. DO NOT wrap output in markdown code blocks (\`\`\`).

RECOMMENDATIONS RULES:
1. Provide 2-4 actionable workflow recommendations (e.g., automation triggers, notifications, error handling strategies).
2. Return as an array of strings.`
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
