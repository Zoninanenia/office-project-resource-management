const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Get all users (optional filter by role)
exports.getAllUsers = async (req, res) => {
    const { role } = req.query;
    try {
        let query = 'SELECT userId as "userId", username, email, firstName as "firstName", lastName as "lastName", role, profilePic as "profilePic" FROM Users';
        const params = [];

        if (role) {
            query += ' WHERE role = $1';
            params.push(role);
        }

        query += ' ORDER BY userId ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create a new user (Admin/PM only)
exports.createUser = async (req, res) => {
    const { username, password, email, firstName, lastName, role } = req.body;

    try {
        // Check if user exists
        const userCheck = await pool.query('SELECT * FROM Users WHERE username = $1 OR email = $2', [username, email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await pool.query(
            'INSERT INTO Users (username, passwordHash, email, firstName, lastName, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING userId as "userId", username, email, firstName as "firstName", lastName as "lastName", role',
            [username, passwordHash, email, firstName, lastName, role || 'user']
        );

        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update user role
exports.updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    // Validate generic role if needed, though Postgres Enum handles it strict
    // user_role_enum: 'project_manager', 'team_leader', 'worker', 'user'

    try {
        const result = await pool.query(
            'UPDATE Users SET role = $1 WHERE userId = $2 RETURNING userId as "userId", username, role',
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
