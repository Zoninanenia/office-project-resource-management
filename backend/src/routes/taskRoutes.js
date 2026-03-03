const express = require('express');
const router = express.Router();
const multer = require('multer');
const taskController = require('../controllers/taskController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
// Download attachments
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // e.g. 1234567890-myfile.pdf
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

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

// Get attachments for a task
router.get('/:taskId/attachments', verifyToken, taskController.getTaskAttachments);

// Upload attachment(s) to a task - PM, Team Leader, or Worker
router.post('/:taskId/attachments', verifyToken, checkRole(['project_manager', 'team_leader', 'worker']), upload.single('file'), taskController.uploadAttachment);

// Delete an attachment
router.delete('/:taskId/attachments/:attachmentId', verifyToken, checkRole(['project_manager', 'team_leader']), taskController.deleteAttachment);

// --- Task Comments Routes ---

// Get all comments for a specific task
router.get('/:taskId/comments', verifyToken, taskController.getTaskComments);

// Add a new comment to a task
router.post('/:taskId/comments', verifyToken, taskController.addTaskComment);

// Update a specific comment
router.put('/:taskId/comments/:commentId', verifyToken, taskController.updateTaskComment);

// Delete a specific comment
router.delete('/:taskId/comments/:commentId', verifyToken, taskController.deleteTaskComment);
module.exports = router;
