'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Task, User } from '@/types';

// Extend Task type locally if needed for extra fields from join
interface ExtendedTask extends Task {
    projectName: string;
}

interface Member {
    userId: number;
    name: string;
    username: string;
    role: string;
    profilePic: string | null;
    totalTasks: number;
    completedTasks: number;
    progress: number;
}

interface Team {
    teamId: number;
    teamName: string;
    projectId: number;
    projectTitle: string;
    leader: Member | null;
    members: Member[];
}

export default function GlobalTasksPage() {
    const [tasks, setTasks] = useState<ExtendedTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [userRole, setUserRole] = useState<string | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    // Create/Edit Task Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [projects, setProjects] = useState<{ projectId: number, title: string }[]>([]);
    const [potentialAssignees, setPotentialAssignees] = useState<User[]>([]);
    const [newTask, setNewTask] = useState({
        projectId: '',
        taskName: '',
        description: '',
        status: 'todo',
        dueDate: '',
        assignedTo: [] as string[],
        dependencies: [] as number[],
    });
    const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
    const today = new Date().toISOString().split('T')[0];


    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserRole(user.role);
            setUserId(user.userid);
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

        const fetchTeams = async () => {
            try {
                const data = await api.get<Team[]>('/teams');
                setTeams(data);
            } catch (err) {
                console.error('Failed to fetch teams', err);
            } finally {
                setLoading(false);
            }
        };


        fetchTasks();
        fetchTeams();
    }, []);

 

    // Fetch resources for modal
    const handleOpenCreateModal = async (taskToEdit?: ExtendedTask) => {
        try {
            if (projects.length === 0) {
                const projectData = await api.get<{ projectId: number, title: string }[]>('/projects');
                setProjects(projectData);
            }
            if (potentialAssignees.length === 0) {
                const userData = await api.get<User[]>('/users?role=worker');
                setPotentialAssignees(userData);
            }

            if (taskToEdit) {
                setIsEditing(true);
                setEditingTaskId(taskToEdit.taskId);
                const isoDate = taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().split('T')[0] : '';
                setNewTask({
                    projectId: taskToEdit.projectId.toString(),
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
                    projectId: '',
                    taskName: '',
                    description: '',
                    status: 'todo',
                    dueDate: '',
                    assignedTo: [],
                    dependencies: [],
                });
            }

        } catch (err) {
            console.error('Failed to fetch resources', err);
        } finally {
            setShowCreateModal(true);
        }
    };

   const getRoleBasedTeams = () => {
        if (userRole === 'team_leader') {
            return teams.filter(t => {
                return t.members?.some(member => String(member.userId).trim() === String(userId).trim());
            });
        }
        return teams;
    };

    const filteredProjectss = projects.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
        let hasAccess = true;
        const myTeams = getRoleBasedTeams();
        hasAccess = myTeams.some(team => String(team.projectId) === String(p.projectId));
        return matchesSearch && hasAccess;
    });



    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.projectId) {
            alert('Please select a project');
            return;
        }

        if (!newTask.taskName || !newTask.taskName.trim()) {
            alert("Please enter a task name");
            return;
        }

        if (!newTask.description || !newTask.description.trim()) {
            alert("Please enter a description");
            return;
        }

        if (!newTask.dueDate) {
            alert("Please select a due date");
            return;
        }

        try {
            if (isEditing && editingTaskId) {
                await api.put(`/tasks/${editingTaskId}`, {
                    ...newTask,
                    projectId: undefined // not updated here, but prevent error
                });
            } else {
                await api.post(`/tasks/project/${newTask.projectId}`, {
                    ...newTask,
                    projectId: undefined
                });
            }
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
                dependencies: [],
            });
        } catch (err: any) {
            alert(err.message || 'Failed to process task');
        }
    };

    const handleDeleteTask = async (taskId: number, taskName: string) => {
        if (confirm(`Are you sure you want to delete task "${taskName}"? This action cannot be undone.`)) {
            try {
                await api.delete(`/tasks/${taskId}`);
                // Refresh list
                const data = await api.get<ExtendedTask[]>('/tasks');
                setTasks(data);
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

    // Filter tasks by search
    const filteredTasks = tasks.filter(t =>
        t.taskName.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.projectName?.toLowerCase().includes(search.toLowerCase())
    );

    const todoTasks = filteredTasks.filter(t => t.status === 'todo');
    const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
    const doneTasks = filteredTasks.filter(t => t.status === 'done' || t.status === 'review');

    // ฟังก์ชันเริ่มลากการ์ด
    const handleDragStart = (e: React.DragEvent, taskId: number) => {
        e.dataTransfer.setData('taskId', taskId.toString());
    };

    // ฟังก์ชันอนุญาตให้วางทับได้ (จำเป็นต้องมี)
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    // ฟังก์ชันเมื่อปล่อยการ์ดลงคอลัมน์ใหม่
    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        const taskIdStr = e.dataTransfer.getData('taskId');
        if (!taskIdStr) return;

        const taskId = parseInt(taskIdStr, 10);
        const taskToUpdate = tasks.find(t => t.taskId === taskId);

        // ถ้าหาไม่เจอ หรือวางในคอลัมน์สถานะเดิม ไม่ต้องทำอะไร
        if (!taskToUpdate || taskToUpdate.status === newStatus) return;

        const previousStatus = taskToUpdate.status;

        // 1. Optimistic Update: อัปเดต UI ให้เปลี่ยนคอลัมน์ทันที
        setTasks(prev => prev.map(t =>
            t.taskId === taskId ? { ...t, status: newStatus as any } : t
        ));

        // 2. เรียก API เพื่ออัปเดตลง Database
        try {
            await api.put(`/tasks/${taskId}/status`, { status: newStatus });
        } catch (err: any) {
            // 3. Rollback: ถ้า API พัง หรืออัปเดตไม่ได้ (เช่น ติด Dependencies) ให้ดึงกลับสถานะเดิม
            setTasks(prev => prev.map(t =>
                t.taskId === taskId ? { ...t, status: previousStatus } : t
            ));
            alert(err.message || 'ไม่สามารถอัปเดตสถานะงานได้');
        }
    };

    const TaskCard = ({ task }: { task: ExtendedTask }) => (

        <div
            draggable
            onDragStart={(e) => handleDragStart(e, task.taskId)}
            className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 mb-4 group relative overflow-hidden cursor-grab active:cursor-grabbing">
            {/* Project Stripe */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-teal group-hover:bg-brand-cyan transition-colors"></div>

            <div className="pl-3">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight pr-12">{task.taskName}</h3>

                    {/* Action Buttons for PMs/Leaders */}
                    {(userRole === 'project_manager' || userRole === 'team_leader') && (
                        <div className="absolute top-3 right-3 flex gap-1 z-10 transition-opacity">
                            <button onClick={() => handleOpenCreateModal(task)}
                                    className="p-1.5 text-gray-400 hover:text-brand-cyan hover:bg-cyan-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Edit Task">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                </svg>
                            </button>
                            <button onClick={() => handleDeleteTask(task.taskId, task.taskName)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Delete Task">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
                <p className="text-xs font-bold text-brand-teal dark:text-brand-cyan mb-3 uppercase tracking-wider">{task.projectName}</p>

                <div className="flex justify-between items-center text-xs mt-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider 
                        ${task.status === 'todo' ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' :
                        task.status === 'in_progress' ? 'bg-brand-cyan/20 text-brand-cyan' :
                            'bg-brand-sage/20 text-brand-sage'}`}>
                        {task.status === 'review' ? 'Review' :
                            task.status === 'in_progress' ? 'In Progress' :
                                task.status === 'done' ? 'Done' : 'To Do'}
                    </span>

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
                            <div
                                className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-[10px]"
                                title="Unassigned">?</div>
                        )}
                    </div>
                </div>

                {task.dueDate && (
                    <div
                        className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 text-[10px] font-bold text-gray-400 flex items-center gap-1">
                        <span className="material-icons text-[10px]">schedule</span>
                        {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                )}

                {/* Blocked Status */}
                {(() => {
                    if (task.status === 'done' || !task.dependencies || task.dependencies.length === 0) return null;
                    const blockedBy = task.dependencies
                        .map(depId => tasks.find(t => t.taskId === depId))
                        .filter(t => t && t.status !== 'done');

                    if (blockedBy.length > 0) {
                        return (
                            <div
                                className="mt-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-[10px] font-bold px-2 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-1">
                                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                                     stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                </svg>
                                <span
                                    className="truncate">Blocked by: {blockedBy.map(t => t?.taskName).join(', ')}</span>
                            </div>
                        );
                    }
                    return null;
                })()}
            </div>
        </div>
    );

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <div className="w-16 h-16 border-4 border-brand-cyan border-t-brand-teal rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Active Tasks</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Manage and track your team's progress.</p>
                </div>
                {(userRole === 'project_manager' || userRole === 'team_leader') && (
                    <button
                        onClick={() => handleOpenCreateModal()}
                        className="px-6 py-2.5 bg-linear-to-r from-cyan-500 to-blue-600 hover:shadow-cyan-500/30 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <span className="text-xl leading-none">+</span> New Task
                    </button>
                )}
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Search tasks or projects..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl font-medium focus:border-brand-cyan focus:outline-none transition-all dark:text-white"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <SearchIcon className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden min-h-0">
                {/* To Do Column */}
                <div
                    className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900/50 rounded-3xl p-4 border border-gray-100 dark:border-gray-800"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'todo')}
                >
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-lg font-black text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-gray-300"></span> To Do
                        </h2>
                        <span
                            className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700">{todoTasks.length}</span>
                    </div>
                    <div className="flex flex-col h-[850px] w-full max-w-md">
                        <div
                            className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                            {todoTasks.map(task => <TaskCard key={task.taskId} task={task}/>)}
                        </div>
                    </div>

                </div>

                {/* In Progress Column */}
                <div
                    className="flex flex-col h-full bg-cyan-50/30 dark:bg-cyan-900/10 rounded-3xl p-4 border border-cyan-100 dark:border-cyan-900/30"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'in_progress')}
                >
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-lg font-black text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-brand-cyan animate-pulse"></span> In Progress
                        </h2>
                        <span
                            className="bg-white dark:bg-gray-800 text-brand-cyan text-xs font-bold px-2.5 py-1 rounded-lg border border-cyan-100 dark:border-cyan-900">{inProgressTasks.length}</span>
                    </div>
                    <div className="flex flex-col h-[850px] w-full max-w-md">
                        <div
                            className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-cyan-200 dark:scrollbar-thumb-cyan-900">
                            {inProgressTasks.map(task => <TaskCard key={task.taskId} task={task}/>)}
                        </div>
                    </div>

                </div>

                {/* Done Column */}
                <div
                    className="flex flex-col h-full bg-green-50/30 dark:bg-green-900/10 rounded-3xl p-4 border border-green-100 dark:border-green-900/30"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'done')}
                >
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-lg font-black text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-brand-sage"></span> Done
                        </h2>
                        <span
                            className="bg-white dark:bg-gray-800 text-brand-sage text-xs font-bold px-2.5 py-1 rounded-lg border border-green-100 dark:border-green-900">{doneTasks.length}</span>
                    </div>
                    <div className="flex flex-col h-[850px] w-full max-w-md">
                        <div
                            className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-green-200 dark:scrollbar-thumb-green-900">
                            {doneTasks.map(task => <TaskCard key={task.taskId} task={task}/>)}
                        </div>
                    </div>

                </div>
            </div>

            {/* Create Task Modal */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div
                        className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl scale-100 transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{isEditing ? 'Edit Task Info' : 'Create New Task'}</h2>
                            <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors">&times;</button>
                        </div>

                        <form onSubmit={handleCreateTask} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Project</label>
                                <select
                                    value={newTask.projectId}
                                    onChange={e => setNewTask({ ...newTask, projectId: e.target.value })}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-brand-cyan rounded-xl font-bold outline-none transition-all dark:text-white"
                                    required
                                    disabled={isEditing} // usually changing project mid-flight is tricky, disabling for simpler UX
                                >
                                    <option value="">Select a project...</option>
                                    {/* {projects.map(p => ( */}
                                    {filteredProjectss.map(p => (
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
                            {newTask.projectId && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Must be finished after (Dependencies)</label>
                                    <div className="max-h-40 overflow-y-auto border-2 border-transparent bg-gray-50 dark:bg-gray-700 rounded-xl p-2 focus-within:border-brand-cyan transition-all">
                                        {(() => {
                                            const projectTasks = tasks.filter(t => t.projectId.toString() === newTask.projectId);
                                            if (projectTasks.length === 0) {
                                                return <p className="text-xs text-gray-400 font-medium p-2">No existing tasks in this project.</p>;
                                            }
                                            return projectTasks.map(t => (
                                                <div key={`dep-${t.taskId}`} className="flex items-center space-x-2 py-1.5 px-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        id={`global-dep-${t.taskId}`}
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
                                                    <label htmlFor={`global-dep-${t.taskId}`} className="text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer select-none flex-1 truncate">
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
            )}
        </div>
    );
}

function SearchIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    )
}
