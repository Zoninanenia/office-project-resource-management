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
                // Ignore 404 if no projects found yet, just empty list
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

    // Helper for progress color
    const getProgressColor = (progress: number) => {
        if (progress >= 100) return 'text-green-600';
        if (progress >= 50) return 'text-blue-600';
        return 'text-yellow-600';
    };

    // Filter projects
    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'All Status' || p.status?.toLowerCase() === statusFilter.toLowerCase(); // Note: DB status might be lowercase
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Projects</h1>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
                <div className="relative flex-1 max-w-lg">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="material-icons text-gray-400">search</span>
                    </span>
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        <option>All Status</option>
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                    </select>

                    {userRole === 'project_manager' && (
                        <Link href="/dashboard/pm/projects/new" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center">
                            <span className="material-icons mr-1">add</span> New Project
                        </Link>
                    )}
                </div>
            </div>

            {/* Projects Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Budget</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Team</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredProjects.map((project) => (
                            <tr key={project.projectId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{project.title}</div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} -
                                        {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${project.status === 'active' ? 'bg-green-100 text-green-800' :
                                            project.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                                                project.status === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
                                        {project.status ? (project.status.charAt(0).toUpperCase() + project.status.slice(1)) : 'Unknown'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2 dark:bg-gray-700">
                                            {/* Mock progress for now, in real app calculate from tasks */}
                                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                                        </div>
                                        <span className="text-xs text-gray-500">45%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    ${Number(project.budget || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {project.teamName || 'Unassigned'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link href={`/dashboard/projects/${project.projectId}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 border border-indigo-600 dark:border-indigo-400 px-3 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition">
                                        View Details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredProjects.length === 0 && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No projects found.
                    </div>
                )}
            </div>
        </div>
    );
}
