import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { evaluationAPI } from '../services/api';
import { useUser } from '../context/UserContext';

interface AIEval {
    clarity_score: number;
    completeness_score: number;
    relevance_score: number;
    grammar_score: number;
    overall_score: number;
    feedback_summary: string;
    confidence_level: number;
}

interface SupEval {
    technical_skill: number;
    communication: number;
    teamwork: number;
    initiative: number;
    overall_performance: number;
    final_score: number;
    remarks: string;
}

interface Report {
    report_id?: number;
    id?: number;
    week_number: number;
    title: string;
    content: string;
    status: string;
    supervisor_feedback?: string;
}

const ScoreBar: React.FC<{ label: string; score: number; max?: number; color?: string; icon: string }> = ({
    label, score, max = 10, color = 'primary', icon
}) => {
    const pct = Math.round((score / max) * 100);
    return (
        <div className="glass rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-${color === 'primary' ? 'primary' : color} text-lg`}>{icon}</span>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-white/80">{label}</h3>
                </div>
                <span className={`text-xl font-black italic text-${color === 'primary' ? 'primary' : color}`}>{pct}%</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div
                    className={`bg-${color === 'primary' ? 'primary' : color} h-full rounded-full transition-all duration-1000`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};

const EvaluationResults: React.FC = () => {
    const { user } = useUser();
    const [searchParams] = useSearchParams();
    const [activeReportId, setActiveReportId] = useState<number | null>(
        searchParams.get('report') ? Number(searchParams.get('report')) : null
    );

    const [report, setReport] = useState<Report | null>(null);
    const [aiEval, setAiEval] = useState<AIEval | null>(null);
    const [supEval, setSupEval] = useState<SupEval | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [showFeedbackBox, setShowFeedbackBox] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<string>('');
    const [actionMsg, setActionMsg] = useState('');

    useEffect(() => {
        if (!loading && activeReportId && searchParams.get('print') === 'true') {
            setTimeout(() => window.print(), 1000);
        }
    }, [loading, activeReportId, searchParams]);

    useEffect(() => {
        const fetchAll = async () => {
            let targetId = activeReportId;

            if (!targetId) {
                try {
                    const allReports = await evaluationAPI.getWeeklyReports();
                    if (allReports && allReports.length > 0) {
                        // Find latest evaluated report (approved/rejected/revision) or just the latest submitted
                        const evaluated = allReports.filter((r: any) => r.status !== 'pending' && r.status !== 'pending_review');
                        const pool = evaluated.length > 0 ? evaluated : allReports;
                        const latest = pool.sort((a: any, b: any) => b.week_number - a.week_number)[0];
                        targetId = latest.report_id || latest.id;
                        setActiveReportId(targetId);
                    } else {
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    setLoading(false);
                    return;
                }
            }

            if (!targetId) return;

            try {
                const [rep, aiEvalData, supEvalData] = await Promise.allSettled([
                    evaluationAPI.getWeeklyReport(targetId),
                    evaluationAPI.getAIEvaluation(targetId),
                    evaluationAPI.getSupervisorEvaluation(targetId),
                ]);
                if (rep.status === 'fulfilled') setReport(rep.value);
                if (aiEvalData.status === 'fulfilled') setAiEval(aiEvalData.value);
                if (supEvalData.status === 'fulfilled') setSupEval(supEvalData.value);
            } catch (e) {
                console.error('Failed to load evaluation data', e);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [activeReportId]);

    const handleStatusChange = async (newStatus: string) => {
        if (!activeReportId || !report) return;
        if (newStatus !== 'approved') {
            setPendingStatus(newStatus);
            setShowFeedbackBox(true);
            return;
        }
        await applyStatus(newStatus, '');
    };

    const applyStatus = async (newStatus: string, feedbackText: string) => {
        if (!activeReportId || !report) return;
        setUpdatingStatus(true);
        try {
            const updated = await evaluationAPI.updateReportStatus(activeReportId, newStatus, feedbackText);
            setReport(updated);
            setShowFeedbackBox(false);
            setActionMsg(`Report marked as ${newStatus}.`);
            setTimeout(() => setActionMsg(''), 4000);
        } catch (e: any) {
            setActionMsg('Failed to update status: ' + (e.response?.data?.detail || 'Unknown error'));
        } finally {
            setUpdatingStatus(false);
        }
    };

    const getStatusProps = (s: string) => {
        switch (s?.toLowerCase()) {
            case 'approved': return { text: 'Approved', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', icon: 'check_circle' };
            case 'revision': return { text: 'Revision Requested', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5', icon: 'history_edu' };
            case 'rejected': return { text: 'Rejected', color: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/5', icon: 'cancel' };
            default: return { text: 'Awaiting Review', color: 'text-primary', border: 'border-primary/30', bg: 'bg-primary/5', icon: 'hourglass_empty' };
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full bg-background-dark text-white items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto shadow-[0_0_20px_#13ecec]"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 animate-pulse">Loading evaluation data...</p>
                </div>
            </div>
        );
    }

    const sp = getStatusProps(report?.status || 'pending');
    const overallScore = aiEval ? Math.round(aiEval.overall_score * 10) : null;

    return (
        <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden">
            <Sidebar />
            <main className="flex-1 relative flex flex-col overflow-hidden">
                <Header />
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-5xl mx-auto space-y-10 pb-12">

                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                                    <Link to="/report-history" className="hover:text-primary cursor-pointer">REPORTS</Link>
                                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                                    <span className="text-white">
                                        {report ? `Week ${report.week_number} — ${report.title}` : 'Evaluation Report'}
                                    </span>
                                </div>
                                <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">
                                    AI <span className="text-primary">Evaluation</span> Results
                                </h1>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => window.print()}
                                    className="px-6 py-3 rounded-xl border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-2 no-print"
                                >
                                    <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                                    Download PDF
                                </button>
                                {user?.role === 'supervisor' && (
                                    <Link
                                        to={`/report/${activeReportId}`}
                                        className="px-6 py-3 rounded-xl border border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all flex items-center gap-2 no-print"
                                    >
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                        Edit Evaluation
                                    </Link>
                                )}
                                <div className={`flex items-center gap-3 px-6 py-3 rounded-xl border ${sp.border} ${sp.bg} ${sp.color} text-[10px] font-black uppercase tracking-[0.2em]`}>
                                    <span className="material-symbols-outlined text-sm">{sp.icon}</span>
                                    {sp.text}
                                </div>
                            </div>
                        </div>

                        {/* No report selected */}
                        {!activeReportId && (
                            <div className="glass rounded-2xl p-16 text-center border border-white/5">
                                <span className="material-symbols-outlined text-6xl text-white/10 mb-4 block">analytics</span>
                                <p className="text-white/30 font-bold uppercase tracking-widest text-sm">No report selected.</p>
                                <Link to="/report-history" className="mt-6 inline-flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest hover:underline">
                                    <span className="material-symbols-outlined text-sm">arrow_back</span> Go to Report History
                                </Link>
                            </div>
                        )}

                        {/* Supervisor Controls */}
                        {activeReportId && report && (user?.role === 'supervisor' || user?.role === 'university_admin') && report.status === 'pending_review' && !showFeedbackBox && (
                            <div className="glass p-8 rounded-3xl border border-primary/20 bg-primary/5 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Supervisor Decision</h3>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Update report status based on your review.</p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-4">
                                    <button onClick={() => handleStatusChange('revision')} disabled={updatingStatus}
                                        className="px-6 py-3 rounded-xl border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/10 transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">history_edu</span> Request Revision
                                    </button>
                                    <button onClick={() => handleStatusChange('rejected')} disabled={updatingStatus}
                                        className="px-6 py-3 rounded-xl border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">cancel</span> Reject
                                    </button>
                                    <button onClick={() => handleStatusChange('approved')} disabled={updatingStatus}
                                        className="px-8 py-3 rounded-xl bg-primary text-background-dark text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(19,236,236,0.4)] transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg font-black">check_circle</span> Approve
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Feedback box for revision/reject */}
                        {showFeedbackBox && (
                            <div className="glass p-8 rounded-3xl border border-amber-500/20 space-y-4">
                                <h3 className="text-sm font-black text-amber-400 uppercase italic tracking-widest">Add Feedback for Student</h3>
                                <textarea
                                    className="w-full bg-white/5 border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-xl p-4 h-32 text-sm outline-none text-white/70 leading-relaxed"
                                    placeholder="Explain what needs to be revised..."
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                />
                                <div className="flex gap-4">
                                    <button onClick={() => applyStatus(pendingStatus, feedback)} disabled={updatingStatus}
                                        className="px-8 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-all flex items-center gap-2">
                                        {updatingStatus && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                                        Confirm
                                    </button>
                                    <button onClick={() => setShowFeedbackBox(false)}
                                        className="px-6 py-3 rounded-xl border border-white/10 text-white/40 font-black uppercase tracking-widest text-[10px] hover:border-white/20 transition-all">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {actionMsg && (
                            <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-widest text-center">
                                {actionMsg}
                            </div>
                        )}

                        {/* AI Evaluation Section */}
                        {activeReportId && (
                            <div className="space-y-8">
                                {/* Score Visualization */}
                                {aiEval ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Score Orb */}
                                        <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center relative overflow-hidden border border-white/5">
                                            <div className="absolute top-0 left-0 w-40 h-40 bg-primary/5 blur-[80px]" />
                                            <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary/5 blur-[80px]" />
                                            <div className="relative size-56">
                                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                                    <circle className="text-white/5" cx="50" cy="50" fill="transparent" r="42" stroke="currentColor" strokeWidth="8" />
                                                    <circle className="text-primary drop-shadow-[0_0_10px_#13ecec]" cx="50" cy="50" fill="transparent" r="42" stroke="currentColor"
                                                        strokeDasharray="264"
                                                        strokeDashoffset={264 - (264 * (overallScore || 0) / 100)}
                                                        strokeLinecap="round" strokeWidth="10"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-6xl font-black text-white tracking-tighter">{overallScore ?? '--'}</span>
                                                    <span className="text-[9px] text-white/30 font-black uppercase tracking-[0.3em] mt-1">AI Score / 100</span>
                                                </div>
                                            </div>
                                            <div className="mt-8 flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em] bg-primary/5 px-5 py-2 rounded-full border border-primary/20">
                                                <span className="material-symbols-outlined text-sm">verified</span>
                                                {aiEval.confidence_level >= 0.6 ? 'AI Verified' : 'Low Confidence'}
                                            </div>
                                        </div>

                                        {/* Score Bars */}
                                        <div className="space-y-4">
                                            <ScoreBar label="Clarity" score={aiEval.clarity_score} icon="lightbulb" />
                                            <ScoreBar label="Completeness" score={aiEval.completeness_score} icon="done_all" color="emerald-400" />
                                            <ScoreBar label="Relevance" score={aiEval.relevance_score} icon="pin_invoke" color="violet-400" />
                                            <ScoreBar label="Grammar" score={aiEval.grammar_score} icon="spellcheck" color="amber-400" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="glass rounded-2xl p-12 text-center border border-white/5">
                                        <span className="material-symbols-outlined text-5xl text-white/10 block mb-3">hourglass_empty</span>
                                        <p className="text-white/30 font-bold uppercase tracking-widest text-sm">AI evaluation pending</p>
                                        <p className="text-white/20 text-xs mt-2">The system will evaluate this report automatically. You can also
                                            <button onClick={async () => {
                                                if (!activeReportId) return;
                                                try { await evaluationAPI.getAIEvaluation(activeReportId); window.location.reload(); } catch (e) { }
                                            }} className="text-primary hover:underline ml-1">trigger it manually</button>.
                                        </p>
                                    </div>
                                )}

                                {/* AI Feedback */}
                                {aiEval?.feedback_summary && (
                                    <div className="glass rounded-2xl p-10 border border-white/5 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                                            <span className="material-symbols-outlined text-[120px] text-primary">neurology</span>
                                        </div>
                                        <h3 className="text-sm font-black uppercase italic tracking-tight flex items-center gap-3 mb-6">
                                            <span className="material-symbols-outlined text-primary">neurology</span>
                                            AI Feedback Summary
                                        </h3>
                                        <p className="text-white/60 text-sm leading-relaxed">{aiEval.feedback_summary}</p>
                                    </div>
                                )}

                                {/* Supervisor Feedback */}
                                {report?.supervisor_feedback && (
                                    <div className="glass rounded-2xl p-8 border border-amber-500/20 bg-amber-500/5">
                                        <h3 className="text-sm font-black uppercase italic tracking-tight flex items-center gap-3 mb-4 text-amber-400">
                                            <span className="material-symbols-outlined">supervisor_account</span>
                                            Supervisor Feedback
                                        </h3>
                                        <p className="text-white/60 text-sm leading-relaxed">{report.supervisor_feedback}</p>
                                    </div>
                                )}

                                {/* Supervisor Evaluation Scores */}
                                {supEval && (
                                    <div className="glass rounded-2xl p-10 border border-white/5 space-y-6">
                                        <h3 className="text-sm font-black uppercase italic tracking-tight flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary">person_check</span>
                                            Supervisor Evaluation
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {[
                                                { label: 'Technical Skill', value: supEval.technical_skill, icon: 'code' },
                                                { label: 'Communication', value: supEval.communication, icon: 'forum' },
                                                { label: 'Teamwork', value: supEval.teamwork, icon: 'group' },
                                                { label: 'Initiative', value: supEval.initiative, icon: 'bolt' },
                                                { label: 'Overall', value: supEval.overall_performance, icon: 'star' },
                                                { label: 'Final Score', value: supEval.final_score, icon: 'military_tech' },
                                            ].map(item => (
                                                <div key={item.label} className="bg-white/5 rounded-xl p-5 text-center border border-white/5">
                                                    <span className="material-symbols-outlined text-primary/60 text-2xl block mb-1">{item.icon}</span>
                                                    <p className="text-2xl font-black text-white">{item.value}<span className="text-sm text-white/30">/10</span></p>
                                                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">{item.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                        {supEval.remarks && (
                                            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Remarks</p>
                                                <p className="text-white/60 text-sm">{supEval.remarks}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                                    <Link to="/report-history"
                                        className="flex items-center gap-2 text-white/40 font-black uppercase tracking-widest text-[10px] hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                                        Report History
                                    </Link>
                                    <Link to="/submit-report"
                                        className="px-8 py-3 rounded-xl border border-primary/30 text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary/10 transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                        Submit Another Report
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <style>{`
                    @media print {
                        .no-print, .Sidebar, .Header, .Footer, button, .Link { display: none !important; }
                        body, html { background: white !important; color: black !important; }
                        main { overflow: visible !important; height: auto !important; margin: 0 !important; padding: 0 !important; }
                        .flex-1 { overflow: visible !important; }
                        .glass { border: 1px solid #eee !important; box-shadow: none !important; background: white !important; color: black !important; }
                        .text-white { color: black !important; }
                        .text-white/70, .text-white/40, .text-white/30, .text-white/20 { color: #444 !important; }
                        .text-primary { color: #000 !important; font-weight: bold !important; }
                        .border-white/5, .border-white/10 { border-color: #eee !important; }
                        .bg-background-dark { background: white !important; }
                        .ScoreBar, .glass { page-break-inside: avoid; }
                        h1 { font-size: 24pt !important; color: black !important; margin-bottom: 20pt !important; }
                        .max-w-5xl { max-width: 100% !important; margin: 0 !important; width: 100% !important; }
                    }
                `}</style>
                <Footer />
            </main>
        </div>
    );
};

export default EvaluationResults;
