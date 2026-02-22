const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// List users - Accessible by Admin, PM and Team Leaders
router.get('/', verifyToken, checkRole(['admin', 'project_manager', 'team_leader']), userController.getAllUsers);

// Create User - Admin only
router.post('/', verifyToken, checkRole(['admin']), userController.createUser);

// Update Role - Admin only
router.put('/:id/role', verifyToken, checkRole(['admin']), userController.updateUserRole);

module.exports = router;
