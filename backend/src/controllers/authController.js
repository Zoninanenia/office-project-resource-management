const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

const generateToken = (user) => {
    return jwt.sign(
        { userId: user.userid, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

exports.register = async (req, res) => {
    const { username, password, email, firstName, lastName } = req.body;

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
            'INSERT INTO Users (username, passwordHash, email, firstName, lastName) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [username, passwordHash, email, firstName, lastName]
        );

        const token = generateToken(newUser.rows[0]);

        res.status(201).json({ token, user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user exists
        const user = await pool.query('SELECT userId, username, passwordHash, email, firstName, lastName, role FROM Users WHERE username = $1', [username]);
        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.rows[0].passwordhash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user.rows[0]);

        res.json({ token, user: user.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
