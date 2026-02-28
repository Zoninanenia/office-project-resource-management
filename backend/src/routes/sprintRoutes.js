const express = require('express');
const router = express.Router();
const sprintController = require('../controllers/sprintController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Get sprints by project - Protected
router.get('/project/:projectId', verifyToken, sprintController.getSprintsByProject);

// Create Sprint - PM Only
router.post('/project/:projectId', verifyToken, checkRole(['project_manager']), sprintController.createSprint);

// Update Sprint - PM Only
router.put('/:sprintId', verifyToken, checkRole(['project_manager']), sprintController.updateSprint);

// Delete Sprint - PM Only
router.delete('/:sprintId', verifyToken, checkRole(['project_manager']), sprintController.deleteSprint);

// Assign task to sprint - PM Only
router.put('/:sprintId/tasks/:taskId', verifyToken, checkRole(['project_manager']), sprintController.assignTaskToSprint);

// Remove task from sprint (back to backlog) - PM Only
router.delete('/tasks/:taskId', verifyToken, checkRole(['project_manager']), sprintController.removeTaskFromSprint);

// Carry over unfinished tasks from one sprint to another - PM Only
router.post('/:fromSprintId/carry-over', verifyToken, checkRole(['project_manager']), sprintController.carryOverTasks);

// Move a single task to a different sprint - PM Only
router.put('/tasks/:taskId/move', verifyToken, checkRole(['project_manager']), sprintController.moveTaskToSprint);

module.exports = router;
