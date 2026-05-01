import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { internshipsAPI } from '../services/api';

const CompanyCandidates: React.FC = () => {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'offered' | 'accepted' | 'rejected'>('all');

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const data = await internshipsAPI.getApplications();
                setApplications(data);
            } catch (err) {
                console.error("Failed to fetch applications", err);
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, []);

    const handleUpdateStatus = async (appId: number, status: string) => {
        try {
            await internshipsAPI.updateApplicationStatus(appId, status);
            const updated = applications.map(a => a.application_id === appId ? { ...a, status } : a);
            setApplications(updated);
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const filteredApps = applications.filter(a => filter === 'all' || a.status === filter);

    return (
        <div className="flex flex-col h-full bg-background-dark text-white rounded-2xl overflow-hidden glass border border-white/5 relative p-8">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-8">
                        <div>
                            <h1 className="text-3xl font-black uppercase italic underline decoration-primary/30 underline-offset-8">
                                Candidate <span className="text-primary italic">Management</span>
                            </h1>
                            <p className="text-white/40 text-sm mt-3 uppercase tracking-widest font-bold">Review and manage internship applications for your organization.</p>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-4">
                            {['all', 'pending', 'offered', 'accepted', 'rejected'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filter === f ? 'bg-primary text-background-dark border-primary' : 'bg-white/5 text-white/40 border-white/10 hover:border-primary/40'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-primary/60">
                                    <tr>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Internship Post</th>
                                        <th className="px-6 py-4">Date Applied</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
                                            </td>
                                        </tr>
                                    ) : filteredApps.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-white/20 italic uppercase tracking-widest text-sm font-bold">No applications found in this category.</td>
                                        </tr>
                                    ) : (
                                        filteredApps.map((app) => (
                                            <tr key={app.application_id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs">
                                                            {app.student_name?.[0] || 'S'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold group-hover:text-primary transition-colors">{app.student_name}</p>
                                                            <p className="text-[10px] text-white/30 uppercase font-black tracking-tighter">ID: {app.student_university_id || app.student}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-bold text-white/70 italic uppercase">{app.post_title}</p>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-white/40 font-bold uppercase">
                                                    {new Date(app.applied_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${app.status === 'accepted' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' :
                                                            app.status === 'offered' ? 'border-primary/30 text-primary bg-primary/10' :
                                                            app.status === 'rejected' || app.status === 'declined' ? 'border-red-500/30 text-red-400 bg-red-500/5' :
                                                                'border-primary/30 text-primary bg-primary/5'
                                                        }`}>
                                                        {app.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {app.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(app.application_id, 'offered')}
                                                                    className="p-2 hover:bg-emerald-500/20 text-emerald-400 transition-all rounded transition-all"
                                                                    title="Offer Position"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg">check_circle</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(app.application_id, 'rejected')}
                                                                    className="p-2 hover:bg-red-500/20 text-red-500 transition-all rounded transition-all"
                                                                    title="Reject"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg">cancel</span>
                                                                </button>
                                                            </>
                                                        )}
                                                        <Link to={`/candidate/${app.application_id}`} className="p-2 hover:bg-white/10 text-white/40 hover:text-white transition-all rounded">
                                                            <span className="material-symbols-outlined text-lg">visibility</span>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
            </div>
        </div>
    );
};

export default CompanyCandidates;
