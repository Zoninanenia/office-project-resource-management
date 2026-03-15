const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// List users - Accessible by Admin, PM and Team Leaders
router.get('/', verifyToken, checkRole(['admin', 'project_manager', 'team_leader', 'worker']), userController.getAllUsers);

// Create User - Admin only
router.post('/', verifyToken, checkRole(['admin']), userController.createUser);

// Update Role - Admin only
router.put('/:id/role', verifyToken, checkRole(['admin']), userController.updateUserRole);

// reset Password - All 
router.put('/:id/newpassword', verifyToken, userController.updatePassword);

// Update Name - All
router.put('/:id/changename', verifyToken, userController.updateName);

module.exports = router;
