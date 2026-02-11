'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { User } from '@/types'; // Assuming User type is exported from types

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

export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);

    // Add Member Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchTeams();
        fetchUsers();
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

    const openAddModal = (teamId: number) => {
        setSelectedTeamId(teamId);
        setSelectedUserId('');
        setShowAddModal(true);
    };

    const handleAddMember = async () => {
        if (!selectedTeamId || !selectedUserId) return;
        setIsAdding(true);
        try {
            // Defaulting role to 'member' (worker) for now as requested
            await api.post(`/teams/${selectedTeamId}/members`, {
                userId: selectedUserId,
                role: 'member'
            });

            // Refresh teams to show new member
            await fetchTeams();
            setShowAddModal(false);
            alert('Member added successfully!');
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to add member');
        } finally {
            setIsAdding(false);
        }
    };

    // Filter users not already in the selected team
    const getAvailableUsers = () => {
        if (!selectedTeamId) return [];
        const team = teams.find(t => t.teamId === selectedTeamId);
        if (!team) return [];

        const memberIds = team.members.map(m => m.userId);
        // Also exclude leader if valid
        if (team.leader) memberIds.push(team.leader.userId);

        return users.filter(u => !memberIds.includes(u.userId) && u.role !== 'project_manager');
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Team Management</h1>
                <Link
                    href="/dashboard/pm/users"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow transition-colors"
                >
                    + Assign Workers to Team
                </Link>
            </div>

            <div className="grid gap-6">
                {teams.map((team) => (
                    <div key={team.teamId} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                        {/* Team Header */}
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        {team.teamName} <span className="text-gray-400 font-normal mx-2">|</span> <span className="text-sm text-gray-500 dark:text-gray-400">{team.projectTitle}</span>
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Team Leader: <span className="font-medium text-gray-700 dark:text-gray-300">{team.leader?.name || 'Unassigned'}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openAddModal(team.teamId)}
                                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Add Member
                                </button>
                                <button className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">
                                    View Details
                                </button>
                            </div>
                        </div>

                        {/* Members Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member Name</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigned Tasks</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {team.members.length > 0 ? (
                                        team.members.map((member) => (
                                            <tr key={member.userId}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                                            {member.name.charAt(0)}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                        ${member.role === 'leader' || member.role === 'team_leader' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                        {member.role === 'team_leader' ? 'Leader' : 'Worker'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {member.totalTasks} tasks
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-1 w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                                                            <div
                                                                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                                                                style={{ width: `${member.progress}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">{member.progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                                                        Assign Task
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                No members assigned to this team.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}

                {teams.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No teams</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new team.</p>
                        <div className="mt-6">
                            <Link
                                href="/dashboard/pm/users"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Create Team
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Member</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                                &times;
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select User</label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="">-- Select a user --</option>
                                {getAvailableUsers().map(user => (
                                    <option key={user.userId} value={user.userId}>
                                        {user.firstName} {user.lastName} (@{user.username})
                                    </option>
                                ))}
                            </select>
                            {getAvailableUsers().length === 0 && (
                                <p className="text-xs text-orange-500 mt-1">No available users to add.</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddMember}
                                disabled={!selectedUserId || isAdding}
                                className={`px-4 py-2 text-white rounded ${!selectedUserId || isAdding ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                {isAdding ? 'Adding...' : 'Add Member'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
