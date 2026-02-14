'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Project } from '@/types';
import Link from 'next/link';

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await api.get<Project[]>('/projects');
                setProjects(data);
            } catch (err: any) {
                if (err.message !== 'No projects found') {
                    setError(err.message || 'Failed to fetch projects');
                }
            } finally {
                setLoading(false);
            }
        };

        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserRole(user.role);
        }

        fetchProjects();
    }, []);

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'All Status' || p.status?.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    if (loading) return (
        <div className="flex items-center justify-center min-h-[500px]">
            <div className="w-16 h-16 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-800 dark:text-white tracking-tight mb-2">Projects</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your ongoing tasks and tracked your progress.</p>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-3 w-full sm:w-64 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-white outline-none focus:border-cyan-400 transition-all shadow-sm"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-500 transition-colors">
                            <SearchIcon className="w-5 h-5" />
                        </div>
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-200 outline-none focus:border-cyan-400 cursor-pointer shadow-sm"
                    >
                        <option>All Status</option>
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                    </select>

                    {userRole === 'project_manager' && (
                        <Link href="/dashboard/pm/projects/new" className="px-6 py-3 bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/30 hover:-translate-y-1 transition-all flex items-center justify-center whitespace-nowrap">
                            <span className="material-icons mr-2 text-sm">add</span> New Project
                        </Link>
                    )}
                </div>
            </div>

            {/* Projects Grid (Adventure Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                    <div key={project.projectId} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-white/60 dark:border-gray-700 flex flex-col overflow-hidden group">
                        {/* Cover Image Simulation */}
                        <div className={`h-32 bg-linear-to-r ${getProjectGradient(project.status)} relative p-6`}>
                            <div className="absolute inset-0 bg-white/10 pattern-dots transform scale-150"></div>
                            <div className="relative z-10 flex justify-between items-start">
                                <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/20">
                                    {project.status || 'Unknown'}
                                </span>
                                <div className="text-white/80 text-xs font-bold bg-black/10 px-2 py-1 rounded-lg">
                                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No Deadline'}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2 group-hover:text-cyan-500 transition-colors truncate">{project.title}</h3>
                            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mb-4 flex items-center gap-1">
                                <UsersIcon className="w-4 h-4" />
                                {project.teamName || 'Unassigned Party'}
                            </p>

                            <div className="mt-auto">
                                <div className="flex justify-between items-end mb-2">
                                    {/* Mock Progress - would be real in full app */}
                                    <span className="text-xs font-bold text-gray-400 uppercase">Progress</span>
                                    <span className="text-sm font-black text-cyan-600 dark:text-cyan-400">45%</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-6">
                                    <div className="bg-cyan-500 h-3 rounded-full relative overflow-hidden" style={{ width: '45%' }}>
                                        <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-gray-500 dark:text-gray-400 font-bold text-sm">
                                        ${Number(project.budget || 0).toLocaleString()}
                                    </div>
                                    <Link href={`/dashboard/projects/${project.projectId}`} className="text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-gray-700 px-4 py-2 rounded-xl font-bold text-sm transition-colors border border-transparent hover:border-cyan-100 dark:hover:border-gray-600">
                                        View Details &rarr;
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredProjects.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600">
                            <FolderIcon className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-400 dark:text-gray-500">No projects found.</h3>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try changing your search filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function getProjectGradient(status: string | undefined) {
    switch (status) {
        case 'active': return 'from-emerald-400 to-teal-600';
        case 'planning': return 'from-orange-400 to-amber-500';
        case 'completed': return 'from-blue-400 to-indigo-600';
        default: return 'from-gray-400 to-gray-600';
    }
}

function SearchIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

function FolderIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
    )
}
