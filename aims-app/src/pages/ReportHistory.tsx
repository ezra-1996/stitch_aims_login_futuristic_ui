import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { evaluationAPI } from '../services/api';

const ReportHistory: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState(searchParams.get('status') || 'All');
    const studentId = searchParams.get('studentId') ? Number(searchParams.get('studentId')) : null;
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await evaluationAPI.getWeeklyReports();
                setReports(data);
            } catch (err) {
                console.error("Failed to fetch reports", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    const filteredReports = useMemo(() => {
        return reports.filter(r => {
            const status = r.status.toLowerCase();
            const matchesStudent = !studentId || r.student === studentId;
            const matchesFilter = filter === 'All' ||
                (filter === 'Pending' && (status === 'pending' || status === 'pending review' || status === 'pending_review')) ||
                status === filter.toLowerCase();

            const matchesSearch = r.week_number.toString().includes(searchTerm) ||
                (r.content && r.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (r.title && r.title.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesStudent && matchesFilter && matchesSearch;
        });
    }, [reports, filter, searchTerm, studentId]);

    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return 'text-primary bg-primary/10 border-primary/20 shadow-[0_0_8px_rgba(19,236,236,0.4)]';
            case 'revision':
                return 'text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-[0_0_8px_rgba(251,191,36,0.4)]';
            case 'pending':
            case 'pending review':
                return 'text-white/40 bg-white/5 border-white/10 shadow-none';
            default:
                return 'text-white/20 bg-white/5 border-white/5 shadow-none';
        }
    };

    const handleExport = () => {
        const headers = "Week,Date,Status,AI Score,Supervisor Grade\n";
        const rows = filteredReports.map(r =>
            `${r.week_number},${new Date(r.submitted_date).toLocaleDateString()},${r.status},${r.ai_score || 'N/A'},${r.grade || 'N/A'}`
        ).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Weekly_Reports_Export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    return (
        <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden">
            <Sidebar />

            <main className="flex-1 relative flex flex-col overflow-hidden">
                <Header />

                {/* Page Content */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-8">
                    <div className="max-w-6xl mx-auto space-y-10">
                        {/* Header Area */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-4">
                                <h2 className="text-4xl font-bold tracking-tight uppercase italic">Report <span className="text-primary">History</span></h2>
                                <p className="text-white/40 max-w-lg text-sm">Access and track the logs of your submitted internship reports. Review feedback and monitor your progress grades.</p>
                            </div>
                            <Link
                                to="/submit-report"
                                className="px-8 py-3 bg-primary text-background-dark font-black text-xs uppercase tracking-widest rounded-xl hover:shadow-[0_0_30px_rgba(19,236,236,0.4)] transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg font-black">upload_file</span>
                                Submit New Report
                            </Link>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="flex flex-wrap items-center gap-4 py-2">
                            <div className="relative flex-1 min-w-[300px]">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20">search</span>
                                <input
                                    className="w-full bg-white/5 border-white/10 rounded-xl pl-12 h-12 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                                    placeholder="Filter by week or content..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    type="text"
                                />
                            </div>
                            <div className="flex items-center gap-1 glass p-1 rounded-xl border border-white/5">
                                {['All', 'Approved', 'Pending', 'Revision'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${filter === f ? 'bg-primary text-background-dark shadow-[0_0_10px_rgba(19,236,236,0.3)]' : 'text-white/40 hover:text-white'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 glass px-5 h-12 hover:bg-white/5 transition-all text-sm rounded-xl border border-white/5 font-bold uppercase tracking-widest text-primary/60 hover:text-primary no-print"
                            >
                                <span className="material-symbols-outlined text-lg">download</span>
                                Export CSV
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 glass px-5 h-12 hover:bg-white/5 transition-all text-sm rounded-xl border border-white/5 font-bold uppercase tracking-widest text-primary/60 hover:text-primary no-print"
                            >
                                <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                                Print List
                            </button>
                        </div>

                        {/* Reports Table */}
                        <div className="glass rounded-xl overflow-hidden border border-white/5">
                            {loading ? (
                                <div className="p-20 text-center"><span className="material-symbols-outlined animate-spin text-primary">sync</span></div>
                            ) : filteredReports.length === 0 ? (
                                <div className="p-20 text-center text-white/20 italic font-bold">No reports found matching criteria.</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/[0.02]">
                                            <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Week</th>
                                            <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Submission Date</th>
                                            <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Status</th>
                                            <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Grade</th>
                                            <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredReports.map((report) => (
                                            <tr key={report.report_id || report.id} className="hover:bg-white/[0.02] transition-all group">
                                                <td className="px-8 py-6">
                                                    <span className={`text-sm font-bold ${report.status.toLowerCase() === 'approved' ? 'text-primary' : 'text-white/60'}`}>WEEK {report.week_number}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-white/60">
                                                        <span className="material-symbols-outlined text-lg opacity-40">calendar_today</span>
                                                        <span className="text-sm">{new Date(report.submitted_date).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`size-2 rounded-full ${getStatusStyles(report.status).split(' ').pop()}`}></span>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${getStatusStyles(report.status).split(' ')[0]}`}>{report.status}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-sm font-medium text-white/80">
                                                        {report.grade ? `${report.grade} / 10` : report.status === 'approved' ? 'Evaluating...' : '-- / 10'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-3">
                                                        <Link
                                                            to={`/evaluation-results?report=${report.report_id || report.id}`}
                                                            className="material-symbols-outlined text-white/20 hover:text-primary transition-all p-2 rounded-lg hover:bg-primary/10 flex items-center justify-center cursor-pointer"
                                                        >
                                                            visibility
                                                        </Link>
                                                        
                                                        <Link
                                                            to={`/evaluation-results?report=${report.report_id || report.id}&print=true`}
                                                            className="material-symbols-outlined text-white/20 hover:text-primary transition-all p-2 rounded-lg hover:bg-primary/10"
                                                        >
                                                            picture_as_pdf
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
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
                        table { width: 100% !important; border-collapse: collapse !important; }
                        th, td { border-bottom: 1px solid #eee !important; color: black !important; padding: 10pt !important; }
                        .max-w-6xl { max-width: 100% !important; margin: 0 !important; width: 100% !important; }
                    }
                `}</style>
                <Footer />
            </main>
        </div>
    );
};

export default ReportHistory;
