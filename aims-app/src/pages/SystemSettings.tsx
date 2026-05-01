import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { usersAPI, organizationsAPI, notificationsAPI } from '../services/api';

const SystemSettings: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [pendingOrgs, setPendingOrgs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, students: 0, supervisors: 0, companies: 0 });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [allUsers, allOrgs] = await Promise.all([
                usersAPI.getUsers(),
                organizationsAPI.getOrganizations()
            ]);

            setUsers(allUsers);
            setPendingOrgs(allOrgs.filter((o: any) => o.status === 'pending'));

            // Calculate stats
            setStats({
                total: allUsers.length,
                active: allUsers.filter((u: any) => u.status === 'active').length,
                pending: allUsers.filter((u: any) => u.status === 'pending').length,
                students: allUsers.filter((u: any) => u.role === 'student').length,
                supervisors: allUsers.filter((u: any) => u.role === 'supervisor').length,
                companies: allUsers.filter((u: any) => u.role === 'company_admin').length,
            });
        } catch (err: any) {
            setError('Failed to load system data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleUserStatus = async (userId: number, currentStatus: string) => {
        // This is a placeholder — in real life you'd call a backend endpoint to toggle active/inactive
        // For now we just flip locally to show it's wired up
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: currentStatus === 'active' ? 'inactive' : 'active' } : u));
    };

    const handleApproval = async (orgId: number, approved: boolean) => {
        try {
            if (approved) {
                await organizationsAPI.approveOrganization(orgId);
                setSuccess('Organization approved and activated.');
            } else {
                await organizationsAPI.rejectOrganization(orgId);
                setSuccess('Organization rejected.');
            }
            await fetchData();
            setTimeout(() => setSuccess(null), 4000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Approval action failed.');
        }
    };

    const getInitials = (name: string) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getRoleBadge = (role: string) => {
        const map: any = {
            university_admin: 'University Admin',
            company_admin: 'Company Admin',
            supervisor: 'Supervisor',
            student: 'Student',
        };
        return map[role] || role;
    };

    return (
        <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden font-display">
            <Sidebar />

            <main className="flex-1 relative flex flex-col overflow-hidden">
                <Header />

                {/* Main Content Area */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-10">
                        {/* Page Header */}
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-black tracking-wider uppercase flex items-center gap-3 italic">
                                System Control Center
                                <span className="flex h-3 w-3 rounded-full bg-primary animate-pulse"></span>
                            </h1>
                            <p className="text-xs text-primary/60 font-black uppercase tracking-[0.3em] italic">AIMS // Jimma University Admin Portal</p>
                        </div>

                        {error && <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-bold uppercase tracking-widest">{error}</div>}
                        {success && <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest">{success}</div>}

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
                            </div>
                        ) : (
                            <>
                                {/* Content Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                    {/* Left Column: Management */}
                                    <div className="lg:col-span-8 space-y-10">
                                        {/* User Access Management */}
                                        <section className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3 italic underline decoration-primary/30 underline-offset-4">
                                                    <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                                                    User Access Management ({users.length})
                                                </h2>
                                            </div>
                                            <div className="glass overflow-hidden rounded-2xl border border-white/5">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-white/5 bg-white/2">
                                                            <th className="p-5 text-[10px] uppercase font-black tracking-widest text-primary/60 italic">User Identifier</th>
                                                            <th className="p-5 text-[10px] uppercase font-black tracking-widest text-primary/60 italic">Classification</th>
                                                            <th className="p-5 text-[10px] uppercase font-black tracking-widest text-primary/60 italic">Email</th>
                                                            <th className="p-5 text-[10px] uppercase font-black tracking-widest text-primary/60 italic">Status</th>
                                                            <th className="p-5 text-[10px] uppercase font-black tracking-widest text-primary/60 italic text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-sm">
                                                        {users.slice(0, 20).map((u) => (
                                                            <tr key={u.id} className="border-b border-white/2 hover:bg-white/2 transition-colors">
                                                                <td className="p-5 font-black flex items-center gap-4">
                                                                    <div className="size-9 bg-white/5 rounded-xl flex items-center justify-center text-[10px] text-primary/40 border border-white/5 uppercase italic font-black">{getInitials(u.full_name)}</div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-white italic tracking-tighter">{u.full_name || u.username}</span>
                                                                        <span className="text-[9px] text-primary/40 font-bold uppercase tracking-widest">@{u.username}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-5 text-xs font-bold text-white/60 italic">{getRoleBadge(u.role)}</td>
                                                                <td className="p-5 text-xs font-bold text-white/40 italic truncate max-w-[150px]">{u.email}</td>
                                                                <td className="p-5">
                                                                    <div
                                                                        onClick={() => toggleUserStatus(u.id, u.status)}
                                                                        className={`w-10 h-5 rounded-full relative cursor-pointer border transition-all ${u.status === 'active' ? 'bg-primary/20 border-primary/40' : 'bg-white/5 border-white/10'}`}
                                                                    >
                                                                        <div className={`absolute top-1 size-2.5 rounded-full transition-all ${u.status === 'active' ? 'right-1 bg-primary shadow-[0_0_10px_#13ecec]' : 'left-1 bg-white/20'}`}></div>
                                                                    </div>
                                                                </td>
                                                                <td className="p-5 text-right">
                                                                    <span className="material-symbols-outlined text-white/20 cursor-pointer hover:text-primary transition-all">more_vert</span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </section>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            {/* Pending Approvals */}
                                            <section className="space-y-6">
                                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3 italic">
                                                    <span className="material-symbols-outlined text-base">verified_user</span>
                                                    Pending Approvals ({pendingOrgs.length})
                                                </h2>
                                                <div className="space-y-4">
                                                    {pendingOrgs.map((org) => (
                                                        <div key={org.org_id} className="glass p-5 border-l-4 rounded-xl flex items-center justify-between group transition-all duration-500 border-yellow-400/60 hover:border-primary">
                                                            <div>
                                                                <h3 className="text-xs font-black text-white italic uppercase tracking-tighter">{org.org_name}</h3>
                                                                <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold mt-1">{org.industry || '—'} // {org.address || '—'}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleApproval(org.org_id, true)}
                                                                    className="size-9 bg-primary/10 border border-primary/20 text-primary flex items-center justify-center rounded-xl hover:bg-primary hover:text-background-dark transition-all"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm font-black">check</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleApproval(org.org_id, false)}
                                                                    className="size-9 bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm font-black">close</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {pendingOrgs.length === 0 && (
                                                        <div className="p-10 text-center glass rounded-2xl border border-white/5 space-y-2">
                                                            <span className="material-symbols-outlined text-white/10 text-4xl">inventory_2</span>
                                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">No Pending Approvals</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </section>

                                            {/* Pending Students */}
                                            <section className="space-y-6">
                                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3 italic">
                                                    <span className="material-symbols-outlined text-base">school</span>
                                                    Pending Students ({users.filter(u => u.role === 'student' && u.status === 'pending').length})
                                                </h2>
                                                <div className="space-y-4">
                                                    {users.filter(u => u.role === 'student' && u.status === 'pending').slice(0, 5).map((student) => (
                                                        <div key={student.id} className="glass p-5 border-l-4 rounded-xl flex items-center justify-between group transition-all duration-500 border-yellow-400/60 hover:border-primary">
                                                            <div>
                                                                <h3 className="text-xs font-black text-white italic uppercase tracking-tighter">{student.full_name || student.username}</h3>
                                                                <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold mt-1">{student.email}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={async () => {
                                                                        try {
                                                                            // We need the student_id, get from students list
                                                                            const students = await usersAPI.getStudents();
                                                                            const s = students.find((st: any) => st.user.id === student.id);
                                                                            if (s) {
                                                                                await usersAPI.approveStudent(s.student_id);
                                                                                setSuccess(`Student ${student.full_name || student.username} approved.`);
                                                                                await fetchData();
                                                                                setTimeout(() => setSuccess(null), 4000);
                                                                            }
                                                                        } catch (err) {
                                                                            setError('Failed to approve student.');
                                                                        }
                                                                    }}
                                                                    className="size-9 bg-primary/10 border border-primary/20 text-primary flex items-center justify-center rounded-xl hover:bg-primary hover:text-background-dark transition-all"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm font-black">check</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {users.filter(u => u.role === 'student' && u.status === 'pending').length === 0 && (
                                                        <div className="p-10 text-center glass rounded-2xl border border-white/5 space-y-2">
                                                            <span className="material-symbols-outlined text-white/10 text-4xl">how_to_reg</span>
                                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">All Students Approved</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </section>
                                        </div>
                                    </div>

                                    {/* Right Column: System Health */}
                                    <aside className="lg:col-span-4 space-y-10">
                                        {/* System Stats */}
                                        <div className="glass rounded-2xl p-8 border border-white/5 space-y-6">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary italic flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm">monitoring</span>
                                                System Metrics
                                            </h3>
                                            <div className="space-y-4">
                                                {[
                                                    { label: 'Total Users', value: stats.total, icon: 'group' },
                                                    { label: 'Active Users', value: stats.active, icon: 'verified_user' },
                                                    { label: 'Pending Approval', value: stats.pending, icon: 'pending' },
                                                    { label: 'Students', value: stats.students, icon: 'school' },
                                                    { label: 'Supervisors', value: stats.supervisors, icon: 'work' },
                                                    { label: 'Companies', value: stats.companies, icon: 'corporate_fare' },
                                                ].map(stat => (
                                                    <div key={stat.label} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 group hover:border-primary/20 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <span className="material-symbols-outlined text-primary/40 text-lg group-hover:text-primary transition-colors">{stat.icon}</span>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{stat.label}</span>
                                                        </div>
                                                        <span className="text-xl font-black text-white italic">{stat.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="glass rounded-2xl p-8 border border-white/5 space-y-4">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary italic flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm">bolt</span>
                                                Quick Actions
                                            </h3>
                                            <a href="/admin/user-management?tab=student" className="block w-full p-4 bg-white/[0.02] rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:border-primary/30 hover:text-primary transition-all flex items-center gap-3">
                                                <span className="material-symbols-outlined text-sm">person_add</span>
                                                Register New Student
                                            </a>
                                            <a href="/admin/user-management?tab=company" className="block w-full p-4 bg-white/[0.02] rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:border-primary/30 hover:text-primary transition-all flex items-center gap-3">
                                                <span className="material-symbols-outlined text-sm">domain_add</span>
                                                Register New Company
                                            </a>
                                            <a href="/admin/credentials-table" className="block w-full p-4 bg-white/[0.02] rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:border-primary/30 hover:text-primary transition-all flex items-center gap-3">
                                                <span className="material-symbols-outlined text-sm">key</span>
                                                Manage Credentials
                                            </a>
                                        </div>
                                    </aside>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <Footer />
            </main>
        </div>
    );
};

export default SystemSettings;
