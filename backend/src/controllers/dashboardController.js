const pool = require('../config/db');

exports.getDashboardStats = async (req, res) => {
    const userId = req.user.userId;
    const userRole = req.user.role;

    try {
        const activeProjectsPromise = pool.query("SELECT COUNT(*) FROM Projects WHERE status = 'active'");
        const teamMembersPromise = pool.query("SELECT COUNT(*) FROM Users");

        let tasksAssignedPromise;
        let completedTasksPromise;

        if (userRole === 'project_manager') {
            // PM sees ALL tasks pending/done
            tasksAssignedPromise = pool.query("SELECT COUNT(*) FROM Tasks WHERE status != 'done'");
            completedTasksPromise = pool.query("SELECT COUNT(*) FROM Tasks WHERE status = 'done'");
        } else {
            // Worker sees only assigned tasks
            tasksAssignedPromise = pool.query(`
                SELECT COUNT(*) FROM TasksToWorkers ttw 
                JOIN Tasks t ON ttw.taskId = t.taskId 
                WHERE ttw.workerId = $1 AND t.status != 'done'
            `, [userId]);
            completedTasksPromise = pool.query(`
                SELECT COUNT(*) FROM TasksToWorkers ttw 
                JOIN Tasks t ON ttw.taskId = t.taskId 
                WHERE ttw.workerId = $1 AND t.status = 'done'
            `, [userId]);
        }

        const [activeProjects, tasksAssigned, completedTasks, teamMembers] = await Promise.all([
            activeProjectsPromise,
            tasksAssignedPromise,
            completedTasksPromise,
            teamMembersPromise
        ]);

        res.json({
            activeProjects: parseInt(activeProjects.rows[0].count),
            tasksAssigned: parseInt(tasksAssigned.rows[0].count),
            completedTasks: parseInt(completedTasks.rows[0].count),
            teamMembers: parseInt(teamMembers.rows[0].count)
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message, stack: err.stack });
    }
};

exports.getDashboardTasks = async (req, res) => {
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
            LEFT JOIN TasksToWorkers ttw ON t.taskId = ttw.taskId
            LEFT JOIN Users w ON ttw.workerId = w.userId
        `;

        const params = [];

        if (userRole !== 'project_manager') {
            query += ' WHERE t.creatorId = $1 OR EXISTS (SELECT 1 FROM TasksToWorkers ttw2 WHERE ttw2.taskId = t.taskId AND ttw2.workerId = $1)';
            params.push(userId);
        }

        query += ' GROUP BY t.taskId, p.title, u.username ORDER BY t.dueDate ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
};

exports.getDashboardProfile = async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            'SELECT userId as "userId", username, email, firstName as "firstName", lastName as "lastName", role, profilePic as "profilePic", createdAt as "createdAt" FROM Users WHERE userId = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
};
