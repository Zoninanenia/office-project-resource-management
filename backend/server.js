const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const pool = require('./src/config/db'); // เพื่อให้ Cron เรียกใช้ DB ได้
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const fs = require('fs');
const path = require('path');

// Auto-create uploads folder if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

// ตั้งเวลาให้รันทุกๆ เที่ยงคืน (00:00) ของทุกวัน
cron.schedule('0 0 * * *', async () => {
    console.log('[Cron Job] Checking for approaching deadlines...');
    try {
        // หา Task ที่ยังไม่เสร็จ และกำลังจะถึง Deadline ในวันพรุ่งนี้
        const query = `
            SELECT t.taskId, t.taskName, ttw.workerId
            FROM Tasks t
            JOIN TasksToWorkers ttw ON t.taskId = ttw.taskId
            WHERE t.status != 'done' 
              AND t.dueDate IS NOT NULL
              AND t.dueDate::date = (CURRENT_DATE + INTERVAL '1 day')::date
        `;
        const { rows } = await pool.query(query);

        // วนลูปส่งการแจ้งเตือน
        for (const row of rows) {
            const message = `Reminder: Task "${row.taskName}" is due tomorrow!`;
            await pool.query(
                `INSERT INTO Notifications (userId, taskId, type, message) VALUES ($1, $2, $3, $4)`,
                [row.workerId, row.taskId, 'deadline', message]
            );
        }
        if (rows.length > 0) console.log(`[Cron Job] Created ${rows.length} deadline notifications.`);
    } catch (error) {
        console.error('[Cron Job] Error checking deadlines:', error.message);
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
    res.send('Project Management System API is running');
});

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const userRoutes = require('./src/routes/userRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const sprintRoutes = require('./src/routes/sprintRoutes');
const wageRoutes = require('./src/routes/wageRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/wages', wageRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/notifications', notificationRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
