const db = require('../config/db');

exports.getAllTeams = async (req, res) => {
    try {
        const query = `
            SELECT 
                t.teamId as "teamId", t.teamName as "teamName", t.projectId as "projectId", p.title as "projectTitle",
                u.userId as "userId", u.firstName as "firstName", u.lastName as "lastName", u.username, u.profilePic as "profilePic",
                tm.role, tm.joinedAt as "joinedAt"
            FROM Teams t
            JOIN Projects p ON t.projectId = p.projectId
            LEFT JOIN TeamMembers tm ON t.teamId = tm.teamId
            LEFT JOIN Users u ON tm.userId = u.userId
            ORDER BY t.teamId, tm.role = 'leader' DESC
        `;

        const result = await db.query(query);

        // Group by team
        const teamsMap = new Map();

        result.rows.forEach(row => {
            if (!teamsMap.has(row.teamId)) {
                teamsMap.set(row.teamId, {
                    teamId: row.teamId,
                    teamName: row.teamName,
                    projectId: row.projectId,
                    projectTitle: row.projectTitle,
                    leader: null,
                    members: []
                });
            }

            const team = teamsMap.get(row.teamId);

            if (row.userId) {
                const member = {
                    userId: row.userId,
                    name: `${row.firstName} ${row.lastName}`,
                    username: row.username,
                    role: row.role,
                    profilePic: row.profilePic
                };

                if (row.role === 'leader') { // Postgres Enum value
                    team.leader = member; // Also add to members list? Maybe separate or include
                    // Let's include in members list too for table view
                } else if (row.role === 'team_leader') { // In case enum is different
                    team.leader = member;
                }

                team.members.push(member);
            }
        });

        // Fetch Task Stats for each member in the context of the project
        // This could be heavy, maybe optimize later?
        // For now, let's just do a separate query to get task counts per user per project
        // Or actually, just get all task assignments

        const teams = Array.from(teamsMap.values());

        // Enhance with task stats
        for (const team of teams) {
            const statsQuery = `
                SELECT 
                    ttw.workerId as "workerId",
                    COUNT(t.taskId) as "totalTasks",
                    COUNT(CASE WHEN t.status = 'done' THEN 1 END) as "completedTasks"
                FROM Tasks t
                JOIN TasksToWorkers ttw ON t.taskId = ttw.taskId
                WHERE t.projectId = $1
                GROUP BY ttw.workerId
             `;
            const statsRes = await db.query(statsQuery, [team.projectId]);
            const statsMap = new Map();
            statsRes.rows.forEach(r => {
                statsMap.set(r.workerId, {
                    total: parseInt(r.totalTasks),
                    completed: parseInt(r.completedTasks)
                });
            });

            team.members.forEach(m => {
                const stat = statsMap.get(m.userId) || { total: 0, completed: 0 };
                m.totalTasks = stat.total;
                m.completedTasks = stat.completed;
                m.progress = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
            });
        }

        res.json(teams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createTeam = async (req, res) => {
    const { teamName, projectId } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO Teams (teamName, projectId) VALUES ($1, $2) RETURNING teamId as "teamId", teamName as "teamName", projectId as "projectId"',
            [teamName, projectId]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addTeamMember = async (req, res) => {
    const { teamId } = req.params;
    const { userId, role } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO TeamMembers (teamId, userId, role) VALUES ($1, $2, $3) RETURNING teamId as "teamId", userId as "userId", role, joinedAt as "joinedAt"',
            [teamId, userId, role]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
