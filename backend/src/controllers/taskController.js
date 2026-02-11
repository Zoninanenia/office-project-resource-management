const pool = require('../config/db');

// Get all tasks (Global view) - PM sees all, others see assigned/created
exports.getAllTasks = async (req, res) => {
    const userId = req.user.userId;
    const userRole = req.user.role;

    try {
        let query = `
      SELECT t.taskId as "taskId", t.taskName as "taskName", t.description, t.status, t.createdDate as "createdDate", t.dueDate as "dueDate", t.projectId as "projectId",
             p.title as "projectName",
             u.username as "creatorName",
             COALESCE(
                 json_agg(
                     json_build_object('workerId', w.userId, 'workerName', w.username)
                 ) FILTER (WHERE w.userId IS NOT NULL), 
                 '[]'
             ) as "assignees"
      FROM Tasks t
      LEFT JOIN Projects p ON t.projectId = p.projectId
      LEFT JOIN Users u ON t.creatorId = u.userId
      LEFT JOIN TasksToWorkers ttw ON t.taskId = ttw.taskId
      LEFT JOIN Users w ON ttw.workerId = w.userId
    `;

        const params = [];

        // If not PM, filter by assignment or creation
        if (userRole !== 'project_manager') {
            query += ` WHERE t.creatorId = $1 OR EXISTS (SELECT 1 FROM TasksToWorkers ttw2 WHERE ttw2.taskId = t.taskId AND ttw2.workerId = $1)`;
            params.push(userId);
        }

        query += ` GROUP BY t.taskId, p.title, u.username ORDER BY t.dueDate ASC`;

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
             u.username as "creatorName",
             COALESCE(
                 json_agg(
                     json_build_object('workerId', w.userId, 'workerName', w.username)
                 ) FILTER (WHERE w.userId IS NOT NULL), 
                 '[]'
             ) as "assignees"
      FROM Tasks t
      LEFT JOIN Users u ON t.creatorId = u.userId
      LEFT JOIN TasksToWorkers ttw ON t.taskId = ttw.taskId
      LEFT JOIN Users w ON ttw.workerId = w.userId
      WHERE t.projectId = $1
      GROUP BY t.taskId, u.username
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
    const { taskName, description, status, dueDate, assignedTo } = req.body;
    const creatorId = req.user.userId; // From auth middleware

    // Handle empty date string
    const validDueDate = dueDate === '' ? null : dueDate;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Create Task
        const newTask = await client.query(
            'INSERT INTO Tasks (taskName, description, status, dueDate, creatorId, projectId) VALUES ($1, $2, $3, $4, $5, $6) RETURNING taskId as "taskId", taskName as "taskName", description, status, dueDate as "dueDate", projectId as "projectId"',
            [taskName, description, status || 'todo', validDueDate, creatorId, projectId]
        );

        const taskId = newTask.rows[0].taskId;

        // Assign to workers if provided (Array of IDs)
        if (assignedTo && Array.isArray(assignedTo) && assignedTo.length > 0) {
            for (const workerId of assignedTo) {
                await client.query(
                    'INSERT INTO TasksToWorkers (taskId, workerId) VALUES ($1, $2)',
                    [taskId, workerId]
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
