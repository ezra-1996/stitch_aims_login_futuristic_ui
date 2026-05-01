import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { internshipsAPI } from '../services/api';
import { useUser } from '../context/UserContext';
import CompanyCandidates from './CompanyCandidates';
import CompanyInternPerformance from './CompanyInternPerformance';
import CompanySupervisorAssignment from './CompanySupervisorAssignment';
import PostInternship from './PostInternship';
import CompanySettings from './CompanySettings';

const CompanyAdminDashboard: React.FC = () => {
    const { user } = useUser();
    const [stats, setStats] = useState({
        totalApplications: 0,
        activeInterns: 0,
        completedInterns: 0,
        acceptanceRate: 0,
        avgProcessingTime: 0
    });
    const [pipeline, setPipeline] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [supervisors, setSupervisors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'postings' | 'supervisors' | 'performance' | 'settings'>('overview');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Applications (filtered by company admin in backend)
                const apps = await internshipsAPI.getApplications();
                setApplications(apps);

                // 2. Fetch Assignments (filtered by company admin in backend)
                const assigns = await internshipsAPI.getSupervisorAssignments();

                // Compute Stats
                const totalApps = apps.length;
                const active = assigns.filter((a: any) => a.is_active).length;
                const completed = assigns.filter((a: any) => !a.is_active).length; // Rough approximation

                // Pipeline Breakdown
                const pending = apps.filter((a: any) => a.status === 'pending').length;
                const approved = apps.filter((a: any) => a.status === 'accepted' || a.status === 'offered').length;
                const rejected = apps.filter((a: any) => a.status === 'rejected' || a.status === 'declined').length;

                // Acceptance Rate
                const accRate = totalApps > 0 ? (approved / totalApps) * 100 : 0;

                setStats({
                    totalApplications: totalApps,
                    activeInterns: active,
                    completedInterns: completed,
                    acceptanceRate: Math.round(accRate),
                    avgProcessingTime: 5 // Mock value for now
                });

                setPipeline([
                    { label: 'Applied', value: totalApps, active: true },
                    { label: 'Screening', value: pending },
                    { label: 'Offered', value: approved, highlight: true },
                    { label: 'Rejected', value: rejected }
                ]);

                // Extract Unique Supervisors from Assignments
                const uniqueSups = new Map();
                assigns.forEach((a: any) => {
                    if (!uniqueSups.has(a.supervisor)) {
                        uniqueSups.set(a.supervisor, {
                            id: a.supervisor,
                            name: a.supervisor_name,
                            load: 1,
                            max: 5 // Mock max load
                        });
                    } else {
                        const s = uniqueSups.get(a.supervisor);
                        s.load += 1;
                    }
                });
                setSupervisors(Array.from(uniqueSups.values()));

            } catch (err) {
                console.error("Failed to load company dashboard", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    const handleUpdateStatus = async (appId: number, status: string) => {
        try {
            await internshipsAPI.updateApplicationStatus(appId, status);
            // Re-fetch data without full page reload
            const apps = await internshipsAPI.getApplications();
            setApplications(apps);
            const assigns = await internshipsAPI.getSupervisorAssignments();
            const totalApps = apps.length;
            const pending = apps.filter((a: any) => a.status === 'pending').length;
            const approved = apps.filter((a: any) => a.status === 'accepted' || a.status === 'offered').length;
            const rejected = apps.filter((a: any) => a.status === 'rejected' || a.status === 'declined').length;
            const active = assigns.filter((a: any) => a.is_active).length;
            const completed = assigns.filter((a: any) => !a.is_active).length;
            const accRate = totalApps > 0 ? (approved / totalApps) * 100 : 0;
            setStats({
                totalApplications: totalApps,
                activeInterns: active,
                completedInterns: completed,
                acceptanceRate: Math.round(accRate),
                avgProcessingTime: 5
            });
            setPipeline([
                { label: 'Applied', value: totalApps, active: true },
                { label: 'Screening', value: pending },
                { label: 'Offered', value: approved, highlight: true },
                { label: 'Rejected', value: rejected }
            ]);
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    return (
        <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden">
            <Sidebar />

            <main className="flex-1 relative flex flex-col overflow-hidden">
                <Header />

                {/* Tab Navigation */}
                <div className="bg-background-dark/80 backdrop-blur-md border-b border-white/5 pt-4 px-8 sticky top-0 z-40 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                    {[
                        { id: 'overview', label: 'Dashboard', icon: 'dashboard' },
                        { id: 'candidates', label: 'Candidates', icon: 'recent_actors' },
                        { id: 'postings', label: 'Post Internship', icon: 'post_add' },
                        { id: 'supervisors', label: 'Supervisors', icon: 'supervised_user_circle' },
                        { id: 'performance', label: 'Performance', icon: 'monitoring' },
                        { id: 'settings', label: 'Settings', icon: 'settings' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-3 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 ${activeTab === tab.id ? 'bg-primary/10 text-primary border-primary' : 'text-white/40 border-transparent hover:text-white hover:bg-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Dashboard Content */}
                {activeTab === 'overview' && (
                <div className="flex-1 p-8 relative overflow-y-auto overflow-x-hidden space-y-8 custom-scrollbar">
                    {/* Top Header Stats */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold uppercase tracking-tighter">Company Metrics</h2>
                            <span className="flex items-center gap-2 px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[10px] font-bold border border-green-500/20">
                                <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span> LIVE
                            </span>
                        </div>
                        <button
                            onClick={() => setActiveTab('postings')}
                            className="bg-primary hover:bg-primary/80 text-background-dark px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm transition-all shadow-[0_0_15px_rgba(19,236,236,0.3)] flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">post_add</span>
                            Post Internship
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <button onClick={() => setActiveTab('candidates')} className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-primary/40 transition-all cursor-pointer text-left w-full">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-6xl text-primary material-symbols-outlined">trending_up</div>
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Total Applications</h3>
                            <div className="text-3xl font-black text-primary mt-1">{stats.totalApplications}</div>
                            <div className="mt-4 flex items-center gap-2 text-[8px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                                View Candidates <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                            </div>
                        </button>
                        <button onClick={() => setActiveTab('performance')} className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-primary/40 transition-all cursor-pointer text-left w-full">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-6xl text-primary material-symbols-outlined">person_play</div>
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Active Interns</h3>
                            <div className="text-3xl font-black text-primary mt-1">{stats.activeInterns}</div>
                            <div className="mt-4 flex items-center gap-2 text-[8px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                                View Performance <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                            </div>
                        </button>
                        <button onClick={() => setActiveTab('supervisors')} className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-primary/40 transition-all cursor-pointer text-left w-full">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-6xl text-primary material-symbols-outlined">check_circle</div>
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Completed Internships</h3>
                            <div className="text-3xl font-black text-primary mt-1">{stats.completedInterns}</div>
                            <div className="mt-4 flex items-center gap-2 text-[8px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                                View Supervisors <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                            </div>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Left Column: Pipeline and Activity */}
                        <div className="xl:col-span-2 space-y-8">
                            {/* Application Pipeline */}
                            <div className="glass p-8 rounded-xl border border-white/5">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-lg font-bold flex items-center gap-2 uppercase italic tracking-tight">
                                        <span className="material-symbols-outlined text-primary">analytics</span>
                                        Application Pipeline
                                    </h3>
                                    <button onClick={() => setActiveTab('candidates')} className="text-xs text-primary font-bold hover:underline uppercase tracking-widest">View All Candidates</button>
                                </div>

                                {/* Pipeline Steps */}
                                <div className="flex items-center justify-between relative px-4 text-center">
                                    <div className="absolute h-[1px] bg-white/5 left-0 right-0 top-1/2 -translate-y-6 z-0"></div>
                                    {pipeline.map((step, i, arr) => (
                                        <React.Fragment key={step.label}>
                                            <div className="relative z-10 flex flex-col items-center gap-3">
                                                <div className={`size-12 rounded-full glass border flex items-center justify-center transition-all ${step.highlight ? 'bg-primary/20 border-primary shadow-[0_0_10px_rgba(19,236,236,0.3)]' : step.active ? 'border-primary' : 'border-white/10'}`}>
                                                    <span className={`text-lg font-bold ${step.highlight || step.active ? 'text-primary' : 'text-white/60'}`}>{step.value}</span>
                                                </div>
                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${step.highlight ? 'text-primary' : 'text-white/40'}`}>{step.label}</span>
                                            </div>
                                            {i < arr.length - 1 && <span className="material-symbols-outlined text-white/10 mt-[-24px]">chevron_right</span>}
                                        </React.Fragment>
                                    ))}
                                </div>

                            </div>

                            {/* Application Management Queue */}
                            <div className="glass rounded-xl border border-white/5 overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">assignment_ind</span>
                                        Incoming Applications
                                    </h4>
                                    <span className="text-[10px] text-white/40 font-medium">{pipeline.find(p => p.label === 'Screening')?.value || 0} Pending</span>
                                </div>
                                <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {applications.filter(a => a.status === 'pending').length === 0 && !loading && (
                                        <div className="p-12 text-center text-white/20 italic text-sm font-medium tracking-widest uppercase">No pending applications</div>
                                    )}
                                    {applications.filter(a => a.status === 'pending').map((app) => (
                                        <div key={app.application_id} className="p-6 hover:bg-white/5 transition-all group">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-xl">
                                                        {app.student_name?.[0] || 'S'}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-white group-hover:text-primary transition-colors italic">{app.student_name}</h5>
                                                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none mt-1">{app.post_title}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleUpdateStatus(app.application_id, 'offered')}
                                                        className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-background-dark transition-all rounded shadow-[0_0_10px_rgba(19,236,236,0.1)] hover:shadow-[0_0_20px_rgba(19,236,236,0.3)]"
                                                    >
                                                        Offer
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(app.application_id, 'rejected')}
                                                        className="px-4 py-2 bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50 transition-all rounded"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Right Column: Supervisors */}
                        <div className="xl:col-span-1">
                            <div className="glass p-6 rounded-xl border border-white/5 h-full flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="font-bold flex items-center gap-2 uppercase italic tracking-tight">
                                        <span className="material-symbols-outlined text-primary">groups</span>
                                        Supervisors
                                    </h3>
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{supervisors.length} Active</span>
                                </div>

                                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
                                    {supervisors.length === 0 && !loading && <div className="text-white/40 text-sm italic">No active supervisors found.</div>}
                                    {supervisors.map((sup, i) => (
                                        <div key={sup.id || i} className="p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-primary/40 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-lg border border-primary/20 overflow-hidden bg-primary/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-white/60">person</span>
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-sm font-bold truncate">{sup.name}</p>
                                                    <p className="text-[10px] text-white/40 uppercase truncate tracking-tighter">Assigned Supervisor</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 space-y-2">
                                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                                                    <span>Intern Load</span>
                                                    <span className={sup.load >= sup.max ? 'text-red-400' : 'text-primary'}>{sup.load} / {sup.max}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    {[...Array(sup.max)].map((_, idx) => (
                                                        <div key={idx} className={`h-1.5 flex-1 rounded-full ${idx < sup.load ? 'bg-primary shadow-[0_0_5px_rgba(19,236,236,0.6)]' : 'bg-white/5'}`}></div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={() => setActiveTab('supervisors')} className="w-full py-3 mt-6 border border-white/5 rounded-xl text-[10px] font-bold text-white/40 hover:text-primary hover:border-primary/40 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-sm font-bold">add</span>
                                    Add Supervisor
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                )}

                {/* Sub-components */}
                <div className="flex-1 overflow-hidden relative">
                    {activeTab === 'candidates' && <CompanyCandidates />}
                    {activeTab === 'postings' && <PostInternship />}
                    {activeTab === 'supervisors' && <CompanySupervisorAssignment />}
                    {activeTab === 'performance' && <CompanyInternPerformance />}
                    {activeTab === 'settings' && <CompanySettings />}
                </div>

                <Footer />
            </main>
        </div>
    );
};

export default CompanyAdminDashboard;
