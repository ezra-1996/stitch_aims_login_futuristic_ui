import React, { useEffect, useState } from 'react';

import { evaluationAPI, usersAPI } from '../services/api';

const UniversityAdminPerformance: React.FC = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [repData, stData] = await Promise.all([
                    evaluationAPI.getWeeklyReports(),
                    usersAPI.getStudents()
                ]);
                setReports(repData);
                setStudents(stData);
            } catch (err) {
                setError("Failed to load performance data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="flex flex-col h-full bg-background-dark text-white rounded-2xl overflow-hidden glass border border-white/5 relative p-8">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black uppercase italic underline decoration-primary/30 underline-offset-8">
                                    Student <span className="text-primary italic">Performance</span>
                                </h1>
                                <p className="text-white/40 text-sm mt-3 uppercase tracking-widest font-bold">Monitor student progress, evaluations, and supervisor feedback.</p>
                            </div>
                            <button 
                                onClick={() => {
                                    const csvContent = "data:text/csv;charset=utf-8," 
                                        + "Report ID,Student Name,Week,Status,AI Score,Supervisor Feedback\n"
                                        + reports.map(r => `${r.report_id},"${r.student_name}",${r.week_number},${r.status},${r.ai_score || ''},"${r.supervisor_feedback || ''}"`).join("\n");
                                    const encodedUri = encodeURI(csvContent);
                                    const link = document.createElement("a");
                                    link.setAttribute("href", encodedUri);
                                    link.setAttribute("download", `institutional_report_${new Date().toISOString().slice(0,10)}.csv`);
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="bg-primary/10 border border-primary/30 text-primary px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-background-dark transition-all shadow-[0_0_15px_rgba(19,236,236,0.1)] flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">download</span>
                                Generate Report
                            </button>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-6xl text-primary">analytics</span>
                                </div>
                                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Average AI Score</h3>
                                <div className="text-3xl font-black text-primary mt-2">8.4<span className="text-sm text-white/20">/10</span></div>
                            </div>
                            <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-6xl text-primary">history_edu</span>
                                </div>
                                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Reports Submitted</h3>
                                <div className="text-3xl font-black text-primary mt-2">{reports.length}</div>
                            </div>
                            <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-6xl text-primary">person</span>
                                </div>
                                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Active Interns</h3>
                                <div className="text-3xl font-black text-primary mt-2">{students.length}</div>
                            </div>
                        </div>

                        {/* Performance Table */}
                        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <h2 className="text-sm font-black uppercase tracking-widest">Recent Evaluations</h2>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-primary/60">
                                    <tr>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Week</th>
                                        <th className="px-6 py-4">Report Status</th>
                                        <th className="px-6 py-4">AI Score</th>
                                        <th className="px-6 py-4">Supervisor Feedback</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {reports.map(report => (
                                        <tr key={report.report_id} className="hover:bg-white/[0.02] transition-all group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-sm text-white group-hover:text-primary transition-colors cursor-pointer">{report.student_name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-white/40">Week {report.week_number}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded border ${report.status === 'approved' ? 'border-green-500/30 text-green-500 bg-green-500/5' : 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5'}`}>
                                                    {report.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-primary">{report.ai_score || 'N/A'}/10</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-white/60 line-clamp-1 italic max-w-xs">{report.supervisor_feedback || 'No feedback yet'}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
            </div>
        </div>
    );
};

export default UniversityAdminPerformance;
