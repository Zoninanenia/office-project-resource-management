import React from 'react';

export interface StatCardProps {
    title: string;
    value: number | string;
    icon?: React.ReactNode;
    color: string;
}

export function StatCard({ title, value, icon, color }: StatCardProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-md border border-gray-100 dark:border-gray-700 hover:-translate-y-2 transition-transform duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-2xl bg-linear-to-br ${color} shadow-lg group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 font-bold text-sm uppercase tracking-wider">{title}</h3>
            <p className="text-3xl font-black text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    );
}
