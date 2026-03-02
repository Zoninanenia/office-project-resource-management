import React from 'react';

export interface AvatarProps {
    name: string;
    colorClass?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export function Avatar({ name, colorClass, size = 'md', className = '' }: AvatarProps) {
    const sizeClasses = {
        sm: 'w-6 h-6 text-[10px]',
        md: 'w-8 h-8 text-xs',
        lg: 'w-10 h-10 text-sm',
        xl: 'w-20 h-20 text-2xl p-1',
    };

    const initial = name ? name.charAt(0).toUpperCase() : '?';

    // Default color if undefined
    const bgColor = colorClass || 'bg-brand-peach text-white dark:bg-brand-peach/80';

    return (
        <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold ${bgColor} ${className}`}
            title={name}
        >
            {initial}
        </div>
    );
}

export interface AvatarGroupProps {
    members: Array<{ id: string | number; name: string }>;
    maxCount?: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function AvatarGroup({ members, maxCount = 4, size = 'sm', className = '' }: AvatarGroupProps) {
    if (!members || members.length === 0) {
        return (
            <Avatar name="?" colorClass="bg-gray-200 dark:bg-gray-700 text-gray-400" size={size} className={className} />
        );
    }

    const showMembers = members.slice(0, maxCount);
    const extraCount = members.length - maxCount;

    return (
        <div className={`flex -space-x-2 ${className}`}>
            {showMembers.map((member) => (
                <Avatar
                    key={member.id}
                    name={member.name}
                    size={size}
                    className="ring-2 ring-white dark:ring-gray-800"
                />
            ))}
            {extraCount > 0 && (
                <div
                    className={`rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold z-10 
                        ${size === 'sm' ? 'w-6 h-6 text-[10px]' :
                            size === 'md' ? 'w-8 h-8 text-xs' :
                                'w-10 h-10 text-sm'
                        }`}
                    title={`${extraCount} more`}
                >
                    +{extraCount}
                </div>
            )}
        </div>
    );
}
