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
