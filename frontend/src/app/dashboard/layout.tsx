'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        // Check for token
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        }

        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserRole(user.role);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col fixed inset-y-0 left-0 z-10">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-6">PM System</h1>

                    {/* Current Role Box */}
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-6">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Current Role</p>
                        <p className="text-gray-800 dark:text-white font-bold capitalize">{userRole?.replace('_', ' ') || 'Guest'}</p>
                    </div>

                    <nav className="space-y-1">
                        <Link href="/dashboard" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <span className="material-icons mr-3 text-sm opacity-70">dashboard</span>
                            <span>Dashboard</span>
                        </Link>
                        <Link href="/dashboard/projects" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <span className="material-icons mr-3 text-sm opacity-70">folder</span>
                            <span>Projects</span>
                        </Link>
                        <Link href="/dashboard/tasks" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <span className="material-icons mr-3 text-sm opacity-70">list</span>
                            <span>Tasks</span>
                        </Link>
                        <Link href="/dashboard/teams" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <span className="material-icons mr-3 text-sm opacity-70">people</span>
                            <span>Teams</span>
                        </Link>
                        <Link href="/dashboard/issues" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <span className="material-icons mr-3 text-sm opacity-70">bug_report</span>
                            <span>Issues</span>
                        </Link>
                        <Link href="/dashboard/settings" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <span className="material-icons mr-3 text-sm opacity-70">settings</span>
                            <span>Settings</span>
                        </Link>

                        {/* PM Only Links */}
                        {(userRole === 'project_manager') && (
                            <>
                                <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4">
                                    Management
                                </div>
                                <Link href="/dashboard/pm/users" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                    <span className="material-icons mr-3 text-sm opacity-70">admin_panel_settings</span>
                                    <span>Users & Roles</span>
                                </Link>
                            </>
                        )}
                    </nav>
                </div>

                <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <span className="material-icons mr-3">logout</span>
                        <span>Logout</span>
                    </button>
                    {/* Add Dark Mode Toggle here later */}
                    <div className="mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50">
                        <span className="material-icons text-sm mr-2">dark_mode</span> Dark Mode
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
