const pool = require('../config/db');

// Get all sprints for a project
exports.getSprintsByProject = async (req, res) => {
    const { projectId } = req.params;

    try {
        const result = await pool.query(`
            SELECT 
                s.sprintId as "sprintId",
                s.sprintName as "sprintName",
                s.projectId as "projectId",
                s.startDate as "startDate",
                s.endDate as "endDate",
                s.status,
                s.createdAt as "createdAt",
                COUNT(t.taskId) as "taskCount",
                COUNT(CASE WHEN t.status = 'done' THEN 1 END) as "completedTaskCount"
            FROM Sprints s
            LEFT JOIN Tasks t ON s.sprintId = t.sprintId
            WHERE s.projectId = $1
            GROUP BY s.sprintId
            ORDER BY s.startDate ASC
        `, [projectId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Get Sprints Error:', err.message);
        res.status(500).send('Server Error');
    }
};

// Create a new sprint (PM Only)
exports.createSprint = async (req, res) => {
    const { projectId } = req.params;
    const { sprintName, startDate, endDate } = req.body;

    if (!projectId || isNaN(Number(projectId))) {
        return res.status(400).json({ message: 'Valid project ID is required' });
    }

    if (!sprintName || !startDate || !endDate) {
        return res.status(400).json({ message: 'Sprint name, start date, and end date are required' });
    }

    if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({ message: 'End date must be after start date' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO Sprints (sprintName, projectId, startDate, endDate) 
             VALUES ($1, $2, $3, $4) 
             RETURNING sprintId as "sprintId", sprintName as "sprintName", projectId as "projectId", 
                       startDate as "startDate", endDate as "endDate", status, createdAt as "createdAt"`,
            [sprintName, projectId, startDate, endDate]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Create Sprint Error:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Update a sprint (PM Only)
exports.updateSprint = async (req, res) => {
    const { sprintId } = req.params;
    const { sprintName, startDate, endDate, status } = req.body;

    if (status && !['planned', 'active', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be: planned, active, or completed' });
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({ message: 'End date must be after start date' });
    }

    try {
        const existing = await pool.query('SELECT * FROM Sprints WHERE sprintId = $1', [sprintId]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Sprint not found' });
        }

        const current = existing.rows[0];
        const updatedName = sprintName || current.sprintname;
        const updatedStart = startDate || current.startdate;
        const updatedEnd = endDate || current.enddate;
        const updatedStatus = status || current.status;

        const result = await pool.query(
            `UPDATE Sprints SET sprintName = $1, startDate = $2, endDate = $3, status = $4 
             WHERE sprintId = $5 
             RETURNING sprintId as "sprintId", sprintName as "sprintName", projectId as "projectId",
                       startDate as "startDate", endDate as "endDate", status, createdAt as "createdAt"`,
            [updatedName, updatedStart, updatedEnd, updatedStatus, sprintId]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update Sprint Error:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Delete a sprint (PM Only)
exports.deleteSprint = async (req, res) => {
    const { sprintId } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM Sprints WHERE sprintId = $1 RETURNING *',
            [sprintId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Sprint not found' });
        }

        // Tasks with this sprintId will be SET NULL automatically (ON DELETE SET NULL)
        res.json({ message: 'Sprint deleted successfully' });
    } catch (err) {
        console.error('Delete Sprint Error:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Assign task to sprint (PM Only)
exports.assignTaskToSprint = async (req, res) => {
    const { sprintId, taskId } = req.params;

    try {
        // Verify sprint exists
        const sprintCheck = await pool.query('SELECT * FROM Sprints WHERE sprintId = $1', [sprintId]);
        if (sprintCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Sprint not found' });
        }

        // Verify task exists
        const taskCheck = await pool.query('SELECT * FROM Tasks WHERE taskId = $1', [taskId]);
        if (taskCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Ensure task belongs to the same project as the sprint
        if (taskCheck.rows[0].projectid !== sprintCheck.rows[0].projectid) {
            return res.status(400).json({ message: 'Task and sprint must belong to the same project' });
        }

        const result = await pool.query(
            'UPDATE Tasks SET sprintId = $1 WHERE taskId = $2 RETURNING taskId as "taskId", sprintId as "sprintId"',
            [sprintId, taskId]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Assign Task to Sprint Error:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Remove task from sprint (back to backlog)
exports.removeTaskFromSprint = async (req, res) => {
    const { taskId } = req.params;

    try {
        const result = await pool.query(
            'UPDATE Tasks SET sprintId = NULL WHERE taskId = $1 RETURNING taskId as "taskId"',
            [taskId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ message: 'Task removed from sprint', taskId: result.rows[0].taskId });
    } catch (err) {
        console.error('Remove Task from Sprint Error:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Carry over all unfinished tasks from one sprint to another (PM Only)
exports.carryOverTasks = async (req, res) => {
    const { fromSprintId } = req.params;
    const { toSprintId } = req.body;

    if (!toSprintId) {
        return res.status(400).json({ message: 'Target sprint ID is required' });
    }

    try {
        // Verify both sprints exist and belong to the same project
        const fromSprint = await pool.query('SELECT * FROM Sprints WHERE sprintId = $1', [fromSprintId]);
        if (fromSprint.rows.length === 0) {
            return res.status(404).json({ message: 'Source sprint not found' });
        }

        const toSprint = await pool.query('SELECT * FROM Sprints WHERE sprintId = $1', [toSprintId]);
        if (toSprint.rows.length === 0) {
            return res.status(404).json({ message: 'Target sprint not found' });
        }

        if (fromSprint.rows[0].projectid !== toSprint.rows[0].projectid) {
            return res.status(400).json({ message: 'Both sprints must belong to the same project' });
        }

        // Move all unfinished tasks (status != 'done') from source to target sprint
        const result = await pool.query(
            `UPDATE Tasks SET sprintId = $1 
             WHERE sprintId = $2 AND status != 'done' 
             RETURNING taskId as "taskId", taskName as "taskName", status`,
            [toSprintId, fromSprintId]
        );

        res.json({
            message: `${result.rows.length} unfinished task(s) moved to ${toSprint.rows[0].sprintname}`,
            movedTasks: result.rows,
            count: result.rows.length
        });
    } catch (err) {
        console.error('Carry Over Tasks Error:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Move a single task to a different sprint (PM Only)
exports.moveTaskToSprint = async (req, res) => {
    const { taskId } = req.params;
    const { toSprintId } = req.body;

    if (!toSprintId) {
        return res.status(400).json({ message: 'Target sprint ID is required' });
    }

    try {
        const task = await pool.query('SELECT * FROM Tasks WHERE taskId = $1', [taskId]);
        if (task.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const toSprint = await pool.query('SELECT * FROM Sprints WHERE sprintId = $1', [toSprintId]);
        if (toSprint.rows.length === 0) {
            return res.status(404).json({ message: 'Target sprint not found' });
        }

        if (task.rows[0].projectid !== toSprint.rows[0].projectid) {
            return res.status(400).json({ message: 'Task and target sprint must belong to the same project' });
        }

        const result = await pool.query(
            'UPDATE Tasks SET sprintId = $1 WHERE taskId = $2 RETURNING taskId as "taskId", sprintId as "sprintId"',
            [toSprintId, taskId]
        );

        res.json({ message: 'Task moved successfully', ...result.rows[0] });
    } catch (err) {
        console.error('Move Task Error:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};
