import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { organizationsAPI, usersAPI, internshipsAPI } from '../services/api';
import UniversityAdminStudents from './UniversityAdminStudents';
import UniversityCompanies from './UniversityCompanies';
import UniversityAdminAssignments from './UniversityAdminAssignments';
import UniversityAdminPerformance from './UniversityAdminPerformance';
import UniversityAdminMessages from './UniversityAdminMessages';
import AdminCredentialsTable from './AdminCredentialsTable';

const UniversityAdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        activePartners: 0,
        placementRate: 0,
    });
    const [pendingOrgs, setPendingOrgs] = useState<any[]>([]);
    const [pendingStudents, setPendingStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'companies' | 'assignments' | 'performance' | 'messages' | 'credentials'>('overview');

    const fetchData = async () => {
        try {
            // 1. Fetch Students
            const students = await usersAPI.getStudents().catch(() => []);

            // 2. Fetch Organizations
            const orgs = await organizationsAPI.getOrganizations();
            const activeOrgs = orgs.filter((o: any) => o.status === 'approved');
            const pending = orgs.filter((o: any) => o.status === 'pending');

            setPendingOrgs(pending);

            // Fetch Pending Students
            const pendingSt = students.filter((s: any) => s.user.status === 'pending');
            setPendingStudents(pendingSt);

            // 3. Fetch Applications for Placement Rate
            const apps = await internshipsAPI.getApplications().catch(() => []);
            const placed = apps.filter((a: any) => a.status === 'approved').length; // Simplistic
            // Better: Unique students with approved apps.
            const placedStudents = new Set(apps.filter((a: any) => a.status === 'approved').map((a: any) => a.student)).size;

            const totalSt = students.length;
            const rate = totalSt > 0 ? (placedStudents / totalSt) * 100 : 0;

            setStats({
                totalStudents: totalSt,
                activePartners: activeOrgs.length,
                placementRate: Math.round(rate * 10) / 10,
            });

        } catch (err) {
            console.error("Failed to load admin dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (orgId: number) => {
        try {
            await organizationsAPI.approveOrganization(orgId);
            fetchData(); // Refresh list
        } catch (e) {
            console.error("Approval failed", e);
        }
    };

    const handleReject = async (orgId: number) => {
        try {
            await organizationsAPI.rejectOrganization(orgId);
            fetchData();
        } catch (e) {
            console.error("Rejection failed", e);
        }
    };

    const handleApproveStudent = async (studentId: number) => {
        try {
            await usersAPI.approveStudent(studentId);
            fetchData();
        } catch (e) {
            console.error("Student approval failed", e);
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
                        { id: 'students', label: 'Students', icon: 'school' },
                        { id: 'companies', label: 'Partner Orgs', icon: 'business' },
                        { id: 'assignments', label: 'Assignments', icon: 'assignment' },
                        { id: 'performance', label: 'Performance', icon: 'analytics' },
                        { id: 'credentials', label: 'Credentials', icon: 'key' },
                        { id: 'messages', label: 'Broadcasts', icon: 'campaign' }
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
                            <h2 className="text-xl font-bold uppercase tracking-tighter">System Metrics</h2>
                            <span className="flex items-center gap-2 px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[10px] font-bold border border-green-500/20">
                                <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span> LIVE
                            </span>
                        </div>
                        <Link
                            to="/admin/users"
                            className="bg-primary hover:bg-primary/80 text-background-dark px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm transition-all shadow-[0_0_15px_rgba(19,236,236,0.3)] flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">person_add</span>
                            Register Users
                        </Link>
                    </div>


                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <button onClick={() => setActiveTab('students')} className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-primary/40 transition-all cursor-pointer text-left w-full">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-6xl text-primary material-symbols-outlined">group</div>
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Total Students</h3>
                            <div className="text-3xl font-black text-primary mt-1">{stats.totalStudents}</div>
                            <div className="mt-4 flex items-center gap-2 text-[8px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                                View Students <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                            </div>
                        </button>
                        <button onClick={() => setActiveTab('companies')} className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-primary/40 transition-all cursor-pointer text-left w-full">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-6xl text-primary material-symbols-outlined">business</div>
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Partner Companies</h3>
                            <div className="text-3xl font-black text-primary mt-1">{stats.activePartners}</div>
                            <div className="mt-4 flex items-center gap-2 text-[8px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                                View Organizations <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                            </div>
                        </button>
                        <button onClick={() => setActiveTab('performance')} className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-primary/40 transition-all cursor-pointer text-left w-full">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-6xl text-primary material-symbols-outlined">assignment_turned_in</div>
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Placement Rate</h3>
                            <div className="text-3xl font-black text-primary mt-1">{stats.placementRate}%</div>
                            <div className="mt-4 flex items-center gap-2 text-[8px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                                View Performance <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                            </div>
                        </button>
                    </div>

                    {/* Main Content Areas */}
                    <div className="grid grid-cols-12 gap-8">
                        {/* Left Column: Approval Queue */}
                        <div className="col-span-12 space-y-8">
                            <div className="glass rounded-xl flex flex-col border border-white/5 min-h-[500px]">
                                <div className="p-6 border-b border-white/5">
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Approval Queue</h4>
                                    <p className="text-[10px] text-white/40">Pending company verification requests</p>
                                </div>
                                <div className="flex-1 divide-y divide-white/5 overflow-y-auto custom-scrollbar">
                                    {(pendingOrgs.length === 0 && pendingStudents.length === 0) && !loading && (
                                        <div className="p-8 text-center text-white/40 italic text-sm">No pending requests.</div>
                                    )}

                                    {/* Organizations */}
                                    {pendingOrgs.map((org, i) => (
                                        <div key={`org-${org.org_id || i}`} className="p-5 hover:bg-white/5 transition-all group">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 bg-white/5 flex items-center justify-center rounded border border-primary/20 font-bold text-primary group-hover:bg-primary/20 transition-all uppercase">{(org.org_name || '?').substring(0, 2)}</div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{org.org_name}</p>
                                                        <p className="text-[10px] text-white/40 font-medium">Organization • {org.industry || 'Sector'}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[8px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 uppercase tracking-tighter">Org</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleApprove(org.org_id)} className="flex-1 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold hover:bg-primary hover:text-background-dark transition-all uppercase tracking-widest rounded">Approve</button>
                                                <button onClick={() => handleReject(org.org_id)} className="flex-1 py-1.5 bg-white/5 border border-white/10 text-white/40 text-[10px] font-bold hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50 transition-all uppercase tracking-widest rounded">Reject</button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Students */}
                                    {pendingStudents.map((student, i) => (
                                        <div key={`student-${student.student_id || i}`} className="p-5 hover:bg-white/5 transition-all group">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 bg-white/5 flex items-center justify-center rounded border border-orange-500/20 font-bold text-orange-500 group-hover:bg-orange-500/20 transition-all uppercase">{(student.user.full_name || student.user.username).substring(0, 2)}</div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{student.user.full_name || student.user.username}</p>
                                                        <p className="text-[10px] text-white/40 font-medium">Student • {student.department}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[8px] font-mono text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 uppercase tracking-tighter">Student</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleApproveStudent(student.student_id)} className="flex-1 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-500 text-[10px] font-bold hover:bg-orange-500 hover:text-white transition-all uppercase tracking-widest rounded">Approve</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 border-t border-white/5 text-center">
                                    
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                )}

                {/* Sub-components */}
                <div className="flex-1 overflow-hidden relative">
                    {activeTab === 'students' && <UniversityAdminStudents />}
                    {activeTab === 'companies' && <UniversityCompanies />}
                    {activeTab === 'assignments' && <UniversityAdminAssignments />}
                    { activeTab === 'performance' && <UniversityAdminPerformance /> }
                    { activeTab === 'credentials' && <AdminCredentialsTable /> }
                    { activeTab === 'messages' && <UniversityAdminMessages /> }
                </div>

                <Footer />
            </main>
        </div>
    );
};

export default UniversityAdminDashboard;
