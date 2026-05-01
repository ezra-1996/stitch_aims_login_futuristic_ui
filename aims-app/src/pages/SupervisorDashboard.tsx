import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { internshipsAPI, evaluationAPI, attendanceAPI } from '../services/api';

const SupervisorDashboard: React.FC = () => {
    const [interns, setInterns] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalInterns: 0,
        avgAttendance: 0,
        pendingReports: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Supervisor Assignments
                const assignments = await internshipsAPI.getSupervisorAssignments();

                // 2. Fetch Attendance for each intern
                const internData = await Promise.all(assignments.map(async (assign: any) => {
                    let attendanceRate = 0;
                    try {
                        const summary = await attendanceAPI.getStudentSummary(assign.student);
                        attendanceRate = summary.attendance_percentage || 0;
                    } catch (e) {
                        console.warn(`Failed to fetch attendance for student ${assign.student}`, e);
                    }
                    return {
                        ...assign,
                        attendanceRate
                    };
                }));

                setInterns(internData);

                // 3. Fetch Reports
                const allReports = await evaluationAPI.getWeeklyReports();
                // Filter pending reports (status 'pending') logic is handled by backend filtering for supervisor, 
                // but we need to count pending specifically.
                // Assuming backend returns ALL reports for my students.
                const pending = allReports.filter((r: any) => r.status === 'pending');
                setReports(pending);

                // 4. Calculate Stats
                const totalAttendance = internData.reduce((acc: number, curr: any) => acc + curr.attendanceRate, 0);
                const avg = internData.length > 0 ? totalAttendance / internData.length : 0;

                setStats({
                    totalInterns: internData.length,
                    avgAttendance: Math.round(avg),
                    pendingReports: pending.length
                });

            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden">
            <Sidebar />

            <main className="flex-1 relative flex flex-col overflow-hidden">
                <Header />

                {/* Dashboard Content */}
                <div className="flex-1 p-8 relative overflow-y-auto overflow-x-hidden space-y-8 custom-scrollbar">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass p-6 flex items-center justify-between border border-primary/20 rounded-xl">
                            <div>
                                <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-1">Total Interns</p>
                                <h3 className="text-3xl font-bold">{stats.totalInterns}</h3>
                            </div>
                            <div className="w-12 h-12 bg-primary/20 rounded flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">groups</span>
                            </div>
                        </div>
                        <div className="glass p-6 flex items-center justify-between border border-primary/20 rounded-xl">
                            <div>
                                <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-1">Avg. Attendance</p>
                                <h3 className="text-3xl font-bold">{stats.avgAttendance}%</h3>
                            </div>
                            <div className="w-12 h-12 bg-primary/20 rounded flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">event_available</span>
                            </div>
                        </div>
                        <div className="glass p-6 flex items-center justify-between border border-primary/20 rounded-xl">
                            <div>
                                <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-1">Pending Reports</p>
                                <h3 className="text-3xl font-bold text-primary">{stats.pendingReports}</h3>
                            </div>
                            <div className="w-12 h-12 bg-primary/20 rounded flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">priority_high</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Grid Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                        {/* Assigned Interns Section */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold tracking-tight uppercase italic border-l-4 border-primary pl-3">Assigned Interns</h2>
                                
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {interns.length === 0 && !loading && (
                                    <div className="col-span-2 p-8 text-center text-white/40 italic">No interns assigned yet.</div>
                                )}
                                {interns.map((intern, i) => (
                                    <div key={intern.assignment_id || i} className="glass p-5 group hover:border-primary/50 transition-all duration-300 rounded-xl border border-white/5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 border border-white/10 p-1 bg-white/5 rounded-full flex items-center justify-center overflow-hidden">
                                                    {/* Use a placeholder if no image */}
                                                    <span className="material-symbols-outlined text-white/20 text-2xl">person</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm">{intern.student_name}</h4>
                                                    <p className="text-[10px] text-white/50">{intern.organization_name}</p>
                                                    <div className={`mt-2 inline-block px-2 py-0.5 ${intern.is_active ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'} text-[10px] font-bold rounded`}>
                                                        {intern.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative w-16 h-16">
                                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                    <circle cx="50" cy="50" fill="transparent" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8"></circle>
                                                    <circle className="transition-all duration-1000 ease-out" cx="50" cy="50" fill="transparent" r="40" stroke="#13ecec"
                                                        strokeDasharray="251.2"
                                                        strokeDashoffset={251.2 - (251.2 * intern.attendanceRate / 100)}
                                                        strokeWidth="8" style={{ filter: 'drop-shadow(0 0 4px #13ecec)' }}></circle>
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{Math.round(intern.attendanceRate)}%</div>
                                            </div>
                                        </div>
                                        <div className="mt-6 flex gap-2">
                                            <Link to={`/report-history?studentId=${intern.student}`} className="flex-1 bg-white/5 hover:bg-white/10 text-[10px] font-bold py-2 transition-all text-center rounded">PROFILE</Link>
                                            <Link to={`/evaluate/${intern.student}`} className="flex-1 bg-primary text-background-dark text-[10px] font-bold py-2 transition-all text-center rounded hover:opacity-90">EVALUATE</Link>
                                        </div>
                                    </div>
                                ))}

                            </div>
                        </div>

                        {/* Pending Reports Panel */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold tracking-tight uppercase italic border-l-4 border-primary pl-3">Pending Reports</h2>
                            </div>
                            <div className="glass border border-white/5 rounded-xl divide-y divide-white/5 overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                                {reports.length === 0 && !loading && (
                                    <div className="p-4 text-center text-white/40 text-sm italic">No pending reports.</div>
                                )}
                                {reports.map((report, i) => (
                                    <div key={report.report_id || i} className="p-4 hover:bg-white/5 transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex gap-3">
                                                <span className="material-symbols-outlined text-primary text-lg">assignment</span>
                                                <div>
                                                    <h5 className="text-sm font-bold">{report.title}</h5>
                                                    <p className="text-[10px] text-white/50">Student ID: {report.student} • Week {report.week_number}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            
                                            <Link to={`/report/${report.report_id}`} className={`text-[10px] font-bold bg-primary text-background-dark px-3 py-1.5 hover:opacity-80 transition-all uppercase rounded text-center inline-block`}>
                                                Review
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </div>

                <Footer />
            </main>
        </div>
    );
};

export default SupervisorDashboard;
