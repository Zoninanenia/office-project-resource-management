'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Task, User } from '@/types';
import { alertSuccess, alertError } from '@/components/Alertmodal';

interface TeamInfo {
    teamId: number;
    teamName: string;
    projectId: number;
}

export default function ProjectTasksPage() {
    const params = useParams();
    const projectId = params.id as string;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState<string | null>(null);

    // Create/Edit Task Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [potentialAssignees, setPotentialAssignees] = useState<User[]>([]);
    const [projectTeams, setProjectTeams] = useState<TeamInfo[]>([]);
    const [newTask, setNewTask] = useState({
        taskName: '',
        description: '',
        status: 'todo',
        dueDate: '',
        assignedTo: [] as string[], // Changed to array
        dependencies: [] as number[],
        teamId: '',
    });

    useEffect(() => {
        // Get user role
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserRole(user.role);
        }

        const fetchTasks = async () => {
            try {
                const data = await api.get<Task[]>(`/tasks/project/${projectId}`);
                setTasks(data);
            } catch (err: any) {
                console.error(err.message);
                setError(err.message || 'Failed to fetch tasks');
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();

        // Fetch teams for this project
        const fetchTeams = async () => {
            try {
                const data = await api.get<TeamInfo[]>('/teams');
                setProjectTeams(data.filter(t => t.projectId.toString() === projectId));
            } catch (err) {
                console.error('Failed to fetch teams', err);
            }
        };
        fetchTeams();
    }, [projectId]);

    const handleOpenCreateModal = async (taskToEdit?: any) => {
        if (potentialAssignees.length === 0) {
            try {
                const users = await api.get<User[]>('/users?role=worker');
                setPotentialAssignees(users);
            } catch (err) {
                console.error('Failed to fetch users for assignment', err);
            }
        }

        if (taskToEdit) {
            setIsEditing(true);
            setEditingTaskId(taskToEdit.taskId);
            const isoDate = taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().split('T')[0] : '';
            setNewTask({
                taskName: taskToEdit.taskName,
                description: taskToEdit.description || '',
                status: taskToEdit.status,
                dueDate: isoDate,
                assignedTo: taskToEdit.assignees ? taskToEdit.assignees.map((a: any) => a.workerId.toString()) : [],
                dependencies: taskToEdit.dependencies || [],
                teamId: taskToEdit.teamId ? taskToEdit.teamId.toString() : '',
            });
        } else {
            setIsEditing(false);
            setEditingTaskId(null);
            setNewTask({
                taskName: '',
                description: '',
                status: 'todo',
                dueDate: '',
                assignedTo: [],
                dependencies: [],
                teamId: '',
            });
        }
        setShowCreateModal(true);
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            if (isEditing && editingTaskId) {
                await api.put(`/tasks/${editingTaskId}`, newTask);
            } else {
                await api.post(`/tasks/project/${projectId}`, newTask);
            }
            setShowCreateModal(false);
            // Refresh tasks
            const data = await api.get<Task[]>(`/tasks/project/${projectId}`);
            setTasks(data);
            // Reset form
            setNewTask({
                taskName: '',
                description: '',
                status: 'todo',
                dueDate: '',
                assignedTo: [],
                dependencies: [],
                teamId: '',
            });
        } catch (err: any) {
            alertError("Something Went Wrong", { message: "Failed to process task."});
            console.error(err.message);
            // alert(err.message || 'Failed to process task');
        }
    };

    const handleDeleteTask = async (taskId: number, taskName: string) => {
        if (confirm(`Are you sure you want to delete task "${taskName}"? This action cannot be undone.`)) {
            try {
                await api.delete(`/tasks/${taskId}`);
                const data = await api.get<Task[]>(`/tasks/project/${projectId}`);
                setTasks(data);
            } catch (err: any) {
                alertError("Something Went Wrong", { message: "Failed to delete task."});
                console.error(err.message);
                // alert(err.message || 'Failed to delete task');
            }
        }
    };

    const toggleAssignee = (userId: string) => {
        setNewTask(prev => {
            if (prev.assignedTo.includes(userId)) {
                return { ...prev, assignedTo: prev.assignedTo.filter(id => id !== userId) };
            } else {
                return { ...prev, assignedTo: [...prev.assignedTo, userId] };
            }
        });
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Project Tasks</h1>
                {(userRole === 'project_manager' || userRole === 'team_leader') && (
                    <button
                        onClick={() => handleOpenCreateModal()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Create Task
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {tasks.map((task: any) => (
                        <li key={task.taskId} className="block hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">{task.taskName}</p>
                                    <div className="ml-2 flex-shrink-0 flex items-center gap-3">
                                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${task.status === 'done' ? 'bg-green-100 text-green-800' :
                                                task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {task.status}
                                        </p>
                                        {(userRole === 'project_manager' || userRole === 'team_leader') && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleOpenCreateModal(task)} className="text-indigo-600 hover:text-indigo-900" title="Edit">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button onClick={() => handleDeleteTask(task.taskId, task.taskName)} className="text-red-500 hover:text-red-700" title="Delete">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                        <p className="flex items-center text-sm text-gray-500 dark:text-gray-300">
                                            {task.description}
                                        </p>
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0 gap-4">
                                        <p>
                                            Due: <time dateTime={task.dueDate}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Date'}</time>
                                        </p>

                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-400">Assigned:</span>
                                            {task.assignees && task.assignees.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {task.assignees.map((a: any) => (
                                                        <span key={a.workerId} className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" title={a.workerName}>
                                                            {a.workerName}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="italic text-gray-400">Unassigned</span>
                                            )}
                                        </div>

                                        {/* Team Badge */}
                                        {(task as any).teamName && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                {(task as any).teamName}
                                            </span>
                                        )}

                                        {/* Blocked Status */}
                                        {task.status !== 'done' && task.dependencies && task.dependencies.length > 0 && (
                                            <div className="flex items-center gap-1 mt-2 sm:mt-0">
                                                {(() => {
                                                    const blockedBy = task.dependencies
                                                        .map((depId: number) => tasks.find(t => t.taskId === depId))
                                                        .filter((t: any) => t && t.status !== 'done');

                                                    if (blockedBy.length > 0) {
                                                        return (
                                                            <div className="flex items-center text-xs text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-md">
                                                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                                Blocked by: {blockedBy.map((t: any) => t.taskName).join(', ')}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {tasks.length === 0 && (
                        <li className="px-4 py-4 sm:px-6 text-center text-gray-500">No tasks found.</li>
                    )}
                </ul>
            </div>

            {/* Create Task Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{isEditing ? 'Edit Task Info' : 'Create New Task'}</h2>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Name</label>
                                <input
                                    type="text"
                                    value={newTask.taskName}
                                    onChange={e => setNewTask({ ...newTask, taskName: e.target.value })}
                                    className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                <textarea
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                                <input
                                    type="date"
                                    value={newTask.dueDate}
                                    onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                                    className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To (Workers)</label>
                                <div className="max-h-40 overflow-y-auto border rounded p-2 dark:bg-gray-700 dark:border-gray-600">
                                    {potentialAssignees.length === 0 ? (
                                        <p className="text-sm text-gray-500">No workers found.</p>
                                    ) : (
                                        potentialAssignees.map(u => (
                                            <div key={u.userId} className="flex items-center space-x-2 py-1">
                                                <input
                                                    type="checkbox"
                                                    id={`worker-${u.userId}`}
                                                    checked={newTask.assignedTo.includes(u.userId.toString())}
                                                    onChange={() => toggleAssignee(u.userId.toString())}
                                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                />
                                                <label htmlFor={`worker-${u.userId}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                                    {u.firstName} {u.lastName} ({u.role})
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Team Assignment */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign to Team</label>
                                <select
                                    value={newTask.teamId}
                                    onChange={e => setNewTask({ ...newTask, teamId: e.target.value })}
                                    className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">No team (Unassigned)</option>
                                    {projectTeams.map(t => (
                                        <option key={t.teamId} value={t.teamId}>{t.teamName}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Must be finished after (Dependencies)</label>
                                <div className="max-h-40 overflow-y-auto border rounded p-2 dark:bg-gray-700 dark:border-gray-600">
                                    {tasks.filter(t => t.taskId !== editingTaskId).length === 0 ? (
                                        <p className="text-sm text-gray-500">No existing tasks.</p>
                                    ) : (
                                        tasks.filter(t => t.taskId !== editingTaskId).map((t: any) => (
                                            <div key={`dep-${t.taskId}`} className="flex items-center space-x-2 py-1">
                                                <input
                                                    type="checkbox"
                                                    id={`dep-${t.taskId}`}
                                                    checked={newTask.dependencies.includes(t.taskId)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setNewTask(prev => ({ ...prev, dependencies: [...prev.dependencies, t.taskId] }));
                                                        } else {
                                                            setNewTask(prev => ({ ...prev, dependencies: prev.dependencies.filter(id => id !== t.taskId) }));
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                />
                                                <label htmlFor={`dep-${t.taskId}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                                    {t.taskName} <span className="text-gray-400 truncate">({t.status.replace('_', ' ')})</span>
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    {isEditing ? 'Save Changes' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
