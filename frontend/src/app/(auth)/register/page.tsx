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
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-cyan-50 p-6 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-lg border-2 border-white/50 relative z-10">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-black text-gray-800 tracking-tight mb-2">Create Account</h2>
                    <p className="text-gray-500 font-medium">Join us and start managing your projects.</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r mb-6 shadow-sm">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2 ml-1" htmlFor="firstName">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-cyan-500 focus:bg-white text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-300 shadow-sm font-medium"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2 ml-1" htmlFor="lastName">Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-cyan-500 focus:bg-white text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-300 shadow-sm font-medium"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2 ml-1" htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-cyan-500 focus:bg-white text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-300 shadow-sm font-medium"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2 ml-1" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-cyan-500 focus:bg-white text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-300 shadow-sm font-medium"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2 ml-1" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-cyan-500 focus:bg-white text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-300 shadow-sm font-medium"
                            required
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-2xl hover:from-cyan-600 hover:to-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Account...
                                </span>
                            ) : 'Create Account'}
                        </button>
                    </div>
                </form>

                <p className="mt-8 text-center text-gray-500 font-medium">
                    Already have an account?{' '}
                    <Link href="/login" className="text-cyan-600 font-bold hover:text-cyan-700 hover:underline transition-colors">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
