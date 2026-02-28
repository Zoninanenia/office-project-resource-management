const pool = require('../config/db');

// Get all workers with their hourly wages
exports.getWorkersWithWages = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT userId AS "userId", username, email, 
                    firstName AS "firstName", lastName AS "lastName", 
                    profilePic AS "profilePic", role, 
                    COALESCE(hourlyWage, 0) AS "hourlyWage"
             FROM Users
             WHERE role IN ('worker', 'team_leader')
             ORDER BY userId ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('getWorkersWithWages Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// Update hourly wage for a specific worker
exports.updateWorkerWage = async (req, res) => {
    const { userId } = req.params;
    const { hourlyWage } = req.body;

    if (hourlyWage === undefined || hourlyWage === null || isNaN(hourlyWage) || hourlyWage < 0) {
        return res.status(400).json({ message: 'Invalid hourly wage value. Must be a non-negative number.' });
    }

    try {
        const result = await pool.query(
            `UPDATE Users SET hourlyWage = $1 WHERE userId = $2 
             RETURNING userId AS "userId", username, firstName AS "firstName", lastName AS "lastName", hourlyWage AS "hourlyWage"`,
            [hourlyWage, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('updateWorkerWage Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// Get project labour cost breakdown
exports.getProjectLabourCost = async (req, res) => {
    const { projectId } = req.params;

    try {
        // Verify project exists
        const projectCheck = await pool.query(
            'SELECT projectId AS "projectId", title, budget FROM Projects WHERE projectId = $1',
            [projectId]
        );
        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const project = projectCheck.rows[0];

        // Get per-worker breakdown: tasks assigned, total estimated hours, hourly wage, cost
        const breakdownResult = await pool.query(
            `SELECT 
                u.userId AS "userId",
                u.username,
                u.firstName AS "firstName",
                u.lastName AS "lastName",
                COALESCE(u.hourlyWage, 0) AS "hourlyWage",
                COUNT(t.taskId) AS "taskCount",
                COALESCE(SUM(t.estimatedHours), 0) AS "totalEstimatedHours",
                COALESCE(SUM(t.estimatedHours), 0) * COALESCE(u.hourlyWage, 0) AS "workerCost"
             FROM TasksToWorkers ttw
             JOIN Users u ON ttw.workerId = u.userId
             JOIN Tasks t ON ttw.taskId = t.taskId
             WHERE t.projectId = $1
             GROUP BY u.userId, u.username, u.firstName, u.lastName, u.hourlyWage
             ORDER BY "workerCost" DESC`,
            [projectId]
        );

        // Calculate total
        const totalLabourCost = breakdownResult.rows.reduce(
            (sum, row) => sum + parseFloat(row.workerCost || 0), 0
        );

        const totalEstimatedHours = breakdownResult.rows.reduce(
            (sum, row) => sum + parseFloat(row.totalEstimatedHours || 0), 0
        );

        res.json({
            project: {
                projectId: project.projectId,
                title: project.title,
                budget: parseFloat(project.budget || 0),
            },
            workers: breakdownResult.rows.map(row => ({
                ...row,
                taskCount: parseInt(row.taskCount),
                totalEstimatedHours: parseFloat(row.totalEstimatedHours),
                hourlyWage: parseFloat(row.hourlyWage),
                workerCost: parseFloat(row.workerCost),
            })),
            totalLabourCost,
            totalEstimatedHours,
        });
    } catch (err) {
        console.error('getProjectLabourCost Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};
