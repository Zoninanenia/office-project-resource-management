'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { StatCard } from '@/components/StatCard';

interface DashboardStats {
    activeProjects: number;
    tasksAssigned: number;
    completedTasks: number;
    teamMembers: number;
}

interface ActivityData {
    type: string;
    title: string;
    description: string;
    timestamp: string;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState<string>('Team Member');
    const [greeting, setGreeting] = useState('');
    const [userRole, setUserRole] = useState<string>('user');
    const [activities, setActivities] = useState<ActivityData[]>([]);

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

        const fetchActivity = async () => {
            try {
                const data = await api.get<ActivityData[]>('/dashboard/activity');
                setActivities(data);
            } catch (err) {
                console.error('Failed to fetch recent activity', err);
            }
        };

        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserName(user.firstName || user.username);
            setUserRole(user.role || 'user');
        }

        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');

        fetchStats();
        fetchActivity();
    }, []);

    const timeAgo = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMs / 3600000);
        const diffDay = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin} minutes ago`;
        if (diffHour < 24) return `${diffHour} hours ago`;
        if (diffDay === 1) return 'Yesterday';
        if (diffDay < 7) return `${diffDay} days ago`;
        return date.toLocaleDateString();
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'project_created':
                return <div className="w-2 h-2 rounded-full bg-blue-500"></div>;
            case 'task_completed':
                return <div className="w-2 h-2 rounded-full bg-brand-sage"></div>;
            case 'task_created':
                return <div className="w-2 h-2 rounded-full bg-brand-cyan"></div>;
            case 'member_joined':
                return <div className="w-2 h-2 rounded-full bg-brand-peach"></div>;
            default:
                return <div className="w-2 h-2 rounded-full bg-gray-400"></div>;
        }
    };

    const getActivityTitle = (type: string) => {
        switch (type) {
            case 'project_created': return 'New Project Created';
            case 'task_completed': return 'Task Completed';
            case 'task_created': return 'New Task Created';
            case 'member_joined': return 'New Member Joined';
            default: return 'Activity';
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[500px]">
            <div className="w-16 h-16 border-4 border-brand-cyan border-t-brand-teal rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="bg-linear-to-r from-brand-teal to-brand-cyan dark:from-cyan-900 dark:to-teal-900 rounded-3xl p-10 text-white shadow-2xl shadow-cyan-500/20 dark:shadow-none overflow-hidden relative">
                {/* Decorative Circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-yellow/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl"></div>

                <div className="relative z-10">
                    <h1 className="text-4xl font-black mb-2 tracking-tight">{greeting}, {userName}! 👋</h1>
                    <p className="text-cyan-50 text-lg mb-8 max-w-xl font-medium">
                        Ready for today? You have <span className="font-bold text-white underline decoration-brand-yellow decoration-4 underline-offset-4">{stats?.tasksAssigned || 0} active tasks</span> on your list.
                    </p>

                    <div className="flex gap-4">
                        <Link href="/dashboard/projects" className="px-6 py-3 bg-white text-brand-teal font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                            <FolderIcon className="w-5 h-5" />
                            Start New Project
                        </Link>
                    </div>
                </div>
            </div>

            {/* 3D Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Projects"
                    value={stats?.activeProjects || 0}
                    icon={<FolderIcon className="w-8 h-8 text-white" />}
                    color="from-brand-cyan to-blue-500"
                />
                <StatCard
                    title="Pending Tasks"
                    value={stats?.tasksAssigned || 0}
                    icon={<ListIcon className="w-8 h-8 text-white" />}
                    color="from-brand-peach to-orange-500"
                />
                <StatCard
                    title="Tasks Completed"
                    value={stats?.completedTasks || 0}
                    icon={<CheckIcon className="w-8 h-8 text-white" />}
                    color="from-brand-sage to-emerald-600"
                />
                <StatCard
                    title="Team Members"
                    value={stats?.teamMembers || 0}
                    icon={<UsersIcon className="w-8 h-8 text-white" />}
                    color="from-brand-yellow to-yellow-500"
                />
            </div>

            {/* Recent Activity */}
            <div className={`grid ${userRole !== 'admin' ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
                {/* Activity Log */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-8 bg-brand-cyan rounded-full"></span>
                            Recent Activity
                        </h2>
                        <Link href="/dashboard/activity" className="text-sm font-bold text-gray-400 hover:text-brand-cyan transition-colors">View All</Link>
                    </div>

                    <div className="space-y-6">
                        {activities.length > 0 ? (
                            activities.map((activity, index) => (
                                <ActivityItem
                                    key={index}
                                    icon={getActivityIcon(activity.type)}
                                    title={getActivityTitle(activity.type)}
                                    description={activity.description}
                                    time={timeAgo(activity.timestamp)}
                                />
                            ))
                        ) : (
                            <div className="py-10 text-center text-gray-400 dark:text-gray-500">
                                <p className="text-sm font-medium">No recent activity yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Shortcuts - ไม่แสดงสำหรับ admin */}
                {userRole !== 'admin' && (
                    <div className="bg-linear-to-b from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between">
                        <div>
                            <h2 className="text-xl font-bold mb-1">Quick Access</h2>
                            <p className="text-gray-400 text-sm mb-6">Jump straight into action.</p>

                            <div className="space-y-3">
                                {/* My Tasks - ทุก role เห็น */}
                                <Link href="/dashboard/tasks" className="w-full text-left px-4 py-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-colors flex items-center gap-3 group block">
                                    <div className="p-2 bg-brand-cyan/20 text-brand-cyan rounded-lg group-hover:bg-brand-cyan group-hover:text-white transition-all">
                                        <ListIcon className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold">My Tasks</span>
                                </Link>

                                {/* Team Management - PM และ Team Leader เห็น */}
                                {(userRole === 'project_manager' || userRole === 'team_leader') && (
                                    <Link href="/dashboard/teams" className="w-full text-left px-4 py-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-colors flex items-center gap-3 group block">
                                        <div className="p-2 bg-brand-peach/20 text-brand-peach rounded-lg group-hover:bg-brand-peach group-hover:text-white transition-all">
                                            <UsersIcon className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold">Team Management</span>
                                    </Link>
                                )}

                                {/* Issues - Team Leader และ Worker เห็น */}
                                {(userRole === 'team_leader' || userRole === 'worker') && (
                                    <Link href="/dashboard/issues" className="w-full text-left px-4 py-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-colors flex items-center gap-3 group block">
                                        <div className="p-2 bg-brand-sage/20 text-brand-sage rounded-lg group-hover:bg-brand-sage group-hover:text-white transition-all">
                                            <BugIcon className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold">Issues</span>
                                    </Link>
                                )}

                                {/* Projects - PM เห็น */}
                                {userRole === 'project_manager' && (
                                    <Link href="/dashboard/projects" className="w-full text-left px-4 py-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-colors flex items-center gap-3 group block">
                                        <div className="p-2 bg-brand-yellow/20 text-brand-yellow rounded-lg group-hover:bg-brand-yellow group-hover:text-white transition-all">
                                            <FolderIcon className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold">Projects</span>
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 border-white/20 text-sm ${userRole === 'project_manager' ? 'bg-linear-to-br from-brand-yellow to-orange-500 text-black' :
                                    userRole === 'team_leader' ? 'bg-linear-to-br from-brand-cyan to-blue-500 text-white' :
                                        userRole === 'worker' ? 'bg-linear-to-br from-brand-sage to-emerald-500 text-white' :
                                            'bg-linear-to-br from-gray-400 to-gray-500 text-white'
                                    }`}>
                                    {userRole === 'project_manager' ? 'PM' :
                                        userRole === 'team_leader' ? 'TL' :
                                            userRole === 'worker' ? 'WK' :
                                                'U'}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">
                                        {userRole?.replace('_', ' ') || 'User'}
                                    </p>
                                    <div className="w-32 h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                                        <div className={`h-full rounded-full ${userRole === 'project_manager' ? 'w-full bg-brand-yellow' :
                                            userRole === 'team_leader' ? 'w-3/4 bg-brand-cyan' :
                                                userRole === 'worker' ? 'w-1/2 bg-brand-sage' :
                                                    'w-1/4 bg-gray-400'
                                            }`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


function ActivityItem({ icon, title, description, time }: { icon: any, title: string, description: string, time: string }) {
    return (
        <div className="flex gap-4 items-start p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
            <div className="mt-1.5 p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-gray-800 dark:text-gray-200">{title}</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{description}</p>
                <span className="text-xs text-gray-400 font-semibold mt-1 block">{time}</span>
            </div>
        </div>
    )
}

// Icons
function FolderIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
    )
}

function ListIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
    )
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
    )
}

function UsersIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    )
}

function BugIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    )
}
