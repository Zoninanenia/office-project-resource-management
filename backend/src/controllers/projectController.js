const pool = require('../config/db');

// Get all projects
exports.getAllProjects = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.projectId as "projectId", 
                p.title, 
                p.description, 
                p.startDate as "startDate", 
                p.endDate as "endDate", 
                p.budget, 
                p.status,
                p.createdAt as "createdAt",
                STRING_AGG(t.teamName, ', ') as "teamName"
            FROM Projects p
            LEFT JOIN Teams t ON p.projectId = t.projectId
            GROUP BY p.projectId
            ORDER BY p.createdAt DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create a new project (PM Only)
exports.createProject = async (req, res) => {
    const { title, description, startDate, endDate, budget } = req.body;

    try {
        const newProject = await pool.query(
            'INSERT INTO Projects (title, description, startDate, endDate, budget) VALUES ($1, $2, $3, $4, $5) RETURNING projectId as "projectId", title, description, startDate as "startDate", endDate as "endDate", budget, status, createdAt as "createdAt"',
            [title, description, startDate, endDate, budget]
        );

        res.status(201).json(newProject.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get project by ID
exports.getProjectById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT projectId as "projectId", title, description, startDate as "startDate", endDate as "endDate", budget, status, createdAt as "createdAt" FROM Projects WHERE projectId = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update project status (PM Only)
exports.updateProjectStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        // Find existing project
        const projectCheck = await pool.query('SELECT * FROM Projects WHERE projectId = $1', [id]);
        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // If trying to mark as completed, ensure all tasks are actually done
        if (status === 'completed') {
            const tasksQuery = await pool.query('SELECT status FROM Tasks WHERE projectId = $1', [id]);
            const tasks = tasksQuery.rows;

            if (tasks.length === 0) {
                return res.status(400).json({ message: 'Cannot complete a project with zero tasks.' });
            }

            const allDone = tasks.every(t => t.status === 'done');
            if (!allDone) {
                return res.status(400).json({ message: 'Cannot mark project as completed. Not all tasks are done.' });
            }
        }

        const result = await pool.query(
            'UPDATE Projects SET status = $1 WHERE projectId = $2 RETURNING projectId as "projectId", title, status',
            [status, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
