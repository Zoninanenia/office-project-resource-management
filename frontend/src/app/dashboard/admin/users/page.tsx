'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User, UserRole } from '@/types';
import { SearchBar } from '@/components/SearchBar';
import { StatusBadge } from '@/components/StatusBadge';

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

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
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUserId(user.userId);
        }
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId: number, newRole: UserRole) => {
        try {
            await api.put(`/users/${userId}/role`, { role: newRole });
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
            fetchUsers();
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

    // Filter Users
    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.firstName?.toLowerCase() || '').includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center h-[500px]">
            <div className="w-16 h-16 border-4 border-brand-cyan border-t-brand-teal rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight leading-tiht">User Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Overview of all team members and roles.</p>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <SearchBar
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Find user..."
                        className="w-full md:w-64"
                    />

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-2.5 bg-brand-cyan hover:bg-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 transition-all flex items-center justify-center whitespace-nowrap"
                    >
                        + Add User
                    </button>
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUsers.map((user) => (
                    <div key={user.userId} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border-b-4 border-gray-100 dark:border-gray-700 hover:border-brand-cyan hover:-translate-y-1 transition-all flex flex-col items-center text-center group relative overflow-hidden">

                        {/* Role Color Stripe top */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 
                            ${user.role === 'admin' ? 'bg-purple-500' :
                                user.role === 'project_manager' ? 'bg-brand-peach' :
                                    user.role === 'team_leader' ? 'bg-brand-cyan' :
                                        user.role === 'worker' ? 'bg-brand-sage' : 'bg-gray-300'
                            }`}>
                        </div>

                        <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-700 p-1 mb-4 shadow-inner">
                            <div className={`w-full h-full rounded-full flex items-center justify-center text-2xl font-black uppercase
                                ${user.role === 'admin' ? 'bg-purple-500 text-white' :
                                    user.role === 'project_manager' ? 'bg-brand-peach text-white' :
                                        user.role === 'team_leader' ? 'bg-brand-cyan text-white' :
                                            user.role === 'worker' ? 'bg-brand-sage text-white' : 'bg-gray-400 text-white'
                                }`}>
                                {user.firstName ? user.firstName.charAt(0) : user.username.charAt(0)}
                            </div>
                        </div>

                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{user.firstName} {user.lastName}</h3>
                        <p className="text-gray-400 dark:text-gray-500 text-xs font-bold mb-4 uppercase tracking-widest">@{user.username}</p>

                        <div className="mb-6">
                            <StatusBadge status={user.role} type="user" />
                        </div>

                        <div className="w-full mt-auto">
                            {user.userId === currentUserId ? (
                                <div className="w-full py-2 px-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-bold text-gray-400 dark:text-gray-500 text-center cursor-not-allowed border border-gray-200 dark:border-gray-700">
                                    Current User
                                </div>
                            ) : (
                                <select
                                    value={user.role}
                                    onChange={(e) => handleRoleChange(user.userId, e.target.value as UserRole)}
                                    disabled={user.role === 'admin'}
                                    className={`w-full py-2 px-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-cyan transition-colors ${user.role === 'admin' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <option value="user">User</option>
                                    <option value="worker">Worker</option>
                                    <option value="team_leader">Team Leader</option>
                                    <option value="project_manager">Project Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-md shadow-2xl scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Create New User</h2>
                            <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-500 transition-colors">
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Info</label>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        value={newUser.username}
                                        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-brand-cyan rounded-xl font-medium outline-none transition-all dark:text-white"
                                        required
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-brand-cyan rounded-xl font-medium outline-none transition-all dark:text-white"
                                        required
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-brand-cyan rounded-xl font-medium outline-none transition-all dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Profile Details</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        value={newUser.firstName}
                                        onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-brand-cyan rounded-xl font-medium outline-none transition-all dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        value={newUser.lastName}
                                        onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-brand-cyan rounded-xl font-medium outline-none transition-all dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assign Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-brand-cyan rounded-xl font-bold outline-none transition-all dark:text-white cursor-pointer"
                                >
                                    <option value="user">User</option>
                                    <option value="worker">Worker</option>
                                    <option value="team_leader">Team Leader</option>
                                    <option value="project_manager">Project Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 mt-4 bg-brand-cyan hover:bg-cyan-400 text-white font-black rounded-xl shadow-lg hover:shadow-cyan-500/30 transform hover:-translate-y-1 transition-all"
                            >
                                Create User Account
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
