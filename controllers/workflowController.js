git initconst { detectWorkflow } = require('../services/detectionService');
const { runWorkflow } = require('../services/executionService');
const dbRepository = require('../dbRepository');

const detect = async (req, res) => {
  try {
    // Support both 'prompt' and 'requirements' keys from req.body
    const userPrompt = req.body.prompt || req.body.requirements;
    const { schemaContext } = req.body;

    if (!userPrompt) {
      return res.status(400).json({ error: 'A prompt or requirements string is required.' });
    }

    const workflow = await detectWorkflow(userPrompt, schemaContext);
    return res.status(200).json(workflow);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  const workflow = await dbRepository.createWorkflow(req.body);
  return res.status(201).json(workflow);
};

const list = async (req, res) => {
  const workflows = await dbRepository.listWorkflows();
  return res.status(200).json(workflows);
};

const get = async (req, res) => {
  const workflow = await dbRepository.getWorkflow(req.params.workflowId);
  if (!workflow) return res.status(404).json({ message: 'Workflow not found' });
  return res.status(200).json(workflow);
};

const update = async (req, res) => {
  const updated = await dbRepository.updateWorkflow(req.params.workflowId, req.body);
  return res.status(200).json(updated);
};

const remove = async (req, res) => {
  await dbRepository.deleteWorkflow(req.params.workflowId);
  return res.status(200).json({ message: 'Deleted successfully' });
};

const trigger = async (req, res) => {
  try {
    const result = await runWorkflow(req.params.workflowId, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getRuns = async (req, res) => {
  const runs = await dbRepository.getWorkflowRuns(req.params.workflowId);
  return res.status(200).json(runs);
};

// ... bottom of controllers/workflowController.js
module.exports = { 
  detect, 
  create, 
  list, 
  get, 
  update, 
  remove, 
  trigger, 
  getRuns 
};