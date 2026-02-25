'use client'
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function SettingsPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserRole(user.role);
            setUserId(user.userid);
        }
    }, []);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        if (password.trim().length === 0) {
            alert('Password cannot be empty');
            return;
        }

        try {
            await api.put(`/users/${userId}/newpassword/`, { password });
            alert('Password updated successfully');
            setConfirmPassword('');
        }catch (err) {
               alert('Failed to update password');
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Settings</h1>
            {userRole === 'user' ? (   
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 max-w-[600px]">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Reset Password</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                        >
                            Update Password
                        </button>
                    </form>
                </div>
            ) : (
                <div>
                    <p className="text-gray-600">Settings coming soon...</p>
                </div>
            )}
        </div>
    );
}



// export default function SettingsPage() {
//     return (
//         <div>
//             <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Settings</h1>
//             <p className="text-gray-600">Settings coming soon...</p>
//         </div>
//     );
// }