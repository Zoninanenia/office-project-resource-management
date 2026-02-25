'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Project, Team, Task, User } from '@/types';
import Link from 'next/link';

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params?.id ? parseInt(params.id as string) : null;

    const [project, setProject] = useState<Project | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

    // Drag-and-drop state
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
    const [savingDep, setSavingDep] = useState(false);

    // Edit/Create Task Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [potentialAssignees, setPotentialAssignees] = useState<User[]>([]);
    const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
    const today = new Date().toISOString().split('T')[0];
    const [newTask, setNewTask] = useState({
        taskName: '',
        description: '',
        status: 'todo',
        dueDate: '',
        assignedTo: [] as string[],
        dependencies: [] as number[],
    });

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setCurrentUserRole(JSON.parse(userStr).role);
        }

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

    const handleMarkAsDone = async () => {
        if (!project || !projectId) return;

        try {
            await api.put(`/projects/${projectId}/status`, { status: 'completed' });
            setProject({ ...project, status: 'completed' });
            // Show some success feedback? The UI update should be enough for now.
        } catch (err: any) {
            alert(err.message || 'Failed to mark project as completed');
        }
    };

    // --- Edit/Create Task Modal Handlers ---
    const handleOpenCreateModal = async (taskToEdit?: Task) => {
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
            });
        }
        setShowCreateModal(true);
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.taskName.trim()) { alert('Please enter a task name'); return; }
        if (!newTask.dueDate) { alert('Please select a due date'); return; }

        try {
            if (isEditing && editingTaskId) {
                await api.put(`/tasks/${editingTaskId}`, newTask);
            } else {
                await api.post(`/tasks/project/${projectId}`, newTask);
            }
            setShowCreateModal(false);
            // Re-fetch tasks
            const tasksData = await api.get<Task[]>('/tasks');
            setTasks(tasksData.filter(t => t.projectId === projectId));
            setNewTask({ taskName: '', description: '', status: 'todo', dueDate: '', assignedTo: [], dependencies: [] });
        } catch (err: any) {
            alert(err.message || 'Failed to process task');
        }
    };

    const handleDeleteTask = async (taskId: number, taskName: string) => {
        if (confirm(`Are you sure you want to delete task "${taskName}"? This action cannot be undone.`)) {
            try {
                await api.delete(`/tasks/${taskId}`);
                const tasksData = await api.get<Task[]>('/tasks');
                setTasks(tasksData.filter(t => t.projectId === projectId));
            } catch (err: any) {
                alert(err.message || 'Failed to delete task');
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

    // Calculate Progress based on tasks
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // Fallback status if missing from backend
    const status = project.status || 'active';

    // --- Sort tasks by due date (earliest first, null dates last) ---
    const sortedTasks = [...tasks].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    // --- Drag-and-drop handlers (reorder-based dependency) ---
    const handleDragStart = (e: React.DragEvent, taskId: number) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', taskId.toString());
        setTimeout(() => setDraggedTaskId(taskId), 0);
    };

    const handleDragOverSlot = (e: React.DragEvent, slotIndex: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropTargetIndex(slotIndex);
    };

    const handleDragLeave = () => {
        setDropTargetIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedTaskId(null);
        setDropTargetIndex(null);
    };

    // Drop at a slot position — the task above becomes the dependency
    const handleDropAtSlot = async (e: React.DragEvent, slotIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        const taskIdStr = e.dataTransfer.getData('text/plain');
        const dragId = taskIdStr ? parseInt(taskIdStr, 10) : draggedTaskId;
        if (dragId === null) { handleDragEnd(); return; }

        const draggedTask = tasks.find(t => t.taskId === dragId);
        if (!draggedTask) { handleDragEnd(); return; }

        // slotIndex 0 = top (no task above → clear deps)
        // slotIndex N = after sortedTasks[N-1] → depend on sortedTasks[N-1]
        let newDeps: number[] = [];
        if (slotIndex > 0) {
            const taskAbove = sortedTasks[slotIndex - 1];
            if (taskAbove && taskAbove.taskId !== dragId) {
                newDeps = [taskAbove.taskId];
            }
        }

        // Skip if dependencies are already the same
        const currentDeps = [...(draggedTask.dependencies || [])].sort();
        const newDepsSorted = [...newDeps].sort();
        if (JSON.stringify(currentDeps) === JSON.stringify(newDepsSorted)) {
            handleDragEnd();
            return;
        }

        setSavingDep(true);
        try {
            await api.put(`/tasks/${dragId}`, {
                taskName: draggedTask.taskName,
                description: draggedTask.description,
                dependencies: newDeps,
            });

            setTasks(prev => prev.map(t =>
                t.taskId === dragId ? { ...t, dependencies: newDeps } : t
            ));
        } catch (err: any) {
            console.error('Failed to update dependencies', err);
            alert(err.message || 'Failed to update dependencies');
        } finally {
            setSavingDep(false);
            handleDragEnd();
        }
    };

    const getTaskNameById = (id: number) => tasks.find(t => t.taskId === id)?.taskName || `Task #${id}`;

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

                        {currentUserRole === 'project_manager' && status !== 'completed' && progress === 100 && totalTasks > 0 && (
                            <button
                                onClick={handleMarkAsDone}
                                className="ml-auto px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-1"
                            >
                                Mark Project as Done
                            </button>
                        )}
                        {currentUserRole === 'project_manager' && status !== 'completed' && (progress < 100 || totalTasks === 0) && (
                            <div className="ml-auto px-6 py-2 bg-gray-500/50 text-white/50 font-bold rounded-xl border border-dashed border-white/20 cursor-not-allowed text-sm flex items-center gap-2" title="All tasks must be completed first">
                                Mark Project as Done
                                <LockIcon className="w-4 h-4" />
                            </div>
                        )}
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
                    {/* Description */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                        <h2 className="text-xl font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2 relative z-10">
                            <InfoIcon className="w-6 h-6 text-cyan-500" />
                            Description
                        </h2>
                        <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 relative z-10">
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line font-medium text-lg">
                                {project.description || 'No description provided.'}
                            </p>
                        </div>
                    </div>

                    {/* Tasks Section — Drag-and-drop dependency ordering */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                                <ListIcon className="w-6 h-6 text-cyan-500" />
                                Active Tasks
                                {savingDep && (
                                    <span className="ml-2 w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                                )}
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden md:block">Drag to reorder</span>
                                {(currentUserRole === 'project_manager' || currentUserRole === 'team_leader') && (
                                    <button
                                        onClick={() => handleOpenCreateModal()}
                                        className="px-4 py-1.5 bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-md hover:shadow-cyan-500/30 transition-all text-sm flex items-center gap-1"
                                    >
                                        <span className="text-lg leading-none">+</span> New Task
                                    </button>
                                )}
                                <Link href="/dashboard/tasks" className="text-sm font-bold text-cyan-500 hover:text-cyan-400 transition-colors">
                                    Go to Board →
                                </Link>
                            </div>
                        </div>

                        {sortedTasks.length > 0 ? (
                            <div className="grid gap-0">
                                {/* Drop slot at the very top (position 0 = clear deps) — PM only */}
                                {currentUserRole === 'project_manager' && (
                                    <div
                                        onDragOver={(e) => handleDragOverSlot(e, 0)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDropAtSlot(e, 0)}
                                        className={`transition-all duration-200 rounded-xl ${dropTargetIndex === 0 && draggedTaskId !== null
                                            ? 'h-3 bg-cyan-400 dark:bg-cyan-500 my-1 shadow-md shadow-cyan-300/50'
                                            : 'h-1'
                                            }`}
                                    />
                                )}

                                {sortedTasks.map((task, index) => (
                                    <div key={task.taskId}>
                                        <div
                                            draggable={currentUserRole === 'project_manager'}
                                            onDragStart={(e) => currentUserRole === 'project_manager' && handleDragStart(e, task.taskId)}
                                            onDragEnd={handleDragEnd}
                                            className={`bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border-2 transition-all group hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden mb-2 ${draggedTaskId === task.taskId
                                                ? 'opacity-40 scale-95 border-cyan-400 dark:border-cyan-500'
                                                : 'border-gray-100 dark:border-gray-700 hover:border-cyan-400 dark:hover:border-cyan-500'
                                                }`}
                                            style={{ cursor: currentUserRole === 'project_manager' ? 'grab' : 'default' }}
                                        >
                                            {/* Project Stripe */}
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-teal group-hover:bg-brand-cyan transition-colors"></div>

                                            <div className="flex items-start gap-4 pl-3">
                                                {/* Drag handle — only visible for PM */}
                                                {currentUserRole === 'project_manager' && (
                                                    <DragHandleIcon className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 flex-shrink-0 mt-1" />
                                                )}

                                                <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)} ring-2 ring-white dark:ring-gray-800 flex-shrink-0 mt-2`}></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 group-hover:text-cyan-500 transition-colors line-clamp-2 leading-tight pr-16">{task.taskName}</h3>

                                                        {/* Edit/Delete buttons for PM/TL */}
                                                        {(currentUserRole === 'project_manager' || currentUserRole === 'team_leader') && (
                                                            <div className="absolute top-3 right-3 flex gap-1 z-10">
                                                                <button onClick={(e) => { e.stopPropagation(); handleOpenCreateModal(task); }}
                                                                    className="p-1.5 text-gray-400 hover:text-brand-cyan hover:bg-cyan-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                                    title="Edit Task">
                                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                    </svg>
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.taskId, task.taskName); }}
                                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                                    title="Delete Task">
                                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider 
                                                            ${task.status === 'todo' ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' :
                                                                task.status === 'in_progress' ? 'bg-brand-cyan/20 text-brand-cyan' :
                                                                    'bg-brand-sage/20 text-brand-sage'}`}>
                                                            {task.status === 'review' ? 'Review' :
                                                                task.status === 'in_progress' ? 'In Progress' :
                                                                    task.status === 'done' ? 'Done' : 'To Do'}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-2">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            {task.dueDate && (
                                                                <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                                                    <CalendarIcon className="w-3 h-3" />
                                                                    {new Date(task.dueDate).toLocaleDateString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {/* Assignee avatars */}
                                                        <div className="flex -space-x-2">
                                                            {task.assignees && task.assignees.length > 0 ? (
                                                                task.assignees.slice(0, 3).map((a: any) => (
                                                                    <div key={a.workerId}
                                                                        className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-gray-800 bg-brand-peach flex items-center justify-center text-gray-900 font-bold text-[10px]"
                                                                        title={a.workerName}>
                                                                        {a.workerName.charAt(0).toUpperCase()}
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-[10px]" title="Unassigned">?</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Blocked-by badge */}
                                                    {(() => {
                                                        if (task.status === 'done' || !task.dependencies || task.dependencies.length === 0) return null;
                                                        const blockedBy = task.dependencies
                                                            .map(depId => tasks.find(t => t.taskId === depId))
                                                            .filter(t => t && t.status !== 'done');
                                                        if (blockedBy.length > 0) {
                                                            return (
                                                                <div className="mt-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-[10px] font-bold px-2 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-1">
                                                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                    </svg>
                                                                    <span className="truncate">Blocked by: {blockedBy.map(t => t?.taskName).join(', ')}</span>
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <div className="mt-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                                                                ↳ Depends on: {task.dependencies.map(id => getTaskNameById(id)).join(', ')}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Drop slot after this card — PM only */}
                                        {currentUserRole === 'project_manager' && (
                                            <div
                                                onDragOver={(e) => handleDragOverSlot(e, index + 1)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDropAtSlot(e, index + 1)}
                                                className={`transition-all duration-200 rounded-xl ${dropTargetIndex === index + 1 && draggedTaskId !== null
                                                    ? 'h-3 bg-cyan-400 dark:bg-cyan-500 my-1 shadow-md shadow-cyan-300/50'
                                                    : 'h-1'
                                                    }`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <p className="text-gray-400 font-bold">No tasks active.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    {/* Progress Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-black text-gray-800 dark:text-white mb-6">Progress</h2>
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
                            Teams
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
                                <p className="text-gray-400 text-sm font-bold">No teams assigned.</p>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <Link href="/dashboard/teams" className="w-full block text-center py-3 bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 font-bold rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                                Manage Teams
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            {/* Create/Edit Task Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl scale-100 transition-all max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{isEditing ? 'Edit Task Info' : 'Create New Task'}</h2>
                            <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors">&times;</button>
                        </div>

                        <form onSubmit={handleCreateTask} className="space-y-5">
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
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Must be finished after (Dependencies)</label>
                                <div className="max-h-40 overflow-y-auto border-2 border-transparent bg-gray-50 dark:bg-gray-700 rounded-xl p-2 focus-within:border-brand-cyan transition-all">
                                    {(() => {
                                        const otherTasks = tasks.filter(t => t.taskId !== editingTaskId);
                                        if (otherTasks.length === 0) {
                                            return <p className="text-xs text-gray-400 font-medium p-2">No other tasks in this project.</p>;
                                        }
                                        return otherTasks.map(t => (
                                            <div key={`dep-${t.taskId}`} className="flex items-center space-x-2 py-1.5 px-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    id={`detail-dep-${t.taskId}`}
                                                    checked={newTask.dependencies.includes(t.taskId)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setNewTask(prev => ({ ...prev, dependencies: [...prev.dependencies, t.taskId] }));
                                                        } else {
                                                            setNewTask(prev => ({ ...prev, dependencies: prev.dependencies.filter(id => id !== t.taskId) }));
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-brand-cyan shadow-sm focus:border-brand-cyan focus:ring focus:ring-brand-cyan/20"
                                                />
                                                <label htmlFor={`detail-dep-${t.taskId}`} className="text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer select-none flex-1 truncate">
                                                    {t.taskName} <span className="text-[10px] text-gray-400 font-medium ml-1">({t.status.replace('_', ' ')})</span>
                                                </label>
                                            </div>
                                        ));
                                    })()}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 font-medium">Select tasks that must be completed before this one can begin.</p>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 mt-2 bg-linear-to-r from-cyan-500 to-blue-600 hover:shadow-cyan-500/30 text-white font-black rounded-xl shadow-lg transform hover:-translate-y-1 transition-all"
                            >
                                {isEditing ? 'Save Changes' : 'Create Task'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
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
function LockIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>; }
function DragHandleIcon({ className }: { className?: string }) { return <svg className={className} fill="currentColor" viewBox="0 0 20 20"><circle cx="7" cy="4" r="1.5" /><circle cx="13" cy="4" r="1.5" /><circle cx="7" cy="10" r="1.5" /><circle cx="13" cy="10" r="1.5" /><circle cx="7" cy="16" r="1.5" /><circle cx="13" cy="16" r="1.5" /></svg>; }
