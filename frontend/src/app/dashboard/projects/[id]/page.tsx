'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Project, Team, Task } from '@/types';
import Link from 'next/link';

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params?.id ? parseInt(params.id as string) : null;

    const [project, setProject] = useState<Project | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!projectId) return;

        const fetchData = async () => {
            try {
                // Fetch basic project details
                // Note: If backend doesn't return status, we fallback to 'active' or hide it.
                const projectData = await api.get<Project>(`/projects/${projectId}`);

                // Fetch all teams and filter in frontend
                const teamsData = await api.get<Team[]>('/teams');

                // Fetch all tasks and filter in frontend
                const tasksData = await api.get<Task[]>('/tasks');

                if (!projectData) throw new Error('Project not found');

                setProject(projectData);
                setTeams(teamsData.filter(t => t.projectId === projectId));
                setTasks(tasksData.filter(t => t.projectId === projectId));
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Failed to load project details');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[500px]">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    );

    if (error || !project) return (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Oops! Something went wrong.</h2>
            <p className="text-gray-500 mb-6">{error || 'Project not found'}</p>
            <Link href="/dashboard/projects" className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Back to Projects
            </Link>
        </div>
    );

    // Calculate Progress based on tasks
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // Fallback status if missing from backend
    const status = project.status || 'active';

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header / Cover */}
            <div className={`relative rounded-3xl overflow-hidden shadow-2xl ${getProjectGradient(status)} p-8 md:p-12 text-white`}>
                <div className="absolute inset-0 bg-white/10 pattern-dots opacity-30"></div>
                <div className="absolute inset-0 bg-black/10"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <Link href="/dashboard/projects" className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl font-bold text-sm transition-all flex items-center group">
                            <span className="group-hover:-translate-x-1 transition-transform mr-1">←</span> Back to Projects
                        </Link>
                        <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest border border-white/20">
                            {status.replace('_', ' ')}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-md">{project.title}</h1>

                    <div className="flex flex-wrap gap-6 text-sm font-bold opacity-90">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5" />
                            {new Date(project.startDate).toLocaleDateString()} — {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                        </div>
                        <div className="flex items-center gap-2">
                            <WalletIcon className="w-5 h-5" />
                            ${Number(project.budget || 0).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description - Game Quest Style */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                        <h2 className="text-xl font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2 relative z-10">
                            <InfoIcon className="w-6 h-6 text-cyan-500" />
                            Mission Briefing (Description)
                        </h2>
                        <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 relative z-10">
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line font-medium text-lg">
                                {project.description || 'No briefing provided for this mission available.'}
                            </p>
                        </div>
                    </div>

                    {/* Tasks Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                                <ListIcon className="w-6 h-6 text-cyan-500" />
                                Active Quests (Tasks)
                            </h2>
                            <Link href="/dashboard/tasks" className="text-sm font-bold text-cyan-500 hover:text-cyan-400 transition-colors">
                                Go to Board →
                            </Link>
                        </div>

                        {tasks.length > 0 ? (
                            <div className="grid gap-4">
                                {tasks.map(task => (
                                    <div key={task.taskId} className="bg-white dark:bg-gray-800 p-5 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 dark:border-gray-700 hover:border-cyan-400 dark:hover:border-cyan-500 transition-all group cursor-default hover:-translate-y-0.5 hover:shadow-md">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)} ring-2 ring-white dark:ring-gray-800`}></div>
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 group-hover:text-cyan-500 transition-colors">{task.taskName}</h3>
                                                <p className="text-xs text-gray-400 font-bold">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Limit'}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-black px-3 py-1 rounded-lg uppercase tracking-wider ${getStatusBadgeColor(task.status)}`}>
                                            {task.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <p className="text-gray-400 font-bold">No quests active.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    {/* Progress Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-black text-gray-800 dark:text-white mb-6">Campaign Progress</h2>
                        <div className="relative pt-2">
                            <div className="flex mb-2 items-center justify-between">
                                <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Completion</span>
                                <span className="text-xs font-black inline-block text-cyan-600 dark:text-cyan-400">
                                    {progress}%
                                </span>
                            </div>
                            <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-cyan-100 dark:bg-gray-700">
                                <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-linear-to-r from-cyan-500 to-blue-600 transition-all duration-1000 ease-out relative">
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Teams Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-black text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <UsersIcon className="w-5 h-5 text-purple-500" />
                            Allied Parties (Teams)
                        </h2>

                        {teams.length > 0 ? (
                            <div className="space-y-4">
                                {teams.map(team => (
                                    <div key={team.teamId} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center font-black text-lg">
                                                {team.teamName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-200">{team.teamName}</p>
                                                <p className="text-xs text-gray-500 font-medium">{team.members.length} Members</p>
                                            </div>
                                        </div>

                                        {/* Member Avatars */}
                                        <div className="flex items-center pl-2">
                                            {team.leader && (
                                                <div className="w-8 h-8 rounded-full bg-brand-peach/20 text-brand-peach flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-800 -ml-2 z-10" title={`Leader: ${team.leader.name}`}>
                                                    {team.leader.name.charAt(0)}
                                                </div>
                                            )}
                                            {team.members.slice(0, 4).map(m => (
                                                <div key={m.userId} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-800 -ml-2" title={m.name}>
                                                    {m.name.charAt(0)}
                                                </div>
                                            ))}
                                            {team.members.length > 4 && (
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-gray-800 -ml-2">
                                                    +{team.members.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                <p className="text-gray-400 text-sm font-bold">No parties assigned.</p>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <Link href="/dashboard/teams" className="w-full block text-center py-3 bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 font-bold rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                                Manage Parties
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helpers
const getProjectGradient = (status: string) => {
    switch (status) {
        case 'active': return 'bg-linear-to-r from-emerald-500 to-teal-700';
        case 'planning': return 'bg-linear-to-r from-orange-400 to-amber-600';
        case 'completed': return 'bg-linear-to-r from-blue-500 to-indigo-700';
        default: return 'bg-linear-to-r from-gray-500 to-gray-700';
    }
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'done': return 'bg-emerald-500';
        case 'in_progress': return 'bg-blue-500';
        case 'review': return 'bg-purple-500';
        default: return 'bg-gray-400';
    }
}

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'done': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
        case 'in_progress': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
        case 'review': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
        default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
}

function CalendarIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function WalletIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>; }
function InfoIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function ListIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>; }
function UsersIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>; }
