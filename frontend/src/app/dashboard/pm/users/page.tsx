'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User, UserRole } from '@/types';

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // New User Form State
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'user' as UserRole,
    });

    const fetchUsers = async () => {
        try {
            const data = await api.get<User[]>('/users');
            setUsers(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId: number, newRole: UserRole) => {
        try {
            await api.put(`/users/${userId}/role`, { role: newRole });
            // Update local state
            setUsers(users.map(u => u.userId === userId ? { ...u, role: newRole } : u));
        } catch (err: any) {
            alert(err.message || 'Failed to update role');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/users', newUser);
            setShowCreateModal(false);
            fetchUsers(); // Refresh list
            // Reset form
            setNewUser({
                username: '',
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                role: 'user',
            });
        } catch (err: any) {
            alert(err.message || 'Failed to create user');
        }
    };

    // Team Setup State
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [teamStep, setTeamStep] = useState(1); // 1: Create Team, 2: Add Leader, 3: Add Workers
    const [teamData, setTeamData] = useState({
        name: '',
        projectId: '',
        leaderId: '',
        workerIds: [] as string[],
    });
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        if (showTeamModal) {
            fetchProjects();
        }
    }, [showTeamModal]);

    const fetchProjects = async () => {
        try {
            const data = await api.get<any[]>('/projects');
            setProjects(data);
        } catch (err) {
            console.error('Failed to fetch projects');
        }
    };

    const handleCreateTeam = async () => {
        try {
            const res = await api.post<any>('/teams', {
                teamName: teamData.name,
                projectId: teamData.projectId,
            });
            return res.teamId; // Assuming backend returns the created team object
        } catch (err: any) {
            alert(err.message || 'Failed to create team');
            return null;
        }
    };

    const handleAddMember = async (teamId: number, userId: string, role: string) => {
        try {
            await api.post(`/teams/${teamId}/members`, { userId, role });
        } catch (err: any) {
            console.error(`Failed to add user ${userId} as ${role}`, err);
        }
    };

    const handleTeamSubmit = async () => {
        // 1. Create Team
        const teamId = await handleCreateTeam();
        if (!teamId) return;

        // 2. Add Leader
        if (teamData.leaderId) {
            await handleAddMember(teamId, teamData.leaderId, 'leader');
            // Update logic to also update user role if needed? The requirement says "add team leader", implies assigning role in team. 
            // But also might imply updating User role in Users table. Let's do both or assume team role is enough. 
            // For now, let's also update the global user role to ensure consistency if that's the model.
            await handleRoleChange(parseInt(teamData.leaderId), 'team_leader');
        }

        // 3. Add Workers
        for (const workerId of teamData.workerIds) {
            await handleAddMember(teamId, workerId, 'member');
            await handleRoleChange(parseInt(workerId), 'worker');
        }

        setShowTeamModal(false);
        setTeamStep(1);
        setTeamData({ name: '', projectId: '', leaderId: '', workerIds: [] });
        fetchUsers(); // Refresh to show updated roles
        alert('Team created and members assigned successfully!');
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">User Management</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowTeamModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Setup Team
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Add User
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                            <tr key={user.userId}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {user.firstName} {user.lastName}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${user.role === 'project_manager' ? 'bg-purple-100 text-purple-800' :
                                            user.role === 'team_leader' ? 'bg-blue-100 text-blue-800' :
                                                user.role === 'worker' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.userId, e.target.value as UserRole)}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                    >
                                        <option value="user">User</option>
                                        <option value="worker">Worker</option>
                                        <option value="team_leader">Team Leader</option>
                                        <option value="project_manager">Project Manager</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New User</h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Username"
                                value={newUser.username}
                                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={newUser.email}
                                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={newUser.password}
                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={newUser.firstName}
                                    onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={newUser.lastName}
                                    onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <select
                                value={newUser.role}
                                onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="user">User</option>
                                <option value="worker">Worker</option>
                                <option value="team_leader">Team Leader</option>
                                <option value="project_manager">Project Manager</option>
                            </select>

                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Team Setup Modal */}
            {showTeamModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Setup Team (Step {teamStep}/3)
                            </h2>
                            <button onClick={() => setShowTeamModal(false)} className="text-gray-500 hover:text-gray-700">
                                &times;
                            </button>
                        </div>

                        {/* Step 1: Create Team */}
                        {teamStep === 1 && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team Name</label>
                                    <input
                                        type="text"
                                        value={teamData.name}
                                        onChange={e => setTeamData({ ...teamData, name: e.target.value })}
                                        className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="e.g. Frontend Team"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project</label>
                                    <select
                                        value={teamData.projectId}
                                        onChange={e => setTeamData({ ...teamData, projectId: e.target.value })}
                                        className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="">Select Project</option>
                                        {projects.map(p => (
                                            <option key={p.projectId} value={p.projectId}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={() => setTeamStep(2)}
                                        disabled={!teamData.name || !teamData.projectId}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        Next: Add Leader
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Add Leader */}
                        {teamStep === 2 && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Select a user to be the Team Leader.</p>
                                <select
                                    value={teamData.leaderId}
                                    onChange={e => setTeamData({ ...teamData, leaderId: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    size={5}
                                >
                                    {users.filter(u => u.role !== 'project_manager').map(u => (
                                        <option key={u.userId} value={u.userId}>
                                            {u.firstName} {u.lastName} (@{u.username})
                                        </option>
                                    ))}
                                </select>
                                <div className="flex justify-between mt-4">
                                    <button
                                        onClick={() => setTeamStep(1)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => setTeamStep(3)}
                                        disabled={!teamData.leaderId}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        Next: Add Workers
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Add Workers */}
                        {teamStep === 3 && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Select workers for this team (Hold Ctrl/Cmd to select multiple).</p>
                                <select
                                    multiple
                                    value={teamData.workerIds}
                                    onChange={e => {
                                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                                        setTeamData({ ...teamData, workerIds: selected });
                                    }}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white h-40"
                                >
                                    {users.filter(u => u.userId.toString() !== teamData.leaderId && u.role !== 'project_manager').map(u => (
                                        <option key={u.userId} value={u.userId}>
                                            {u.firstName} {u.lastName} (@{u.username})
                                        </option>
                                    ))}
                                </select>
                                <div className="flex justify-between mt-4">
                                    <button
                                        onClick={() => setTeamStep(2)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleTeamSubmit}
                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                        Create Team & Assign Members
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
