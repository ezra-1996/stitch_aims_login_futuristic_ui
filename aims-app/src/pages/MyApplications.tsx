import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { internshipsAPI } from '../services/api';

const MyApplications: React.FC = () => {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'offered' | 'accepted' | 'rejected'>('pending');

    const fetchApplications = () => {
        setLoading(true);
        internshipsAPI.getApplications()
            .then(data => {
                setApplications(data);
                // Auto-switch tab if there are offers
                if (data.some((a: any) => a.status === 'offered')) {
                    setActiveTab('offered');
                }
            })
            .catch(() => setError('Could not load applications.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleRespond = async (id: number, status: 'accepted' | 'declined') => {
        try {
            await internshipsAPI.updateApplicationStatus(id, status);
            fetchApplications(); // Refresh
        } catch (e) {
            console.error("Failed to update status", e);
            setError("Failed to update application status.");
        }
    };

    const pending = applications.filter((a) => a.status === 'pending');
    const offered = applications.filter((a) => a.status === 'offered');
    const accepted = applications.filter((a) => a.status === 'accepted' || a.status === 'approved'); // Include legacy 'approved'
    const rejected = applications.filter((a) => a.status === 'rejected' || a.status === 'declined');

    const visible = activeTab === 'pending' ? pending : activeTab === 'offered' ? offered : activeTab === 'accepted' ? accepted : rejected;

    return (
        <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden font-display">
            <Sidebar />

            <main className="flex-1 relative flex flex-col overflow-hidden">
                <Header />

                {/* Dashboard Content */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-10">
                        {/* Hero Section */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                                    <Link className="hover:text-primary cursor-pointer transition-all" to="/student-dashboard">DASHBOARD</Link>
                                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                                    <span className="text-white">APPLICATIONS & OFFERS</span>
                                </div>
                                <h2 className="text-4xl font-black text-white tracking-tight uppercase italic underline decoration-primary/30 underline-offset-8">My <span className="text-primary italic">Applications</span> & Offers</h2>
                                <p className="text-slate-400 max-w-lg text-sm">Manage your internship journey at Jimma University. Track your pending requests and respond to active offers.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="glass px-6 py-3 rounded-xl flex items-center gap-4 border border-primary/30 shadow-[0_0_20px_rgba(19,236,236,0.1)]">
                                    <div className="size-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">verified</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Active Offers</p>
                                        <p className="text-xl font-black text-white leading-none italic">{offered.length} Pending</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-bold uppercase tracking-widest">
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
                            </div>
                        ) : (
                            <>
                                {/* Tabs Navigation */}
                                <div className="p-1 glass rounded-2xl inline-flex w-full md:w-auto border border-white/5 overflow-x-auto">
                                    {['pending', 'offered', 'accepted', 'rejected'].map((tab) => (
                                        <button
                                            key={tab}
                                            type="button"
                                            onClick={() => setActiveTab(tab as any)}
                                            className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === tab
                                                    ? 'bg-primary text-background-dark shadow-lg shadow-primary/20'
                                                    : 'text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            {tab} ({
                                                tab === 'pending' ? pending.length :
                                                    tab === 'offered' ? offered.length :
                                                        tab === 'accepted' ? accepted.length :
                                                            rejected.length
                                            })
                                        </button>
                                    ))}
                                </div>

                                {/* Grid of Applications */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
                                    {visible.length === 0 ? (
                                        <div className="col-span-2 glass rounded-2xl border-dashed border-2 border-white/10 flex flex-col items-center justify-center p-12 h-64">
                                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No {activeTab} applications found</p>
                                            {activeTab === 'pending' && (
                                                <Link to="/browse-internships" className="text-primary mt-4 text-[10px] font-bold uppercase tracking-widest underline underline-offset-4">Browse new opportunities</Link>
                                            )}
                                        </div>
                                    ) : visible.map((app) => (
                                        <div key={app.application_id} className="glass p-8 rounded-2xl border border-white/5 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden">
                                            {/* Status Badge */}
                                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <span className="material-symbols-outlined text-6xl">
                                                    {app.status === 'offered' ? 'local_offer' :
                                                        app.status === 'accepted' ? 'check_circle' :
                                                            app.status === 'rejected' ? 'cancel' : 'pending'}
                                                </span>
                                            </div>

                                            <div className="relative z-10 space-y-6">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">{app.post_title || `Internship #${app.post}`}</h3>
                                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Application ID: {app.application_id}</p>
                                                    </div>
                                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${app.status === 'offered' ? 'bg-primary/20 text-primary border-primary/40' :
                                                            app.status === 'accepted' || app.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/40' :
                                                                app.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                                    'bg-red-500/10 text-red-500 border-red-500/30'
                                                        }`}>
                                                        {app.status}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                                        <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Applied On</p>
                                                        <p className="text-xs font-bold text-white mt-1">{new Date(app.applied_date).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                                        <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Organization</p>
                                                        <p className="text-xs font-bold text-white mt-1">{app.organization_name || 'Organization'}</p>
                                                    </div>
                                                </div>

                                                {/* Action Buttons for Offers */}
                                                {app.status === 'offered' && (
                                                    <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                                                        <button
                                                            onClick={() => handleRespond(app.application_id, 'declined')}
                                                            className="py-3 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 rounded-xl transition-all"
                                                        >
                                                            Decline Offer
                                                        </button>
                                                        <button
                                                            onClick={() => handleRespond(app.application_id, 'accepted')}
                                                            className="py-3 bg-primary text-background-dark text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(19,236,236,0.4)] rounded-xl transition-all shadow-[0_0_10px_rgba(19,236,236,0.2)]"
                                                        >
                                                            Accept Offer
                                                        </button>
                                                    </div>
                                                )}

                                                {app.status === 'pending' && (
                                                    <div className="pt-2 text-[10px] text-slate-500 italic">
                                                        Waiting for company review...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
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

export default MyApplications;
