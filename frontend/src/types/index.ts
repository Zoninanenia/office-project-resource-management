export type TeamRole = 'leader' | 'member' | 'observer';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type UserRole = 'project_manager' | 'team_leader' | 'worker' | 'user';

export interface User {
    userId: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePic?: string;
    role: UserRole;
    createdAt: string;
}

export interface Project {
    projectId: number;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    budget?: number;
    status: 'planning' | 'active' | 'completed' | 'on_hold';
    createdAt: string;
    ownerId?: number;
    teamName?: string;
}

export interface Team {
    teamId: number;
    teamName: string;
    projectId: number;
    createdAt: string;
}

export interface Task {
    taskId: number;
    taskName: string;
    description: string;
    status: TaskStatus;
    createdDate: string;
    dueDate?: string;
    creatorId: number;
    projectId: number;
    assignees?: {
        workerId: number;
        workerName: string;
    }[];
}

export interface TeamMember {
    teamId: number;
    userId: number;
    role: TeamRole;
    joinedAt: string;
}

export interface TaskWorker {
    taskId: number;
    workerId: number;
    assignedAt: string;
}
