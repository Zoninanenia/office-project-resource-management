import React from 'react';

export type BadgeType = 'task' | 'project' | 'user';

export interface StatusBadgeProps {
    status: string;
    type?: BadgeType;
    className?: string;
}

export function StatusBadge({ status, type = 'task', className = '' }: StatusBadgeProps) {
    let colorClass = '';
    let displayValue = status;

    if (type === 'task') {
        const normalizedStatus = status.toLowerCase();
        displayValue = normalizedStatus === 'review' ? 'Review'
            : normalizedStatus === 'in_progress' ? 'In Progress'
                : normalizedStatus === 'done' ? 'Done'
                    : 'To Do';

        colorClass = normalizedStatus === 'todo' ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            : normalizedStatus === 'in_progress' ? 'bg-brand-cyan/20 text-brand-cyan'
                : 'bg-brand-sage/20 text-brand-sage';
    } else if (type === 'project') {
        const normalizedStatus = status.toLowerCase();
        // from getProjectGradient logic, though these are typically just badges:
        colorClass = 'bg-white/20 backdrop-blur-md text-white border border-white/20';
        displayValue = status.toUpperCase();
    } else if (type === 'user') {
        // user roles
        const normalizedRole = status.toLowerCase();
        displayValue = normalizedRole.replace('_', ' ').toUpperCase();
        colorClass = normalizedRole === 'admin' ? 'bg-purple-500/10 text-purple-500' :
            normalizedRole === 'project_manager' ? 'bg-brand-peach/10 text-brand-peach' :
                normalizedRole === 'team_leader' ? 'bg-brand-cyan/10 text-brand-cyan' :
                    normalizedRole === 'worker' ? 'bg-brand-sage/10 text-brand-sage' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-500';
    }

    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${colorClass} ${className}`}>
            {displayValue}
        </span>
    );
}
