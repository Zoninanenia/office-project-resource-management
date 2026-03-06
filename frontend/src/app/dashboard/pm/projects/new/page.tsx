'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { alertError } from '@/components/Alertmodal';

export default function NewProjectPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [project, setProject] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        budget: '',
        status: 'planning'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project.title.trim()) {
            alertError("Incomplete Form", { message: "Please enter a project title." });
            return;
        }

        if (!project.description.trim()) {
            alertError("Incomplete Form", { message: "Please enter a project description." });
            return;
        }

        if (!project.startDate || !project.endDate) {
            alertError("Incomplete Form", { message: "Please select both start and end date." });
            return;
        }

        if (project.endDate < project.startDate) {
            alertError("Invalid Date", { message: "End date must be after start date." });
            return;
        }

        if (!project.budget || isNaN(Number(project.budget)) || Number(project.budget) <= 0) {
            alertError("Incomplete Form", { message: "Please enter a valid budget." });
            return;
        }

        setIsSubmitting(true);

        try {
            await api.post('/projects', {
                ...project,
                budget: parseFloat(project.budget) || 0
            });
            router.push('/dashboard/projects');
        } catch (err: any) {
            alertError("Something Went Wrong", { message: "Failed to create project."});
            console.error(err.message);
            // alert(err.message || 'Failed to create project');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-4xl font-black mb-2 tracking-tight text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">Create New Project</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Kick off your next big adventure.</p>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 space-y-6 relative overflow-hidden">
                {/* Decorative Top Bar */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-cyan-500 to-blue-600"></div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Project Title</label>
                    <input
                        type="text"
                        value={project.title}
                        onChange={e => setProject({ ...project, title: e.target.value })}
                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-cyan-500 rounded-xl font-bold text-lg outline-none transition-all dark:text-white"
                        placeholder="e.g. Website Redesign v2"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                    <textarea
                        value={project.description}
                        onChange={e => setProject({ ...project, description: e.target.value })}
                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-cyan-500 rounded-xl font-medium outline-none transition-all dark:text-white min-h-[120px]"
                        placeholder="What is this project about?"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Date</label>
                        <input
                            type="date"
                            value={project.startDate}
                            onChange={e => setProject({ ...project, startDate: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-cyan-500 rounded-xl font-bold outline-none transition-all dark:text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">End Date (Optional)</label>
                        <input
                            type="date"
                            value={project.endDate}
                            onChange={e => setProject({ ...project, endDate: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-cyan-500 rounded-xl font-bold outline-none transition-all dark:text-white"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Budget ($)</label>
                    <input
                        type="number"
                        value={project.budget}
                        onChange={e => setProject({ ...project, budget: e.target.value })}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-cyan-500 rounded-xl font-bold outline-none transition-all dark:text-white"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-4 bg-linear-to-r from-cyan-500 to-blue-600 hover:shadow-cyan-500/30 text-white font-black rounded-xl shadow-lg transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Creating Project...' : 'Launch Project'}
                    </button>
                </div>
            </form>
        </div>
    );
}
