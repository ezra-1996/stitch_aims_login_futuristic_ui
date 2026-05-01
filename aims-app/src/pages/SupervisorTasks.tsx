import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { usersAPI } from '../services/api';

// Tasks API will be added in backend + api.ts in next step.
import api from '../services/api';

const SupervisorTasks: React.FC = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [student, setStudent] = useState<number | ''>('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().slice(0, 10);
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    // Editing State
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const [s, t] = await Promise.all([
                usersAPI.getStudents(),
                api.get('/internships/tasks/').then((r) => r.data),
            ]);
            setStudents(s);
            setTasks(t);
        } catch {
            setError('Could not load tasks/students.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (!student || !title) {
            setError('Select a student and enter a task title.');
            return;
        }
        try {
            if (editingTaskId) {
                await api.patch(`/internships/tasks/${editingTaskId}/`, {
                    student: Number(student),
                    title,
                    description,
                    due_date: dueDate,
                });
                setSuccess('Task updated successfully.');
            } else {
                await api.post('/internships/tasks/', {
                    student: Number(student),
                    title,
                    description,
                    due_date: dueDate,
                });
                setSuccess('Task assigned.');
            }
            setStudent('');
            setTitle('');
            setDescription('');
            setEditingTaskId(null);
            await refresh();
        } catch (err: any) {
            const d = err.response?.data;
            const msg = d?.detail || d?.student?.[0] || d?.title?.[0] || 'Failed to process task.';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    };

    const handleEdit = (task: any) => {
        setEditingTaskId(task.task_id);
        setStudent(task.student);
        setTitle(task.title);
        setDescription(task.description || '');
        setDueDate(task.due_date);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (taskId: number) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await api.delete(`/internships/tasks/${taskId}/`);
            setSuccess('Task deleted.');
            await refresh();
        } catch {
            setError('Failed to delete task.');
        }
    };

    const cancelEdit = () => {
        setEditingTaskId(null);
        setStudent('');
        setTitle('');
        setDescription('');
        setError(null);
    };

    return (
        <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden font-display">
            <Sidebar />
            <main className="flex-1 relative flex flex-col overflow-hidden">
                <Header />
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div>
                            <h1 className="text-3xl font-black uppercase italic underline decoration-primary/30 underline-offset-8">
                                Supervisor <span className="text-primary italic">Tasks</span>
                            </h1>
                            <p className="text-white/40 text-sm mt-3">Assign tasks to students and track progress.</p>
                        </div>

                        {error && <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-bold uppercase tracking-widest">{error}</div>}
                        {success && <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest">{success}</div>}

                        <div className="glass p-8 rounded-2xl border border-white/5">
                            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-3">Student</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" value={student} onChange={(e) => setStudent(e.target.value ? Number(e.target.value) : '')}>
                                        <option value="">Select student…</option>
                                        {students.map((s) => (
                                            <option key={s.student_id} value={s.student_id} className="bg-background-dark">{s.university_id}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-3">Due date</label>
                                    <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-3">Title</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-3">Description</label>
                                    <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Task details (optional)" />
                                </div>
                                <div className="md:col-span-2 flex gap-4">
                                    <button type="submit" className="flex-1 bg-primary text-background-dark font-black py-4 rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(19,236,236,0.2)] hover:shadow-[0_0_30px_rgba(19,236,236,0.4)] transition-all">
                                        {editingTaskId ? 'Update Task' : 'Assign Task'}
                                    </button>
                                    {editingTaskId && (
                                        <button type="button" onClick={cancelEdit} className="px-8 bg-white/10 text-white font-black py-4 rounded-xl uppercase tracking-widest hover:bg-white/20 transition-all">
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="glass p-8 rounded-2xl border border-white/5">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-black uppercase tracking-widest">Tasks</h2>
                                <button type="button" onClick={refresh} className="text-primary text-xs font-black uppercase tracking-widest">Refresh</button>
                            </div>
                            {loading ? (
                                <div className="flex items-center justify-center py-10">
                                    <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
                                </div>
                            ) : tasks.length === 0 ? (
                                <p className="text-white/40 text-sm">No tasks yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {tasks.map((t) => (
                                        <div key={t.task_id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                            <div>
                                                <div className="font-bold">{t.title}</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                                    Student: {t.student_university_id || t.student} • Due: {t.due_date}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 md:justify-end">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-primary px-3 py-1 bg-primary/5 border border-primary/20 rounded-full">{t.status}</div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleEdit(t)} className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/40 hover:text-primary">
                                                        <span className="material-symbols-outlined text-lg">edit</span>
                                                    </button>
                                                    <button onClick={() => handleDelete(t.task_id)} className="p-2 hover:bg-red-500/10 rounded-lg transition-all text-white/40 hover:text-red-500">
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <Footer />
            </main>
        </div>
    );
};

export default SupervisorTasks;

