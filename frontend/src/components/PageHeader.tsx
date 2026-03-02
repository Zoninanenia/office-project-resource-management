import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-4xl font-black text-gray-800 dark:text-white tracking-tight">{title}</h1>
                {description && <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">{description}</p>}
            </div>
            {actions && <div className="flex gap-4">{actions}</div>}
        </div>
    );
}
