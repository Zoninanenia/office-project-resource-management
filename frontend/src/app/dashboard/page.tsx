'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface DashboardStats {
    activeProjects: number;
    tasksAssigned: number;
    completedTasks: number;
    teamMembers: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.get<DashboardStats>('/dashboard/stats');
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch dashboard stats', err);
            } finally {
                setLoading(false);
            }
        };

        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserRole(user.role);
        }

        fetchStats();
    }, []);

    if (loading) return <div className="p-8">Loading dashboard...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-300">Welcome back, <span className="capitalize font-semibold">{userRole?.replace('_', ' ') || 'User'}</span></p>
                </div>
                <button className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <span className="material-icons text-gray-600 dark:text-gray-300">notifications</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Projects</p>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{stats?.activeProjects || 0}</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tasks Pending</p>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{stats?.tasksAssigned || 0}</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Completed Tasks</p>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{stats?.completedTasks || 0}</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Team Members</p>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{stats?.teamMembers || 0}</h2>
                </div>
            </div>
        </div>
    );
}
