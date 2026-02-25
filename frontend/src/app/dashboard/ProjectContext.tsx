'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

interface ProjectOption {
    projectId: number;
    title: string;
}

interface ProjectContextType {
    selectedProjectId: number | null;
    setSelectedProjectId: (id: number | null) => void;
    projects: ProjectOption[];
}

const ProjectContext = createContext<ProjectContextType>({
    selectedProjectId: null,
    setSelectedProjectId: () => { },
    projects: [],
});

export function ProjectProvider({ children }: { children: ReactNode }) {
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [projects, setProjects] = useState<ProjectOption[]>([]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await api.get<ProjectOption[]>('/projects');
                setProjects(data);
            } catch (err) {
                console.error('Failed to fetch projects for context selector', err);
            }
        };
        fetchProjects();
    }, []);

    return (
        <ProjectContext.Provider value={{ selectedProjectId, setSelectedProjectId, projects }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    return useContext(ProjectContext);
}
