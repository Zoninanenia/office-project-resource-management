const express = require('express');
const router = express.Router();
const wageController = require('../controllers/wageController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Get all workers with wages - PM only
router.get('/workers', verifyToken, checkRole(['project_manager']), wageController.getWorkersWithWages);

// Update worker's hourly wage - PM only
router.put('/workers/:userId', verifyToken, checkRole(['project_manager']), wageController.updateWorkerWage);

// Get project labour cost breakdown - PM only
router.get('/projects/:projectId', verifyToken, checkRole(['project_manager']), wageController.getProjectLabourCost);

module.exports = router;
