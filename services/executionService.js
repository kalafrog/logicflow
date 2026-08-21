// services/executionService.js
const axios = require('axios');
const Handlebars = require('handlebars');
const { EXECUTION_STATUS, ACTION_TYPES } = require('../config/constants');
const dbRepository = require('../dbRepository');

const resolveContext = (payloadObj, executionState) => {
  if (!payloadObj) return {};
  const templateString = JSON.stringify(payloadObj);
  const template = Handlebars.compile(templateString);
  const resolvedString = template(executionState);
  return JSON.parse(resolvedString);
};

const evaluateCondition = (conditionExpr, executionState) => {
  try {
    const func = new Function('state', `return ${conditionExpr}`);
    return func(executionState);
  } catch (error) {
    console.error(`Error evaluating condition: ${conditionExpr}`, error);
    return false;
  }
};

const dispatchAction = async (actionType, resolvedPayload) => {
  const client = axios.create({ baseURL: process.env.SYSTEM_API_BASE_URL || 'http://localhost:5000' });

  switch (actionType) {
    case ACTION_TYPES.FORM_CREATE:
      return await client.post('/api/forms', resolvedPayload);
    case ACTION_TYPES.FORM_UPDATE:
      return await client.put(`/api/forms/${resolvedPayload.id}`, resolvedPayload);
    case ACTION_TYPES.FUNCTION:
      return await client.post('/api/functions/execute', resolvedPayload);
    case ACTION_TYPES.OPERATION:
      return await client.post('/api/operations', resolvedPayload);
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
};

const topologicalSort = (nodes = [], edges = []) => {
  const inDegree = {};
  const adjacencyList = {};

  nodes.forEach(node => {
    inDegree[node.id] = 0;
    adjacencyList[node.id] = [];
  });

  edges.forEach(edge => {
    if (inDegree[edge.to] !== undefined) inDegree[edge.to]++;
    if (adjacencyList[edge.from]) adjacencyList[edge.from].push(edge.to);
  });

  const queue = nodes.filter(node => inDegree[node.id] === 0).map(n => n.id);
  const sorted = [];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const nodeObj = nodes.find(n => n.id === currentId);
    if (nodeObj) sorted.push(nodeObj);

    (adjacencyList[currentId] || []).forEach(nextId => {
      inDegree[nextId]--;
      if (inDegree[nextId] === 0) queue.push(nextId);
    });
  }

  return sorted.length === nodes.length ? sorted : nodes;
};

const runWorkflow = async (workflowId, initialPayload) => {
  const workflow = await dbRepository.getWorkflow(workflowId);
  if (!workflow) throw new Error('Workflow not found');

  const executionState = {
    trigger: initialPayload,
    steps: {},
    status: EXECUTION_STATUS.RUNNING
  };

  await dbRepository.updateRunStatus(workflowId, EXECUTION_STATUS.RUNNING);

  const sortedNodes = topologicalSort(workflow.nodes, workflow.edges);

  for (const node of sortedNodes) {
    const stepId = node.id;
    try {
      const resolvedPayload = resolveContext(node.payload, executionState);

      if (node.conditions && node.conditions.length > 0) {
        const shouldExecute = node.conditions.every(condition =>
          evaluateCondition(condition.expression, executionState)
        );
        if (!shouldExecute) continue;
      }

      const result = await dispatchAction(node.type, resolvedPayload);

      executionState.steps[stepId] = {
        status: EXECUTION_STATUS.SUCCESS,
        output: result.data,
        timestamp: new Date()
      };

      await dbRepository.updateStepLog(workflowId, stepId, {
        status: EXECUTION_STATUS.SUCCESS,
        output: result.data
      });
    } catch (error) {
      executionState.steps[stepId] = {
        status: EXECUTION_STATUS.FAILED,
        error: error.message,
        timestamp: new Date()
      };
      await dbRepository.updateStepLog(workflowId, stepId, {
        status: EXECUTION_STATUS.FAILED,
        error: error.message
      });
      await dbRepository.updateRunStatus(workflowId, EXECUTION_STATUS.FAILED);
      throw error;
    }
  }

  executionState.status = EXECUTION_STATUS.SUCCESS;
  await dbRepository.updateRunStatus(workflowId, EXECUTION_STATUS.SUCCESS);
  return executionState;
};

module.exports = { runWorkflow };