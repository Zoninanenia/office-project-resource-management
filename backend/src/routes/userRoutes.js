const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// List users - Accessible by PM and Team Leaders (maybe workers too if needed to see team)
// For now, let's allow PM and Team Leader
router.get('/', verifyToken, checkRole(['project_manager', 'team_leader']), userController.getAllUsers);

// Create User - PM only
router.post('/', verifyToken, checkRole(['project_manager']), userController.createUser);

// Update Role - PM only
router.put('/:id/role', verifyToken, checkRole(['project_manager']), userController.updateUserRole);

module.exports = router;
