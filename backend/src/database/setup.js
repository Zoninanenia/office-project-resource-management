const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'pm_system';

async function setupDatabase() {
    const config = {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: 'postgres', // Connect to default DB first
    };

    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected to PostgreSQL...');

        // Check if database exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`);
        if (res.rowCount === 0) {
            console.log(`Database ${DB_NAME} not found. Creating...`);
            await client.query(`CREATE DATABASE "${DB_NAME}"`);
            console.log(`Database ${DB_NAME} created successfully.`);
        } else {
            console.log(`Database ${DB_NAME} already exists.`);
        }
    } catch (err) {
        console.error('Error creating database:', err);
        process.exit(1);
    } finally {
        await client.end();
    }

    // Connect to the project database
    const dbClient = new Client({
        ...config,
        database: DB_NAME,
    });

    try {
        await dbClient.connect();
        console.log(`Connected to ${DB_NAME}...`);

        // Read init.sql
        const sqlPath = path.join(__dirname, 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing schema initialization...');
        await dbClient.query(sql);
        console.log('Schema initialized successfully.');

        // Seed initial data (PM User)
        console.log('Seeding initial data...');
        // Check if pm exists
        const checkUser = await dbClient.query("SELECT * FROM Users WHERE username = 'pm'");
        if (checkUser.rowCount === 0) {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);

            await dbClient.query(`
                INSERT INTO Users (username, passwordHash, email, firstName, lastName, role)
                VALUES ('pm', $1, 'pm@example.com', 'System', 'Admin', 'project_manager')
            `, [hashedPassword]);
            console.log('Default PM User created: pm / password123');
        } else {
            console.log('PM user already exists.');
        }

    } catch (err) {
        console.error('Error initializing schema:', err);
        process.exit(1);
    } finally {
        await dbClient.end();
    }
}

setupDatabase();
