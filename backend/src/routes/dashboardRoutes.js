const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/stats', verifyToken, dashboardController.getDashboardStats);
router.get('/tasks', verifyToken, dashboardController.getDashboardTasks);
router.get('/me', verifyToken, dashboardController.getDashboardProfile);

module.exports = router;
