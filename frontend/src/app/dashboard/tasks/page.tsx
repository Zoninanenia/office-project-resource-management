'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Task, User } from '@/types';

// Extend Task type locally if needed for extra fields from join
interface ExtendedTask extends Task {
    projectName: string;
}

export default function GlobalTasksPage() {
    const [tasks, setTasks] = useState<ExtendedTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [userRole, setUserRole] = useState<string | null>(null);

    // Create Task Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [projects, setProjects] = useState<{ projectId: number, title: string }[]>([]);
    const [potentialAssignees, setPotentialAssignees] = useState<User[]>([]);
    const [newTask, setNewTask] = useState({
        projectId: '',
        taskName: '',
        description: '',
        status: 'todo',
        dueDate: '',
        assignedTo: [] as string[],
    });

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserRole(user.role);
        }

        const fetchTasks = async () => {
            try {
                const data = await api.get<ExtendedTask[]>('/tasks');
                setTasks(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch tasks');
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    // Fetch resources for modal
    const handleOpenCreateModal = async () => {
        setShowCreateModal(true);
        try {
            if (projects.length === 0) {
                const projectData = await api.get<{ projectId: number, title: string }[]>('/projects');
                setProjects(projectData);
            }
            if (potentialAssignees.length === 0) {
                const userData = await api.get<User[]>('/users?role=worker');
                setPotentialAssignees(userData);
            }
        } catch (err) {
            console.error('Failed to fetch resources', err);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.projectId) {
            alert('Please select a project');
            return;
        }

        try {
            await api.post(`/tasks/project/${newTask.projectId}`, {
                ...newTask,
                projectId: undefined // API endpoint handles projectId from URL, but we need it locally for selection
            });
            setShowCreateModal(false);

            // Refresh tasks
            const data = await api.get<ExtendedTask[]>('/tasks');
            setTasks(data);

            // Reset form
            setNewTask({
                projectId: '',
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

    // Filter tasks by search
    const filteredTasks = tasks.filter(t =>
        t.taskName.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.projectName?.toLowerCase().includes(search.toLowerCase())
    );

    const todoTasks = filteredTasks.filter(t => t.status === 'todo');
    const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
    const doneTasks = filteredTasks.filter(t => t.status === 'done' || t.status === 'review');

    const TaskCard = ({ task }: { task: ExtendedTask }) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition mb-3">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">{task.taskName}</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{task.projectName}</p>

            <div className="flex justify-between items-center text-xs mt-3">
                <span className={`px-2 py-1 rounded text-xs font-medium 
                  ${task.status === 'todo' ? 'bg-gray-100 text-gray-600' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                            'bg-green-100 text-green-600'}`}>
                    {task.status === 'review' ? 'Review' :
                        task.status === 'in_progress' ? 'In Progress' :
                            task.status === 'done' ? 'Done' : 'To Do'}
                </span>
                <div className="flex -space-x-1 overflow-hidden">
                    {task.assignees && task.assignees.length > 0 ? (
                        task.assignees.slice(0, 3).map((a: any) => (
                            <div key={a.workerId} className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-800 bg-indigo-500 flex items-center justify-center text-white text-[10px]" title={a.workerName}>
                                {a.workerName.charAt(0).toUpperCase()}
                            </div>
                        ))
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-white text-[10px]" title="Unassigned">?</div>
                    )}
                </div>
            </div>
            <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                <span className="material-icons text-[10px]">schedule</span>
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}
            </div>
        </div>
    );

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Task Management</h1>
                {(userRole === 'project_manager' || userRole === 'team_leader') && (
                    <button
                        onClick={handleOpenCreateModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Create Task
                    </button>
                )}
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-4 pr-4 py-2 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                </div>
                <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                    Filters
                </button>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)] overflow-hidden">
                {/* To Do Column */}
                <div className="flex flex-col h-full">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center justify-between">
                        To Do
                        <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-full">{todoTasks.length}</span>
                    </h2>
                    <div className="flex-1 overflow-y-auto pr-2">
                        {todoTasks.map(task => <TaskCard key={task.taskId} task={task} />)}
                    </div>
                </div>

                {/* In Progress Column */}
                <div className="flex flex-col h-full">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center justify-between">
                        In Progress
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-2 py-1 rounded-full">{inProgressTasks.length}</span>
                    </h2>
                    <div className="flex-1 overflow-y-auto pr-2">
                        {inProgressTasks.map(task => <TaskCard key={task.taskId} task={task} />)}
                    </div>
                </div>

                {/* Done Column */}
                <div className="flex flex-col h-full">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center justify-between">
                        Done
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs px-2 py-1 rounded-full">{doneTasks.length}</span>
                    </h2>
                    <div className="flex-1 overflow-y-auto pr-2">
                        {doneTasks.map(task => <TaskCard key={task.taskId} task={task} />)}
                    </div>
                </div>
            </div>

            {/* Create Task Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Task</h2>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project <span className="text-red-500">*</span></label>
                                <select
                                    value={newTask.projectId}
                                    onChange={e => setNewTask({ ...newTask, projectId: e.target.value })}
                                    className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                >
                                    <option value="">Select a project...</option>
                                    {projects.map(p => (
                                        <option key={p.projectId} value={p.projectId}>{p.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Name <span className="text-red-500">*</span></label>
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
                                <div className="max-h-32 overflow-y-auto border rounded p-2 dark:bg-gray-700 dark:border-gray-600">
                                    {potentialAssignees.length === 0 ? (
                                        <p className="text-sm text-gray-500">No workers found.</p>
                                    ) : (
                                        potentialAssignees.map(u => (
                                            <div key={u.userId} className="flex items-center space-x-2 py-1">
                                                <input
                                                    type="checkbox"
                                                    id={`worker-global-${u.userId}`}
                                                    checked={newTask.assignedTo.includes(u.userId.toString())}
                                                    onChange={() => toggleAssignee(u.userId.toString())}
                                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                />
                                                <label htmlFor={`worker-global-${u.userId}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
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
