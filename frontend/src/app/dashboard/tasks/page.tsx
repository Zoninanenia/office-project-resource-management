'use client';

import { useEffect, useState, useRef } from 'react';
import { api, API_BASE_URL } from '@/lib/api';
import { Task, User } from '@/types';
import { useProject } from '../ProjectContext';
import TaskModal from '@/components/TaskModal';
import { SearchBar } from '@/components/SearchBar';
import { StatusBadge } from '@/components/StatusBadge';
import { AvatarGroup } from '@/components/Avatar';
import { alertError } from '@/components/Alertmodal';



// Extend Task type locally if needed for extra fields from join
interface ExtendedTask extends Task {
    projectName: string;
}

interface Member {
    userId: number;
    name: string;
    username: string;
    role: string;
    profilePic: string | null;
    totalTasks: number;
    completedTasks: number;
    progress: number;
}

interface Team {
    teamId: number;
    teamName: string;
    projectId: number;
    projectTitle: string;
    leader: Member | null;
    members: Member[];
}

interface Attachment {
    attachmentId: number;
    fileName: string;
    fileUrl: string;
    fileSize: number | null;
    mimeType: string | null;
    uploadedAt: string;
    uploadedBy: string;
}

interface TaskComment {
    taskCommentId: number;
    comment: string;
    createdDate: string;
    userId: number;
    username: string;
    profilePic: string | null;
}

export default function GlobalTasksPage() {
    const [tasks, setTasks] = useState<ExtendedTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [userRole, setUserRole] = useState<string | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [filterTeamId, setFilterTeamId] = useState<string>('');

    // Create/Edit Task Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [projects, setProjects] = useState<{ projectId: number, title: string }[]>([]);
    const [potentialAssignees, setPotentialAssignees] = useState<User[]>([]);
    const [newTask, setNewTask] = useState({
        projectId: '',
        taskName: '',
        description: '',
        status: 'todo',
        dueDate: '',
        estimatedHours: '',
        assignedTo: [] as string[],
        dependencies: [] as number[],
        teamId: '',
    });
    const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
    const today = new Date().toISOString().split('T')[0];

    // Reorder-based dependency drag state
    const [dropSlotKey, setDropSlotKey] = useState<string | null>(null);
    const [savingDep, setSavingDep] = useState(false);

    // Attachment Panel State
    const [attachmentTask, setAttachmentTask] = useState<ExtendedTask | null>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [attachmentLoading, setAttachmentLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const BACKEND_URL = API_BASE_URL.replace('/api', '');

    // Comments Panel State
    const [commentTask, setCommentTask] = useState<ExtendedTask | null>(null);
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState<number | null>(null);

    // --- State สำหรับระบบ Mention ---
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const [selectedMentions, setSelectedMentions] = useState<number[]>([]);
    const commentInputRef = useRef<HTMLInputElement>(null);
    const [pmUsers, setPmUsers] = useState<User[]>([]);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserRole(user.role);
            setUserId(user.userid);
        }

        const fetchTasks = async () => {
            try {
                const data = await api.get<ExtendedTask[]>('/tasks');
                setTasks(data);
            } catch (err: any) {
                console.error(err.message || 'Failed to fetch tasks');
                setError(err.message || 'Failed to fetch tasks');
            } finally {
                setLoading(false);
            }
        };

        const fetchTeams = async () => {
            try {
                const data = await api.get<Team[]>('/teams');
                setTeams(data);
            } catch (err) {
                console.error('Failed to fetch teams', err);
            } finally {
                setLoading(false);
            }
        };

        const fetchAllUsersForPM = async () => {
            try {
                // 🌟 แก้ไข: บังคับขอเฉพาะ Project Manager ตรงๆ จาก Backend
                // เพื่อให้ Worker/Team Leader สามารถมองเห็นรายชื่อ PM ได้
                const data = await api.get<User[]>('/users?role=project_manager');

                // กรองซ้ำเผื่อ Backend ไม่รองรับ Query Param แล้วส่งมาทุกคน
                const pms = data.filter(u => u.role === 'project_manager');

                // ถ้าระบบส่ง PM มาสำเร็จ ให้เก็บลง State เลย
                if (pms.length > 0) {
                    setPmUsers(pms);
                } else if (data && data.length > 0) {
                    // เผื่อกรณี Backend ไม่ได้กรอง role ให้แต่ส่งข้อมูลมา
                    setPmUsers(data);
                }
            } catch (err) {
                console.error('Failed to fetch PMs', err);
            }
        };

        fetchTasks();
        fetchTeams();
        fetchAllUsersForPM();
    }, []);



    // Fetch resources for modal
    const handleOpenCreateModal = async (taskToEdit?: ExtendedTask) => {
        try {
            if (projects.length === 0) {
                const projectData = await api.get<{ projectId: number, title: string }[]>('/projects');
                setProjects(projectData);
            }
            if (potentialAssignees.length === 0) {
                const userData = await api.get<User[]>('/users?role=worker');
                setPotentialAssignees(userData);
            }

            if (taskToEdit) {
                setIsEditing(true);
                setEditingTaskId(taskToEdit.taskId);
                const isoDate = taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().split('T')[0] : '';
                setNewTask({
                    projectId: taskToEdit.projectId.toString(),
                    taskName: taskToEdit.taskName,
                    description: taskToEdit.description || '',
                    status: taskToEdit.status,
                    dueDate: isoDate,
                    estimatedHours: taskToEdit.estimatedHours ? taskToEdit.estimatedHours.toString() : '',
                    assignedTo: taskToEdit.assignees ? taskToEdit.assignees.map((a: any) => a.workerId.toString()) : [],
                    dependencies: taskToEdit.dependencies || [],
                    teamId: taskToEdit.teamId ? taskToEdit.teamId.toString() : '',
                });
            } else {
                setIsEditing(false);
                setEditingTaskId(null);
                setNewTask({
                    projectId: '',
                    taskName: '',
                    description: '',
                    status: 'todo',
                    dueDate: '',
                    estimatedHours: '',
                    assignedTo: [],
                    dependencies: [],
                    teamId: '',
                });
            }

        } catch (err) {
            console.error('Failed to fetch resources', err);
        } finally {
            setShowCreateModal(true);
        }
    };

    const getRoleBasedTeams = () => {
        return teams.filter(t => {
            return t.members?.some(member => String(member.userId).trim() === String(userId).trim());
        });
    };

    const filteredProjectss = projects.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
        let hasAccess = true;
        if (userRole === 'team_leader' || userRole === 'worker' || userRole === 'user') {
            const myTeams = getRoleBasedTeams();
            hasAccess = myTeams.some(team => String(team.projectId) === String(p.projectId));
        }
        return matchesSearch && hasAccess;
    });



    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.projectId) {
            alertError("Incomplete Form", { message: "Please select a project." });
            // alert('Please select a project');
            return;
        }

        if (!newTask.taskName || !newTask.taskName.trim()) {
            alertError("Incomplete Form", { message: "Please enter a task name." });
            // alert("Please enter a task name");
            return;
        }

        // if (!newTask.description || !newTask.description.trim()) {
        //     alertError("Incomplete Form", { message: "Please enter a description."});
        //     // alert("Please enter a description");
        //     return;
        // }

        if (!newTask.dueDate) {
            alertError("Incomplete Form", { message: "Please select a due date." });
            // alert("Please select a due date");
            return;
        }

        try {
            if (isEditing && editingTaskId) {
                await api.put(`/tasks/${editingTaskId}`, {
                    ...newTask,
                    projectId: undefined // not updated here, but prevent error
                });
            } else {
                await api.post(`/tasks/project/${newTask.projectId}`, {
                    ...newTask,
                    projectId: undefined
                });
            }
            setShowCreateModal(false);

            // Refresh tasks
            const data = await api.get<ExtendedTask[]>('/tasks');
            setTasks(data);

            // Reset form
            setNewTask({
                projectId: '',
                taskName: '',
                description: '',
                status: 'todo',
                dueDate: '',
                estimatedHours: '',
                assignedTo: [],
                dependencies: [],
                teamId: '',
            });
        } catch (err: any) {
            console.error(err.message || 'Failed to process task');
        }
    };

    const handleDeleteTask = async (taskId: number, taskName: string) => {
        if (confirm(`Are you sure you want to delete task "${taskName}"? This action cannot be undone.`)) {
            try {
                await api.delete(`/tasks/${taskId}`);
                // Refresh list
                const data = await api.get<ExtendedTask[]>('/tasks');
                setTasks(data);
            } catch (err: any) {
                console.error(err.message || 'Failed to delete task');
            }
        }
    };


    // --- Attachment Handlers ---
    const handleOpenAttachments = async (task: ExtendedTask) => {
        setAttachmentTask(task);
        setAttachments([]);
        setAttachmentLoading(true);
        try {
            const data = await api.get<Attachment[]>(`/tasks/${task.taskId}/attachments`);
            setAttachments(data);
        } catch (err: any) {
            console.error(err.message || 'Failed to load attachments');
        } finally {
            setAttachmentLoading(false);
        }
    };

    const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!attachmentTask || !e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/tasks/${attachmentTask.taskId}/attachments`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,   // DO NOT set Content-Type here — browser sets it automatically for FormData
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Upload failed');
            }
            // Refresh attachment list
            const data = await api.get<Attachment[]>(`/tasks/${attachmentTask.taskId}/attachments`);
            setAttachments(data);
        } catch (err: any) {
            console.error(err.message || 'Upload failed');
        } finally {
            setIsUploading(false);
            e.target.value = ''; // reset input
        }
    };

    const handleDeleteAttachment = async (attachmentId: number) => {
        if (!attachmentTask) return;
        if (!confirm('Delete this attachment?')) return;
        try {
            await api.delete(`/tasks/${attachmentTask.taskId}/attachments/${attachmentId}`);
            setAttachments(prev => prev.filter(a => a.attachmentId !== attachmentId));
        } catch (err: any) {
            console.error(err.message || 'Failed to delete attachment');
        }
    };

    // ฟังก์ชันเปิดดูคอมเมนต์
    const handleOpenComments = async (task: ExtendedTask) => {
        setCommentTask(task);
        setComments([]);
        setCommentsLoading(true);
        try {
            const data = await api.get<TaskComment[]>(`/tasks/${task.taskId}/comments`);
            setComments(data);
        } catch (err: any) {
            console.error(err.message || 'Failed to load comments');
        } finally {
            setCommentsLoading(false);
        }
    };

    // --- ระบบ Mention ---
    // 🌟 รวมรายชื่อ PM และ คนในทีม (Leaders & Members)
    const getMentionableUsers = () => {
        const usersMap = new Map();

        // 1. นำ Project Managers ใส่ลงไปก่อน (ใช้ username เป็นชื่อไปเลยเพื่อป้องกัน Error)
        pmUsers.forEach(pm => {
            usersMap.set(pm.userId, {
                userId: pm.userId,
                username: pm.username,
                name: pm.username || 'Project Manager',
                role: pm.role || 'project_manager'
            });
        });

        // 2. นำคนใน Team (Leader และ Members) ใส่ลงไป
        teams.forEach(team => {
            if (team.leader) usersMap.set(team.leader.userId, team.leader);
            if (team.members) team.members.forEach(m => usersMap.set(m.userId, m));
        });

        return Array.from(usersMap.values());
    };

    // เก็บใส่ตัวแปรไว้ใช้งานร่วมกัน
    const mentionableUsers = getMentionableUsers();

    // 🌟 ฟังก์ชัน Render สีของ Mention ในคอมเมนต์
    const renderCommentText = (text: string) => {
        if (!text) return null;

        // แยกข้อความด้วย @ ตามด้วยตัวอักษร
        const parts = text.split(/(@\S+)/g);

        return parts.map((part, index) => {
            if (part.startsWith('@')) {
                const usernameToFind = part.slice(1);
                const matchedUser = mentionableUsers.find(u => u.username === usernameToFind);

                if (matchedUser) {
                    return (
                        <span
                            key={index}
                            className="font-bold text-brand-cyan bg-cyan-50 dark:bg-cyan-900/30 px-1.5 py-0.5 rounded-md cursor-default border border-cyan-100 dark:border-cyan-800 transition-colors hover:bg-cyan-100 dark:hover:bg-cyan-900/50"
                            title={`Name: ${matchedUser.name}\nRole: ${matchedUser.role ? matchedUser.role.replace('_', ' ').toUpperCase() : 'UNKNOWN'}`}
                        >
                            {part}
                        </span>
                    );
                }
                // ถ้าค้นไม่เจอ ให้แสดงเป็นตัวหนาสีเทา
                return <span key={index} className="font-bold text-gray-500">{part}</span>;
            }
            return <span key={index}>{part}</span>;
        });
    };

    // 🌟 กรองรายชื่อสำหรับ Dropdown (ใส่ดัก undefined ไว้กันแอปพัง)
    const filteredMentionUsers = mentionableUsers.filter(u => {
        const uname = u.username || '';
        const fname = u.name || '';
        const query = mentionQuery.toLowerCase();
        return uname.toLowerCase().includes(query) || fname.toLowerCase().includes(query);
    });

    // ฟังก์ชันตรวจจับการพิมพ์
    const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNewComment(val);

        const cursor = e.target.selectionStart || 0;
        const textBeforeCursor = val.slice(0, cursor);

        // เช็คว่ามีตัว @ แล้วตามด้วยข้อความที่ไม่ใช่ช่องว่าง (หยุดเมื่อเจอ Space)
        const match = textBeforeCursor.match(/(?:^|\s)@(\S*)$/);

        if (match) {
            setShowMentions(true);
            setMentionQuery(match[1]); // ข้อความหลัง @
            setCursorPosition(cursor);
        } else {
            setShowMentions(false);
        }
    };

    // ฟังก์ชันเมื่อกดเลือกคนจาก Dropdown
    const handleSelectMention = (user: any) => {
        const textBeforeQuery = newComment.slice(0, cursorPosition - mentionQuery.length - 1);
        const textAfterQuery = newComment.slice(cursorPosition);

        // แทนที่ข้อความด้วย @username
        const newText = `${textBeforeQuery}@${user.username} ${textAfterQuery}`;
        setNewComment(newText);
        setShowMentions(false);

        // เก็บ ID คนที่ถูก Mention เอาไว้ส่งไปให้ Backend
        if (!selectedMentions.includes(user.userId)) {
            setSelectedMentions(prev => [...prev, user.userId]);
        }

        // โฟกัสกลับไปที่ช่องพิมพ์
        if (commentInputRef.current) commentInputRef.current.focus();
    };

    // ฟังก์ชันส่งคอมเมนต์ใหม่
    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentTask || !newComment.trim()) return;

        setIsSubmittingComment(true);
        try {
            // ส่ง comment และ mentions (Array ของ ID) ไปยัง Backend
            await api.post(`/tasks/${commentTask.taskId}/comments`, {
                comment: newComment,
                mentions: selectedMentions
            });

            setNewComment(''); // ล้างช่องพิมพ์
            setSelectedMentions([]); // ล้างรายการ mention
            setShowMentions(false);

            // โหลดรายการคอมเมนต์ใหม่เพื่อให้อัปเดตทันที
            const data = await api.get<TaskComment[]>(`/tasks/${commentTask.taskId}/comments`);
            setComments(data);
        } catch (err: any) {
            console.error(err.message || 'Failed to add comment');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    // ฟังก์ชันเปิด Modal ยืนยันเมื่อกดไอคอนถังขยะ
    const confirmDeleteComment = (commentId: number) => {
        setCommentToDelete(commentId);
    };

    // ฟังก์ชันกดยืนยันการลบจริงใน Modal
    const executeDeleteComment = async () => {
        if (!commentTask || !commentToDelete) return;
        try {
            await api.delete(`/tasks/${commentTask.taskId}/comments/${commentToDelete}`);
            // อัปเดต UI ให้คอมเมนต์นั้นหายไปทันทีโดยไม่ต้องโหลดหน้าใหม่
            setComments(prev => prev.filter(c => c.taskCommentId !== commentToDelete));
            setCommentToDelete(null); // ปิด Modal
        } catch (err: any) {
            alert(err.message || 'Failed to delete comment');
        }
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };


    const toggleAssignee = (userId: string) => {
        setNewTask(prev => {
            if (prev.assignedTo.includes(userId)) {
                return { ...prev, assignedTo: prev.assignedTo.filter(id => id !== userId) };
            } else {
                return { ...prev, assignedTo: [...prev.assignedTo, userId] };
            }
        });
    };

    const { selectedProjectId } = useProject();

    // Filter tasks by search, project context, and team
    const filteredTasks = tasks.filter(t => {
        if (selectedProjectId && t.projectId !== selectedProjectId) return false;
        const matchSearch = t.taskName.toLowerCase().includes(search.toLowerCase()) ||
            t.description?.toLowerCase().includes(search.toLowerCase()) ||
            t.projectName?.toLowerCase().includes(search.toLowerCase());
        const matchTeam = filterTeamId === '' || (t.teamId && t.teamId.toString() === filterTeamId);
        return matchSearch && matchTeam;
    });

    // Sort helper: by due date ascending (null dates last)
    const sortByDueDate = (arr: ExtendedTask[]) => [...arr].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    const todoTasks = sortByDueDate(filteredTasks.filter(t => t.status === 'todo'));
    const inProgressTasks = sortByDueDate(filteredTasks.filter(t => t.status === 'in_progress'));
    const doneTasks = sortByDueDate(filteredTasks.filter(t => t.status === 'done' || t.status === 'review'));

    // Drag start for cards
    const handleDragStart = (e: React.DragEvent, taskId: number) => {
        e.dataTransfer.setData('taskId', taskId.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    // Allow column-level drop for status change
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDragEnd = () => {
        setDropSlotKey(null);
    };

    // Drop on a column -> status change (unchanged behavior)
    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        setDropSlotKey(null);
        const taskIdStr = e.dataTransfer.getData('taskId');
        if (!taskIdStr) return;

        const taskId = parseInt(taskIdStr, 10);
        const taskToUpdate = tasks.find(t => t.taskId === taskId);

        if (!taskToUpdate || taskToUpdate.status === newStatus) return;

        const previousStatus = taskToUpdate.status;

        // Optimistic Update
        setTasks(prev => prev.map(t =>
            t.taskId === taskId ? { ...t, status: newStatus as any } : t
        ));

        try {
            await api.put(`/tasks/${taskId}/status`, { status: newStatus });
        } catch (err: any) {
            // Rollback
            setTasks(prev => prev.map(t =>
                t.taskId === taskId ? { ...t, status: previousStatus } : t
            ));
            console.error(err.message || 'Unable to update task status');
        }
    };

    // Drop at a slot between cards within a column -> set dependency
    const handleDropAtSlot = async (e: React.DragEvent, columnTasks: ExtendedTask[], slotIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        setDropSlotKey(null);

        const taskIdStr = e.dataTransfer.getData('taskId');
        if (!taskIdStr) return;
        const dragId = parseInt(taskIdStr, 10);

        const draggedTask = tasks.find(t => t.taskId === dragId);
        if (!draggedTask) return;

        // If the task is coming from a different column, also update status
        const targetColumnStatus = columnTasks.length > 0 ? columnTasks[0].status : null;
        if (targetColumnStatus && draggedTask.status !== targetColumnStatus) {
            // Status change + dependency in one go
            setTasks(prev => prev.map(t =>
                t.taskId === dragId ? { ...t, status: targetColumnStatus as any } : t
            ));
            try {
                await api.put(`/tasks/${dragId}/status`, { status: targetColumnStatus });
            } catch (err: any) {
                // Rollback status
                setTasks(prev => prev.map(t =>
                    t.taskId === dragId ? { ...t, status: draggedTask.status } : t
                ));
            }
        }

        // slotIndex 0 = top (clear deps), slotIndex N = after task N-1 (set dep)
        let newDeps: number[] = [];
        if (slotIndex > 0) {
            const taskAbove = columnTasks[slotIndex - 1];
            if (taskAbove && taskAbove.taskId !== dragId) {
                newDeps = [taskAbove.taskId];
            }
        }

        // Skip if dependencies are already the same
        const currentDeps = [...(draggedTask.dependencies || [])].sort();
        const newDepsSorted = [...newDeps].sort();
        if (JSON.stringify(currentDeps) === JSON.stringify(newDepsSorted)) return;

        setSavingDep(true);
        try {
            await api.put(`/tasks/${dragId}`, {
                taskName: draggedTask.taskName,
                description: draggedTask.description,
                dependencies: newDeps,
            });
            setTasks(prev => prev.map(t =>
                t.taskId === dragId ? { ...t, dependencies: newDeps } : t
            ));
        } catch (err: any) {
            console.error('Failed to update dependencies', err);
        } finally {
            setSavingDep(false);
        }
    };

    const getTaskNameById = (id: number) => tasks.find(t => t.taskId === id)?.taskName || `Task #${id}`;

    const TaskCard = ({ task }: { task: ExtendedTask }) => (
        <div
            draggable
            onDragStart={(e) => handleDragStart(e, task.taskId)}
            onDragEnd={handleDragEnd}
            className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden cursor-grab active:cursor-grabbing border-gray-100 dark:border-gray-700`}>

            {/* Project Stripe */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-teal group-hover:bg-brand-cyan transition-colors"></div>

            <div className="pl-3">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight pr-12">{task.taskName}</h3>

                    {/* File and Comment buttons for people who work on the task */}
                    <div className="absolute top-3 right-3 flex gap-1 z-10 transition-opacity">
                        {/* 💬 ปุ่ม Comment (เพิ่มใหม่) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleOpenComments(task); }}
                            className="p-1.5 text-gray-400 hover:text-brand-cyan hover:bg-cyan-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Comments">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </button>

                        {/* 📎 ปุ่ม Attachments (ของเดิม) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleOpenAttachments(task); }}
                            className="p-1.5 text-gray-400 hover:text-brand-teal hover:bg-teal-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Attachments">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </button>

                        {/* Action Buttons for PMs/Leaders */}
                        {(userRole === 'project_manager' || userRole === 'team_leader') && (
                            <>
                                <button onClick={() => handleOpenCreateModal(task)}
                                    className="p-1.5 text-gray-400 hover:text-brand-cyan hover:bg-cyan-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Edit Task">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                                <button onClick={() => handleDeleteTask(task.taskId, task.taskName)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Delete Task">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </>)}
                    </div>
                </div>

                {/* Team Badge */}
                {task.teamName && (
                    <div className="mb-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            {task.teamName}
                        </span>
                    </div>
                )}

                <div className="flex justify-between items-center text-xs mt-3">
                    <StatusBadge status={task.status} type="task" />

                    <AvatarGroup
                        members={task.assignees ? task.assignees.map((a: any) => ({ id: a.workerId, name: a.workerName })) : []}
                        size="sm"
                    />
                </div>

                {(task.dueDate || task.projectName) && (
                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                        {task.dueDate && (
                            <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                <span className="material-icons text-[10px]">schedule</span>
                                {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                        )}
                        {task.projectName && (
                            <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    {task.projectName}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Blocked Status */}
                {(() => {
                    if (task.status === 'done' || !task.dependencies || task.dependencies.length === 0) return null;
                    const blockedBy = task.dependencies
                        .map(depId => tasks.find(t => t.taskId === depId))
                        .filter(t => t && t.status !== 'done');

                    if (blockedBy.length > 0) {
                        return (
                            <div
                                className="mt-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-[10px] font-bold px-2 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-1">
                                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span
                                    className="truncate">Blocked by: {blockedBy.map(t => t?.taskName).join(', ')}</span>
                            </div>
                        );
                    }
                    // All dependencies done - show amber badge
                    return (
                        <div className="mt-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            ↳ Depends on: {task.dependencies.map(id => getTaskNameById(id)).join(', ')}
                        </div>
                    );
                })()}
            </div>
        </div>
    );

    // Render a column's tasks with drop slots between them
    const renderColumnTasks = (columnTasks: ExtendedTask[], columnKey: string) => (
        <>
            {/* Drop slot at the top — PM only */}
            {userRole === 'project_manager' && (
                <div
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDropSlotKey(`${columnKey}-0`); }}
                    onDragLeave={() => setDropSlotKey(null)}
                    onDrop={(e) => handleDropAtSlot(e, columnTasks, 0)}
                    className={`transition-all duration-200 rounded-xl ${dropSlotKey === `${columnKey}-0`
                        ? 'h-3 bg-cyan-400 dark:bg-cyan-500 my-1 shadow-md shadow-cyan-300/50'
                        : 'h-1'
                        }`}
                />
            )}
            {columnTasks.map((task, index) => (
                <div key={task.taskId}>
                    <TaskCard task={task} />
                    {/* Drop slot after this card — PM only */}
                    {userRole === 'project_manager' && (
                        <div
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDropSlotKey(`${columnKey}-${index + 1}`); }}
                            onDragLeave={() => setDropSlotKey(null)}
                            onDrop={(e) => handleDropAtSlot(e, columnTasks, index + 1)}
                            className={`transition-all duration-200 rounded-xl ${dropSlotKey === `${columnKey}-${index + 1}`
                                ? 'h-3 bg-cyan-400 dark:bg-cyan-500 my-1 shadow-md shadow-cyan-300/50'
                                : 'h-1'
                                }`}
                        />
                    )}
                </div>
            ))}
        </>
    );

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <div className="w-16 h-16 border-4 border-brand-cyan border-t-brand-teal rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="flex flex-col min-h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Active Tasks</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                        Manage and track your team's progress.
                        {savingDep && <span className="ml-2 text-cyan-500 animate-pulse">Saving dependency...</span>}
                    </p>
                </div>
                {(userRole === 'project_manager' || userRole === 'team_leader') && (
                    <button
                        onClick={() => handleOpenCreateModal()}
                        className="px-6 py-2.5 bg-linear-to-r from-cyan-500 to-blue-600 hover:shadow-cyan-500/30 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <span className="text-xl leading-none">+</span> New Task
                    </button>
                )}
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 mb-6">
                <SearchBar
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tasks or projects..."
                    className="max-w-md"
                />
                {/* Team Filter */}
                <select
                    value={filterTeamId}
                    onChange={e => setFilterTeamId(e.target.value)}
                    className="px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl font-bold text-sm focus:border-brand-cyan focus:outline-none transition-all dark:text-white min-w-[160px]"
                >
                    <option value="">All Teams</option>
                    {teams.map(t => (
                        <option key={t.teamId} value={t.teamId}>{t.teamName}</option>
                    ))}
                </select>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* To Do Column */}
                <div
                    className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900/50 rounded-3xl p-4 border border-gray-100 dark:border-gray-800"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'todo')}
                >
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-lg font-black text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-gray-300"></span> To Do
                        </h2>
                        <span
                            className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700">{todoTasks.length}</span>
                    </div>
                    <div className="flex flex-col w-full max-w-md">
                        <div className="flex-1">
                            {renderColumnTasks(todoTasks, 'todo')}
                        </div>
                    </div>
                </div>

                {/* In Progress Column */}
                <div
                    className="flex flex-col h-full bg-cyan-50/30 dark:bg-cyan-900/10 rounded-3xl p-4 border border-cyan-100 dark:border-cyan-900/30"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'in_progress')}
                >
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-lg font-black text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-brand-cyan animate-pulse"></span> In Progress
                        </h2>
                        <span
                            className="bg-white dark:bg-gray-800 text-brand-cyan text-xs font-bold px-2.5 py-1 rounded-lg border border-cyan-100 dark:border-cyan-900">{inProgressTasks.length}</span>
                    </div>
                    <div className="flex flex-col w-full max-w-md">
                        <div className="flex-1">
                            {renderColumnTasks(inProgressTasks, 'in_progress')}
                        </div>
                    </div>
                </div>

                {/* Done Column */}
                <div
                    className="flex flex-col h-full bg-green-50/30 dark:bg-green-900/10 rounded-3xl p-4 border border-green-100 dark:border-green-900/30"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'done')}
                >
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-lg font-black text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-brand-sage"></span> Done
                        </h2>
                        <span
                            className="bg-white dark:bg-gray-800 text-brand-sage text-xs font-bold px-2.5 py-1 rounded-lg border border-green-100 dark:border-green-900">{doneTasks.length}</span>
                    </div>
                    <div className="flex flex-col w-full max-w-md">
                        <div className="flex-1">
                            {renderColumnTasks(doneTasks, 'done')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Task Modal */}
            <TaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                isEditing={isEditing}
                editingTaskId={editingTaskId}
                newTask={newTask as any}
                setNewTask={setNewTask}
                onSubmit={handleCreateTask}
                projects={filteredProjectss}
                teams={teams}
                potentialAssignees={potentialAssignees}
                tasks={tasks}
            />

            {/* Attachments Modal */}
            {attachmentTask && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white">Attachments</h2>
                                <p className="text-xs text-gray-400 font-medium mt-0.5 truncate max-w-xs">{attachmentTask.taskName}</p>
                            </div>
                            <button
                                onClick={() => setAttachmentTask(null)}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors flex-shrink-0">
                                &times;
                            </button>
                        </div>

                        {/* Upload — PM, Team Leader, Worker */}
                        {(userRole === 'project_manager' || userRole === 'team_leader' || userRole === 'worker') && (
                            <label className={`flex items-center justify-center gap-2 w-full py-3 mb-4 border-2 border-dashed rounded-xl cursor-pointer transition-all
                                ${isUploading
                                    ? 'border-brand-cyan bg-cyan-50 dark:bg-cyan-900/20 text-brand-cyan cursor-not-allowed'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-brand-cyan hover:bg-cyan-50/50 dark:hover:bg-cyan-900/10 text-gray-400 hover:text-brand-cyan'}`}>
                                {isUploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-sm font-bold">Uploading…</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        <span className="text-sm font-bold">Click to upload a file</span>
                                    </>
                                )}
                                <input type="file" className="hidden" onChange={handleUploadAttachment} disabled={isUploading} />
                            </label>
                        )}

                        {/* File List */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {attachmentLoading ? (
                                <div className="flex justify-center py-10">
                                    <div className="w-8 h-8 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : attachments.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    <p className="text-sm font-medium">No attachments yet</p>
                                </div>
                            ) : (
                                attachments.map(att => (
                                    <div key={att.attachmentId}
                                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 group">
                                        {/* File icon */}
                                        <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0 shadow-xs">
                                            <svg className="w-5 h-5 text-brand-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>

                                        {/* File info */}
                                        <div className="flex-1 min-w-0">
                                            <a href={`${BACKEND_URL}/${att.fileUrl}`} target="_blank" rel="noopener noreferrer"
                                                className="text-sm font-bold text-gray-800 dark:text-gray-100 hover:text-brand-cyan truncate block transition-colors">
                                                {att.fileName}
                                            </a>
                                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                {formatFileSize(att.fileSize)} · {att.uploadedBy} · {new Date(att.uploadedAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        {/* Delete — PM / Team Leader only */}
                                        {(userRole === 'project_manager' || userRole === 'team_leader') && (
                                            <button
                                                onClick={() => handleDeleteAttachment(att.attachmentId)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-600 rounded-lg transition-all flex-shrink-0"
                                                title="Delete attachment">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Comments Modal */}
            {commentTask && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white">Comments</h2>
                                <p className="text-xs text-gray-400 font-medium mt-0.5 truncate max-w-xs">{commentTask.taskName}</p>
                            </div>
                            <button
                                onClick={() => setCommentTask(null)}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors flex-shrink-0">
                                &times;
                            </button>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
                            {commentsLoading ? (
                                <div className="flex justify-center py-10">
                                    <div className="w-8 h-8 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                    <p className="text-sm font-medium">No comments yet. Start the conversation!</p>
                                </div>
                            ) : (
                                comments.map(comment => (
                                    // เอาคลาส group ออกจากตรงนี้ได้เลยเพราะไม่ได้ใช้แล้ว
                                    <div key={comment.taskCommentId} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-600 relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{comment.username}</span>
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {new Date(comment.createdDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                </span>
                                            </div>

                                            {/* ไอคอนถังขยะจะแสดงค้างไว้ตลอดสำหรับคอมเมนต์ของเรา */}
                                            {String(comment.userId) === String(userId) && (
                                                <button
                                                    onClick={() => confirmDeleteComment(comment.taskCommentId)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                                                    title="Delete comment"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                            {renderCommentText(comment.comment)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add Comment Form with Mention UI */}
                        <div className="relative mt-auto border-t border-gray-100 dark:border-gray-700 pt-5">
                            {/* Mention Dropdown */}
                            {showMentions && filteredMentionUsers.length > 0 && (
                                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto">
                                    {filteredMentionUsers.map(user => (
                                        <div
                                            key={user.userId}
                                            onClick={() => handleSelectMention(user)}
                                            className="px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0 transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-brand-cyan/20 text-brand-cyan flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">@{user.username}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{user.name} • {user.role?.replace('_', ' ')}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleSubmitComment} className="flex gap-3">
                                <input
                                    ref={commentInputRef}
                                    type="text"
                                    value={newComment}
                                    onChange={handleCommentChange}
                                    placeholder="Type a comment... (use @ to mention)"
                                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 dark:text-white transition-all"
                                    disabled={isSubmittingComment}
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isSubmittingComment}
                                    className="px-5 py-3 bg-brand-cyan text-white font-bold rounded-xl disabled:opacity-50 hover:bg-cyan-600 transition-colors flex items-center justify-center min-w-[80px]"
                                >
                                    {isSubmittingComment ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        'Send'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Comment Confirmation Modal */}
            {commentToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 mb-4">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Delete Comment?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                            Are you sure you want to delete this comment? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setCommentToDelete(null)}
                                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeDeleteComment}
                                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/30"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}

function SearchIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    )
}
