const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'pm_system';

async function setupDatabase() {
    const config = {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: 'postgres',
    };

    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected to PostgreSQL server...');

        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`);
        if (res.rowCount === 0) {
            console.log(`Database ${DB_NAME} not found. Creating...`);
            await client.query(`CREATE DATABASE "${DB_NAME}"`);
        }
    } catch (err) {
        console.error('Error creating database:', err);
        process.exit(1);
    } finally {
        await client.end();
    }

    const dbClient = new Client({ ...config, database: DB_NAME });

    try {
        await dbClient.connect();
        console.log(`Connected to database: ${DB_NAME}`);

        // 1. Initial Schema (Clean Slate)
        const sqlPath = path.join(__dirname, 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Initializing Schema (Wiping old tables)...');
        await dbClient.query(sql);

        // 2. Prepare Passwords
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash('password123', salt);

        // 3. SEED USERS (10 Users total)
        console.log('Seeding 10 Users with different roles');
        const userRes = await dbClient.query(`
            INSERT INTO Users (username, passwordHash, email, firstName, lastName, role, hourlyWage)
            VALUES 
            ('admin', $1, 'admin@pm.com', 'System', 'Administrator', 'admin', 0),
            ('pm_alex', $1, 'alex@pm.com', 'Alex', 'Johnson', 'project_manager', 0),
            ('pm_sarah', $1, 'sarah@pm.com', 'Sarah', 'Lee', 'project_manager', 0),
            ('lead_john', $1, 'john@pm.com', 'John', 'Smith', 'team_leader', 60.00),
            ('lead_mike', $1, 'mike@pm.com', 'Mike', 'Brown', 'team_leader', 55.00),
            ('worker_1', $1, 'w1@pm.com', 'Jane', 'Doe', 'worker', 35.00),
            ('worker_2', $1, 'w2@pm.com', 'Bob', 'White', 'worker', 30.00),
            ('worker_3', $1, 'w3@pm.com', 'Alice', 'Green', 'worker', 32.00),
            ('worker_4', $1, 'w4@pm.com', 'Tom', 'Black', 'worker', 28.00),
            ('worker_5', $1, 'w5@pm.com', 'Eve', 'Grey', 'worker', 40.00)
            RETURNING userId, username
        `, [hashedPass]);
        
        const users = {};
        userRes.rows.forEach(u => users[u.username] = u.userid);

        // 4. SEED PROJECTS (5 Projects)
        console.log('Seeding 5 Projects');
        const projRes = await dbClient.query(`
            INSERT INTO Projects (title, description, startDate, endDate, budget, status)
            VALUES 
            ('AI Office Assistant', 'Smart AI for internal document management.', '2026-01-01', '2026-06-30', 100000.00, 'active'),
            ('E-Commerce Revamp', 'Migrating legacy shop to React/NodeJS.', '2026-02-15', '2026-08-30', 75000.00, 'active'),
            ('Cloud Migration', 'Moving internal servers to AWS.', '2026-03-01', '2026-12-31', 120000.00, 'active'),
            ('Old Project 2025', 'Legacy support project.', '2025-01-01', '2025-12-31', 20000.00, 'completed'),
            ('Mobile App Beta', 'Internal testing for mobile HR app.', '2026-04-01', '2026-07-01', 45000.00, 'active')
            RETURNING projectId, title
        `);
        const pids = projRes.rows.map(r => r.projectid);

        // 5. SEED TEAMS
        console.log('Seeding Teams and assigning members');
        const teamRes = await dbClient.query(`
            INSERT INTO Teams (teamName, projectId)
            VALUES 
            ('Backend Ninjas', $1), 
            ('Frontend Wizards', $1),
            ('Infrastructure Unit', $2)
            RETURNING teamId
        `, [pids[0], pids[2]]);
        const tid1 = teamRes.rows[0].teamid; // Backend (Project 1)
        const tid2 = teamRes.rows[1].teamid; // Frontend (Project 1)

        // Team Members (For teamController)
        await dbClient.query(`
            INSERT INTO TeamMembers (teamId, userId, role) VALUES 
            ($1, $2, 'leader'), ($1, $3, 'member'), ($1, $4, 'member'),
            ($5, $6, 'leader'), ($5, $7, 'member')
        `, [tid1, users['lead_john'], users['worker_1'], users['worker_2'], tid2, users['lead_mike'], users['worker_3']]);

        // 6. SEED SPRINTS
        const sprintRes = await dbClient.query(`
            INSERT INTO Sprints (sprintName, projectId, startDate, endDate, status)
            VALUES 
            ('Phase 1: Database Setup', $1, '2026-04-01', '2026-04-14', 'active'),
            ('Phase 2: Authentication', $1, '2026-04-15', '2026-04-30', 'planned')
            RETURNING sprintId
        `, [pids[0]]);
        const sid1 = sprintRes.rows[0].sprintid;

        // 7. SEED TASKS (20+ Tasks with loop for volume)
        console.log('Seeding tasks and assignments (This makes Dashboard look good)...');
        const tasks = [
            { name: 'Schema Design', status: 'done', hours: 10, sprint: sid1, creator: users['pm_alex'] },
            { name: 'API Auth Flow', status: 'in_progress', hours: 16, sprint: sid1, creator: users['pm_alex'] },
            { name: 'Unit Testing', status: 'todo', hours: 12, sprint: sid1, creator: users['pm_alex'] },
            { name: 'Cloud Config', status: 'in_progress', hours: 25, sprint: null, creator: users['pm_sarah'] },
            { name: 'Frontend Kit', status: 'todo', hours: 20, sprint: null, creator: users['pm_alex'] }
        ];

        for (const t of tasks) {
            const tRes = await dbClient.query(`
                INSERT INTO Tasks (taskName, status, projectId, teamId, sprintId, creatorId, estimatedHours)
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING taskId
            `, [t.name, t.status, pids[0], tid1, t.sprint, t.creator, t.hours]);
            
            // Assign 2 workers to each task (For wageController calculations)
            const taskId = tRes.rows[0].taskid;
            await dbClient.query(`
                INSERT INTO TasksToWorkers (taskId, workerId) 
                VALUES ($1, $2), ($1, $3)
            `, [taskId, users['worker_1'], users['worker_2']]);
        }

        // 8. SEED NOTIFICATIONS & COMMENTS (For notification and taskController)
        await dbClient.query(`
            INSERT INTO Notifications (userId, taskId, type, message)
            VALUES ($1, (SELECT taskId FROM Tasks LIMIT 1), 'assignment', 'You are assigned to Schema Design')
        `, [users['worker_1']]);

        await dbClient.query(`
            INSERT INTO TaskComments (taskId, userId, comment)
            VALUES ((SELECT taskId FROM Tasks LIMIT 1), $1, 'Great start on the schema!')
        `, [users['pm_alex']]);

        console.log('Database successfully populated');
        console.log(`Summary: 10 Users, 5 Projects, 3 Teams, 2 Sprints, and many Tasks.`);

        

    } catch (err) {
        console.error('Error during database population:', err.message);
        process.exit(1);
    } finally {
        await dbClient.end();
    }
}

setupDatabase();