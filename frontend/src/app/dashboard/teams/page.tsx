'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { useProject } from '../ProjectContext';
import { Avatar, AvatarGroup } from '@/components/Avatar';
import { alertSuccess, alertError } from '@/components/Alertmodal';

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

interface Project {
    projectId: number;
    title: string;
}

export default function TeamsPage() {
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    // Wizard State
    const [showWizard, setShowWizard] = useState(false);
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Creation Data
    const [newTeamName, setNewTeamName] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [createdTeamId, setCreatedTeamId] = useState<number | null>(null);
    const [selectedLeaderId, setSelectedLeaderId] = useState('');
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editingTeamId, setEditingTeamId] = useState<number | null>(null);

    // Existing Add Member Modal (for editing existing teams)
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    const [userRole, setUserRole] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchTeams();
        fetchUsers();

        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserRole(user.role);
            setUserId(user.userid);
        }

    }, []);

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

    const fetchUsers = async () => {
        try {
            const data = await api.get<User[]>('/users');
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
    };

    const fetchProjects = async () => {
        try {
            const data = await api.get<Project[]>('/projects');
            setProjects(data);
        } catch (err) {
            console.error('Failed to fetch projects', err);
        }
    };

    // --- Wizard Actions ---

    const openWizard = (teamToEdit?: Team) => {
        fetchProjects();
        setStep(1);

        if (teamToEdit) {
            setIsEditing(true);
            setEditingTeamId(teamToEdit.teamId);
            setNewTeamName(teamToEdit.teamName);
            setSelectedProjectId(teamToEdit.projectId.toString());
            setCreatedTeamId(teamToEdit.teamId);
            setSelectedLeaderId(teamToEdit.leader ? teamToEdit.leader.userId.toString() : '');
            setSelectedMemberIds(teamToEdit.members.map(m => m.userId.toString()));
        } else {
            setIsEditing(false);
            setEditingTeamId(null);
            setNewTeamName('');
            setSelectedProjectId('');
            setCreatedTeamId(null);
            setSelectedLeaderId('');
            setSelectedMemberIds([]);
        }

        setShowWizard(true);
    };

    const handleStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName || !selectedProjectId) return;
        setIsSubmitting(true);
        try {
            if (isEditing && editingTeamId) {
                // Skiping backend save for step 1 when editing, we save everything at step 3
                setStep(2);
            } else {
                const res = await api.post<Team>('/teams', {
                    teamName: newTeamName,
                    projectId: parseInt(selectedProjectId)
                });
                setCreatedTeamId(res.teamId);
                setStep(2);
                await fetchTeams(); // Refresh to see new team immediately behind modal
            }
        } catch (err: any) {
            alertError("Something Went Wrong", { message: "Failed to process team."});
            console.error(err.message);
            // alert(err.message || 'Failed to process team');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStep2 = async () => {
        if (!createdTeamId || !selectedLeaderId) return;
        setIsSubmitting(true);
        try {
            if (isEditing) {
                // Delay save until step 3 for bulk edit
                setStep(3);
            } else {
                await api.post(`/teams/${createdTeamId}/members`, {
                    userId: selectedLeaderId,
                    role: 'leader'
                });
                await fetchTeams();
                setStep(3);
            }
        } catch (err: any) {
            alertError("Something Went Wrong", { message: "Failed to assign leader."});
            console.error(err.message);
            // alert(err.message || 'Failed to assign leader');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStep3 = async () => {
        if (!createdTeamId) return;
        setIsSubmitting(true);

        try {
            if (isEditing && editingTeamId) {
                // Bulk save for edits
                await api.put(`/teams/${editingTeamId}`, {
                    teamName: newTeamName,
                    projectId: parseInt(selectedProjectId),
                    leaderId: selectedLeaderId,
                    memberIds: selectedMemberIds,
                });
            } else {
                // Add all selected members for new teams
                if (selectedMemberIds.length > 0) {
                    const promises = selectedMemberIds.map(userId =>
                        api.post(`/teams/${createdTeamId}/members`, {
                            userId: userId,
                            role: 'member'
                        })
                    );
                    await Promise.all(promises);
                }
            }
            await fetchTeams();
            setShowWizard(false);
            alertSuccess(isEditing ? "Team Updated" : "Team Created", { message: `Setup complete!` });
            // alert(`Team ${isEditing ? 'updated' : 'setup'} complete!`);
        } catch (err: any) {
            alertError("Something Went Wrong", { message: "Failed to complete team setup."});
            console.error(err.message);
            // alert(err.message || 'Failed to complete team setup');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMemberSelection = (userId: string) => {
        if (selectedMemberIds.includes(userId)) {
            setSelectedMemberIds(selectedMemberIds.filter(id => id !== userId));
        } else {
            setSelectedMemberIds([...selectedMemberIds, userId]);
        }
    };

    // --- Helpers for Filtering Users ---


    const { selectedProjectId: contextProjectId } = useProject();

    const getRoleBasedTeams = () => {
        let result = teams;

        // Filter by selected project context
        if (contextProjectId) {
            result = result.filter(t => t.projectId === contextProjectId);
        }

        if (userRole === 'team_leader') {
            return result.filter(t => {
                const LeaderId = String(t.leader?.userId).trim();
                const myId = String(userId).trim();
                return LeaderId === myId;
            });
        }
        else if (userRole === 'worker' || userRole === 'user') {
            return result.filter(t => {
                const myId = String(userId).trim();
                return t.members?.some(member => String(member.userId).trim() === myId);
            });
        }

        // Other role return all team
        return result;
    };

    // Eligible Leaders: Only 'team_leader' role
    const getEligibleLeaders = () => {
        return users.filter(u => u.role === 'team_leader');
    };

    // Eligible Workers: Role 'worker' primarily, or anyone not already leader
    const getEligibleWorkers = () => {
        return users.filter(u => u.userId.toString() !== selectedLeaderId && (u.role === 'worker' || u.role === 'user'));
    };

    const handleDeleteTeam = async (teamId: number, teamName: string) => {
        if (confirm(`Are you sure you want to delete ${teamName}? This action cannot be undone.`)) {
            try {
                await api.delete(`/teams/${teamId}`);
                await fetchTeams();
            } catch (err: any) {
                alertError("Something Went Wrong", { message: "Failed to delete team."});
                console.error(err.message);
                // alert(err.message || 'Failed to delete team');
            }
        }
    };

    // --- Existing Add Member Logic (Single) ---
    const openAddMemberModal = (teamId: number) => {
        setSelectedTeamId(teamId);
        setSelectedUserId('');
        setShowAddMemberModal(true);
    };

    const handleAddMember = async () => {
        if (!selectedTeamId || !selectedUserId) return;
        setIsSubmitting(true);
        try {
            await api.post(`/teams/${selectedTeamId}/members`, {
                userId: selectedUserId,
                role: 'member'
            });
            await fetchTeams();
            setShowAddMemberModal(false);
            alertSuccess("Member Added", { message: "Member added successfully!" });
            // alert('Member added successfully!');
        } catch (err: any) {
            console.error(err);
            alertError("Something Went Wrong", { message: "Failed to add member."});
            console.error(err.message);
            // alert(err.message || 'Failed to add member');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getAvailableUsersForAdd = () => {
        if (!selectedTeamId) return [];
        const team = teams.find(t => t.teamId === selectedTeamId);
        if (!team) return [];
        const memberIds = team.members.map(m => m.userId);
        if (team.leader) memberIds.push(team.leader.userId);
        return users.filter(u => !memberIds.includes(u.userId) && (u.role === 'worker' || u.role === 'user'));
    };


    if (loading) return (
        <div className="flex items-center justify-center min-h-[500px]">
            <div className="w-16 h-16 border-4 border-brand-cyan border-t-brand-teal rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-800 dark:text-white tracking-tight">Team Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Oversee your teams, assign leaders, and keep everyone organized.</p>
                </div>
                {(userRole === 'project_manager') && (
                    <div className="flex gap-4">
                        <button
                            onClick={() => openWizard()}
                            className="flex text-center justify-center items-center px-6 py-3 bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-1 transition-all duration-300"
                        >
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Create Team
                        </button>
                        {/*              
                            <Link
                                href="/dashboard/pm/users"
                                className="flex text-center justify-center items-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                            >
                                Manage Users
                            </Link> */}
                    </div>
                )}
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {/* {teams.map((team) => ( */}
                {getRoleBasedTeams().map((team) => (
                    <div
                        key={team.teamId}
                        onClick={() => router.push(`/dashboard/teams/${team.teamId}`)}
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-white/60 dark:border-gray-700 flex flex-col overflow-hidden group cursor-pointer"
                    >

                        {/* Card Header (Gradient) */}
                        <div className="h-28 bg-linear-to-r from-brand-cyan to-brand-teal relative p-6">
                            {(userRole === 'project_manager') && (
                                <div className="absolute top-4 right-4 z-20 flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); openWizard(team); }} className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-xs transition-colors" title="Edit Team">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.teamId, team.teamName); }} className="p-1.5 bg-red-500/50 hover:bg-red-500/80 text-white rounded-lg backdrop-blur-xs transition-colors" title="Delete Team">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            )}

                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                            <h2 className="text-white text-xl font-bold truncate relative z-10 w-[70%]">{team.teamName}</h2>
                            <div className="flex items-center text-cyan-100 text-xs font-bold mt-1 relative z-10 uppercase tracking-wider w-[70%] truncate">
                                <FolderIcon className="w-3 h-3 flex-shrink-0 mr-1" />
                                {team.projectTitle}
                            </div>
                        </div>

                        {/* Leader Section (Overlap) */}
                        <div className="px-6 flex justify-between items-end -mt-10 relative z-10">
                            <div className="flex flex-col items-center">
                                <Avatar
                                    name={team.leader?.name || ''}
                                    size="xl"
                                    className="border-4 border-white dark:border-gray-800 shadow-md"
                                />
                                <div className="mt-2 text-center">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Leader</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate max-w-[120px]">{team.leader?.name || 'Unassigned'}</p>
                                </div>
                            </div>
                            {(userRole === 'project_manager' || userRole === 'team_leader') && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); openAddMemberModal(team.teamId); }}
                                    className="mb-4 bg-brand-sage/20 text-brand-sage p-3 rounded-xl hover:bg-brand-sage/30 hover:scale-110 transition-all font-bold shadow-sm"
                                    title="Add Member"
                                >
                                    <UserPlusIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Stats Summary */}
                        <div className="px-6 py-4 flex gap-2 mt-2">
                            <div className="px-3 py-1 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400">
                                {team.members.length} Members
                            </div>
                            <div className="px-3 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-900/30 text-xs font-bold text-brand-cyan">
                                {team.totalTasks !== undefined ? team.totalTasks : team.members.reduce((acc, m) => acc + m.totalTasks, 0)} Tasks
                            </div>
                        </div>

                        {/* Members List */}
                        <div className="px-6 pb-6 flex-1 flex flex-col gap-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Members</h3>

                            {team.members.length > 0 ? (
                                <div className="space-y-3">
                                    {team.members.slice(0, 3).map((member) => (
                                        <div key={member.userId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <Avatar
                                                name={member.name}
                                                size="md"
                                                colorClass={member.role.includes('leader') ? 'bg-brand-peach/20 text-brand-peach' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">{member.name}</p>
                                                    <span className="text-xs text-brand-cyan font-bold">{member.progress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-brand-cyan h-1.5 rounded-full" style={{ width: `${member.progress}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {team.members.length > 3 && (
                                        <p className="text-xs text-center text-gray-400 italic">...and {team.members.length - 3} more</p>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                                    <p className="text-sm">No members yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Create New Team Card */}
                {(userRole === 'project_manager') && (
                    <button onClick={() => openWizard()} className="bg-white/50 dark:bg-gray-800/50 border-2 border-dashed border-brand-cyan/30 rounded-3xl flex flex-col items-center justify-center p-10 hover:border-brand-cyan hover:bg-cyan-50/50 dark:hover:bg-gray-800 transition-all duration-300 group cursor-pointer min-h-[400px]">
                        <div className="w-16 h-16 bg-cyan-50 dark:bg-cyan-900/20 text-brand-cyan rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <PlusIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-400 group-hover:text-brand-cyan transition-colors">Create New Team</h3>
                    </button>
                )}
            </div>

            {/* --- WIZARD MODAL --- */}
            {showWizard && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 w-full max-w-lg border border-gray-100 dark:border-gray-700 transform transition-all scale-100 relative overflow-hidden">
                        {/* Progress Bar */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gray-100 dark:bg-gray-800">
                            <div className="h-full bg-linear-to-r from-cyan-500 to-blue-600 transition-all duration-300" style={{ width: `${step * 33.33}%` }}></div>
                        </div>

                        <div className="flex justify-between items-center mb-6 mt-2">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                                {isEditing ? (
                                    <>
                                        {step === 1 && "Edit Team Info"}
                                        {step === 2 && "Change Team Leader"}
                                        {step === 3 && "Edit Members"}
                                    </>
                                ) : (
                                    <>
                                        {step === 1 && "Create Your Team"}
                                        {step === 2 && "Select a Leader"}
                                        {step === 3 && "Recruit Members"}
                                    </>
                                )}
                            </h2>
                            <button
                                onClick={() => setShowWizard(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                            >
                                &times;
                            </button>
                        </div>

                        {/* STEP 1: Basic Info */}
                        {step === 1 && (
                            <form onSubmit={handleStep1} className="space-y-6">
                                <p className="text-gray-500 text-sm">Step 1: Name your squad and assign them to a mission.</p>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Team Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Alpha Squad"
                                        value={newTeamName}
                                        onChange={e => setNewTeamName(e.target.value)}
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-brand-cyan rounded-xl font-bold outline-none transition-all dark:text-white"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assign to Project</label>
                                    <select
                                        value={selectedProjectId}
                                        onChange={e => setSelectedProjectId(e.target.value)}
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-brand-cyan rounded-xl font-bold outline-none transition-all dark:text-white"
                                        required
                                    >
                                        <option value="">-- Select Project --</option>
                                        {projects.map(p => (
                                            <option key={p.projectId} value={p.projectId}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-linear-to-r from-cyan-500 to-blue-600 text-white font-black rounded-xl shadow-lg hover:shadow-cyan-500/30 transform hover:-translate-y-1 transition-all"
                                >
                                    Next: Select Leader &rarr;
                                </button>
                            </form>
                        )}

                        {/* STEP 2: Select Leader */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <p className="text-gray-500 text-sm">Step 2: Who will lead this team? (Required)</p>
                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                                    {getEligibleLeaders().map(user => (
                                        <div
                                            key={user.userId}
                                            onClick={() => setSelectedLeaderId(user.userId.toString())}
                                            className={`p-3 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${selectedLeaderId === user.userId.toString() ? 'border-brand-cyan bg-cyan-50 dark:bg-cyan-900/20' : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-brand-peach/20 text-brand-peach flex items-center justify-center font-bold">
                                                {user.firstName?.charAt(0) || user.username.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white">{user.firstName} {user.lastName}</p>
                                                <p className="text-xs text-gray-500">{user.role}</p>
                                            </div>
                                            {selectedLeaderId === user.userId.toString() && (
                                                <div className="ml-auto text-brand-cyan">
                                                    <CheckIcon className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleStep2}
                                    disabled={!selectedLeaderId || isSubmitting}
                                    className="w-full py-4 bg-linear-to-r from-cyan-500 to-blue-600 text-white font-black rounded-xl shadow-lg hover:shadow-cyan-500/30 transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:grayscale"
                                >
                                    Next: Add Members &rarr;
                                </button>
                            </div>
                        )}

                        {/* STEP 3: Add Members */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <p className="text-gray-500 text-sm">Step 3: Recruit workers to the team. (Optional)</p>
                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                                    {getEligibleWorkers().length > 0 ? getEligibleWorkers().map(user => (
                                        <div
                                            key={user.userId}
                                            onClick={() => toggleMemberSelection(user.userId.toString())}
                                            className={`p-3 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${selectedMemberIds.includes(user.userId.toString()) ? 'border-brand-sage bg-green-50 dark:bg-green-900/20' : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center font-bold">
                                                {user.firstName?.charAt(0) || user.username.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white">{user.firstName} {user.lastName}</p>
                                                <p className="text-xs text-gray-500">{user.role}</p>
                                            </div>
                                            {selectedMemberIds.includes(user.userId.toString()) && (
                                                <div className="ml-auto text-brand-sage">
                                                    <CheckIcon className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                    )) : (
                                        <p className="text-center text-gray-400 py-4">No eligible workers found.</p>
                                    )}
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowWizard(false)}
                                        className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                    >
                                        Skip this step
                                    </button>
                                    <button
                                        onClick={handleStep3}
                                        disabled={isSubmitting}
                                        className="flex-1 py-4 bg-linear-to-r from-brand-sage to-emerald-600 text-white font-black rounded-xl shadow-lg hover:shadow-green-500/30 transform hover:-translate-y-1 transition-all"
                                    >
                                        {selectedMemberIds.length > 0 ? `Add ${selectedMemberIds.length} Members` : 'Finish Setup'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- EXISTING ADD MEMBER MODAL (For single adds) --- */}
            {showAddMemberModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Add Team Member</h2>
                            <button onClick={() => setShowAddMemberModal(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-red-500">&times;</button>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Select User</label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-brand-cyan rounded-xl font-bold dark:text-white outline-none"
                            >
                                <option value="">-- Choose a worker --</option>
                                {getAvailableUsersForAdd().map(u => (
                                    <option key={u.userId} value={u.userId}>{u.firstName} {u.lastName} ({u.role})</option>
                                ))}
                            </select>
                        </div>
                        <button onClick={handleAddMember} disabled={!selectedUserId || isSubmitting} className="w-full py-3 bg-brand-cyan text-white font-bold rounded-xl shadow-lg">
                            Add Member
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function PlusIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg> }
function FolderIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> }
function UserPlusIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> }
function CheckIcon({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> }
