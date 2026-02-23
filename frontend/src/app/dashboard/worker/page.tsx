'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Task, TaskStatus } from '@/types';

interface DashboardStats {
    activeProjects: number;
    tasksAssigned: number;
    completedTasks: number;
    teamMembers: number;
}

interface ExtendedTask extends Task {
    projectName?: string;
}

type StatusFilter = 'all' | TaskStatus;

const ENABLE_WORKER_MOCK = true;

const MOCK_TASKS: ExtendedTask[] = [
    {
        taskId: 101,
        taskName: 'Finalize landing page responsiveness',
        description: 'Fix mobile spacing and tablet breakpoints.',
        status: 'in_progress',
        createdDate: '2026-02-20',
        dueDate: '2026-02-24',
        creatorId: 2,
        projectId: 11,
        projectName: 'Website Revamp',
        dependencies: [],
        assignees: [{ workerId: 1, workerName: 'worker1' }],
    },
    {
        taskId: 102,
        taskName: 'Prepare API integration notes',
        description: 'Document endpoints and payload examples for FE handoff.',
        status: 'todo',
        createdDate: '2026-02-19',
        dueDate: '2026-02-25',
        creatorId: 2,
        projectId: 12,
        projectName: 'CRM Portal',
        dependencies: [],
        assignees: [{ workerId: 1, workerName: 'worker1' }],
    },
    {
        taskId: 103,
        taskName: 'Fix task filtering bug',
        description: 'Resolve stale state when changing quick filters.',
        status: 'review',
        createdDate: '2026-02-18',
        dueDate: '2026-02-23',
        creatorId: 3,
        projectId: 12,
        projectName: 'CRM Portal',
        dependencies: [],
        assignees: [{ workerId: 1, workerName: 'worker1' }],
    },
    {
        taskId: 104,
        taskName: 'Refactor card components',
        description: 'Extract duplicated UI card blocks to reusable components.',
        status: 'done',
        createdDate: '2026-02-14',
        dueDate: '2026-02-21',
        creatorId: 2,
        projectId: 10,
        projectName: 'Internal Design System',
        dependencies: [],
        assignees: [{ workerId: 1, workerName: 'worker1' }],
    },
];

export default function WorkerPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [userName, setUserName] = useState('Worker');
    const [tasks, setTasks] = useState<ExtendedTask[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [saving, setSaving] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (ENABLE_WORKER_MOCK) {
                    if (!localStorage.getItem('user')) {
                        localStorage.setItem('user', JSON.stringify({
                            userid: 1,
                            username: 'worker1',
                            firstName: 'Worker',
                            role: 'worker',
                        }));
                    }

                    if (!localStorage.getItem('token')) {
                        localStorage.setItem('token', 'mock-worker-token');
                    }

                    setUserName('Worker');
                    setTasks(MOCK_TASKS);
                    return;
                }

                const [profile, dashboardTasks] = await Promise.all([
                    api.get<{ firstName?: string; username: string }>('/dashboard/me'),
                    api.get<ExtendedTask[]>('/dashboard/tasks'),
                ]);

                setUserName(profile.firstName || profile.username || 'Worker');
                setTasks(dashboardTasks);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Failed to load worker dashboard');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(''), 2200);
        return () => clearTimeout(t);
    }, [notice]);

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const matchesSearch =
                task.taskName.toLowerCase().includes(search.toLowerCase()) ||
                task.description?.toLowerCase().includes(search.toLowerCase()) ||
                task.projectName?.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [tasks, search, statusFilter]);

    const stats: DashboardStats = useMemo(() => {
        const activeProjects = new Set(tasks.map((task) => task.projectId)).size;
        const tasksAssigned = tasks.filter((task) => task.status !== 'done').length;
        const completedTasks = tasks.filter((task) => task.status === 'done').length;

        return {
            activeProjects,
            tasksAssigned,
            completedTasks,
            teamMembers: 1,
        };
    }, [tasks]);

    const completionRate = tasks.length
        ? Math.round((stats.completedTasks / tasks.length) * 100)
        : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueToday = tasks.filter((task) => isSameDate(task.dueDate, today)).length;
    const overdue = tasks.filter((task) => isOverdue(task, today)).length;

    const inReview = tasks.filter((task) => task.status === 'review').length;
    const inProgress = tasks.filter((task) => task.status === 'in_progress').length;

    const updateTaskStatus = async (task: ExtendedTask, nextStatus: TaskStatus) => {
        if (task.status === nextStatus) return;

        const previousStatus = task.status;
        setSaving((prev) => ({ ...prev, [task.taskId]: true }));

        setTasks((prev) => prev.map((item) =>
            item.taskId === task.taskId ? { ...item, status: nextStatus } : item
        ));

        try {
            if (!ENABLE_WORKER_MOCK) {
                await api.put(`/tasks/${task.taskId}/status`, { status: nextStatus });
            }
            setNotice(`Updated "${task.taskName}" to ${formatStatus(nextStatus)}.`);
        } catch {
            setTasks((prev) => prev.map((item) =>
                item.taskId === task.taskId ? { ...item, status: previousStatus } : item
            ));
            setError(`Could not update status for "${task.taskName}".`);
        } finally {
            setSaving((prev) => ({ ...prev, [task.taskId]: false }));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <div className="w-16 h-16 border-4 border-brand-cyan border-t-brand-teal rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
                    {error}
                </div>
            )}

            {notice && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4">
                    {notice}
                </div>
            )}

            <div className="bg-linear-to-r from-brand-teal to-brand-cyan dark:from-cyan-900 dark:to-teal-900 rounded-3xl p-10 text-white shadow-2xl shadow-cyan-500/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-yellow/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl"></div>

                <div className="relative z-10">
                    <h1 className="text-4xl font-black mb-2 tracking-tight">Worker Space, {userName}</h1>
                    <p className="text-cyan-50 text-lg mb-8 max-w-2xl font-medium">
                        Update progress as tasks move forward. Change status anytime to keep team visibility accurate.
                    </p>

                    <div className="flex gap-4 flex-wrap">
                        <Link href="/dashboard/tasks" className="px-6 py-3 bg-white text-brand-teal font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                            Open Full Task Board
                        </Link>
                        <Link href="/dashboard/projects" className="px-6 py-3 bg-brand-teal/50 hover:bg-brand-teal text-white font-bold rounded-xl border border-white/30 transition-all">
                            View Project Context
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Active Projects" value={stats.activeProjects} color="from-brand-cyan to-blue-500" trend="Linked to your tasks" />
                <StatCard title="Open Tasks" value={stats.tasksAssigned} color="from-brand-peach to-orange-500" trend="Need status updates" />
                <StatCard title="Completed" value={stats.completedTasks} color="from-brand-sage to-emerald-600" trend="Marked as done" />
                <StatCard title="Completion Rate" value={`${completionRate}%`} color="from-brand-yellow to-yellow-500" trend="Across all assignments" />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <h2 className="text-xl font-black text-gray-800 dark:text-white">My Assigned Tasks</h2>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-4 pr-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-white outline-none focus:border-cyan-400 transition-all shadow-sm"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-200 outline-none focus:border-cyan-400 cursor-pointer shadow-sm"
                            >
                                <option value="all">All Status</option>
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="done">Done</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredTasks.length === 0 && (
                            <div className="text-center py-14 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 font-semibold">
                                No tasks match this filter.
                            </div>
                        )}

                        {filteredTasks.map((task) => {
                            const isSaving = !!saving[task.taskId];
                            const progress = progressByStatus(task.status);

                            return (
                                <article
                                    key={task.taskId}
                                    className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-700"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-base font-black text-gray-800 dark:text-gray-100">{task.taskName}</h3>
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${getStatusStyle(task.status)}`}>
                                                    {formatStatus(task.status)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                {task.description || 'No description'}
                                            </p>
                                            <p className="text-xs font-semibold text-gray-400 mt-2">
                                                {task.projectName || 'No Project'} • Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}
                                            </p>

                                            <div className="mt-4">
                                                <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                                                    <span>Progress</span>
                                                    <span>{progress}%</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-linear-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full lg:w-52 flex flex-col gap-3">
                                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Change Status
                                            </label>
                                            <select
                                                value={task.status}
                                                onChange={(e) => updateTaskStatus(task, e.target.value as TaskStatus)}
                                                disabled={isSaving}
                                                className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-100 outline-none focus:ring-2 focus:ring-brand-cyan disabled:opacity-70"
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="review">Review</option>
                                                <option value="done">Done</option>
                                            </select>

                                            <button
                                                onClick={() => updateTaskStatus(task, 'done')}
                                                disabled={isSaving || task.status === 'done'}
                                                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-linear-to-r from-emerald-500 to-teal-600 disabled:opacity-40 hover:opacity-90 transition-opacity"
                                            >
                                                {isSaving ? 'Saving...' : task.status === 'done' ? 'Already Done' : 'Mark as Done'}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-linear-to-b from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl font-bold mb-1">Progress Snapshot</h2>
                        <p className="text-gray-400 text-sm mb-6">Live task status metrics from your assignments.</p>

                        <div className="space-y-3">
                            <QuickStat label="Overdue" value={overdue} tone="warn" />
                            <QuickStat label="In Progress" value={inProgress} tone="info" />
                            <QuickStat label="In Review" value={inReview} tone="info" />
                            <QuickStat label="Due Today" value={dueToday} tone="ok" />
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-700">
                        <p className="text-xs font-bold text-gray-400 uppercase">Workflow Tip</p>
                        <p className="text-sm text-gray-200 mt-2">
                            Move tasks to <span className="font-bold text-brand-yellow">Review</span> before <span className="font-bold text-brand-sage">Done</span> so your lead can verify quality quickly.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function progressByStatus(status: TaskStatus) {
    switch (status) {
        case 'todo':
            return 15;
        case 'in_progress':
            return 55;
        case 'review':
            return 85;
        case 'done':
            return 100;
        default:
            return 0;
    }
}

function isSameDate(dueDate: string | undefined, date: Date) {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due.getTime() === date.getTime();
}

function isOverdue(task: ExtendedTask, today: Date) {
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime() && task.status !== 'done';
}

function StatCard({ title, value, color, trend }: { title: string; value: number | string; color: string; trend: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-2xl bg-linear-to-br ${color} shadow-lg`} />
                <span className="text-xs font-bold text-gray-400 bg-gray-50 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">{trend}</span>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 font-bold text-sm uppercase tracking-wider">{title}</h3>
            <p className="text-3xl font-black text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    );
}

function QuickStat({ label, value, tone }: { label: string; value: number; tone: 'warn' | 'info' | 'ok' }) {
    const toneStyle =
        tone === 'warn'
            ? 'bg-red-500/15 border-red-400/40 text-red-200'
            : tone === 'ok'
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                : 'bg-cyan-500/15 border-cyan-400/40 text-cyan-100';

    return (
        <div className={`rounded-2xl border px-4 py-3 flex items-center justify-between ${toneStyle}`}>
            <span className="font-semibold text-sm">{label}</span>
            <span className="font-black text-lg">{value}</span>
        </div>
    );
}

function formatStatus(status: TaskStatus) {
    switch (status) {
        case 'in_progress':
            return 'In Progress';
        case 'todo':
            return 'To Do';
        case 'review':
            return 'Review';
        case 'done':
            return 'Done';
        default:
            return status;
    }
}

function getStatusStyle(status: TaskStatus) {
    switch (status) {
        case 'done':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
        case 'in_progress':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
        case 'review':
            return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
        default:
            return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
}
