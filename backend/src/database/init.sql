-- Drop existing tables to ensure a clean slate (Order matters due to foreign keys)
DROP TABLE IF EXISTS Notifications CASCADE;
DROP TABLE IF EXISTS TaskDependencies CASCADE;
DROP TABLE IF EXISTS TasksToWorkers CASCADE;
DROP TABLE IF EXISTS TaskAttachments CASCADE;
DROP TABLE IF EXISTS TaskComments CASCADE;
DROP TABLE IF EXISTS TeamMembers CASCADE;
DROP TABLE IF EXISTS Tasks CASCADE;
DROP TABLE IF EXISTS Sprints CASCADE;
DROP TABLE IF EXISTS Teams CASCADE;
DROP TABLE IF EXISTS Projects CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

-- Drop Enums if they exist
DROP TYPE IF EXISTS team_role_enum;
DROP TYPE IF EXISTS task_status_enum;
DROP TYPE IF EXISTS user_role_enum;
DROP TYPE IF EXISTS project_status_enum;

-- Create Enums
CREATE TYPE team_role_enum AS ENUM ('leader', 'member', 'observer');
CREATE TYPE task_status_enum AS ENUM ('todo', 'in_progress', 'review', 'done');
CREATE TYPE user_role_enum AS ENUM ('admin', 'project_manager', 'team_leader', 'worker', 'user');
CREATE TYPE project_status_enum AS ENUM ('active', 'completed');
CREATE TYPE notification_type_enum AS ENUM ('assignment', 'deadline', 'mention');

-- Table: Users
CREATE TABLE Users (
    userId SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    firstName VARCHAR(255),
    lastName VARCHAR(255),
    profilePic VARCHAR(255),
    role user_role_enum DEFAULT 'user',
    hourlyWage DECIMAL(10, 2) DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Projects
CREATE TABLE Projects (
    projectId SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    startDate DATE,
    endDate DATE,
    budget DECIMAL(15, 2),
    status project_status_enum DEFAULT 'active',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Teams
CREATE TABLE Teams (
    teamId SERIAL PRIMARY KEY,
    teamName VARCHAR(255) NOT NULL,
    projectId INTEGER REFERENCES Projects(projectId) ON DELETE CASCADE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Sprints
CREATE TABLE Sprints (
    sprintId SERIAL PRIMARY KEY,
    sprintName VARCHAR(255) NOT NULL,
    projectId INTEGER REFERENCES Projects(projectId) ON DELETE CASCADE,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'planned',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Tasks
CREATE TABLE Tasks (
    taskId SERIAL PRIMARY KEY,
    taskName VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status_enum DEFAULT 'todo',
    createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dueDate TIMESTAMP,
    creatorId INTEGER REFERENCES Users(userId) ON DELETE SET NULL,
    projectId INTEGER REFERENCES Projects(projectId) ON DELETE CASCADE,
    teamId INTEGER REFERENCES Teams(teamId) ON DELETE SET NULL,
    sprintId INTEGER REFERENCES Sprints(sprintId) ON DELETE SET NULL,
    estimatedHours DECIMAL(6, 2)
);

-- Table: TeamMembers (Junction Table for Users <-> Teams)
CREATE TABLE TeamMembers (
    teamId INTEGER REFERENCES Teams(teamId) ON DELETE CASCADE,
    userId INTEGER REFERENCES Users(userId) ON DELETE CASCADE,
    role team_role_enum DEFAULT 'member',
    joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (teamId, userId)
);

-- Table: TasksToWorkers (Junction Table for Tasks <-> Users)
CREATE TABLE TasksToWorkers (
    taskId INTEGER REFERENCES Tasks(taskId) ON DELETE CASCADE,
    workerId INTEGER REFERENCES Users(userId) ON DELETE CASCADE,
    assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (taskId, workerId)
);

-- Table: TaskDependencies (Junction Table for Task <-> Task)
CREATE TABLE TaskDependencies (
    taskId INTEGER REFERENCES Tasks(taskId) ON DELETE CASCADE,
    dependsOnTaskId INTEGER REFERENCES Tasks(taskId) ON DELETE CASCADE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (taskId, dependsOnTaskId)
);

-- Table:TaskAttachments
CREATE TABLE TaskAttachments (
    attachmentId  SERIAL PRIMARY KEY,
    taskId        INTEGER REFERENCES Tasks(taskId) ON DELETE CASCADE,
    uploadedBy    INTEGER REFERENCES Users(userId) ON DELETE SET NULL,
    fileName      VARCHAR(255) NOT NULL,       -- original display name
    fileUrl       VARCHAR(1024) NOT NULL,      -- storage path / S3 URL
    fileSize      INTEGER,                     -- bytes
    mimeType      VARCHAR(100),
    uploadedAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: TaskComments
CREATE TABLE TaskComments (
    taskCommentId SERIAL PRIMARY KEY,
    taskId INTEGER REFERENCES Tasks(taskId) ON DELETE CASCADE,
    userId INTEGER REFERENCES Users(userId) ON DELETE SET NULL, -- เพื่อเก็บว่าใครเป็นคนคอมเมนต์
    comment TEXT NOT NULL,
    createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Notifications
CREATE TABLE Notifications (
    notificationId SERIAL PRIMARY KEY,
    userId INTEGER REFERENCES Users(userId) ON DELETE CASCADE,
    taskId INTEGER REFERENCES Tasks(taskId) ON DELETE CASCADE,
    type notification_type_enum NOT NULL, -- เปลี่ยนมาใช้ ENUM แทน VARCHAR
    message TEXT NOT NULL,
    isRead BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);