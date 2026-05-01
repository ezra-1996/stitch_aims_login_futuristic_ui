import React, { useEffect, useState, useMemo } from 'react';
import { internshipsAPI, attendanceAPI, evaluationAPI } from '../services/api';
import { useUser } from '../context/UserContext';

const CompanyInternPerformance: React.FC = () => {
    const { user } = useUser();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [assignsData, attData, reportsData] = await Promise.all([
                    internshipsAPI.getSupervisorAssignments(),
                    attendanceAPI.getAttendance(),
                    evaluationAPI.getWeeklyReports()
                ]);

                // Filter active assignments only
                const activeAssigns = assignsData.filter((a: any) => a.is_active);
                setAssignments(activeAssigns);
                setAttendanceRecords(attData);
                setReports(reportsData);

                if (activeAssigns.length > 0 && !selectedStudentId) {
                    setSelectedStudentId(activeAssigns[0].student);
                }
            } catch (err) {
                console.error("Failed to load performance data", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    const selectedStudent = useMemo(() =>
        assignments.find(a => a.student === selectedStudentId),
        [assignments, selectedStudentId]);

    const studentAttendance = useMemo(() =>
        attendanceRecords.filter(a => a.student === selectedStudentId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [attendanceRecords, selectedStudentId]);

    const studentReports = useMemo(() =>
        reports.filter(r => r.student === selectedStudentId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        [reports, selectedStudentId]);

    const stats = useMemo(() => {
        if (!selectedStudentId) return null;
        const totalDays = studentAttendance.length;
        const present = studentAttendance.filter(a => a.status === 'present').length;
        const rate = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

        const avgScore = studentReports.length > 0
            ? Math.round(studentReports.reduce((acc, r) => acc + (r.ai_evaluation?.score || 0), 0) / studentReports.length)
            : 0;

        return { attendanceRate: rate, avgScore, totalReports: studentReports.length };
    }, [studentAttendance, studentReports, selectedStudentId]);

    return (
        <div className="flex flex-col h-full bg-background-dark text-white rounded-2xl overflow-hidden glass border border-white/5 relative p-8">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Sidebar: Student List */}
                    <aside className="w-full md:w-80 border border-white/5 bg-white/2 rounded-2xl flex flex-col">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-primary font-black uppercase tracking-[0.2em] italic text-lg">Active Interns</h2>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">{assignments.length} MONITORING TARGETS</p>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                            {loading && <div className="text-white/30 text-xs text-center p-4">Loading fleet data...</div>}
                            {assignments.map(assign => (
                                <button
                                    key={assign.assignment_id}
                                    onClick={() => setSelectedStudentId(assign.student)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all group relative overflow-hidden ${selectedStudentId === assign.student
                                            ? 'bg-primary/10 border-primary/40 shadow-[0_0_15px_rgba(19,236,236,0.1)]'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="relative z-10">
                                        <p className={`font-bold text-sm ${selectedStudentId === assign.student ? 'text-white' : 'text-white/70'}`}>
                                            {assign.student_name || `Student #${assign.student}`}
                                        </p>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                                            Sup: {assign.supervisor_name || 'Unassigned'}
                                        </p>
                                    </div>
                                    {selectedStudentId === assign.student && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary box-shadow-[0_0_10px_#13ecec]"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* Main Content: Performance Details */}
                    <div className="flex-1">
                        {selectedStudent ? (
                            <div className="max-w-5xl space-y-8">
                                {/* Header Card */}
                                <div className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <span className="material-symbols-outlined text-9xl text-primary">data_usage</span>
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-primary/20">Active Intern</span>
                                            <span className="px-3 py-1 bg-white/5 text-white/40 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5">{selectedStudent.organization_name}</span>
                                        </div>
                                        <h1 className="text-4xl font-black italic uppercase tracking-tight text-white mb-6">
                                            {selectedStudent.student_name || `ID: ${selectedStudent.student}`}
                                        </h1>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Attendance Rate</p>
                                                <div className="flex items-end gap-2">
                                                    <span className={`text-3xl font-black italic ${stats?.attendanceRate && stats.attendanceRate > 80 ? 'text-primary' : 'text-red-400'}`}>
                                                        {stats?.attendanceRate}%
                                                    </span>
                                                    <span className="text-xs text-white/30 mb-1">/ 100%</span>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Reports Submitted</p>
                                                <div className="flex items-end gap-2">
                                                    <span className="text-3xl font-black italic text-white">
                                                        {stats?.totalReports}
                                                    </span>
                                                    <span className="text-xs text-white/30 mb-1">Total</span>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Avg. Report Score</p>
                                                <div className="flex items-end gap-2">
                                                    <span className={`text-3xl font-black italic ${stats?.avgScore && stats.avgScore > 70 ? 'text-primary' : 'text-yellow-400'}`}>
                                                        {stats?.avgScore}
                                                    </span>
                                                    <span className="text-xs text-white/30 mb-1">/ 100</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Attendance Log */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-black uppercase italic tracking-widest text-white flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">calendar_month</span>
                                                Attendance Log
                                            </h3>
                                        </div>
                                        <div className="space-y-3">
                                            {studentAttendance.length === 0 && (
                                                <div className="p-8 text-center text-white/20 italic border border-dashed border-white/10 rounded-2xl">No attendance records found.</div>
                                            )}
                                            {studentAttendance.map((record) => (
                                                <div key={record.attendance_id} className="glass p-4 rounded-xl border border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`size-10 rounded-lg flex items-center justify-center border font-bold text-xs uppercase ${record.status === 'present'
                                                                ? 'bg-primary/10 border-primary/30 text-primary'
                                                                : 'bg-red-500/10 border-red-500/30 text-red-500'
                                                            }`}>
                                                            {record.status?.substring(0, 3)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-white">{new Date(record.date).toLocaleDateString()}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] text-white/40 uppercase tracking-widest">{record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                                                {record.gps_latitude && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 font-mono">GPS OK</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {record.verification_method === 'face_id' && (
                                                        <span className="material-symbols-outlined text-white/20 text-lg" title="Biometrically Verified">face</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Weekly Reports */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-black uppercase italic tracking-widest text-white flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">history_edu</span>
                                                Weekly Reports
                                            </h3>
                                        </div>
                                        <div className="space-y-3">
                                            {studentReports.length === 0 && (
                                                <div className="p-8 text-center text-white/20 italic border border-dashed border-white/10 rounded-2xl">No weekly reports submitted.</div>
                                            )}
                                            {studentReports.map((report) => (
                                                <div key={report.report_id} className="glass p-5 rounded-xl border border-white/5 space-y-3 group hover:border-primary/30 transition-all">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <span className="text-[9px] text-primary font-black uppercase tracking-widest">Week {report.week_number}</span>
                                                            <h4 className="font-bold text-white text-sm mt-1">{report.title}</h4>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {report.ai_evaluation ? (
                                                                <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-bold text-white">
                                                                    AI: <span className={report.ai_evaluation.score > 80 ? 'text-primary' : 'text-yellow-400'}>{report.ai_evaluation.score}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[9px] italic text-white/30">Pending Eval</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                                                        {report.content_summary || "No summary available."}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
                                <span className="material-symbols-outlined text-6xl opacity-20">analytics</span>
                                <p className="text-sm font-bold uppercase tracking-widest">Select an intern to view performance analytics</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyInternPerformance;
