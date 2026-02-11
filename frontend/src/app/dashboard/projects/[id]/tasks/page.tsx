'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Task, User } from '@/types';

export default function ProjectTasksPage() {
    const params = useParams();
    const projectId = params.id as string;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState<string | null>(null);

    // Create Task Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [potentialAssignees, setPotentialAssignees] = useState<User[]>([]);
    const [newTask, setNewTask] = useState({
        taskName: '',
        description: '',
        status: 'todo',
        dueDate: '',
        assignedTo: [] as string[], // Changed to array
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
                setError(err.message || 'Failed to fetch tasks');
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [projectId]);

    // Fetch users when modal opens (for assignment)
    const handleOpenCreateModal = async () => {
        setShowCreateModal(true);
        if (potentialAssignees.length === 0) {
            try {
                const users = await api.get<User[]>('/users?role=worker');
                setPotentialAssignees(users);
            } catch (err) {
                console.error('Failed to fetch users for assignment', err);
            }
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/tasks/project/${projectId}`, newTask);
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
            });
        } catch (err: any) {
            alert(err.message || 'Failed to create task');
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
                        onClick={handleOpenCreateModal}
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
                                    <div className="ml-2 flex-shrink-0 flex">
                                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${task.status === 'done' ? 'bg-green-100 text-green-800' :
                                                task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {task.status}
                                        </p>
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
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Task</h2>
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
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
