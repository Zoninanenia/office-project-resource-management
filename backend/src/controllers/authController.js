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


//user@example.com
//Section-forgotPassword
const tempOTPStorage = {};
exports.generateOtp = async (req, res) => {
    const { email } = req.body;
    delete tempOTPStorage[email]; 
    try {
        const query = 'SELECT userid FROM Users WHERE email = $1 LIMIT 1';
        const result = await pool.query(query, [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found with this email address." });
        }

        const user = result.rows[0];
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        tempOTPStorage[email] = {
            otp: otp,
            userId: user.userid,
            email: user.email,
            expire: Date.now() + (5 * 60 * 1000) 
        };

        console.log(`------------------------------------------`);
        console.log(`[DEBUG] OTP for ${email} is: ${otp}`);
        console.log(`------------------------------------------`);
        return res.status(200).json({ success: true, });
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};


//ConfirmOTP
exports.verifyOtp = (req, res) => {
    const { email, otp } = req.body;
    const record = tempOTPStorage[email];
    if (!record) {
        return res.status(400).json({ 
            success: false, 
            message: "No OTP request found for this email." 
        });
    }

    if (Date.now() > record.expire) {
        delete tempOTPStorage[email];
        return res.status(400).json({ 
            success: false, 
            message: "OTP has expired. Please request a new code." 
        });
    }

    if (record.otp === otp) {
        const userId = record.userId;
        delete tempOTPStorage[email]; 

        const resetToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '10m' });
        return res.status(200).json({ 
            success: true, userId: userId, email: email, resetToken, 
        });
    } else {
        return res.status(400).json({ 
            success: false, 
            message: "Invalid OTP code." 
        });
    }
};