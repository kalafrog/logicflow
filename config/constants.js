const { z } = require('zod');

const nodeSchema = z.object({
  id: z.string(),
  type: z.enum(['trigger', 'transform', 'action']),
  label: z.string(),
  config: z.record(z.any()).optional().default({})
});

const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  condition: z.string().optional()
});

const workflowSchema = z.object({
  name: z.string(),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema)
});

module.exports = { workflowSchema };