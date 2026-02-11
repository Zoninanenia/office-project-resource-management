const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Get all projects - Protected
router.get('/', verifyToken, projectController.getAllProjects);

// Get project by ID - Protected
router.get('/:id', verifyToken, projectController.getProjectById);

// Create Project - PM Only
router.post('/', verifyToken, checkRole(['project_manager']), projectController.createProject);

module.exports = router;
