'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/register', formData);
            router.push('/login');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl w-full max-w-lg border border-white/20">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Create Account</h2>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-white px-4 py-2 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-200 text-sm font-bold mb-1" htmlFor="firstName">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-transparent focus:border-white focus:bg-white/30 text-white placeholder-gray-300 focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-200 text-sm font-bold mb-1" htmlFor="lastName">Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-transparent focus:border-white focus:bg-white/30 text-white placeholder-gray-300 focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-200 text-sm font-bold mb-1" htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg bg-white/20 border border-transparent focus:border-white focus:bg-white/30 text-white placeholder-gray-300 focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-200 text-sm font-bold mb-1" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg bg-white/20 border border-transparent focus:border-white focus:bg-white/30 text-white placeholder-gray-300 focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-200 text-sm font-bold mb-1" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg bg-white/20 border border-transparent focus:border-white focus:bg-white/30 text-white placeholder-gray-300 focus:outline-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-indigo-600 font-bold py-3 px-4 rounded-lg hover:bg-gray-100 transition duration-300 mt-4 transform hover:scale-105"
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-200">
                    Already have an account?{' '}
                    <Link href="/login" className="text-white font-bold hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
