const express = require('express');
const cors = require('cors');
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

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
