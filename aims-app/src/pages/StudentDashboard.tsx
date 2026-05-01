import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useUser } from '../context/UserContext';
import { internshipsAPI, attendanceAPI, evaluationAPI } from '../services/api';

const StudentDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [activeInternship, setActiveInternship] = useState<any>(null);
    const [attendanceStats, setAttendanceStats] = useState<any>({ rate: 0, days_tracked: 0, days_missed: 0 });
    const [reportStats, setReportStats] = useState<any>({ total: 0, approved: 0, revision: 0 });
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Check for active internship application or assignment
                try {
                    const [apps, assignments] = await Promise.all([
                        internshipsAPI.getApplications().catch(() => []),
                        internshipsAPI.getSupervisorAssignments().catch(() => [])
                    ]);
                    
                    const activeAssignment = assignments.find((a: any) => a.is_active);
                    const approvedApp = apps.find((a: any) => a.status === 'accepted' || a.status === 'approved' || a.status === 'offered');
                    
                    if (activeAssignment) {
                        const matchingApp = apps.find((a: any) => a.status === 'accepted' || a.status === 'approved' || a.status === 'offered');
                        setActiveInternship({
                            title: matchingApp?.post_title || 'Active Internship',
                            company: activeAssignment.organization_name || 'Partner Organization',
                            supervisor: activeAssignment.supervisor_name || 'Pending',
                            location: 'On-site',
                            duration: activeAssignment.start_date && activeAssignment.end_date ? `${activeAssignment.start_date} to ${activeAssignment.end_date}` : '6 Months'
                        });
                    } else if (approvedApp) {
                        setActiveInternship({
                            title: approvedApp.post_title || 'Internship Program',
                            company: approvedApp.organization_name || 'Partner Organization',
                            supervisor: 'Pending Assignment',
                            location: 'On-site',
                            duration: '6 Months'
                        });
                    }
                } catch (e) {
                    console.log('No applications or error fetching', e);
                }

                // 2. Get attendance stats
                const studentId = localStorage.getItem('student_id') || user?.student_profile?.student_id;
                if (studentId) {
                    try {
                        const att = await attendanceAPI.getStudentSummary(Number(studentId));
                        if (att) {
                            setAttendanceStats({
                                rate: att.attendance_percentage || 0,
                                days_tracked: att.total_days || 0,
                                days_missed: att.absent_days || 0
                            });
                        }
                    } catch (e) {
                        console.log('Error fetching attendance', e);
                    }
                }

                // 3. Get reports
                try {
                    const reports = await evaluationAPI.getWeeklyReports();
                    if (Array.isArray(reports)) {
                        setReportStats({
                            total: reports.length,
                            approved: reports.filter((r: any) => r.status.toLowerCase() === 'approved').length,
                            revision: reports.filter((r: any) => r.status.toLowerCase() === 'revision').length
                        });
                    }
                } catch (e) {
                    console.log('Error fetching reports', e);
                }

                // 4. Get Tasks
                try {
                    const t = await internshipsAPI.getTasks();
                    setTasks(t.filter((item: any) => item.status !== 'done').slice(0, 3));
                } catch (e) {
                    console.log('Error fetching tasks', e);
                }

            } catch (err) {
                console.error('Dashboard data fetch failed', err);
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

                    {loading ? (
                        <>
                            {/* Hero Skeleton */}
                            <div className="glass p-8 rounded-xl border border-white/5 animate-pulse">
                                <div className="h-10 w-2/3 bg-white/10 rounded mb-6"></div>
                                <div className="flex gap-10">
                                    <div className="h-4 w-24 bg-white/10 rounded"></div>
                                    <div className="h-4 w-24 bg-white/10 rounded"></div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Circular Skeleton */}
                                <div className="lg:col-span-4 glass p-6 rounded-xl border border-white/5 flex flex-col items-center justify-center animate-pulse">
                                    <div className="size-32 rounded-full border-[8px] border-white/10"></div>
                                    <div className="h-3 w-32 bg-white/10 rounded mt-6"></div>
                                </div>
                                {/* Stats Skeleton */}
                                <div className="lg:col-span-8 glass p-6 rounded-xl border border-white/5 animate-pulse">
                                    <div className="h-4 w-40 bg-white/10 rounded mb-8"></div>
                                    <div className="h-16 w-full bg-white/5 rounded mb-4"></div>
                                    <div className="flex gap-4">
                                        <div className="h-12 flex-1 bg-white/5 rounded"></div>
                                        <div className="h-12 flex-1 bg-white/5 rounded"></div>
                                        <div className="h-12 flex-1 bg-white/5 rounded"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Tasks Skeleton */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[1,2,3].map(i => (
                                    <div key={i} className="glass p-5 rounded-xl border border-white/5 animate-pulse h-32"></div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Hero Section: Active Internship */}
                            <section className="relative z-10">
                        {activeInternship ? (
                            <div className="glass p-8 rounded-xl border border-primary/20 relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-4xl font-bold tracking-tight uppercase italic">{activeInternship.title}</h3>
                                        <div className="flex flex-wrap gap-10">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-primary/60">business</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Company</p>
                                                    <p className="text-sm font-bold uppercase tracking-tight">{activeInternship.company}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-primary/60">person</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Supervisor</p>
                                                    <p className="text-sm font-bold uppercase tracking-tight">{activeInternship.supervisor}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/report-history')}
                                        className="bg-primary text-background-dark font-black px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(19,236,236,0.2)] hover:shadow-[0_0_30px_rgba(19,236,236,0.4)] transition-all uppercase tracking-[0.2em] text-[10px] flex items-center gap-2"
                                    >
                                        VIEW REPORTS <span className="material-symbols-outlined text-sm">description</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="glass p-8 rounded-xl border border-white/10 relative overflow-hidden group hover:border-primary/40 transition-all duration-500 flex flex-col items-center justify-center text-center space-y-6 py-16">
                                <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-5xl text-white/20">work_off</span>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold tracking-tight uppercase">No Active Internship</h3>
                                    <p className="text-white/60 mt-2 max-w-md mx-auto">You haven't started an internship yet. Browse available opportunities and kickstart your career.</p>
                                </div>
                                <Link to="/browse-internships" className="bg-primary text-background-dark font-bold px-8 py-4 rounded shadow-[0_0_20px_rgba(19,236,236,0.4)] hover:shadow-[0_0_30px_rgba(19,236,236,0.6)] transition-all uppercase tracking-widest text-xs flex items-center gap-2">
                                    BROWSE OPPORTUNITIES <span className="material-symbols-outlined text-sm">search</span>
                                </Link>
                            </div>
                        )}
                    </section>

                    {/* Priority Tasks */}
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <h4 className="text-xs font-bold tracking-widest text-primary/60 uppercase">Priority Tasks</h4>
                            <Link to="/attendance" className="text-[10px] font-bold text-white/40 hover:text-primary transition-all uppercase tracking-widest">Manual Entry Protocol</Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {tasks.length > 0 ? (
                                tasks.map((task) => (
                                    <div key={task.task_id} className="glass p-5 rounded-xl border border-white/5 hover:border-primary/30 transition-all group relative">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter border border-primary/20">{task.status}</span>
                                            <span className="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors text-sm">assignment</span>
                                        </div>
                                        <h5 className="font-bold text-sm text-white mb-2 uppercase tracking-tight line-clamp-1">{task.title}</h5>
                                        <p className="text-[10px] text-white/40 line-clamp-2 mb-4 leading-relaxed">{task.description || 'No description provided.'}</p>
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-1.5 opacity-60">
                                                <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                                <span className="text-[9px] font-bold uppercase">{task.due_date || 'No deadline'}</span>
                                            </div>
                                            <button
                                                onClick={() => navigate('/submit-report')}
                                                className="text-[9px] font-black text-primary uppercase tracking-[0.2em] hover:underline"
                                            >
                                                Start Task
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-10 text-center glass rounded-xl border border-dashed border-white/10">
                                    <p className="text-xs text-white/20 font-bold uppercase tracking-widest italic">No pending tasks from your supervisor.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="relative z-10">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold tracking-widest text-primary/60 uppercase px-2">Quick Access</h4>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { name: 'Weekly Report', icon: 'add_task', primary: true, path: '/submit-report' },
                                    { name: 'Attendance', icon: 'fingerprint', primary: false, path: '/attendance' },
                                    { name: 'History', icon: 'history', primary: false, path: '/report-history' },
                                    { name: 'Applications', icon: 'work', primary: false, path: '/my-applications' },
                                ].map((action, i) => (
                                    <Link
                                        key={i}
                                        to={action.path}
                                        className={`w-full glass p-5 rounded-xl border ${action.primary ? 'border-primary/30 hover:bg-primary/10 hover:border-primary' : 'border-white/10 hover:bg-white/5'
                                            } transition-all flex items-center justify-between group cursor-pointer`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`material-symbols-outlined ${action.primary ? 'text-primary' : 'text-white/60'}`}>
                                                {action.icon}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${action.primary ? 'text-white' : 'text-white/80'}`}>
                                                {action.name}
                                            </span>
                                        </div>
                                        <span className={`material-symbols-outlined ${action.primary ? 'text-primary/40' : 'text-white/20'} group-hover:translate-x-1 transition-transform`}>
                                            chevron_right
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                    </>
                    )}
                </div>

                <Footer />
            </main>
        </div>
    );
};

export default StudentDashboard;
