# Project Management System (PM)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)

## Setup Instructions

### 1. Database Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies (if not already done):
    ```bash
    npm install
    ```
3.  Run the automated setup command:
    ```bash
    npm run db:setup
    ```
    This command will:
    - Create the `pm_system` database (if it doesn't exist).
    - Create all tables and types from the schema.
    - Create a default Project Manager user: `pm` / `password123`.

Note: Ensure your PostgreSQL server is running and the credentials in `.env` are correct before running this command.

### 2. Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables:
    - The `.env` file is already created with default settings.
    - Check if `DB_PASSWORD` in `.env` matches your local PostgreSQL password.
4.  Start the backend server:
    ```bash
    npm run dev
    ```
    The server will run on `http://localhost:5000`.

### 3. Frontend Setup

1.  Open a new terminal and navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Usage

1.  Go to `http://localhost:3000/register` to create a new account.
2.  Go to `http://localhost:3000/login` to sign in.
