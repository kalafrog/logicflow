const { Ollama } = require('ollama');
const { workflowSchema } = require('../config/constants');

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

async function detectWorkflowFromPrompt(userPrompt) {
  if (!userPrompt || typeof userPrompt !== 'string') {
    throw new Error('Invalid or missing userPrompt argument.');
  }

  console.log(`[Ollama Processing] Generating workflow for: "${userPrompt.substring(0, 50)}..."`);

  const systemPrompt = `You are an expert AI workflow architect for AutomationFlow.
Your task is to analyze the user's natural language request and parse it into a node-based workflow graph.

CRITICAL INSTRUCTIONS:
1. Dynamically analyze the provided prompt.
2. Identify every trigger, transformation/filter/branch condition, and action step requested by the user.
3. Every node MUST have a "type" field set strictly to one of: "trigger", "transform", or "action".
   - Use "trigger" for initial webhooks/events.
   - Use "transform" for logic, OCR extractions, evaluations, and condition checks.
   - Use "action" for emails, payouts, ticket creation, or external dispatches.
4. Assign unique IDs to every node ("node_1", "node_2") and edge ("edge_1", "edge_2").
5. Link nodes logically using "source" and "target" parameters in the edges array.

REQUIRED JSON FORMAT:
{
  "name": "<Short descriptive title>",
  "nodes": [
    {
      "id": "node_1",
      "type": "trigger",
      "label": "<Clear step description>",
      "config": {}
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2"
    }
  ]
}`;

  try {
    const response = await ollama.chat({
      model: 'qwen2.5-coder',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a workflow graph for the following scenario: "${userPrompt}"` }
      ],
      options: {
        temperature: 0.1
      },
      format: 'json',
      stream: false
    });

    const rawContent = response.message.content;
    const parsedWorkflow = JSON.parse(rawContent);

    // DYNAMIC SANITIZATION: Force all non-standard node types to valid enum values
    if (parsedWorkflow && Array.isArray(parsedWorkflow.nodes)) {
      const allowedTypes = ['trigger', 'transform', 'action'];
      
      parsedWorkflow.nodes = parsedWorkflow.nodes.map(node => {
        if (!allowedTypes.includes(node.type)) {
          // Default any condition/filter/decision nodes outputted by LLM to 'transform'
          node.type = 'transform';
        }
        return node;
      });
    }

    // Validate sanitized object against Zod schema
    const validatedWorkflow = workflowSchema.parse(parsedWorkflow);
    return validatedWorkflow;

  } catch (error) {
    console.error('LLM Workflow Detection Error:', error.message);
    throw new Error(`Failed to generate workflow from prompt: ${error.message}`);
  }
}

module.exports = {
  detectWorkflowFromPrompt,
  detectWorkflow: detectWorkflowFromPrompt
};