'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface ActivityData {
    type: string;
    title: string;
    description: string;
    timestamp: string;
}

const LIMIT = 20;

export default function ActivityPage() {
    const [activities, setActivities] = useState<ActivityData[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const [filter, setFilter] = useState<string>('all');

    const fetchActivities = useCallback(async (currentOffset: number, append: boolean = false) => {
        try {
            if (append) setLoadingMore(true); else setLoading(true);
            const data = await api.get<ActivityData[]>(`/dashboard/activity?limit=${LIMIT}&offset=${currentOffset}`);
            if (data.length < LIMIT) setHasMore(false);
            setActivities(prev => append ? [...prev, ...data] : data);
            setOffset(currentOffset + data.length);
        } catch (err) {
            console.error('Failed to fetch activities', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchActivities(0);
    }, [fetchActivities]);

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            fetchActivities(offset, true);
        }
    };

    const timeAgo = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMs / 3600000);
        const diffDay = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin} minutes ago`;
        if (diffHour < 24) return `${diffHour} hours ago`;
        if (diffDay === 1) return 'Yesterday';
        if (diffDay < 7) return `${diffDay} days ago`;
        return date.toLocaleDateString();
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'project_created':
                return (
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                    </div>
                );
            case 'task_completed':
                return (
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case 'task_created':
                return (
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
                        <svg className="w-5 h-5 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                );
            case 'member_joined':
                return (
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                        <svg className="w-5 h-5 text-brand-peach" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                        <div className="w-5 h-5 rounded-full bg-gray-400"></div>
                    </div>
                );
        }
    };

    const getActivityLabel = (type: string) => {
        switch (type) {
            case 'project_created': return 'New Project';
            case 'task_completed': return 'Task Completed';
            case 'task_created': return 'New Task';
            case 'member_joined': return 'Member Joined';
            default: return 'Activity';
        }
    };

    const getLabelColor = (type: string) => {
        switch (type) {
            case 'project_created': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'task_completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
            case 'task_created': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300';
            case 'member_joined': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const filteredActivities = filter === 'all'
        ? activities
        : activities.filter(a => a.type === filter);

    const filterOptions = [
        { value: 'all', label: 'All Activity' },
        { value: 'project_created', label: 'Projects' },
        { value: 'task_created', label: 'Tasks Created' },
        { value: 'task_completed', label: 'Tasks Completed' },
        { value: 'member_joined', label: 'Members Joined' },
    ];

    if (loading) return (
        <div className="flex items-center justify-center h-[500px]">
            <div className="w-16 h-16 border-4 border-brand-cyan border-t-brand-teal rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Link
                            href="/dashboard"
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                            title="Back to Dashboard"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
                            Recent Activity
                        </h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium ml-12">
                        All activity across your projects and teams.
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {filterOptions.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => setFilter(opt.value)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === opt.value
                                ? 'bg-brand-cyan text-white shadow-lg shadow-cyan-500/20'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-2 border-gray-100 dark:border-gray-700 hover:border-brand-cyan hover:text-brand-cyan'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Activity List */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                {filteredActivities.length > 0 ? (
                    <div className="space-y-1">
                        {filteredActivities.map((activity, index) => (
                            <div
                                key={index}
                                className="flex gap-4 items-start p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
                            >
                                {getActivityIcon(activity.type)}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getLabelColor(activity.type)}`}>
                                            {getActivityLabel(activity.type)}
                                        </span>
                                        <span className="text-xs text-gray-400 font-semibold">
                                            {timeAgo(activity.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                                        {activity.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-center text-gray-400 dark:text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium">No activity found.</p>
                    </div>
                )}

                {/* Load More */}
                {hasMore && filter === 'all' && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all text-sm disabled:opacity-50"
                        >
                            {loadingMore ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    Loading...
                                </span>
                            ) : (
                                'Load More'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
