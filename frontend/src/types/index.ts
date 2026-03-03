export type TeamRole = 'leader' | 'member' | 'observer';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type UserRole = 'admin' | 'project_manager' | 'team_leader' | 'worker' | 'user';

export interface User {
    userId: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePic?: string;
    role: UserRole;
    hourlyWage?: number;
    createdAt: string;
}

export interface Project {
    projectId: number;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    budget?: number;
    status: 'active' | 'completed' | 'on_hold';
    createdAt: string;
    ownerId?: number;
    teamName?: string;
}

export interface Team {
    teamId: number;
    teamName: string;
    projectId: number;
    createdAt: string;
    members: {
        userId: number;
        name: string;
        role: TeamRole;
    }[];
    leader?: {
        userId: number;
        name: string;
    };
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
    teamId?: number;
    teamName?: string;
    sprintId?: number;
    sprintName?: string;
    estimatedHours?: number;
    dependencies?: number[];
    assignees?: {
        workerId: number;
        workerName: string;
    }[];
}

export interface Sprint {
    sprintId: number;
    sprintName: string;
    projectId: number;
    startDate: string;
    endDate: string;
    status: 'planned' | 'active' | 'completed';
    createdAt: string;
    taskCount?: number;
    completedTaskCount?: number;
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

export interface AppNotification {
    notificationId: number;
    taskId: number;
    type: 'assignment' | 'deadline';
    message: string;
    isRead: boolean;
    createdAt: string;
}
