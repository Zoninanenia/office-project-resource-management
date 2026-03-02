'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { Sprint, Task } from '@/types';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function SprintsPage() {
    const params = useParams();
    const projectId = params?.id ? parseInt(params.id as string) : null;

    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
    const [form, setForm] = useState({ sprintName: '', startDate: '', endDate: '' });

    // Assign task modal
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignSprintId, setAssignSprintId] = useState<number | null>(null);

    // Carry over modal
    const [showCarryOverModal, setShowCarryOverModal] = useState(false);
    const [carryOverFromId, setCarryOverFromId] = useState<number | null>(null);
    const [carryOverToId, setCarryOverToId] = useState<number | null>(null);

    // Move single task dropdown
    const [movingTaskId, setMovingTaskId] = useState<number | null>(null);

    // View mode
    const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUserRole(JSON.parse(userStr).role);
        }

        }, []);

    useEffect(() => {
        if (!projectId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const [sprintsData, tasksData] = await Promise.all([
                    api.get<Sprint[]>(`/sprints/project/${projectId}`),
                    api.get<Task[]>('/tasks'),
                ]);
                setSprints(sprintsData);
                setTasks(tasksData.filter(t => t.projectId === projectId));
            } catch (err) {
                console.error('Failed to fetch sprint data', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId]);

    const backlogTasks = useMemo(() =>
        tasks.filter(t => !t.sprintId),
        [tasks]
    );

    const getSprintTasks = (sprintId: number) =>
        tasks.filter(t => t.sprintId === sprintId);

    // --- CRUD handlers ---
    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.sprintName.trim() || !form.startDate || !form.endDate) return;
        if (!projectId) {
            alert('Please select a project first');
            return;
        }

        try {
            if (editingSprint) {
                await api.put(`/sprints/${editingSprint.sprintId}`, form);
            } else {
                await api.post(`/sprints/project/${projectId}`, form);
            }
            // Refresh
            const data = await api.get<Sprint[]>(`/sprints/project/${projectId}`);
            setSprints(data);
            setShowModal(false);
            setEditingSprint(null);
            setForm({ sprintName: '', startDate: '', endDate: '' });
        } catch (err: any) {
            alert(err.message || 'Failed to save sprint');
        }
    };

    const handleDelete = async (sprintId: number, name: string) => {
        if (!confirm(`Delete sprint "${name}"? Tasks will be moved to backlog.`)) return;
        try {
            await api.delete(`/sprints/${sprintId}`);
            const [sprintsData, tasksData] = await Promise.all([
                api.get<Sprint[]>(`/sprints/project/${projectId}`),
                api.get<Task[]>('/tasks'),
            ]);
            setSprints(sprintsData);
            setTasks(tasksData.filter(t => t.projectId === projectId));
        } catch (err: any) {
            alert(err.message || 'Failed to delete sprint');
        }
    };

    const handleStatusChange = async (sprintId: number, newStatus: string) => {
        try {
            await api.put(`/sprints/${sprintId}`, { status: newStatus });
            setSprints(prev => prev.map(s =>
                s.sprintId === sprintId ? { ...s, status: newStatus as Sprint['status'] } : s
            ));
        } catch (err: any) {
            alert(err.message || 'Failed to update status');
        }
    };

    const handleAssignTask = async (taskId: number) => {
        if (!assignSprintId) return;
        try {
            await api.put(`/sprints/${assignSprintId}/tasks/${taskId}`, {});
            // Refresh tasks
            const tasksData = await api.get<Task[]>('/tasks');
            setTasks(tasksData.filter(t => t.projectId === projectId));
            // Refresh sprint counts
            const sprintsData = await api.get<Sprint[]>(`/sprints/project/${projectId}`);
            setSprints(sprintsData);
        } catch (err: any) {
            alert(err.message || 'Failed to assign task');
        }
    };

    const handleRemoveTask = async (taskId: number) => {
        try {
            await api.delete(`/sprints/tasks/${taskId}`);
            const tasksData = await api.get<Task[]>('/tasks');
            setTasks(tasksData.filter(t => t.projectId === projectId));
            const sprintsData = await api.get<Sprint[]>(`/sprints/project/${projectId}`);
            setSprints(sprintsData);
        } catch (err: any) {
            alert(err.message || 'Failed to remove task from sprint');
        }
    };

    const openEdit = (sprint: Sprint) => {
        setEditingSprint(sprint);
        setForm({
            sprintName: sprint.sprintName,
            startDate: new Date(sprint.startDate).toISOString().split('T')[0],
            endDate: new Date(sprint.endDate).toISOString().split('T')[0],
        });
        setShowModal(true);
    };

    const openCreate = () => {
        setEditingSprint(null);
        setForm({ sprintName: '', startDate: '', endDate: '' });
        setShowModal(true);
    };

    // --- Carry Over / Move handlers ---
    const handleCarryOver = async () => {
        if (!carryOverFromId || !carryOverToId) return;
        try {
            const result: any = await api.post(`/sprints/${carryOverFromId}/carry-over`, { toSprintId: carryOverToId });
            alert(result.message || 'Tasks carried over successfully');
            // Refresh data
            const [sprintsData, tasksData] = await Promise.all([
                api.get<Sprint[]>(`/sprints/project/${projectId}`),
                api.get<Task[]>('/tasks'),
            ]);
            setSprints(sprintsData);
            setTasks(tasksData.filter(t => t.projectId === projectId));
            setShowCarryOverModal(false);
            setCarryOverFromId(null);
            setCarryOverToId(null);
        } catch (err: any) {
            alert(err.message || 'Failed to carry over tasks');
        }
    };

    const handleMoveTask = async (taskId: number, toSprintId: number) => {
        try {
            await api.put(`/sprints/tasks/${taskId}/move`, { toSprintId });
            const [sprintsData, tasksData] = await Promise.all([
                api.get<Sprint[]>(`/sprints/project/${projectId}`),
                api.get<Task[]>('/tasks'),
            ]);
            setSprints(sprintsData);
            setTasks(tasksData.filter(t => t.projectId === projectId));
            setMovingTaskId(null);
        } catch (err: any) {
            alert(err.message || 'Failed to move task');
        }
    };

    const openCarryOver = (sprintId: number) => {
        setCarryOverFromId(sprintId);
        setCarryOverToId(null);
        setShowCarryOverModal(true);
    };

    const getUnfinishedCount = (sprintId: number) => {
        return tasks.filter(t => t.sprintId === sprintId && t.status !== 'done').length;
    };

    // --- Timeline calculations ---
    const timelineData = useMemo(() => {
        if (sprints.length === 0) return null;
        const allDates = sprints.flatMap(s => [new Date(s.startDate), new Date(s.endDate)]);
        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
        // Add padding
        minDate.setDate(minDate.getDate() - 3);
        maxDate.setDate(maxDate.getDate() + 3);
        const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        return { minDate, maxDate, totalDays };
    }, [sprints]);

    const getBarPosition = (startDate: string, endDate: string) => {
        if (!timelineData) return { left: '0%', width: '0%' };
        const start = new Date(startDate);
        const end = new Date(endDate);
        const startOffset = Math.ceil((start.getTime() - timelineData.minDate.getTime()) / (1000 * 60 * 60 * 24));
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const left = (startOffset / timelineData.totalDays) * 100;
        const width = (duration / timelineData.totalDays) * 100;
        return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
    };

    const getTimelineMarkers = () => {
        if (!timelineData) return [];
        const markers = [];
        const current = new Date(timelineData.minDate);
        while (current <= timelineData.maxDate) {
            const isMonday = current.getDay() === 1;
            if (isMonday) {
                const offset = Math.ceil((current.getTime() - timelineData.minDate.getTime()) / (1000 * 60 * 60 * 24));
                markers.push({
                    label: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    position: `${(offset / timelineData.totalDays) * 100}%`,
                });
            }
            current.setDate(current.getDate() + 1);
        }
        return markers;
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[500px]">
            <div className="w-16 h-16 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <Link href={`/dashboard/projects/${projectId}`} className="text-sm font-bold text-cyan-500 hover:text-cyan-400 transition-colors mb-4 inline-block">
                        ← Back to Project Details
                    </Link>
                    <h1 className="text-4xl font-black text-gray-800 dark:text-white tracking-tight mb-2">Sprints & Timeline</h1>
                    <p className="text-gray-500 dark:text-gray-400">Organize your project timeline with sprints.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">


                    {/* View Toggle */}
                    <div className="flex bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`px-4 py-3 font-bold text-sm transition-colors ${viewMode === 'cards' ? 'bg-cyan-500 text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                        >
                            <span className="flex items-center gap-1.5">
                                <GridIcon className="w-4 h-4" /> Cards
                            </span>
                        </button>
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`px-4 py-3 font-bold text-sm transition-colors ${viewMode === 'timeline' ? 'bg-cyan-500 text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                        >
                            <span className="flex items-center gap-1.5">
                                <TimelineIcon className="w-4 h-4" /> Timeline
                            </span>
                        </button>
                    </div>

                    {userRole === 'project_manager' && (
                        <button onClick={openCreate} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/30 hover:-translate-y-1 transition-all flex items-center justify-center whitespace-nowrap">
                            <span className="mr-2 text-lg">+</span> New Sprint
                        </button>
                    )}
                </div>
            </div>

            {!projectId ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-400 font-bold text-lg">No project selected.</p>
                    <p className="text-gray-400 text-sm mt-1">Please select a project to manage sprints.</p>
                </div>
            ) : viewMode === 'cards' ? (
                // === CARDS VIEW ===
                <div className="space-y-6">
                    {/* Sprint Cards */}
                    {sprints.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {sprints.map(sprint => {
                                const sprintTasks = getSprintTasks(sprint.sprintId);
                                const totalT = Number(sprint.taskCount || 0);
                                const doneT = Number(sprint.completedTaskCount || 0);
                                const progress = totalT === 0 ? 0 : Math.round((doneT / totalT) * 100);

                                return (
                                    <div key={sprint.sprintId} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden group">
                                        {/* Sprint Header Bar */}
                                        <div className={`h-2 ${sprint.status === 'active' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : sprint.status === 'completed' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}></div>

                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-black text-gray-800 dark:text-white truncate group-hover:text-cyan-500 transition-colors">{sprint.sprintName}</h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
                                                            <CalendarIcon className="w-3.5 h-3.5" />
                                                            {new Date(sprint.startDate).toLocaleDateString()} — {new Date(sprint.endDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Status Badge + Actions */}
                                                <div className="flex items-center gap-2 ml-4">
                                                    {userRole === 'project_manager' ? (
                                                        <select
                                                            value={sprint.status}
                                                            onChange={(e) => handleStatusChange(sprint.sprintId, e.target.value)}
                                                            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border-0 outline-none cursor-pointer appearance-none ${getStatusBadge(sprint.status)}`}
                                                        >
                                                            <option value="planned">Planned</option>
                                                            <option value="active">Active</option>
                                                            <option value="completed">Completed</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${getStatusBadge(sprint.status)}`}>
                                                            {sprint.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Progress */}
                                            <div className="mb-4">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Progress</span>
                                                    <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">{progress}% ({doneT}/{totalT})</span>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full transition-all duration-700 relative" style={{ width: `${progress}%` }}>
                                                        <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tasks in this sprint */}
                                            <div className="space-y-1.5 mb-4">
                                                {sprintTasks.length > 0 ? (
                                                    sprintTasks.slice(0, 4).map(task => (
                                                        <div key={task.taskId} className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group/task">
                                                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getTaskStatusColor(task.status)}`}></div>
                                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate flex-1">{task.taskName}</span>
                                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${getTaskStatusBadge(task.status)}`}>
                                                                {task.status.replace('_', ' ')}
                                                            </span>
                                                            {userRole === 'project_manager' && task.status !== 'done' && (
                                                                <div className="relative">
                                                                    <button onClick={() => setMovingTaskId(movingTaskId === task.taskId ? null : task.taskId)} className="opacity-0 group-hover/task:opacity-100 text-gray-400 hover:text-blue-500 transition-all p-1" title="Move to another sprint">
                                                                        <MoveIcon className="w-3 h-3" />
                                                                    </button>
                                                                    {movingTaskId === task.taskId && (
                                                                        <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 py-1 z-20 min-w-[160px]">
                                                                            {sprints.filter(s => s.sprintId !== sprint.sprintId).map(s => (
                                                                                <button key={s.sprintId} onClick={() => handleMoveTask(task.taskId, s.sprintId)} className="w-full text-left px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-600 transition-colors">
                                                                                    → {s.sprintName}
                                                                                </button>
                                                                            ))}
                                                                            <button onClick={() => handleRemoveTask(task.taskId)} className="w-full text-left px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors border-t border-gray-100 dark:border-gray-700">
                                                                                → Backlog
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {userRole === 'project_manager' && (
                                                                <button onClick={() => handleRemoveTask(task.taskId)} className="opacity-0 group-hover/task:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1" title="Remove from sprint">
                                                                    <XIcon className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-gray-400 font-medium py-2 text-center">No tasks assigned yet</p>
                                                )}
                                                {sprintTasks.length > 4 && (
                                                    <p className="text-[10px] text-gray-400 font-bold text-center">+{sprintTasks.length - 4} more tasks</p>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            {userRole === 'project_manager' && (
                                                <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                    <button
                                                        onClick={() => { setAssignSprintId(sprint.sprintId); setShowAssignModal(true); }}
                                                        className="flex-1 py-2 text-center text-sm font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/10 hover:bg-cyan-100 dark:hover:bg-cyan-900/20 rounded-xl transition-colors"
                                                    >
                                                        + Add Tasks
                                                    </button>
                                                    {getUnfinishedCount(sprint.sprintId) > 0 && sprints.length > 1 && (
                                                        <button
                                                            onClick={() => openCarryOver(sprint.sprintId)}
                                                            className="flex-1 py-2 text-center text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded-xl transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <CarryOverIcon className="w-4 h-4" /> Carry Over ({getUnfinishedCount(sprint.sprintId)})
                                                        </button>
                                                    )}
                                                    <button onClick={() => openEdit(sprint)} className="px-3 py-2 text-gray-400 hover:text-cyan-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors" title="Edit">
                                                        <EditIcon className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(sprint.sprintId, sprint.sprintName)} className="px-3 py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-xl transition-colors" title="Delete">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600">
                                <SprintIcon className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-400 dark:text-gray-500">No sprints yet</h3>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Create your first sprint to start organizing work.</p>
                        </div>
                    )}

                    {/* Backlog Section */}
                    {backlogTasks.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <BacklogIcon className="w-5 h-5 text-amber-500" />
                                Backlog
                                <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{backlogTasks.length}</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {backlogTasks.map(task => (
                                    <div key={task.taskId} className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-amber-200 dark:hover:border-amber-800">
                                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getTaskStatusColor(task.status)}`}></div>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate flex-1">{task.taskName}</span>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${getTaskStatusBadge(task.status)}`}>
                                            {task.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // === TIMELINE VIEW ===
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 overflow-x-auto">
                    <h2 className="text-lg font-black text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <TimelineIcon className="w-5 h-5 text-cyan-500" />
                        Project Timeline
                    </h2>

                    {sprints.length > 0 && timelineData ? (
                        <div className="min-w-[700px]">
                            {/* Today indicator */}
                            {(() => {
                                const today = new Date();
                                if (today >= timelineData.minDate && today <= timelineData.maxDate) {
                                    const offset = Math.ceil((today.getTime() - timelineData.minDate.getTime()) / (1000 * 60 * 60 * 24));
                                    const position = `${(offset / timelineData.totalDays) * 100}%`;
                                    return null; // We'll render it inside the timeline
                                }
                                return null;
                            })()}

                            {/* Date markers */}
                            <div className="relative h-8 mb-2 border-b border-gray-100 dark:border-gray-700">
                                {getTimelineMarkers().map((marker, i) => (
                                    <div key={i} className="absolute text-[10px] font-bold text-gray-400 -translate-x-1/2" style={{ left: marker.position }}>
                                        {marker.label}
                                        <div className="w-px h-2 bg-gray-200 dark:bg-gray-600 mx-auto mt-0.5"></div>
                                    </div>
                                ))}
                            </div>

                            {/* Sprint bars */}
                            <div className="space-y-4 relative">
                                {/* Today line */}
                                {(() => {
                                    const today = new Date();
                                    if (timelineData && today >= timelineData.minDate && today <= timelineData.maxDate) {
                                        const offset = Math.ceil((today.getTime() - timelineData.minDate.getTime()) / (1000 * 60 * 60 * 24));
                                        const position = `${(offset / timelineData.totalDays) * 100}%`;
                                        return (
                                            <div className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10 pointer-events-none" style={{ left: position }}>
                                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full whitespace-nowrap">TODAY</div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                {sprints.map(sprint => {
                                    const pos = getBarPosition(sprint.startDate, sprint.endDate);
                                    const totalT = Number(sprint.taskCount || 0);
                                    const doneT = Number(sprint.completedTaskCount || 0);
                                    const progress = totalT === 0 ? 0 : Math.round((doneT / totalT) * 100);

                                    return (
                                        <div key={sprint.sprintId} className="relative h-14">
                                            {/* Label */}
                                            <div className="absolute left-0 top-0 text-xs font-black text-gray-600 dark:text-gray-300 truncate pr-2 z-10" style={{ maxWidth: pos.left }}>
                                                {sprint.sprintName}
                                            </div>

                                            {/* Bar */}
                                            <div
                                                className={`absolute top-5 h-8 rounded-xl cursor-pointer transition-all hover:scale-y-110 hover:shadow-lg group/bar ${sprint.status === 'active' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-emerald-200 dark:shadow-emerald-900/30' :
                                                    sprint.status === 'completed' ? 'bg-gradient-to-r from-blue-400 to-indigo-500 shadow-blue-200 dark:shadow-blue-900/30' :
                                                        'bg-gradient-to-r from-amber-400 to-orange-500 shadow-amber-200 dark:shadow-amber-900/30'
                                                    } shadow-sm`}
                                                style={{ left: pos.left, width: pos.width }}
                                                title={`${sprint.sprintName}: ${new Date(sprint.startDate).toLocaleDateString()} — ${new Date(sprint.endDate).toLocaleDateString()} (${progress}%)`}
                                            >
                                                {/* Inner progress */}
                                                <div className="absolute inset-y-0 left-0 bg-white/20 rounded-l-xl transition-all" style={{ width: `${progress}%` }}></div>

                                                <div className="relative z-10 flex items-center h-full px-3">
                                                    <span className="text-[10px] font-black text-white truncate">{sprint.sprintName}</span>
                                                    <span className="ml-auto text-[9px] font-bold text-white/80">{totalT} tasks</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-6 mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-2 rounded bg-gradient-to-r from-amber-400 to-orange-500"></div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Planned</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-2 rounded bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Active</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-2 rounded bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Completed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-0.5 h-4 bg-red-400"></div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Today</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-400 font-bold">No sprints to show on timeline.</p>
                            <p className="text-gray-400 text-sm mt-1">Create sprints to visualize your project timeline.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create/Edit Sprint Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{editingSprint ? 'Edit Sprint' : 'Create New Sprint'}</h2>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors">&times;</button>
                        </div>

                        <form onSubmit={handleCreateOrUpdate} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sprint Name</label>
                                <input
                                    type="text"
                                    value={form.sprintName}
                                    onChange={e => setForm({ ...form, sprintName: e.target.value })}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-cyan-400 rounded-xl font-bold outline-none transition-all dark:text-white"
                                    placeholder="e.g. Sprint 1 — Foundation"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-cyan-400 rounded-xl font-bold outline-none transition-all dark:text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={form.endDate}
                                        onChange={e => setForm({ ...form, endDate: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-cyan-400 rounded-xl font-bold outline-none transition-all dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full py-4 mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-cyan-500/30 text-white font-black rounded-xl shadow-lg transform hover:-translate-y-1 transition-all">
                                {editingSprint ? 'Save Changes' : 'Create Sprint'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Tasks to Sprint Modal */}
            {showAssignModal && assignSprintId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Add Tasks to Sprint</h2>
                            <button onClick={() => setShowAssignModal(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors">&times;</button>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">
                            Click a task to assign it to <span className="font-bold text-cyan-500">{sprints.find(s => s.sprintId === assignSprintId)?.sprintName}</span>
                        </p>

                        {backlogTasks.length > 0 ? (
                            <div className="space-y-2">
                                {backlogTasks.map(task => (
                                    <button
                                        key={task.taskId}
                                        onClick={() => handleAssignTask(task.taskId)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:bg-cyan-50 dark:hover:bg-cyan-900/10 hover:border-cyan-200 dark:hover:border-cyan-800 border border-transparent transition-colors text-left"
                                    >
                                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getTaskStatusColor(task.status)}`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">{task.taskName}</p>
                                            {task.dueDate && (
                                                <p className="text-[10px] text-gray-400 font-medium">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${getTaskStatusBadge(task.status)}`}>
                                            {task.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-cyan-500 text-lg">+</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/20 rounded-2xl">
                                <p className="text-gray-400 font-bold">All tasks are already assigned to sprints</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Carry Over Modal */}
            {showCarryOverModal && carryOverFromId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Carry Over Tasks</h2>
                            <button onClick={() => setShowCarryOverModal(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors">&times;</button>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">
                            Move all unfinished tasks from <span className="font-bold text-amber-500">{sprints.find(s => s.sprintId === carryOverFromId)?.sprintName}</span> to:
                        </p>

                        {/* Target sprint selector */}
                        <select
                            value={carryOverToId || ''}
                            onChange={(e) => setCarryOverToId(Number(e.target.value) || null)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-cyan-400 rounded-xl font-bold outline-none transition-all mb-4 dark:text-white"
                        >
                            <option value="">Select target sprint...</option>
                            {sprints.filter(s => s.sprintId !== carryOverFromId).map(s => (
                                <option key={s.sprintId} value={s.sprintId}>{s.sprintName}</option>
                            ))}
                        </select>

                        {/* Preview of tasks to carry over */}
                        <div className="mb-4">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Tasks to move ({getUnfinishedCount(carryOverFromId)})</p>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {tasks.filter(t => t.sprintId === carryOverFromId && t.status !== 'done').map(task => (
                                    <div key={task.taskId} className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getTaskStatusColor(task.status)}`}></div>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate flex-1">{task.taskName}</span>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${getTaskStatusBadge(task.status)}`}>
                                            {task.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleCarryOver}
                            disabled={!carryOverToId}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-amber-500/30 text-white font-black rounded-xl shadow-lg transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                        >
                            <CarryOverIcon className="w-5 h-5 inline mr-2" />
                            Carry Over {getUnfinishedCount(carryOverFromId)} Task(s)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Helpers ---
function getStatusBadge(status: string) {
    switch (status) {
        case 'active': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
        case 'completed': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
        default: return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
    }
}

function getTaskStatusColor(status: string) {
    switch (status) {
        case 'done': return 'bg-emerald-500';
        case 'in_progress': return 'bg-blue-500';
        case 'review': return 'bg-purple-500';
        default: return 'bg-gray-400';
    }
}

function getTaskStatusBadge(status: string) {
    switch (status) {
        case 'done': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
        case 'in_progress': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
        case 'review': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
        default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
}

// --- Icons ---
function CalendarIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }

function GridIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" /><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" /><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" /><rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" /></svg>; }

function TimelineIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h6" /></svg>; }

function SprintIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>; }

function BacklogIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>; }

function EditIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>; }

function TrashIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>; }

function XIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>; }

function MoveIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>; }

function CarryOverIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>; }
