import React, { useState } from 'react';
import { organizationsAPI } from '../services/api';
import { useUser } from '../context/UserContext';

const PostInternship: React.FC = () => {
    const { user } = useUser();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [requirements, setRequirements] = useState('');
    const [durationMonths, setDurationMonths] = useState(3);
    const [capacity, setCapacity] = useState(1);
    const [deadline, setDeadline] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().slice(0, 10);
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const submit = async () => {
        setError(null);
        setSuccess(null);
        if (!title || !description || !requirements) {
            setError('Fill title, description, and requirements.');
            return;
        }
        setSubmitting(true);
        try {
            await organizationsAPI.createInternshipPost({
                title,
                description,
                requirements,
                duration_months: durationMonths,
                capacity,
                application_deadline: deadline,
                is_active: true,
            });
            setSuccess('Internship posted successfully.');
            setTitle('');
            setDescription('');
            setRequirements('');
        } catch (err: any) {
            const d = err.response?.data;
            const msg = d?.detail || d?.organization?.[0] || d?.title?.[0] || d?.description?.[0] || d?.requirements?.[0] || 'Posting failed.';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-dark text-white rounded-2xl overflow-hidden glass border border-white/5 relative p-8">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Breadcrumbs & Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-white/30 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                                <span>DASHBOARD</span>
                                <span className="material-symbols-outlined text-xs">chevron_right</span>
                                <span>POSTINGS</span>
                                <span className="material-symbols-outlined text-xs">chevron_right</span>
                                <span className="text-primary">NEW INTERNSHIP</span>
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic underline decoration-primary/30 underline-offset-8">Post New <span className="text-primary italic">Internship</span></h1>
                            <p className="text-white/50 text-sm mt-4 font-medium italic">Design a futuristic job listing to attract Jimma University's top talent.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12">
                        {/* Main Editor */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="glass rounded-2xl p-10 relative overflow-hidden border border-white/5">
                                <div className="space-y-8">
                                    {error && <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-bold uppercase tracking-widest">{error}</div>}
                                    {success && <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest">{success}</div>}

                                    <div>
                                        <label className="block text-primary text-[10px] uppercase tracking-[0.3em] font-black mb-4 italic underline decoration-primary/30 underline-offset-4">Internship Title</label>
                                        <input
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-5 text-white text-xl font-black italic tracking-tighter focus:ring-1 focus:ring-primary focus:border-primary/50 outline-none transition-all placeholder:text-white/10 italic"
                                            placeholder="e.g. AI RESEARCH INTERN (CYBERSECURITY)"
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-primary text-[10px] uppercase tracking-[0.3em] font-black mb-4">Strategic Responsibilities</label>
                                        <div className="border border-white/10 rounded-xl overflow-hidden glass">
                                            <textarea
                                                className="w-full bg-transparent border-none p-6 text-white/70 text-sm font-medium leading-relaxed focus:ring-0 outline-none resize-none placeholder:text-white/10"
                                                placeholder="Describe the day-to-day tactical operations..."
                                                rows={8}
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            ></textarea>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-primary text-[10px] uppercase tracking-[0.3em] font-black mb-4">Core Prerequisites</label>
                                        <div className="flex-1 relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 text-sm">adjust</span>
                                            <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none font-bold italic uppercase tracking-tight" type="text" value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="e.g. Python, SQL, Git" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Controls */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* Deadline Picker */}
                            <div className="glass rounded-3xl p-8 border border-primary/20 bg-primary/5">
                                <label className="block text-primary text-[10px] uppercase tracking-[0.3em] font-black mb-6 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-lg">event</span> Submission Cut-off
                                </label>
                                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white font-bold outline-none" />
                            </div>

                            {/* Metadata Cards */}
                            <div className="glass rounded-3xl p-8 border border-white/5 space-y-6">
                                <label className="block text-primary text-[10px] uppercase tracking-[0.3em] font-black italic underline decoration-primary/30 underline-offset-4">Fleet Intelligence</label>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Candidate Load</span>
                                        <input type="number" min="1" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-16 bg-transparent text-right text-xl font-black italic text-white outline-none" />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Time Horizon</span>
                                        <input type="number" min="1" max="12" value={durationMonths} onChange={(e) => setDurationMonths(Number(e.target.value))} className="w-16 bg-transparent text-right text-xl font-black italic text-white outline-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Publishing Controls */}
                            <div className="space-y-4">
                                <button type="button" disabled={submitting} onClick={submit} className="w-full bg-primary h-24 rounded-3xl flex items-center justify-center gap-4 text-background-dark font-black text-2xl uppercase tracking-tighter italic shadow-[0_0_50px_rgba(19,236,236,0.2)] hover:shadow-[0_0_80px_rgba(19,236,236,0.4)] hover:scale-[1.02] transition-all group overflow-hidden relative disabled:opacity-50">
                                    {submitting ? 'POSTING...' : 'LAUNCH POSTING'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostInternship;
