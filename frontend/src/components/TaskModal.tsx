import React, { useState } from 'react';
import { Task, User } from '@/types';
interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    isEditing: boolean;
    editingTaskId: number | null;
    newTask: {
        projectId: string;
        taskName: string;
        description: string;
        status: string;
        dueDate: string;
        estimatedHours: string;
        assignedTo: string[];
        dependencies: number[];
        teamId: string;
    };
    setNewTask: React.Dispatch<React.SetStateAction<any>>;
    onSubmit: (e: React.FormEvent) => void;
    projects: { projectId: number; title: string }[];
    teams: { teamId: number; teamName: string; projectId: number;[key: string]: any }[];
    potentialAssignees: User[];
    tasks: Task[];
    fixedProjectId?: string; // If provided, the project dropdown defaults to this and is disabled
}

export default function TaskModal({
    isOpen,
    onClose,
    isEditing,
    editingTaskId,
    newTask,
    setNewTask,
    onSubmit,
    projects,
    teams,
    potentialAssignees,
    tasks,
    fixedProjectId
}: TaskModalProps) {
    const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
    const today = new Date().toISOString().split('T')[0];

    if (!isOpen) return null;

    const toggleAssignee = (userId: string) => {
        setNewTask((prev: any) => {
            if (prev.assignedTo.includes(userId)) {
                return { ...prev, assignedTo: prev.assignedTo.filter((id: string) => id !== userId) };
            } else {
                return { ...prev, assignedTo: [...prev.assignedTo, userId] };
            }
        });
    };

    const displayProjectId = fixedProjectId || newTask.projectId;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl scale-100 transition-all max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                        {isEditing ? 'Edit Task Info' : 'Create New Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                        type="button"
                    >
                        &times;
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Project</label>
                        <select
                            value={displayProjectId}
                            onChange={e => setNewTask({ ...newTask, projectId: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-brand-cyan rounded-xl font-bold outline-none transition-all dark:text-white"
                            required
                            disabled={isEditing || !!fixedProjectId}
                        >
                            <option value="">Select a project...</option>
                            {projects.map(p => (
                                <option key={p.projectId} value={p.projectId}>{p.title}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Task Name</label>
                        <input
                            type="text"
                            value={newTask.taskName}
                            onChange={e => setNewTask({ ...newTask, taskName: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-brand-cyan rounded-xl font-bold outline-none transition-all dark:text-white"
                            placeholder="e.g. Design Homepage"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                        <textarea
                            value={newTask.description}
                            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-brand-cyan rounded-xl font-medium outline-none transition-all dark:text-white"
                            rows={3}
                            placeholder="Add details..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Due Date</label>
                            <input
                                type="date"
                                min={today}
                                value={newTask.dueDate}
                                onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-brand-cyan rounded-xl font-bold outline-none transition-all dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Est. Hours</label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={newTask.estimatedHours}
                                onChange={e => setNewTask({ ...newTask, estimatedHours: e.target.value })}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-brand-cyan rounded-xl font-bold outline-none transition-all dark:text-white"
                                placeholder="e.g. 8"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Team Assignment */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assign to Team</label>
                            <select
                                value={newTask.teamId}
                                onChange={e => setNewTask({ ...newTask, teamId: e.target.value })}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-brand-cyan rounded-xl font-bold outline-none transition-all dark:text-white"
                            >
                                <option value="">No team (Unassigned)</option>
                                {teams.filter(t => !displayProjectId || t.projectId.toString() === displayProjectId.toString()).map(t => (
                                    <option key={t.teamId} value={t.teamId}>{t.teamName}</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assign to (Worker)</label>
                            <div
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-brand-cyan rounded-xl min-h-[50px] cursor-pointer flex flex-wrap gap-2 items-center transition-all"
                                onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                            >
                                {newTask.assignedTo.length > 0 ? (
                                    newTask.assignedTo.map(id => {
                                        const user = potentialAssignees.find(u => u.userId.toString() === id);
                                        if (!user) return null;
                                        return (
                                            <div key={id} className="bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg px-2 py-1 flex items-center gap-1.5 shadow-xs" onClick={(e) => { e.stopPropagation(); toggleAssignee(id); }}>
                                                <div className="w-4 h-4 rounded-full bg-brand-cyan text-white flex items-center justify-center text-[8px] font-bold">
                                                    {user.firstName?.charAt(0) || user.username.charAt(0)}
                                                </div>
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{user.firstName || user.username}</span>
                                                <span className="text-gray-400 hover:text-red-500 text-xs ml-1">×</span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <span className="text-sm text-gray-400 font-medium">Select workers...</span>
                                )}
                                <div className="ml-auto text-gray-400 transform transition-transform">
                                    <svg className={`w-4 h-4 ${isAssigneeDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>

                            {/* Dropdown List */}
                            {isAssigneeDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto z-20 p-2 space-y-1">
                                    {potentialAssignees.length > 0 ? (
                                        potentialAssignees.map(user => (
                                            <div
                                                key={user.userId}
                                                onClick={() => toggleAssignee(user.userId.toString())}
                                                className={`p-2 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${newTask.assignedTo.includes(user.userId.toString())
                                                    ? 'bg-cyan-50 dark:bg-cyan-900/20'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${newTask.assignedTo.includes(user.userId.toString())
                                                    ? 'bg-brand-cyan text-white'
                                                    : 'bg-gray-100 dark:bg-gray-600 text-gray-500'
                                                    }`}>
                                                    {user.firstName?.charAt(0) || user.username.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-sm font-bold ${newTask.assignedTo.includes(user.userId.toString()) ? 'text-brand-cyan' : 'text-gray-700 dark:text-gray-200'}`}>
                                                        {user.firstName || user.username} {user.lastName}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 capitalize">{user.role}</p>
                                                </div>
                                                {newTask.assignedTo.includes(user.userId.toString()) && (
                                                    <div className="text-brand-cyan">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-gray-400 text-sm">No workers found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dependencies Selector */}
                    {displayProjectId && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Must be finished after (Dependencies)</label>
                            <div className="max-h-40 overflow-y-auto border-2 border-transparent bg-gray-50 dark:bg-gray-700 rounded-xl p-2 focus-within:border-brand-cyan transition-all">
                                {(() => {
                                    const projectTasks = tasks.filter(t => t.projectId.toString() === displayProjectId.toString() && t.taskId !== editingTaskId);
                                    if (projectTasks.length === 0) {
                                        return <p className="text-xs text-gray-400 font-medium p-2">No existing tasks in this project.</p>;
                                    }
                                    return projectTasks.map(t => (
                                        <div key={`dep-${t.taskId}`} className="flex items-center space-x-2 py-1.5 px-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer">
                                            <input
                                                type="checkbox"
                                                id={`modal-dep-${t.taskId}`}
                                                checked={newTask.dependencies.includes(t.taskId)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setNewTask((prev: any) => ({ ...prev, dependencies: [...prev.dependencies, t.taskId] }));
                                                    } else {
                                                        setNewTask((prev: any) => ({ ...prev, dependencies: prev.dependencies.filter((id: number) => id !== t.taskId) }));
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-brand-cyan shadow-sm focus:border-brand-cyan focus:ring focus:ring-brand-cyan/20"
                                            />
                                            <label htmlFor={`modal-dep-${t.taskId}`} className="text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer select-none flex-1 truncate">
                                                {t.taskName} <span className="text-[10px] text-gray-400 font-medium ml-1">({t.status.replace('_', ' ')})</span>
                                            </label>
                                        </div>
                                    ));
                                })()}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 font-medium">Select tasks that must be completed before this one can begin.</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-4 mt-2 bg-linear-to-r from-cyan-500 to-blue-600 hover:shadow-cyan-500/30 text-white font-black rounded-xl shadow-lg transform hover:-translate-y-1 transition-all"
                    >
                        {isEditing ? 'Save Changes' : 'Create Task'}
                    </button>
                </form>
            </div>
        </div>
    );
}
