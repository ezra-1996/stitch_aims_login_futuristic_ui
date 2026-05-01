import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { evaluationAPI, aiAPI } from '../services/api';
import { useUser } from '../context/UserContext';

const SupervisorReview: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useUser();

    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [phaseStatus, setPhaseStatus] = useState<string>('pending');

    // AI Evaluation fields for "Value Addition"
    const [clarity, setClarity] = useState(0);
    const [completeness, setCompleteness] = useState(0);
    const [technical, setTechnical] = useState(0);

    useEffect(() => {
        if (id) {
            fetchReport();
        }
    }, [id]);

    const fetchReport = async () => {
        try {
            const data = await evaluationAPI.getWeeklyReport(Number(id));
            setReport(data);
            setPhaseStatus(data.status || 'pending');
            setFeedback(data.supervisor_feedback || '');

            // Mock or actual AI scores from the report
            if (data.ai_evaluation) {
                setClarity(data.ai_evaluation.clarity_score || 7);
                setCompleteness(data.ai_evaluation.completeness_score || 8);
                setTechnical(data.ai_evaluation.relevance_score || 6);
            } else {
                setClarity(7.5);
                setCompleteness(8.2);
                setTechnical(7.0);
            }

            // 4. Fetch existing Supervisor Evaluation if it exists (for editing)
            try {
                const supEval = await evaluationAPI.getSupervisorEvaluation(Number(id));
                if (supEval) {
                    setTechnical(supEval.technical_skill || technical);
                    setClarity(supEval.communication || clarity);
                    setCompleteness(supEval.initiative || completeness);
                    if (supEval.remarks) setFeedback(supEval.remarks);
                }
            } catch (e) {
                // Ignore if not found, it's just a new evaluation
            }
        } catch (err) {
            console.error("Failed to load report", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (status: 'approved' | 'rejected' | 'revision') => {
        if (!report) return;
        setSubmitting(true);
        try {
            // 1. Update Report Status & Feedback
            await evaluationAPI.updateWeeklyReport(report.report_id, {
                status: status,
                supervisor_feedback: feedback,
            });

            // 2. If approved, save human-adjusted evaluation (Add value to AI evaluation)
            if (status === 'approved') {
                await evaluationAPI.createSupervisorEvaluation({
                    report: report.report_id,
                    supervisor: user?.id,
                    technical_skill: technical,
                    communication: clarity,
                    teamwork: Math.round(((clarity + technical) / 2) * 10) / 10,
                    initiative: completeness,
                    overall_performance: Math.round(((technical + clarity + completeness) / 3) * 10) / 10,
                    final_score: Math.round(((technical + clarity + completeness) / 3) * 10) / 10,
                    remarks: feedback
                });
            }

            setPhaseStatus(status);
            alert(`Report marked as ${status.toUpperCase()}`);
        } catch (err) {
            console.error("Failed to update report", err);
            alert("Error updating report status.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleExportPDF = () => {
        window.print();
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        alert("Report link copied to clipboard for sharing.");
    };

    const getSupervisorId = (): string => {
        const userStr = localStorage.getItem('user');
        const stored = userStr ? JSON.parse(userStr) : null;
        return stored?.username || '';
    };

    const getStatusStyle = () => {
        switch (phaseStatus) {
            case 'approved': return 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400';
            case 'rejected': return 'border-red-500/50 bg-red-500/5 text-red-400';
            case 'revision': return 'border-amber-500/50 bg-amber-500/5 text-amber-400';
            default: return 'border-primary/20 bg-primary/5 text-primary';
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-background-dark">
            <span className="material-symbols-outlined text-primary text-5xl animate-spin font-black">sync</span>
        </div>
    );
    if (!report) return <div className="text-white p-8">Report not found.</div>;

    return (
        <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden font-display no-print">
            <Sidebar />

            <main className="flex-1 relative flex flex-col overflow-hidden">
                <Header />

                {/* Main Content Area */}
                <div className="flex-1 p-8 flex flex-col gap-8 relative overflow-y-auto custom-scrollbar">

                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">
                                <span>SUPERVISOR</span>
                                <span className="material-symbols-outlined text-xs">chevron_right</span>
                                <span className="text-primary italic">REVIEW REPORT</span>
                            </div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white underline decoration-primary/30 underline-offset-8">Report <span className="text-primary">#{report.week_number}</span></h2>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={handleShare}
                                className="px-6 py-3 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 rounded-xl italic"
                            >
                                <span className="material-symbols-outlined text-lg">share</span> Share
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="px-8 py-3 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 rounded-xl italic"
                            >
                                <span className="material-symbols-outlined text-lg">picture_as_pdf</span> Export PDF
                            </button>
                            <button onClick={() => navigate('/supervisor-dashboard')} className="px-6 py-3 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all rounded-xl border border-white/10">
                                Back
                            </button>
                        </div>
                    </div>

                    {/* Status Banner */}
                    <div className={`p-6 rounded-2xl border ${getStatusStyle()} flex items-center justify-between`}>
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-2xl font-black">
                                {phaseStatus === 'approved' ? 'verified' : phaseStatus === 'revision' ? 'history_edu' : 'report'}
                            </span>
                            <div>
                                <p className="text-sm font-black uppercase tracking-widest">
                                    Current Status: {phaseStatus.toUpperCase()}
                                </p>
                                <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Protocol: Sequential Peer Review</p>
                            </div>
                        </div>
                        <div className="text-[10px] font-black px-4 py-1.5 rounded-full border border-current uppercase tracking-widest">
                            {phaseStatus}
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                        {/* Student Submission */}
                        <div className="xl:col-span-2 space-y-8">
                            <div className="glass rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                                <div className="p-8 border-b border-white/5 bg-primary/5 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-black italic tracking-tight">{report.title}</h3>
                                        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">Submitted by {report.student_name} • {new Date(report.submitted_date).toLocaleDateString()}</p>
                                    </div>
                                    <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg border border-primary/20">WEEK {report.week_number}</span>
                                </div>
                                <div className="p-10 space-y-10">
                                    <section>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 italic underline decoration-primary/20 underline-offset-4">1.0 Executive Content</h4>
                                        <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap border-l border-primary/20 pl-6 italic uppercase font-medium">
                                            {report.content}
                                        </div>
                                    </section>
                                    <section>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 italic underline decoration-primary/20 underline-offset-4">2.0 Tasks & Challenges</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                                <p className="text-[9px] font-black uppercase text-emerald-400 mb-2">Accomplishments</p>
                                                <p className="text-xs text-white/60 leading-relaxed italic">{report.tasks_completed}</p>
                                            </div>
                                            <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl">
                                                <p className="text-[9px] font-black uppercase text-red-400 mb-2">Challenges</p>
                                                <p className="text-xs text-white/60 leading-relaxed italic">{report.challenges_faced || 'None reported.'}</p>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>

                        {/* Supervisor Evaluation Panel */}
                        <div className="space-y-8">
                            {/* AI Evaluation Adjustment ("Add Value") */}
                            <div className="glass rounded-3xl p-8 border border-primary/20 bg-primary/5 space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none">
                                    <span className="material-symbols-outlined text-8xl text-primary font-black">neurology</span>
                                </div>

                                <div>
                                    <h3 className="text-sm font-black uppercase italic tracking-widest text-primary">Neural Audit Adjustment</h3>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Modify AI metrics to reflect human oversight.</p>
                                </div>

                                <div className="space-y-6">
                                    {[
                                        { label: 'Clarity', val: clarity, set: setClarity, icon: 'lightbulb' },
                                        { label: 'Completeness', val: completeness, set: setCompleteness, icon: 'done_all' },
                                        { label: 'Technical Accuracy', val: technical, set: setTechnical, icon: 'architecture' },
                                    ].map(item => (
                                        <div key={item.label} className="space-y-4">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">{item.icon}</span> {item.label}</span>
                                                <span className="text-primary">{item.val}/10</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="10" step="0.5"
                                                value={item.val} onChange={(e) => item.set(parseFloat(e.target.value))}
                                                className="w-full accent-primary h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Decision Box */}
                            <div className="glass rounded-3xl p-8 border border-white/5 space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic">Feedback Terminal</h3>

                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-6 text-xs text-white/80 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-white/5"
                                    placeholder="Enter supervisor remarks..."
                                />

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleAction('revision')}
                                            disabled={submitting}
                                            className="py-4 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-500/10 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">history_edu</span> Fix
                                        </button>
                                        <button
                                            onClick={() => handleAction('rejected')}
                                            disabled={submitting}
                                            className="py-4 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">cancel</span> Reject
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleAction('approved')}
                                        disabled={submitting}
                                        className="py-5 bg-primary text-background-dark text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_30px_rgba(19,236,236,0.4)] transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-lg font-black">check_circle</span> Final Approve
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Print Styles */}
                <style>{`
                    @media print {
                        .no-print { display: none !important; }
                        body, html { background: white !important; color: black !important; }
                        main { overflow: visible !important; height: auto !important; }
                        .glass { border: 1px solid #ccc !important; box-shadow: none !important; background: white !important; }
                        .text-white { color: black !important; }
                        .text-white/70, .text-white/40 { color: #555 !important; }
                        .bg-background-dark { background: white !important; }
                        .xl\\:col-span-2 { width: 100% !important; }
                        .space-y-8 > * + * { margin-top: 2rem !important; }
                        textarea, button, input { display: none !important; }
                    }
                `}</style>

                <Footer />
            </main>
        </div>

    );
};

export default SupervisorReview;
