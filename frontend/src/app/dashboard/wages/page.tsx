'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Project } from '@/types';
import { Avatar } from '@/components/Avatar';
import { alertError } from '@/components/Alertmodal';

interface WorkerWage {
    userId: number;
    username: string;
    firstName?: string;
    lastName?: string;
    profilePic?: string;
    role: string;
    hourlyWage: number;
}

interface ProjectLabourWorker {
    userId: number;
    username: string;
    firstName?: string;
    lastName?: string;
    hourlyWage: number;
    taskCount: number;
    totalEstimatedHours: number;
    workerCost: number;
}

interface ProjectLabourData {
    project: {
        projectId: number;
        title: string;
        budget: number;
    };
    workers: ProjectLabourWorker[];
    totalLabourCost: number;
    totalEstimatedHours: number;
}


function WageIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function UserIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>; }
function ChartIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }

export default function WagesPage() {
    const [workers, setWorkers] = useState<WorkerWage[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [labourData, setLabourData] = useState<ProjectLabourData | null>(null);
    const [loading, setLoading] = useState(true);
    const [labourLoading, setLabourLoading] = useState(false);
    const [editingWages, setEditingWages] = useState<Record<number, string>>({});
    const [savingWage, setSavingWage] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'wages' | 'costs'>('wages');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [workersData, projectsData] = await Promise.all([
                    api.get<WorkerWage[]>('/wages/workers'),
                    api.get<Project[]>('/projects'),
                ]);
                setWorkers(workersData);
                setProjects(projectsData);
            } catch (err) {
                console.error('Failed to fetch wages data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!selectedProjectId) {
            setLabourData(null);
            return;
        }
        const fetchLabour = async () => {
            setLabourLoading(true);
            try {
                const data = await api.get<ProjectLabourData>(`/wages/projects/${selectedProjectId}`);
                setLabourData(data);
            } catch (err) {
                console.error('Failed to fetch labour cost', err);
            } finally {
                setLabourLoading(false);
            }
        };
        fetchLabour();
    }, [selectedProjectId]);

    const handleWageChange = (userId: number, value: string) => {
        setEditingWages(prev => ({ ...prev, [userId]: value }));
    };

    const handleSaveWage = async (userId: number) => {
        const value = editingWages[userId];
        if (value === undefined) return;

        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
            alertError("Incomplete Form", { message: "Please enter a valid non-negative number."});
            // alert('Please enter a valid non-negative number');
            return;
        }

        setSavingWage(userId);
        try {
            await api.put(`/wages/workers/${userId}`, { hourlyWage: numValue });
            setWorkers(prev =>
                prev.map(w => w.userId === userId ? { ...w, hourlyWage: numValue } : w)
            );
            setEditingWages(prev => {
                const copy = { ...prev };
                delete copy[userId];
                return copy;
            });
            // Refresh labour data if viewing a project
            if (selectedProjectId) {
                const data = await api.get<ProjectLabourData>(`/wages/projects/${selectedProjectId}`);
                setLabourData(data);
            }
        } catch (err: any) {
            console.error(err.message || 'Failed to update wage');
        } finally {
            setSavingWage(null);
        }
    };

    const getWorkerName = (w: WorkerWage | ProjectLabourWorker) =>
        (w.firstName || w.lastName) ? `${w.firstName || ''} ${w.lastName || ''}`.trim() : w.username;

    if (loading) return (
        <div className="flex items-center justify-center min-h-[500px]">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-700 p-8 md:p-12 text-white">
                <div className="absolute inset-0 bg-white/10 opacity-30"></div>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight drop-shadow-md">
                        <div className="flex items-center gap-3"><WageIcon className="w-10 h-10 md:w-12 md:h-12 text-white" /> Labour Wages</div>
                    </h1>
                    <p className="text-white/80 text-lg font-medium max-w-2xl">
                        Define hourly wages for workers and view overall labour costs per project.
                    </p>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 w-fit">
                <button
                    onClick={() => setActiveTab('wages')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'wages'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2"><UserIcon className="w-4 h-4" /> Worker Wages</div>
                </button>
                <button
                    onClick={() => setActiveTab('costs')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'costs'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2"><ChartIcon className="w-4 h-4" /> Project Costs</div>
                </button>
            </div>

            {/* Tab: Worker Wages */}
            {activeTab === 'wages' && (
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center text-sm">$</span>
                            Hourly Wages Configuration
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Set the hourly rate for each worker. This rate is used to calculate project labour costs.</p>
                    </div>

                    {workers.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-gray-400 font-bold text-lg">No workers found</p>
                            <p className="text-gray-400 text-sm mt-1">Add workers to the system first.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <div className="col-span-5">Worker</div>
                                <div className="col-span-2">Role</div>
                                <div className="col-span-3">Hourly Wage</div>
                                <div className="col-span-2">Action</div>
                            </div>

                            {workers.map(worker => {
                                const isEditing = editingWages[worker.userId] !== undefined;
                                const currentValue = isEditing ? editingWages[worker.userId] : worker.hourlyWage.toString();
                                const hasChanged = isEditing && parseFloat(editingWages[worker.userId]) !== worker.hourlyWage;

                                return (
                                    <div key={worker.userId} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                        <div className="col-span-5 flex items-center gap-3">
                                            <Avatar
                                                name={getWorkerName(worker)}
                                                size="lg"
                                                colorClass="bg-gradient-to-br from-cyan-400 to-blue-500 text-white"
                                                className="shadow-md rounded-xl"
                                            />
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-200">{getWorkerName(worker)}</p>
                                                <p className="text-xs text-gray-400">@{worker.username}</p>
                                            </div>
                                        </div>

                                        <div className="col-span-2">
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                                                {worker.role.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <div className="col-span-3">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={currentValue}
                                                    onChange={(e) => handleWageChange(worker.userId, e.target.value)}
                                                    className="w-full pl-7 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-cyan-400 rounded-xl font-bold text-gray-800 dark:text-white outline-none transition-all text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="col-span-2">
                                            <button
                                                onClick={() => handleSaveWage(worker.userId)}
                                                disabled={!hasChanged || savingWage === worker.userId}
                                                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${hasChanged
                                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md hover:shadow-cyan-500/30 hover:-translate-y-0.5'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {savingWage === worker.userId ? (
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                        Saving
                                                    </span>
                                                ) : 'Save'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )
            }

            {/* Tab: Project Costs */}
            {
                activeTab === 'costs' && (
                    <div className="space-y-6">
                        {/* Project Selector */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Select Project</label>
                            <select
                                value={selectedProjectId || ''}
                                onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full md:w-96 p-3 bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-cyan-400 rounded-xl font-bold outline-none transition-all dark:text-white text-sm"
                            >
                                <option value="">-- Choose a Project --</option>
                                {projects.map(p => (
                                    <option key={p.projectId} value={p.projectId}>{p.title}</option>
                                ))}
                            </select>
                        </div>

                        {/* Labour Cost Display */}
                        {labourLoading && (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-12 h-12 border-4 border-cyan-500 border-t-blue-600 rounded-full animate-spin"></div>
                            </div>
                        )}

                        {!labourLoading && labourData && (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Project Budget</p>
                                        <p className="text-3xl font-black text-gray-800 dark:text-white">${labourData.project.budget.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Labour Cost</p>
                                        <p className={`text-3xl font-black ${labourData.totalLabourCost > labourData.project.budget ? 'text-red-500' : 'text-emerald-500'}`}>
                                            ${labourData.totalLabourCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Remaining Budget</p>
                                        {(() => {
                                            const remaining = labourData.project.budget - labourData.totalLabourCost;
                                            return (
                                                <p className={`text-3xl font-black ${remaining < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                                    {remaining < 0 ? '-' : ''}${Math.abs(remaining).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Budget Usage Bar */}
                                {labourData.project.budget > 0 && (
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Budget Usage</span>
                                            <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">
                                                {Math.min(100, Math.round((labourData.totalLabourCost / labourData.project.budget) * 100))}%
                                            </span>
                                        </div>
                                        <div className="overflow-hidden h-4 rounded-full bg-gray-100 dark:bg-gray-700">
                                            <div
                                                style={{ width: `${Math.min(100, (labourData.totalLabourCost / labourData.project.budget) * 100)}%` }}
                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${(labourData.totalLabourCost / labourData.project.budget) > 0.9
                                                    ? 'bg-gradient-to-r from-red-400 to-red-600'
                                                    : (labourData.totalLabourCost / labourData.project.budget) > 0.7
                                                        ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                                        : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                                                    }`}
                                            ></div>
                                        </div>
                                    </div>
                                )}

                                {/* Worker Breakdown */}
                                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                        <h3 className="text-lg font-black text-gray-800 dark:text-white">Worker Cost Breakdown</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Total estimated hours: <span className="font-bold text-cyan-600">{labourData.totalEstimatedHours.toFixed(1)}h</span>
                                        </p>
                                    </div>

                                    {labourData.workers.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-gray-400 font-bold">No workers assigned to tasks in this project</p>
                                            <p className="text-gray-400 text-sm mt-1">Assign workers to tasks and set estimated hours to see cost breakdown.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {/* Table Header */}
                                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                <div className="col-span-3">Worker</div>
                                                <div className="col-span-2 text-center">Tasks</div>
                                                <div className="col-span-2 text-center">Est. Hours</div>
                                                <div className="col-span-2 text-center">Rate</div>
                                                <div className="col-span-3 text-right">Cost</div>
                                            </div>

                                            {labourData.workers.map(worker => (
                                                <div key={worker.userId} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                    <div className="col-span-3 flex items-center gap-3">
                                                        <Avatar
                                                            name={getWorkerName(worker)}
                                                            size="md"
                                                            colorClass="bg-gradient-to-br from-purple-400 to-indigo-500 text-white"
                                                            className="shadow-md rounded-xl"
                                                        />
                                                        <div>
                                                            <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{getWorkerName(worker)}</p>
                                                            <p className="text-[10px] text-gray-400">@{worker.username}</p>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2 text-center">
                                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-black text-sm">
                                                            {worker.taskCount}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2 text-center font-bold text-gray-700 dark:text-gray-300 text-sm">
                                                        {worker.totalEstimatedHours.toFixed(1)}h
                                                    </div>
                                                    <div className="col-span-2 text-center font-bold text-gray-700 dark:text-gray-300 text-sm">
                                                        ${worker.hourlyWage.toFixed(2)}/h
                                                    </div>
                                                    <div className="col-span-3 text-right">
                                                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                                            ${worker.workerCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Total Row */}
                                            <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center bg-gray-50 dark:bg-gray-900/50">
                                                <div className="col-span-3 font-black text-gray-800 dark:text-white text-sm">TOTAL</div>
                                                <div className="col-span-2 text-center font-black text-gray-800 dark:text-white text-sm">
                                                    {labourData.workers.reduce((sum, w) => sum + w.taskCount, 0)}
                                                </div>
                                                <div className="col-span-2 text-center font-black text-gray-800 dark:text-white text-sm">
                                                    {labourData.totalEstimatedHours.toFixed(1)}h
                                                </div>
                                                <div className="col-span-2"></div>
                                                <div className="col-span-3 text-right">
                                                    <span className="text-xl font-black text-gray-800 dark:text-white">
                                                        ${labourData.totalLabourCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {!labourLoading && !labourData && selectedProjectId === null && (
                            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-center mb-4 text-cyan-500"><ChartIcon className="w-16 h-16" /></div>
                                <p className="text-gray-400 font-bold text-lg">Select a project to view labour costs</p>
                                <p className="text-gray-400 text-sm mt-1">Choose a project from the dropdown above.</p>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
}
