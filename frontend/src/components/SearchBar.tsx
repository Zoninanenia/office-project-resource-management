import React from 'react';

export interface SearchBarProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    className?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search...", className = "" }: SearchBarProps) {
    return (
        <div className={`relative flex-1 ${className}`}>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl font-medium focus:border-brand-cyan focus:outline-none transition-all dark:text-white"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        </div>
    );
}
