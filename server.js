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
                    content: `You are an expert Workflow Engineer. Parse workflow instructions into clean, non-overlapping Mermaid flowcharts.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "mermaidCode": "graph TD\\n...",
  "recommendations": ["rec1", "rec2"]
}

FLOW GRAPH RULES:
1. Standard Sequence for Orders:
   Start --> Check Stock --> In Stock?
   - If No: Out of Stock Notification --> End
   - If Yes: Collect Details --> Process Payment --> Payment Successful?
     - If Yes: Confirm Order --> Send Email Confirmation --> End
     - If No: Payment Failed --> Retry Payment?
       - If Yes: Process Payment
       - If No: Cancel Order --> End

2. ISOLATION RULE:
   - "Order Confirmed" MUST ONLY flow to "Send Email Confirmation" or "End".
   - NEVER connect "Order Confirmed" to "Retry Payment" or "Cancel Order".
   - Success and Failure branches must remain strictly isolated.
   
3. Use valid Mermaid graph TD syntax without codeblocks.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
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
});const express = require('express');
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
                    content: `You are an expert Workflow Engineer. Parse workflow instructions into clean, non-overlapping Mermaid flowcharts.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "mermaidCode": "graph TD\\n...",
  "recommendations": ["rec1", "rec2"]
}

FLOW GRAPH RULES:
1. Standard Sequence for Orders:
   Start --> Check Stock --> In Stock?
   - If No: Out of Stock Notification --> End
   - If Yes: Collect Details --> Process Payment --> Payment Successful?
     - If Yes: Confirm Order --> Send Email Confirmation --> End
     - If No: Payment Failed --> Retry Payment?
       - If Yes: Process Payment
       - If No: Cancel Order --> End

2. ISOLATION RULE:
   - "Order Confirmed" MUST ONLY flow to "Send Email Confirmation" or "End".
   - NEVER connect "Order Confirmed" to "Retry Payment" or "Cancel Order".
   - Success and Failure branches must remain strictly isolated.
   
3. Use valid Mermaid graph TD syntax without codeblocks.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
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
});const express = require('express');
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

Return ONLY a JSON object with two keys: "mermaidCode" and "recommendations".

STRICT MERMAID ARCHITECTURE RULES:
1. Use valid Mermaid syntax starting with "graph TD".
2. Decision nodes MUST be diamonds with explicit condition branches:
   A{"Payment Success?"} -->|Success| B["Order Confirmed"]
   A{"Payment Success?"} -->|Failure| C["Payment Failed"]
3. PATH SEPARATION RULE:
   - Successful actions (e.g., "Order Confirmed") MUST route directly to completion ("End") and NEVER connect to retry logic.
   - Failure actions (e.g., "Payment Failed") route into a decision node (e.g., "Retry Payment?").
   - If "Retry Payment?" is Yes, loop back to "Enter Payment Details". If No, route to "Cancel Order" -> "End".
4. Do NOT wrap code in markdown code blocks (\`\`\`).

RECOMMENDATIONS RULES:
1. Provide 2-3 concise operational optimizations as an array of strings.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
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
