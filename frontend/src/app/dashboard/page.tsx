'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface DashboardStats {
    activeProjects: number;
    tasksAssigned: number;
    completedTasks: number;
    teamMembers: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState<string>('Team Member');
    const [greeting, setGreeting] = useState('');

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
            setUserName(user.firstName || user.username);
        }

        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');

        fetchStats();
    }, []);

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
                        <button className="px-6 py-3 bg-brand-teal/50 hover:bg-brand-teal hover:shadow-lg hover:shadow-teal-500/30 hover:border-white/60 text-white font-bold rounded-xl border border-white/30 transition-all flex items-center gap-2">
                            View Reports
                        </button>
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
                    trend="+2 this week"
                />
                <StatCard
                    title="Pending Tasks"
                    value={stats?.tasksAssigned || 0}
                    icon={<ListIcon className="w-8 h-8 text-white" />}
                    color="from-brand-peach to-orange-500"
                    trend="5 high priority"
                />
                <StatCard
                    title="Tasks Completed"
                    value={stats?.completedTasks || 0}
                    icon={<CheckIcon className="w-8 h-8 text-white" />}
                    color="from-brand-sage to-emerald-600"
                    trend="+12% completion"
                />
                <StatCard
                    title="Team Members"
                    value={stats?.teamMembers || 0}
                    icon={<UsersIcon className="w-8 h-8 text-white" />}
                    color="from-brand-yellow to-yellow-500"
                    trend="Full strength"
                />
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Activity Log */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-8 bg-brand-cyan rounded-full"></span>
                            Recent Activity
                        </h2>
                        <button className="text-sm font-bold text-gray-400 hover:text-brand-cyan">View All</button>
                    </div>

                    <div className="space-y-6">
                        <ActivityItem
                            icon={<div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                            title="New Project Started"
                            description="Website Redesign Phase 1 has been initiated."
                            time="2 hours ago"
                        />
                        <ActivityItem
                            icon={<div className="w-2 h-2 rounded-full bg-brand-sage"></div>}
                            title="Task Completed"
                            description="Homepage Hero Section implementation finished."
                            time="4 hours ago"
                        />
                        <ActivityItem
                            icon={<div className="w-2 h-2 rounded-full bg-brand-peach"></div>}
                            title="New Member Joined"
                            description="Jane Doe joined the Marketing Team."
                            time="Yesterday"
                        />
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="bg-linear-to-b from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl font-bold mb-1">Quick Access</h2>
                        <p className="text-gray-400 text-sm mb-6">Jump straight into action.</p>

                        <div className="space-y-3">
                            <Link href="/dashboard/tasks" className="w-full text-left px-4 py-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-colors flex items-center gap-3 group block">
                                <div className="p-2 bg-brand-cyan/20 text-brand-cyan rounded-lg group-hover:bg-brand-cyan group-hover:text-white transition-all">
                                    <ListIcon className="w-5 h-5" />
                                </div>
                                <span className="font-bold">My Tasks</span>
                            </Link>
                            <button className="w-full text-left px-4 py-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-colors flex items-center gap-3 group">
                                <div className="p-2 bg-brand-peach/20 text-brand-peach rounded-lg group-hover:bg-brand-peach group-hover:text-white transition-all">
                                    <UsersIcon className="w-5 h-5" />
                                </div>
                                <span className="font-bold">Team Chat</span>
                            </button>
                            <button className="w-full text-left px-4 py-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-colors flex items-center gap-3 group">
                                <div className="p-2 bg-brand-sage/20 text-brand-sage rounded-lg group-hover:bg-brand-sage group-hover:text-white transition-all">
                                    <BugIcon className="w-5 h-5" />
                                </div>
                                <span className="font-bold">Report Bug</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-brand-yellow to-orange-500 flex items-center justify-center font-bold text-black border-2 border-white/20">
                                PM
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Project Manager</p>
                                <div className="w-32 h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                                    <div className="w-3/4 h-full bg-brand-yellow rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color, trend }: { title: string, value: number, icon: any, color: string, trend: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-md border border-gray-100 dark:border-gray-700 hover:-translate-y-2 transition-transform duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-2xl bg-linear-to-br ${color} shadow-lg group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                <span className="text-xs font-bold text-gray-400 bg-gray-50 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">{trend}</span>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 font-bold text-sm uppercase tracking-wider">{title}</h3>
            <p className="text-3xl font-black text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    )
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
