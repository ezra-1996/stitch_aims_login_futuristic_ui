import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { evaluationAPI, internshipsAPI } from '../services/api';

const SubmitWeeklyReport: React.FC = () => {
    const [tasks, setTasks] = useState<string[]>(['']);
    const [summary, setSummary] = useState('');
    const [challenges, setChallenges] = useState('');
    const [lessonsLearned, setLessonsLearned] = useState('');
    const [weekNumber, setWeekNumber] = useState<number>(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [existingReports, setExistingReports] = useState<any[]>([]);
    const [activeReportId, setActiveReportId] = useState<number | null>(null);

    // Tasks API State
    const [apiTasks, setApiTasks] = useState<any[]>([]);
    const [updatingTask, setUpdatingTask] = useState<number | null>(null);

    // Fetch existing reports and tasks on mount
    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await evaluationAPI.getWeeklyReports();
                setExistingReports(data);
            } catch (err) {
                console.error("Failed to load existing reports", err);
            }
        };
        const fetchTasks = async () => {
            try {
                const data = await internshipsAPI.getTasks();
                setApiTasks(data);
            } catch (err) {
                console.error("Failed to load tasks", err);
            }
        };
        fetchReports();
        fetchTasks();
    }, []);

    // Prefill form when weekNumber or existingReports changes
    useEffect(() => {
        const report = existingReports.find(r => r.week_number === weekNumber);
        if (report) {
            setActiveReportId(report.report_id || report.id);
            setSummary(report.content || '');
            setChallenges(report.challenges_faced || '');
            setLessonsLearned(report.lessons_learned || '');
            // Split by newline-dash or newline depending on formatting
            if (report.tasks_completed) {
                const parsedTasks = report.tasks_completed.split('\n- ').map((t: string) => t.replace(/^- /, '').trim()).filter(Boolean);
                setTasks(parsedTasks.length > 0 ? parsedTasks : ['']);
            } else {
                setTasks(['']);
            }
        } else {
            setActiveReportId(null);
            setSummary('');
            setChallenges('');
            setLessonsLearned('');
            setTasks(['']);
        }
    }, [weekNumber, existingReports]);

    const addTask = () => setTasks([...tasks, '']);
    const updateTask = (index: number, val: string) => {
        const newTasks = [...tasks];
        newTasks[index] = val;
        setTasks(newTasks);
    };
    const removeTask = (index: number) => setTasks(tasks.filter((_, i) => i !== index));

    const handleCompleteTask = async (task: any) => {
        setUpdatingTask(task.task_id);
        try {
            await internshipsAPI.updateTask(task.task_id, { status: 'done' });
            setApiTasks(prev => prev.map(t => t.task_id === task.task_id ? { ...t, status: 'done' } : t));
            
            // Inject into report seamlessly
            const currentTasks = tasks.filter(t => t.trim() !== '');
            if (!currentTasks.includes(task.title)) {
                setTasks([...currentTasks, task.title]);
            }
        } catch (e) {
            console.error("Failed to complete task", e);
        } finally {
            setUpdatingTask(null);
        }
    };

    const handleStartTask = async (task: any) => {
        setUpdatingTask(task.task_id);
        try {
            await internshipsAPI.updateTask(task.task_id, { status: 'in_progress' });
            setApiTasks(prev => prev.map(t => t.task_id === task.task_id ? { ...t, status: 'in_progress' } : t));
        } catch (e) {
            console.error("Failed to start task", e);
        } finally {
            setUpdatingTask(null);
        }
    };

    const handleSubmit = async () => {
        setError(null);
        setSuccess(null);
        setSubmitting(true);

        const cleanedTasks = tasks.map(t => t.trim()).filter(Boolean);
        const tasks_completed = cleanedTasks.join('\n- ');

        try {
            const payload = {
                week_number: weekNumber,
                title: `Week ${weekNumber} report`,
                content: summary,
                tasks_completed,
                challenges_faced: challenges || undefined,
                lessons_learned: lessonsLearned || undefined,
            };

            let returnedReport;
            if (activeReportId) {
                returnedReport = await evaluationAPI.updateWeeklyReport(activeReportId, payload);
                setSuccess('Weekly report updated successfully.');
            } else {
                returnedReport = await evaluationAPI.createWeeklyReport(payload);
                setSuccess('Weekly report submitted successfully.');
            }
            
            // Update local state to immediately reflect the newly saved data
            setExistingReports(prev => {
                const filtered = prev.filter(r => (r.report_id || r.id) !== activeReportId);
                return [...filtered, returnedReport];
            });
            setActiveReportId(returnedReport.report_id || returnedReport.id);
            
        } catch (err: any) {
            const d = err.response?.data;
            const msg =
                d?.error ||
                d?.week_number?.[0] ||
                d?.non_field_errors?.[0] ||
                'Failed to submit weekly report.';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden">
            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden">
                <Header />

                {/* Page Content */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-[1400px] mx-auto space-y-10">
                        {/* Header + Breadcrumbs */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                                <span className="hover:text-primary cursor-pointer transition-all">DASHBOARD</span>
                                <span className="material-symbols-outlined text-xs">chevron_right</span>
                                <span className="hover:text-primary cursor-pointer transition-all">REPORTS</span>
                                <span className="material-symbols-outlined text-xs">chevron_right</span>
                                <span className="text-white">WEEKLY SUBMISSION</span>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div className="space-y-2">
                                    <h1 className="text-4xl font-black text-white tracking-tight uppercase italic underline decoration-primary/40 decoration-4 underline-offset-8">Weekly <span className="text-primary italic">Progress</span> Report</h1>
                                    <p className="text-white/40 text-sm font-medium tracking-wide">Documentation of technical activities and professional growth.</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-10">
                            {/* Top/Left Column: Form Areas & Tasks */}
                            <div className="col-span-12 lg:col-span-8 space-y-8">
                                
                                {/* TASKS BOARD PORTAL */}
                                <div className="glass p-8 rounded-2xl border border-primary/20 bg-background-dark/50 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                                    <div className="flex items-center justify-between mb-6 relative z-10">
                                        <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary">assignment</span>
                                            Active <span className="text-primary italic">Task Matrix</span>
                                        </h3>
                                        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-primary/60">
                                            <span>{apiTasks.filter(t => t.status !== 'done').length} Pending</span>
                                            <span>•</span>
                                            <span>{apiTasks.filter(t => t.status === 'done').length} Completed</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                        {apiTasks.length > 0 ? apiTasks.map(task => (
                                            <div key={task.task_id} className={`p-5 rounded-xl border transition-all ${
                                                task.status === 'done' ? 'glass border-emerald-500/20 bg-emerald-500/5' : 
                                                task.status === 'in_progress' ? 'glass border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(19,236,236,0.1)]' : 
                                                'glass border-white/10 hover:border-white/20 hover:bg-white/5'
                                            }`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest border ${
                                                        task.status === 'done' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        task.status === 'in_progress' ? 'bg-primary/20 text-primary border-primary/30 animate-pulse' :
                                                        'bg-white/10 text-white/40 border-white/10'
                                                    }`}>
                                                        {task.status === 'done' ? 'Completed' : task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                                                    </span>
                                                    {task.due_date && (
                                                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[10px]">event</span> {task.due_date}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className={`text-sm font-bold uppercase tracking-tight mb-2 ${task.status === 'done' ? 'text-white/40 line-through' : 'text-white'}`}>{task.title}</h4>
                                                <p className="text-[10px] text-white/50 leading-relaxed mb-4 line-clamp-2">{task.description}</p>
                                                
                                                <div className="flex gap-2">
                                                    {task.status === 'pending' && (
                                                        <button 
                                                            onClick={() => handleStartTask(task)}
                                                            disabled={updatingTask === task.task_id}
                                                            className="flex-1 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-background-dark transition-all disabled:opacity-50"
                                                        >
                                                            {updatingTask === task.task_id ? 'Syncing...' : 'Start Task'}
                                                        </button>
                                                    )}
                                                    {task.status === 'in_progress' && (
                                                        <button 
                                                            onClick={() => handleCompleteTask(task)}
                                                            disabled={updatingTask === task.task_id}
                                                            className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-background-dark transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                                                        >
                                                            {updatingTask === task.task_id ? 'Syncing...' : 'Mark Completed'}
                                                        </button>
                                                    )}
                                                    {task.status === 'done' && (
                                                        <button disabled className="flex-1 py-2 rounded-lg bg-white/5 text-emerald-500/40 border border-emerald-500/10 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                                            <span className="material-symbols-outlined text-[12px]">check_circle</span> Injected into Report
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center text-white/20 space-y-2 border border-dashed border-white/10 rounded-xl bg-black/20">
                                                <span className="material-symbols-outlined text-4xl">inventory_2</span>
                                                <p className="text-xs font-bold uppercase tracking-widest italic">No tasks assigned by supervisor yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Week Selector Ribbon */}
                                <div className="glass p-3 flex items-center gap-3 overflow-x-auto no-scrollbar rounded-2xl border border-white/5">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(w => {
                                        const isActive = w === weekNumber;
                                        return (
                                            <button
                                                key={w}
                                                type="button"
                                                onClick={() => setWeekNumber(w)}
                                                className={`flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-xl transition-all
                      ${isActive ? 'bg-primary/10 border-2 border-primary shadow-[0_0_20px_rgba(19,236,236,0.2)]' : 'bg-white/5 border border-white/10 opacity-40 hover:opacity-100'}
                    `}
                                            >
                                                <span className={`text-[9px] uppercase font-black tracking-[0.2em] ${isActive ? 'text-primary' : 'text-white/40'}`}>{isActive ? 'Active' : 'Week'}</span>
                                                <span className={`text-2xl font-black ${isActive ? 'text-white' : 'text-white/30'}`}>{w < 10 ? `0${w}` : w}</span>
                                                {w < weekNumber || existingReports.some(r => r.week_number === w) ? (
                                                    <span className="material-symbols-outlined text-sm text-green-500 mt-1">check_circle</span>
                                                ) : isActive ? (
                                                    <span className="material-symbols-outlined text-sm text-primary animate-pulse mt-1">radio_button_checked</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-sm text-white/10 mt-1">lock</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Editor Content */}
                                <div className="glass p-10 rounded-2xl border border-white/5 space-y-12">
                                    {/* Section 1: Summary */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-4">
                                                <span className="w-12 h-[2px] bg-primary rounded-full"></span>
                                                Executive Summary
                                            </label>
                                            <div className="flex gap-4 text-white/20">
                                            </div>
                                        </div>
                                        <textarea
                                            className="w-full bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-6 h-40 text-sm transition-all outline-none text-white/70 placeholder:text-white/20 leading-relaxed"
                                            placeholder="Summarize your overall performance and key learnings this week..."
                                            value={summary}
                                            onChange={(e) => setSummary(e.target.value)}
                                        ></textarea>
                                    </div>

                                    {/* Section 2: Tasks */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-4">
                                                <span className="w-12 h-[2px] bg-primary rounded-full"></span>
                                                Key Tasks Completed
                                            </label>
                                            <button onClick={addTask} className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-4 py-2 hover:bg-primary/20 transition-all uppercase font-black tracking-widest rounded-lg">Add Task</button>
                                        </div>

                                        <div className="space-y-4">
                                            {tasks.map((task, i) => (
                                                <div key={i} className="flex gap-4 group">
                                                    <div className="flex-1 flex gap-4 items-center bg-white/5 border border-white/10 p-2 pr-4 rounded-xl transition-all focus-within:border-primary/40 focus-within:bg-white/[0.08]">
                                                        <div className="h-10 w-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(19,236,236,0.6)]"></div>
                                                        <input
                                                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-white/80 outline-none"
                                                            type="text"
                                                            value={task}
                                                            onChange={(e) => updateTask(i, e.target.value)}
                                                            placeholder="Enter task description..."
                                                        />
                                                        <button onClick={() => removeTask(i)} className="p-2 text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><span className="material-symbols-outlined">delete</span></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Section 3: Challenges */}
                                    <div className="space-y-6">
                                        <div className="flex items-center">
                                            <label className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-4">
                                                <span className="w-12 h-[2px] bg-primary rounded-full"></span>
                                                Challenges &amp; Solutions
                                            </label>
                                        </div>
                                        <textarea
                                            className="w-full bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-6 h-40 text-sm transition-all outline-none text-white/70 placeholder:text-white/20 leading-relaxed"
                                            placeholder="What problems did you face and how did you overcome them?"
                                            value={challenges}
                                            onChange={(e) => setChallenges(e.target.value)}
                                        ></textarea>
                                    </div>

                                    {/* Section 4: Lessons Learned */}
                                    <div className="space-y-6">
                                        <div className="flex items-center">
                                            <label className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-4">
                                                <span className="w-12 h-[2px] bg-primary rounded-full"></span>
                                                Lessons Learned
                                            </label>
                                        </div>
                                        <textarea
                                            className="w-full bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-6 h-32 text-sm transition-all outline-none text-white/70 placeholder:text-white/20 leading-relaxed"
                                            placeholder="What new skills or knowledge did you gain this week?"
                                            value={lessonsLearned}
                                            onChange={(e) => setLessonsLearned(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Error / Success */}
                                {(error || success) && (
                                    <div className="pt-2">
                                        {error && (
                                            <div className="mb-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-[11px] font-bold uppercase tracking-widest">
                                                {error}
                                            </div>
                                        )}
                                        {success && (
                                            <div className="p-3 rounded-xl border border-primary/30 bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-widest">
                                                {success}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex justify-end gap-6 pt-4">
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={handleSubmit}
                                        className="px-16 h-14 bg-primary text-background-dark font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_0_30px_rgba(19,236,236,0.3)] hover:shadow-[0_0_50px_rgba(19,236,236,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl disabled:opacity-50"
                                    >
                                        {submitting ? 'Processing...' : (activeReportId ? 'Update Report' : 'Initialize Digital Submission')}
                                    </button>
                                </div>
                            </div>

                            {/* Right Column: Submission Info */}
                            <div className="col-span-12 lg:col-span-4 space-y-8">
                                <div className="glass p-8 rounded-2xl border border-white/5 space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                            <span className="material-symbols-outlined font-black">verified</span>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Validation Active</h4>
                                            <p className="text-white/40 text-[9px] uppercase font-bold tracking-widest mt-1">AI-Assisted Evaluation Enabled</p>
                                        </div>
                                    </div>

                                    <p className="text-[10px] text-white/40 leading-relaxed font-medium uppercase tracking-widest border-l-2 border-primary/20 pl-4">
                                        Your report will be processed through the AIMS Evaluation Matrix for task alignment and supervisor review.
                                    </p>

                                    {/* Pro Tip Card - Moved here */}
                                    <div className="p-8 border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl space-y-4 shadow-[0_0_20px_rgba(19,236,236,0.05)]">
                                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary text-lg">info</span>
                                            Efficiency Pro Tip
                                        </h4>
                                        <p className="text-xs text-white/50 leading-relaxed font-medium">
                                            Be sure to include technical challenges faced. It helps your supervisor understand your problem-solving process and technical depth.
                                        </p>
                                    </div>

                                    {/* View Reports History / Export Buttons */}
                                    <div className="space-y-4 pt-4">
                                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Report History & Export</h4>
                                        <p className="text-[10px] text-white/40 leading-relaxed font-medium uppercase tracking-widest border-l-2 border-primary/20 pl-4">
                                            View previous reports and export them for your records.
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            <a href="/report-history" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium">
                                                <span className="material-symbols-outlined text-base">history</span>
                                                View All Reports
                                            </a>
                                            <a href="/report-history?status=approved" className="flex items-center gap-2 text-emerald-500 hover:text-emerald-500/80 transition-colors text-sm font-medium">
                                                <span className="material-symbols-outlined text-base">check_circle</span>
                                                Approved Reports
                                            </a>
                                            <a href="/report-history?status=pending" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium">
                                                <span className="material-symbols-outlined text-base">pending</span>
                                                Pending Review
                                            </a>
                                            <a href="/report-history?status=revision" className="flex items-center gap-2 text-yellow-500 hover:text-yellow-500/80 transition-colors text-sm font-medium">
                                                <span className="material-symbols-outlined text-base">edit_note</span>
                                                Reports for Revision
                                            </a>
                                            
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </main>
        </div>
    );
};

export default SubmitWeeklyReport;
