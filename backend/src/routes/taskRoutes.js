const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Get all tasks (Global) - Protected
router.get('/', verifyToken, taskController.getAllTasks);

// Get tasks by project - Protected
router.get('/project/:projectId', verifyToken, taskController.getTasksByProject);

// Create Task - PM or Team Leader
router.post('/project/:projectId', verifyToken, checkRole(['project_manager', 'team_leader']), taskController.createTask);

// Update Task Status - Any authenticated user (logic might need refinement for ownership)
router.put('/:taskId/status', verifyToken, taskController.updateTaskStatus);

// Edit Task Details - PM or Team Leader
router.put('/:taskId', verifyToken, checkRole(['project_manager', 'team_leader']), taskController.updateTask);

// Delete Task - PM or Team Leader
router.delete('/:taskId', verifyToken, checkRole(['project_manager', 'team_leader']), taskController.deleteTask);

module.exports = router;
