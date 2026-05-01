import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { organizationsAPI, internshipsAPI } from '../services/api';
import { useUser } from '../context/UserContext';

type Opportunity = {
    id: number;
    orgId: number;
    title: string;
    company: string;
    location: string;
    tags: string[];
    badge?: string;
    badgeColor?: string;
    logo: string;
};

const defaultLogo = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBk1uAWIsthsojTHhxslcqyszlpWbaAhWfcpPkf683-zRBSXzlGKwWswTnRUl2j31eBv2_yedvmf2LmTFyNS9wzDcDHDzs6DyNHcfCFFo3ruArd94NHryNhpX_vuvYgk1l1Il-_UQLxzsdfjn_AT-wvhU6r6JqjTRM9uytwkmVdWYDhy61ZKvT6tYvFCAgPSkPqppiJewWtyR7Bi3g0AVKY79Nyoq-kYTq__aJ8tSqAiZaNnRaXgHuCBQAPg0KOzBydek8cq52sF4';

const BrowseInternships: React.FC = () => {
    const { user } = useUser();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [oppData, appData, assData] = await Promise.all([
                    organizationsAPI.getActiveInternships(),
                    user?.role === 'student' ? internshipsAPI.getApplications().catch(() => []) : Promise.resolve([]),
                    user?.role === 'student' ? internshipsAPI.getSupervisorAssignments().catch(() => []) : Promise.resolve([])
                ]);
                
                setApplications(appData);
                setAssignments(assData);
                
                setOpportunities(oppData.map((p: any) => ({
                    id: p.post_id,
                    orgId: p.organization,
                    title: p.title || 'Internship',
                    company: p.organization_name || p.organization?.org_name || '—',
                    location: p.organization_address || '—',
                    tags: p.requirements ? p.requirements.slice(0, 200).split(/[,;\s]+/).filter((w: string) => w.length > 2).slice(0, 5) : [],
                    badge: p.is_active ? 'ACTIVE' : undefined,
                    badgeColor: 'text-primary border-primary/30 bg-primary/10',
                    logo: defaultLogo,
                })));
            } catch(e) {
                setError('Could not load internships.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user?.role]);

    return (
        <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden">
            <Sidebar />

            <main className="flex-1 relative flex flex-col overflow-hidden">
                <Header />

                {/* Top Sticky Filter Bar */}
                <div className="bg-background-dark/80 backdrop-blur-md px-10 py-6 border-b border-primary/10 z-30">
                    <div className="max-w-6xl mx-auto space-y-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <div className="flex items-center gap-2 text-primary/60 text-[10px] mb-2 tracking-[0.2em] font-medium uppercase">
                                    <span>DASHBOARD</span>
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                    <span className="text-primary font-bold">INTERNSHIPS</span>
                                </div>
                                <h2 className="text-3xl font-bold tracking-[0.1em] uppercase">Browse Opportunities</h2>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex-1 min-w-[300px] relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/50">search</span>
                                <input
                                    className="w-full bg-slate-900/50 border border-primary/20 rounded h-12 pl-12 pr-4 text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                                    placeholder="Search by role, company, or tech stack..."
                                    type="text"
                                />
                            </div>
                            <div className="flex gap-2">
                            </div>
                        </div>
                    </div>
                </div>

                {/* Opportunities Grid */}
                <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                    <div className="max-w-7xl mx-auto">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {opportunities.map((opp, i) => (
                                    <div
                                        key={opp.id}
                                        className={`glass p-8 relative border border-white/5 rounded-xl transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 group bg-background-dark/40 ${i % 3 === 1 ? 'lg:translate-y-4' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="size-14 bg-slate-900 border border-primary/20 flex items-center justify-center p-2 rounded">
                                                <img className="w-full h-full object-contain" alt={opp.company} src={opp.logo} />
                                            </div>
                                            {opp.badge && (
                                                <span className={`text-[9px] font-bold tracking-widest px-2 py-1 border uppercase rounded ${opp.badgeColor}`}>
                                                    {opp.badge}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold mb-1 tracking-tight uppercase">{opp.title}</h3>
                                        <p className="text-slate-500 text-[10px] mb-4 uppercase tracking-widest">{opp.company} • {opp.location}</p>
                                        <div className="flex flex-wrap gap-2 mb-8">
                                            {opp.tags.map(tag => (
                                                <span key={tag} className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 uppercase">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-4">
                                            <Link to={`/internship/${opp.id}`} className="flex-1 py-3 text-[10px] font-bold tracking-widest uppercase border border-primary/40 hover:bg-primary/5 transition-all rounded text-center">Details</Link>
                                            {user?.role === 'student' && (() => {
                                                const hasAssignment = assignments.find(a => a.organization === opp.orgId || a.organization_name === opp.company);
                                                const app = applications.find(a => a.post === opp.id || (a.post && a.post.post_id === opp.id));
                                                
                                                if (hasAssignment || (app && app.status === 'accepted')) {
                                                    return <div className="flex-1 py-3 text-[10px] font-black tracking-widest uppercase bg-primary/20 text-primary border border-primary/50 text-center rounded opacity-80 cursor-not-allowed">Accepted</div>;
                                                }
                                                if (app && app.status !== 'pending' && app.status !== 'declined' && app.status !== 'rejected') {
                                                    return <div className="flex-1 py-3 text-[10px] font-bold tracking-widest uppercase bg-white/10 text-white/50 text-center rounded border border-white/20 cursor-not-allowed">{app.status}</div>;
                                                }
                                                if (app && app.status === 'pending') {
                                                    return <div className="flex-1 py-3 text-[10px] font-bold tracking-widest uppercase bg-white/10 text-white/50 text-center rounded border border-white/20 cursor-not-allowed">Pending</div>;
                                                }

                                                return (
                                                    <Link to={`/internship-application?postId=${opp.id}`} className="flex-1 py-3 text-[10px] font-bold tracking-widest uppercase bg-primary text-slate-900 transition-all rounded shadow-[0_0_15px_rgba(19,236,236,0.2)] hover:shadow-[0_0_25px_rgba(19,236,236,0.4)] text-center">Apply Now</Link>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-20 flex justify-center pb-10">
                            
                        </div>
                    </div>
                </div>

                <Footer />
            </main>

            {/* Scroll to Top / Help Fab */}
            <div className="fixed bottom-10 right-10 z-50">
                
            </div>
        </div>
    );
};

export default BrowseInternships;
