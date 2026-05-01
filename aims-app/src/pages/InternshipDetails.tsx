import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { organizationsAPI } from '../services/api';

const InternshipDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        organizationsAPI.getInternshipPost(Number(id))
            .then(setPost)
            .catch(() => setError('Could not load internship.'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden items-center justify-center">
                <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
            </div>
        );
    }
    if (error || !post) {
        return (
            <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 font-bold uppercase tracking-widest">{error || 'Not found'}</p>
                    <Link to="/browse-internships" className="text-primary mt-4 inline-block text-sm font-bold uppercase">Back to internships</Link>
                </div>
            </div>
        );
    }

    const title = post.title || 'Internship';
    const company = post.organization_name || post.organization?.org_name || '—';
    const description = post.description || 'No description provided.';
    const requirements = post.requirements || '';
    const deadline = post.application_deadline;
    const duration = post.duration_months || '—';
    const capacity = post.capacity || '—';

    // Parse requirements into a list
    const reqList = requirements
        ? requirements.split(/[,;\n]+/).map((r: string) => r.trim()).filter((r: string) => r.length > 0)
        : [];

    // Format deadline
    const formatDeadline = (dateStr: string) => {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
        } catch { return dateStr; }
    };

    // Calculate days remaining
    const daysRemaining = () => {
        if (!deadline) return null;
        try {
            const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return diff > 0 ? diff : 0;
        } catch { return null; }
    };
    const remaining = daysRemaining();
    const progressPercent = remaining !== null && remaining > 0 ? Math.max(10, Math.min(95, 100 - (remaining / 30) * 100)) : 100;

    return (
        <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden">
            <Sidebar />

            <main className="flex-1 relative flex flex-col overflow-hidden">
                <Header />

                {/* Page Content */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-10">
                        {/* Breadcrumbs & Simple Header */}
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                            <Link to="/student-dashboard" className="hover:text-primary cursor-pointer transition-all">DASHBOARD</Link>
                            <span className="material-symbols-outlined text-xs">chevron_right</span>
                            <Link to="/browse-internships" className="hover:text-primary cursor-pointer transition-all">INTERNSHIPS</Link>
                            <span className="material-symbols-outlined text-xs">chevron_right</span>
                            <span className="text-white">{title.toUpperCase()}</span>
                        </div>

                        {/* Premium Company Card */}
                        <div className="glass rounded-2xl p-10 relative overflow-hidden border border-white/5">
                            <div className="absolute top-0 right-0 size-80 bg-primary/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2"></div>

                            <div className="flex flex-col lg:flex-row gap-10 items-start lg:items-center relative z-10">
                                <div className="size-28 rounded-2xl bg-white/5 border border-white/10 p-6 flex items-center justify-center shrink-0 shadow-2xl">
                                    <span className="material-symbols-outlined text-primary text-5xl">corporate_fare</span>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <span className="px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-[9px] font-black uppercase tracking-[0.2em] rounded-lg">
                                            {post.is_active ? 'ACTIVE_POSTING' : 'CLOSED'}
                                        </span>
                                        {post.created_at && (
                                            <span className="text-white/30 text-[10px] uppercase font-bold tracking-widest">
                                                • Posted {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-4xl font-black text-white tracking-tight uppercase italic decoration-primary/40 decoration-4 underline-offset-8 underline decoration-solid">{title}</h2>
                                    <div className="flex flex-wrap gap-8 pt-2">
                                        {[
                                            { icon: 'corporate_fare', text: company },
                                            { icon: 'groups', text: `${capacity} Position${capacity !== 1 ? 's' : ''}` },
                                            { icon: 'schedule', text: `${duration} Month${duration !== 1 ? 's' : ''}` },
                                        ].map(item => (
                                            <div key={item.text} className="flex items-center gap-2 text-white/50 text-xs font-bold uppercase tracking-widest group cursor-default">
                                                <span className="material-symbols-outlined text-primary text-lg transition-transform group-hover:scale-125">{item.icon}</span>
                                                {item.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="w-full lg:w-auto">
                                    
                                </div>
                            </div>
                        </div>

                        {/* Grid Layout */}
                        <div className="grid grid-cols-12 gap-10">
                            {/* Main Content */}
                            <div className="col-span-12 lg:col-span-8 space-y-10">
                                <section className="glass rounded-2xl p-10 border border-white/5 space-y-8">
                                    <h3 className="text-xl font-bold uppercase italic tracking-tight flex items-center gap-4">
                                        <span className="w-8 h-1 bg-primary rounded-full"></span>
                                        Role <span className="text-primary">Description</span>
                                    </h3>
                                    <div className="space-y-6 text-white/60 leading-relaxed font-medium">
                                        {description.split('\n').filter((p: string) => p.trim()).map((paragraph: string, i: number) => (
                                            <p key={i}>{paragraph}</p>
                                        ))}
                                    </div>
                                </section>

                                <section className="glass rounded-2xl p-10 border border-white/5 space-y-8">
                                    <h3 className="text-xl font-bold uppercase italic tracking-tight flex items-center gap-4">
                                        <span className="w-8 h-1 bg-primary rounded-full"></span>
                                        Technical <span className="text-primary">Requirements</span>
                                    </h3>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {reqList.length > 0 ? reqList.map((req: string) => (
                                            <li key={req} className="flex items-center gap-5 group">
                                                <div className="size-2 rounded-full bg-primary shadow-[0_0_8px_#13ecec] shrink-0 transition-transform group-hover:scale-150"></div>
                                                <p className="text-white/70 text-sm font-bold tracking-tight uppercase">{req}</p>
                                            </li>
                                        )) : (
                                            <li className="text-white/30 italic text-sm col-span-2">No specific requirements listed.</li>
                                        )}
                                    </ul>
                                </section>
                            </div>

                            {/* Sidebar Info */}
                            <div className="col-span-12 lg:col-span-4 space-y-8">
                                {/* Deadline Card */}
                                <div className="glass rounded-2xl p-8 border border-primary/20 relative overflow-hidden group">
                                    <div className="absolute -bottom-8 -right-8 size-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700"></div>

                                    <div className="flex justify-between items-start mb-8 relative z-10">
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white/30">Submission Deadline</span>
                                            <p className="text-2xl font-black text-white tracking-tighter italic">{formatDeadline(deadline)}</p>
                                        </div>
                                        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                            <span className="material-symbols-outlined text-2xl animate-pulse">schedule</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6 relative z-10">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-white/30">Application Window</span>
                                                <span className="text-primary italic">
                                                    {remaining !== null ? `${remaining} Day${remaining !== 1 ? 's' : ''} Rem.` : '—'}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full shadow-[0_0_15px_#13ecec]" style={{ width: `${progressPercent}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Logistics Info */}
                                <div className="glass rounded-2xl p-8 border border-white/5 space-y-8">
                                    {[
                                        { icon: 'groups', label: 'Open Positions', val: `${capacity}` },
                                        { icon: 'calendar_today', label: 'Duration', val: `${duration} Month${duration !== 1 ? 's' : ''}` },
                                    ].map(stat => (
                                        <div key={stat.label} className="flex items-center gap-5">
                                            <div className="size-14 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 text-primary">
                                                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">{stat.label}</p>
                                                <p className="text-xl font-black text-white italic tracking-tighter">{stat.val}</p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="pt-6 border-t border-white/5 space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Organization</h4>
                                        <p className="text-xs text-white/30 leading-relaxed font-medium italic">
                                            {company}
                                        </p>
                                    </div>
                                </div>

                                {/* Big Apply Action */}
                                <div className="pt-4">
                                    <Link to={`/internship-application?postId=${post.post_id}`} className="block w-full bg-primary h-24 rounded-2xl flex items-center justify-center gap-4 text-background-dark font-black text-2xl uppercase tracking-tighter italic shadow-[0_0_40px_rgba(19,236,236,0.3)] hover:shadow-[0_0_60px_rgba(19,236,236,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 overflow-hidden relative group/btn">
                                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 skew-x-[-45deg]"></div>
                                        APPLY NOW
                                        <span className="material-symbols-outlined text-3xl font-bold">arrow_forward</span>
                                    </Link>
                                    <p className="text-center text-[9px] text-white/20 mt-6 font-bold uppercase tracking-[0.3em]">REF_ID : {company} – {post.post_id}</p>
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

export default InternshipDetails;
