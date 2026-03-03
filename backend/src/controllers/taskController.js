const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

// Get all tasks (Global view) - PM sees all, others see assigned/created
exports.getAllTasks = async (req, res) => {
    const userId = req.user.userId;
    const userRole = req.user.role;

    try {
        let query = `
      SELECT t.taskId as "taskId", t.taskName as "taskName", t.description, t.status, t.createdDate as "createdDate", t.dueDate as "dueDate", t.projectId as "projectId",
             t.teamId as "teamId",
             t.sprintId as "sprintId",
             t.estimatedHours as "estimatedHours",
             p.title as "projectName",
             u.username as "creatorName",
             tm.teamName as "teamName",
             sp.sprintName as "sprintName",
             COALESCE(
                 json_agg(
                     json_build_object('workerId', w.userId, 'workerName', w.username)
                 ) FILTER (WHERE w.userId IS NOT NULL), 
                 '[]'
             ) as "assignees",
             COALESCE(
                 (SELECT json_agg(td.dependsOnTaskId) 
                  FROM TaskDependencies td 
                  WHERE td.taskId = t.taskId),
                 '[]'
             ) as "dependencies"
      FROM Tasks t
      LEFT JOIN Projects p ON t.projectId = p.projectId
      LEFT JOIN Users u ON t.creatorId = u.userId
      LEFT JOIN Teams tm ON t.teamId = tm.teamId
      LEFT JOIN Sprints sp ON t.sprintId = sp.sprintId
      LEFT JOIN TasksToWorkers ttw ON t.taskId = ttw.taskId
      LEFT JOIN Users w ON ttw.workerId = w.userId
    `;

        const params = [];

        // If not PM, filter by assignment, creation, or team membership
        if (userRole !== 'project_manager') {
            query += ` WHERE t.creatorId = $1 OR EXISTS (SELECT 1 FROM TasksToWorkers ttw2 WHERE ttw2.taskId = t.taskId AND ttw2.workerId = $1) OR EXISTS (SELECT 1 FROM TeamMembers tmem WHERE tmem.userId = $1 AND tmem.teamId = t.teamId)`;
            params.push(userId);
        }

        query += ` GROUP BY t.taskId, p.title, u.username, tm.teamName, sp.sprintName ORDER BY t.dueDate ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get all tasks for a project
exports.getTasksByProject = async (req, res) => {
    const { projectId } = req.params;

    try {
        const result = await pool.query(`
      SELECT t.taskId as "taskId", t.taskName as "taskName", t.description, t.status, t.createdDate as "createdDate", t.dueDate as "dueDate", t.projectId as "projectId",
             t.teamId as "teamId",
             t.sprintId as "sprintId",
             u.username as "creatorName",
             tm.teamName as "teamName",
             sp.sprintName as "sprintName",
             COALESCE(
                 json_agg(
                     json_build_object('workerId', w.userId, 'workerName', w.username)
                 ) FILTER (WHERE w.userId IS NOT NULL), 
                 '[]'
             ) as "assignees",
             COALESCE(
                 (SELECT json_agg(td.dependsOnTaskId) 
                  FROM TaskDependencies td 
                  WHERE td.taskId = t.taskId),
                 '[]'
             ) as "dependencies"
      FROM Tasks t
      LEFT JOIN Users u ON t.creatorId = u.userId
      LEFT JOIN Teams tm ON t.teamId = tm.teamId
      LEFT JOIN Sprints sp ON t.sprintId = sp.sprintId
      LEFT JOIN TasksToWorkers ttw ON t.taskId = ttw.taskId
      LEFT JOIN Users w ON ttw.workerId = w.userId
      WHERE t.projectId = $1
      GROUP BY t.taskId, u.username, tm.teamName, sp.sprintName
      ORDER BY t.createdDate DESC
    `, [projectId]);

        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create a new task (PM/Team Leader)
exports.createTask = async (req, res) => {
    const { projectId } = req.params;
    const { taskName, description, status, dueDate, assignedTo, dependencies, teamId, estimatedHours } = req.body;
    const creatorId = req.user.userId; // From auth middleware

    // Handle empty date string
    const validDueDate = dueDate === '' ? null : dueDate;
    const validTeamId = teamId === '' || teamId === undefined ? null : teamId;
    const validEstimatedHours = estimatedHours === '' || estimatedHours === undefined ? null : estimatedHours;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Create Task
        const newTask = await client.query(
            'INSERT INTO Tasks (taskName, description, status, dueDate, creatorId, projectId, teamId, estimatedHours) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING taskId as "taskId", taskName as "taskName", description, status, dueDate as "dueDate", projectId as "projectId", teamId as "teamId", estimatedHours as "estimatedHours"',
            [taskName, description, status || 'todo', validDueDate, creatorId, projectId, validTeamId, validEstimatedHours]
        );

        const taskId = newTask.rows[0].taskId;

        // Assign to workers if provided (Array of IDs)
        if (assignedTo && Array.isArray(assignedTo) && assignedTo.length > 0) {
            for (const workerId of assignedTo) {
                // 1. นำ User เข้า Task
                await client.query(
                    'INSERT INTO TasksToWorkers (taskId, workerId) VALUES ($1, $2)',
                    [taskId, workerId]
                );

                // 2. สร้างการแจ้งเตือน (เพิ่มใหม่)
                const message = `You have been assigned to a new task: ${taskName}`;
                await client.query(
                    `INSERT INTO Notifications (userId, taskId, type, message) VALUES ($1, $2, $3, $4)`,
                    [workerId, taskId, 'assignment', message]
                );
            }
        }

        // Add task dependencies
        if (dependencies && Array.isArray(dependencies) && dependencies.length > 0) {
            for (const depId of dependencies) {
                await client.query(
                    'INSERT INTO TaskDependencies (taskId, dependsOnTaskId) VALUES ($1, $2)',
                    [taskId, depId]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json(newTask.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create Task Error:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    } finally {
        client.release();
    }
};

// Update Task Status (Worker/PM)
exports.updateTaskStatus = async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;

    try {
        // Enforce dependencies: cannot start or finish if dependencies are not done
        if (['in_progress', 'review', 'done'].includes(status)) {
            const depsCheck = await pool.query(`
                SELECT t.taskId, t.taskName, t.status
                FROM TaskDependencies td
                JOIN Tasks t ON td.dependsOnTaskId = t.taskId
                WHERE td.taskId = $1 AND t.status != 'done'
            `, [taskId]);

            if (depsCheck.rows.length > 0) {
                const pendingTasks = depsCheck.rows.map(r => r.taskName).join(', ');
                return res.status(400).json({ message: `Blocked by unfinished tasks: ${pendingTasks}` });
            }
        }

        const result = await pool.query(
            'UPDATE Tasks SET status = $1 WHERE taskId = $2 RETURNING taskId as "taskId", status',
            [status, taskId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

// Delete Task (PM/Team Leader)
exports.deleteTask = async (req, res) => {
    const { taskId } = req.params;
    try {
        const result = await pool.query('DELETE FROM Tasks WHERE taskId = $1 RETURNING *', [taskId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
};

// Update Task Details (PM/Team Leader)
exports.updateTask = async (req, res) => {
    const { taskId } = req.params;
    const { taskName, description, dueDate, assignedTo, dependencies, teamId, estimatedHours } = req.body;

    const validDueDate = dueDate === '' ? null : dueDate;
    const validTeamId = teamId === '' || teamId === undefined ? null : teamId;
    const validEstimatedHours = estimatedHours === '' || estimatedHours === undefined ? null : estimatedHours;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Update core task info
        const result = await client.query(
            'UPDATE Tasks SET taskName = $1, description = $2, dueDate = $3, teamId = $4, estimatedHours = $5 WHERE taskId = $6 RETURNING *',
            [taskName, description, validDueDate, validTeamId, validEstimatedHours, taskId]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Task not found' });
        }

        // Handle Assignments update
        if (assignedTo !== undefined) {
            // Wipe old
            await client.query('DELETE FROM TasksToWorkers WHERE taskId = $1', [taskId]);
            // Insert new
            if (Array.isArray(assignedTo)) {
                for (const workerId of assignedTo) {
                    await client.query('INSERT INTO TasksToWorkers (taskId, workerId) VALUES ($1, $2)', [taskId, workerId]);
                }
            }
        }

        // Handle Dependencies update
        if (dependencies !== undefined) {
            // Wipe old
            await client.query('DELETE FROM TaskDependencies WHERE taskId = $1', [taskId]);
            // Insert new
            if (Array.isArray(dependencies)) {
                for (const depId of dependencies) {
                    // Prevent self dependency theoretically
                    if (depId !== parseInt(taskId)) {
                        await client.query('INSERT INTO TaskDependencies (taskId, dependsOnTaskId) VALUES ($1, $2)', [taskId, depId]);
                    }
                }
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Task updated successfully', task: result.rows[0] });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update Task Error:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    } finally {
        client.release();
    }
};

// Get all attachments for a task
exports.getTaskAttachments = async (req, res) => {
    const { taskId } = req.params;

    try {
        const result = await pool.query(
            `SELECT a.attachmentId as "attachmentId", a.fileName as "fileName", a.fileUrl as "fileUrl",
                    a.fileSize as "fileSize", a.mimeType as "mimeType", a.uploadedAt as "uploadedAt",
                    u.username as "uploadedBy"
             FROM TaskAttachments a
             LEFT JOIN Users u ON a.uploadedBy = u.userId
             WHERE a.taskId = $1
             ORDER BY a.uploadedAt DESC`,
            [taskId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Get Attachments Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// Upload an attachment to a task
exports.uploadAttachment = async (req, res) => {
    const { taskId } = req.params;
    const uploadedBy = req.user.userId;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: 'No file provided' });
    }

    try {
        // Verify the task exists before attaching
        const taskCheck = await pool.query(
            'SELECT taskId FROM Tasks WHERE taskId = $1',
            [taskId]
        );

        if (taskCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const result = await pool.query(
            `INSERT INTO TaskAttachments (taskId, uploadedBy, fileName, fileUrl, fileSize, mimeType)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING attachmentId as "attachmentId", fileName as "fileName", fileUrl as "fileUrl",
                       fileSize as "fileSize", mimeType as "mimeType", uploadedAt as "uploadedAt"`,
            [taskId, uploadedBy, file.originalname, file.path, file.size, file.mimetype]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Upload Attachment Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// Delete an attachment
exports.deleteAttachment = async (req, res) => {
    const { attachmentId } = req.params;

    try {
        const lookup = await pool.query(
            'SELECT fileUrl as "fileUrl" FROM TaskAttachments WHERE attachmentId = $1',
            [attachmentId]
        );

        if (lookup.rows.length === 0) {
            return res.status(404).json({ message: 'Attachment not found' });
        }

        // Remove file from disk
        const filePath = path.resolve(lookup.rows[0].fileUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await pool.query(
            'DELETE FROM TaskAttachments WHERE attachmentId = $1',
            [attachmentId]
        );

        res.json({ message: 'Attachment deleted successfully' });
    } catch (err) {
        console.error('Delete Attachment Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// Get all comments for a task
exports.getTaskComments = async (req, res) => {
    const { taskId } = req.params;

    try {
        const result = await pool.query(
            `SELECT c.taskCommentId as "taskCommentId", c.comment, c.createdDate as "createdDate",
                    u.userId as "userId", u.username as "username", u.profilePic as "profilePic"
             FROM TaskComments c
             LEFT JOIN Users u ON c.userId = u.userId
             WHERE c.taskId = $1
             ORDER BY c.createdDate ASC`,
            [taskId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get Task Comments Error:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
};

// Add a comment to a task (with @mention detection)
exports.addTaskComment = async (req, res) => {
    const { taskId } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId; // ดึงมาจาก authMiddleware

    if (!comment || comment.trim() === '') {
        return res.status(400).json({ message: 'Comment text is required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if task exists (need task name for notification message)
        const taskCheck = await client.query(
            'SELECT taskId, taskName AS "taskName" FROM Tasks WHERE taskId = $1',
            [taskId]
        );

        if (taskCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Task not found' });
        }

        const taskName = taskCheck.rows[0].taskName;

        // Save the comment
        const result = await client.query(
            `INSERT INTO TaskComments (taskId, userId, comment)
             VALUES ($1, $2, $3)
             RETURNING taskCommentId as "taskCommentId", comment, createdDate as "createdDate"`,
            [taskId, userId, comment]
        );

        // Detect @mentions using regex
        const mentionRegex = /@(\w+)/g;
        const matches = [];
        let match;

        while ((match = mentionRegex.exec(comment)) !== null) {
            matches.push(match[1]);
        }

        const uniqueUsernames = [...new Set(matches)];
        const mentionedUsers = [];

        // For each @username, check if user exists and create notification
        for (const username of uniqueUsernames) {
            const userResult = await client.query(
                'SELECT userId AS "userId", username FROM Users WHERE username = $1',
                [username]
            );

            if (userResult.rows.length === 0) continue;

            const mentionedUser = userResult.rows[0];

            // Don't notify yourself
            if (mentionedUser.userId === userId) continue;

            // Get commenter's username for the notification message
            const commenter = await client.query(
                'SELECT username FROM Users WHERE userId = $1',
                [userId]
            );

            const message = `${commenter.rows[0].username} mentioned you in task "${taskName}"`;

            await client.query(
                `INSERT INTO Notifications (userId, taskId, type, message) VALUES ($1, $2, $3, $4)`,
                [mentionedUser.userId, taskId, 'mention', message]
            );

            mentionedUsers.push(mentionedUser);
        }

        await client.query('COMMIT');

        res.status(201).json({
            ...result.rows[0],
            mentionedUsers
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Add Task Comment Error:', err.message);
        res.status(500).json({ error: 'Server Error' });
    } finally {
        client.release();
    }
};

// Update a task comment
exports.updateTaskComment = async (req, res) => {
    const { commentId } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId;

    try {
        // เช็คก่อนว่ามีสิทธิ์แก้ไหม (ต้องเป็นเจ้าของคอมเมนต์)
        const checkOwnership = await pool.query(
            'SELECT userId FROM TaskComments WHERE taskCommentId = $1',
            [commentId]
        );

        if (checkOwnership.rows.length === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (checkOwnership.rows[0].userid !== userId) {
            return res.status(403).json({ message: 'Unauthorized to edit this comment' });
        }

        const result = await pool.query(
            `UPDATE TaskComments 
             SET comment = $1 
             WHERE taskCommentId = $2 
             RETURNING taskCommentId as "taskCommentId", comment, createdDate as "createdDate"`,
            [comment, commentId]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update Task Comment Error:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
};

// Delete a task comment
exports.deleteTaskComment = async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    try {
        const checkOwnership = await pool.query(
            'SELECT userId FROM TaskComments WHERE taskCommentId = $1',
            [commentId]
        );

        if (checkOwnership.rows.length === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // ให้ลบได้เฉพาะเจ้าของคอมเมนต์ หรือคนที่เป็น PM
        if (checkOwnership.rows[0].userid !== userId && userRole !== 'project_manager') {
            return res.status(403).json({ message: 'Unauthorized to delete this comment' });
        }

        await pool.query('DELETE FROM TaskComments WHERE taskCommentId = $1', [commentId]);
        res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
        console.error('Delete Task Comment Error:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
};