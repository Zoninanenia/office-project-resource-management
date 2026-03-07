'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Task, User } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import Link from 'next/link';
import TaskModal from '@/components/TaskModal';
import { Avatar, AvatarGroup } from '@/components/Avatar';
import { alertError } from '@/components/Alertmodal';

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
    totalTasks?: number;
    completedTasks?: number;
    progress?: number;
}

export default function TeamDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = parseInt(params.id as string, 10);

    const [team, setTeam] = useState<Team | null>(null);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Task Modal configuration (for viewing/editing)
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [isEditingTask, setIsEditingTask] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [potentialAssignees, setPotentialAssignees] = useState<User[]>([]);
    const [newTask, setNewTask] = useState({
        projectId: '',
        taskName: '',
        description: '',
        status: 'todo',
        dueDate: '',
        estimatedHours: '',
        assignedTo: [] as string[],
        dependencies: [] as number[],
        teamId: '',
    });

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                // Fetch all teams and find the one we need
                const teamsData = await api.get<Team[]>('/teams');
                setAllTeams(teamsData);
                const currentTeam = teamsData.find(t => t.teamId === teamId);

                if (!currentTeam) {
                    setError('Team not found');
                    setLoading(false);
                    return;
                }

                setTeam(currentTeam);

                // Fetch tasks for the team's project to get dependencies, and filter for this team
                const allTasks = await api.get<Task[]>(`/tasks/project/${currentTeam.projectId}`);
                const teamTasks = allTasks.filter(t => t.teamId === teamId);
                setTasks(teamTasks);

            } catch (err: any) {
                console.error(err.message || 'Failed to fetch team details');
                setError(err.message || 'Failed to fetch team details');
            } finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    }, [teamId]);

    const handleTaskUpdated = async () => {
        if (!team) return;
        try {
            const allTasks = await api.get<Task[]>(`/tasks/project/${team.projectId}`);
            const teamTasks = allTasks.filter(t => t.teamId === teamId);
            setTasks(teamTasks);
        } catch (err) {
            console.error('Failed to refresh tasks');
        }
    };

    const handleOpenTaskModal = async (taskToEdit?: Task) => {
        if (!team) return;
        try {
            if (potentialAssignees.length === 0) {
                const users = await api.get<User[]>('/users?role=worker');
                setPotentialAssignees(users);
            }
            if (taskToEdit) {
                setIsEditingTask(true);
                setEditingTaskId(taskToEdit.taskId);
                const isoDate = taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().split('T')[0] : '';
                setNewTask({
                    projectId: taskToEdit.projectId.toString(),
                    taskName: taskToEdit.taskName,
                    description: taskToEdit.description || '',
                    status: taskToEdit.status,
                    dueDate: isoDate,
                    estimatedHours: taskToEdit.estimatedHours ? taskToEdit.estimatedHours.toString() : '',
                    assignedTo: taskToEdit.assignees ? taskToEdit.assignees.map((a: any) => a.workerId.toString()) : [],
                    dependencies: taskToEdit.dependencies || [],
                    teamId: taskToEdit.teamId ? taskToEdit.teamId.toString() : '',
                });
            } else {
                setIsEditingTask(false);
                setEditingTaskId(null);
                setNewTask({
                    projectId: team.projectId.toString(),
                    taskName: '',
                    description: '',
                    status: 'todo',
                    dueDate: '',
                    estimatedHours: '',
                    assignedTo: [],
                    dependencies: [],
                    teamId: team.teamId.toString(),
                });
            }
        } catch (err) {
            console.error('Failed to prepare task modal', err);
        } finally {
            setShowTaskModal(true);
        }
    };

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log(newTask.projectId);
        
        if (!newTask.taskName || !newTask.taskName.trim()) {
            alertError("Incomplete Form", { message: "Please enter a task name."});
            // alert("Please enter a task name");
            return;
        }

        // if (!newTask.description || !newTask.description.trim()) {
        //     alertError("Incomplete Form", { message: "Please enter a description."});
        //     // alert("Please enter a description");
        //     return;
        // }

        if (!newTask.dueDate) {
            alertError("Incomplete Form", { message: "Please select a due date."});
            // alert("Please select a due date");
            return;
        }

        try {
            if (isEditingTask && editingTaskId) {
                await api.put(`/tasks/${editingTaskId}`, newTask);
            } else {
                await api.post(`/tasks/project/${newTask.projectId}`, newTask);
            }
            setShowTaskModal(false);
            handleTaskUpdated();
        } catch (err: any) {
            console.error(err.message || 'Failed to save task');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[500px]">
            <div className="w-16 h-16 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
    );

    if (error || !team) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-red-500 mb-4">{error || 'Team not found'}</h2>
            <button onClick={() => router.push('/dashboard/teams')} className="px-6 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 font-bold transition-colors">
                Back to Teams
            </button>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header utilizing the new PageHeader component */}
            <PageHeader
                title={team.teamName}
                description={`Project: ${team.projectTitle}`}
                actions={
                    <button onClick={() => router.push('/dashboard/teams')} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                        Back to Teams
                    </button>
                }
            />

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Team Details */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Stats Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Team Summary</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl p-4 border border-cyan-100 dark:border-cyan-900/30">
                                <p className="text-brand-cyan font-black text-2xl">{tasks.length}</p>
                                <p className="text-xs font-bold text-cyan-700 dark:text-cyan-400">Total Tasks</p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/30">
                                <p className="text-emerald-600 font-black text-2xl">{tasks.filter(t => t.status === 'done').length}</p>
                                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Completed</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-1 text-xs font-bold text-gray-500">
                                <span>Overall Progress</span>
                                <span>{team.progress || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div className="bg-brand-cyan h-2 rounded-full transition-all duration-500" style={{ width: `${team.progress || 0}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Roster */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Roster ({team.members.length + (team.leader ? 1 : 0)})</h3>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {/* Leader */}
                            {team.leader && (
                                <div className="p-4 flex items-center gap-3 bg-brand-peach/5">
                                    <Avatar
                                        name={team.leader.name}
                                        size="lg"
                                        colorClass="bg-brand-peach/20 text-brand-peach border border-brand-peach/30"
                                    />
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{team.leader.name}</p>
                                        <p className="text-[10px] text-brand-peach font-bold uppercase tracking-wider">Team Leader</p>
                                    </div>
                                </div>
                            )}

                            {/* Members */}
                            {team.members.map(member => (
                                <div key={member.userId} className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <Avatar
                                        name={member.name}
                                        size="lg"
                                        colorClass="bg-gray-100 dark:bg-gray-700 text-gray-500"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{member.name}</p>
                                            <span className="text-[10px] font-bold text-cyan-600">{member.totalTasks} Tasks</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Member</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Tasks Pipeline */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-black text-gray-800 dark:text-white">Assigned Tasks</h3>
                            <button
                                onClick={() => handleOpenTaskModal()}
                                className="px-4 py-2 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 rounded-xl font-bold text-sm transition-colors"
                            >
                                + New Task
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto w-full">
                            {tasks.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                                    <p className="font-bold mb-1">No tasks assigned yet.</p>
                                    <p className="text-sm">Click "+ New Task" to start populating the board.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {tasks.map(task => (
                                        <div
                                            key={task.taskId}
                                            onClick={() => handleOpenTaskModal(task)}
                                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-bold text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-brand-cyan transition-colors">{task.taskName}</h4>
                                                <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ml-2 flex-shrink-0
                                                    ${task.status === 'done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' :
                                                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' :
                                                            task.status === 'review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                                                                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                                                >
                                                    {task.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 h-8">{task.description}</p>

                                            <div className="flex justify-between items-center mt-auto">
                                                <div className="flex -space-x-2">
                                                    {task.assignees && task.assignees.length > 0 ? (
                                                        task.assignees.slice(0, 3).map(a => (
                                                            <div key={a.workerId} className="w-6 h-6 rounded-full bg-linear-to-br from-cyan-400 to-blue-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[8px] text-white font-bold" title={a.workerName}>
                                                                {a.workerName.charAt(0).toUpperCase()}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] items-center text-gray-400 font-bold bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">Unassigned</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Deadline'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showTaskModal && (
                <TaskModal
                    isOpen={showTaskModal}
                    onClose={() => setShowTaskModal(false)}
                    isEditing={isEditingTask}
                    editingTaskId={editingTaskId}
                    newTask={newTask}
                    setNewTask={setNewTask}
                    onSubmit={handleSaveTask}
                    projects={[{ projectId: team.projectId, title: team.projectTitle }]}
                    teams={allTeams}
                    potentialAssignees={potentialAssignees}
                    tasks={tasks}
                    fixedProjectId={team.projectId.toString()}
                />
            )}
        </div>
    );
}
