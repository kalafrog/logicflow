const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');

// Detection
router.post('/detect', workflowController.detect);

// CRUD operations
router.post('/', workflowController.create);
router.get('/', workflowController.list);
router.get('/:workflowId', workflowController.get);
router.put('/:workflowId', workflowController.update);
router.delete('/:workflowId', workflowController.remove);

// Execution
router.post('/:workflowId/trigger', workflowController.trigger);
router.get('/:workflowId/runs', workflowController.getRuns);

// CRITICAL: Must export the router directly
module.exports = router;