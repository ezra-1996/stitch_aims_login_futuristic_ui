import React, { useEffect, useState } from 'react';
import { organizationsAPI } from '../services/api';
import { Link } from 'react-router-dom';

const UniversityCompanies: React.FC = () => {
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedOrg, setExpandedOrg] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            const data = await organizationsAPI.getOrganizations();
            setOrganizations(data.filter((o: any) => o.status === 'approved'));
        } catch (err) {
            setError("Failed to load organizations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleExpand = (orgId: number) => {
        setExpandedOrg(expandedOrg === orgId ? null : orgId);
    };

    return (
        <div className="flex flex-col h-full bg-background-dark text-white rounded-2xl overflow-hidden glass border border-white/5 relative p-8">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-10">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black uppercase italic underline decoration-primary/30 underline-offset-8">
                                    Partner <span className="text-primary italic">Organizations</span>
                                </h1>
                                <p className="text-white/40 text-sm mt-3 uppercase tracking-widest font-bold">Monitor companies and their assigned supervisors.</p>
                            </div>
                            <Link
                                to="/admin/users?tab=company"
                                className="bg-primary/10 border border-primary/30 text-primary px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-background-dark transition-all shadow-[0_0_15px_rgba(19,236,236,0.1)]"
                            >
                                Register New Company
                            </Link>
                        </div>

                        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded uppercase">{error}</div>}

                        <div className="grid grid-cols-1 gap-6">
                            {organizations.map(org => (
                                <div key={org.org_id} className="glass rounded-2xl border border-white/5 overflow-hidden transition-all group hover:border-primary/20 relative">
                                    {/* Card Decoration */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors"></div>
                                    <div className="absolute inset-0 diagonal-line opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity"></div>
                                    
                                    <div className="p-6 flex items-center justify-between cursor-pointer relative z-10" onClick={() => toggleExpand(org.org_id)}>
                                        <div className="flex items-center gap-6">
                                            <div className="size-16 relative">
                                                <div className="absolute -inset-1 bg-primary/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="relative size-16 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center font-black text-2xl text-primary group-hover:border-primary/40 transition-all uppercase italic">
                                                    {org.org_name.substring(0, 2)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors underline decoration-primary/0 group-hover:decoration-primary/30 underline-offset-4 uppercase tracking-tighter italic">
                                                        {org.org_name}
                                                    </h3>
                                                    <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[8px] font-black uppercase rounded tracking-widest">
                                                        Partner
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <div className="flex items-center gap-1.5 text-white/40 group-hover:text-white/60 transition-colors">
                                                        <span className="material-symbols-outlined text-xs">precision_manufacturing</span>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">{org.industry || 'General Industry'}</span>
                                                    </div>
                                                    <span className="text-white/10">|</span>
                                                    <div className="flex items-center gap-1.5 text-primary/40 group-hover:text-primary/70 transition-colors">
                                                        <span className="material-symbols-outlined text-xs">groups</span>
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{org.supervisors?.length || 0} Registered Staff</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full border border-white/5 bg-white/5 transition-all duration-500 ${expandedOrg === org.org_id ? 'bg-primary/20 border-primary/40 rotate-180' : 'group-hover:bg-white/10'}`}>
                                                <span className="material-symbols-outlined text-2xl text-white/40 group-hover:text-primary transition-colors">
                                                    expand_more
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {expandedOrg === org.org_id && (
                                        <div className="px-6 pb-8 animate-in slide-in-from-top-4 duration-500 relative z-10">
                                            <div className="border-t border-white/10 pt-8 mt-2 space-y-8">
                                                {/* Org Profile Header */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-primary text-sm">room</span>
                                                            <h5 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Operational Base</h5>
                                                        </div>
                                                        <p className="text-sm text-white/70 leading-relaxed italic">{org.address || 'Address not registered'}</p>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-primary text-sm">language</span>
                                                            <h5 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Digital Nexus</h5>
                                                        </div>
                                                        <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block text-sm font-bold truncate">
                                                            {org.website || 'N/A'}
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Internal Oversight Team</h4>
                                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 to-transparent"></div>
                                                    </div>

                                                    {org.supervisors && org.supervisors.length > 0 ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {org.supervisors.map((sup: any) => (
                                                                <div key={sup.id} className="relative bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center gap-4 transition-all hover:bg-white/[0.08] hover:border-primary/30 group/card overflow-hidden">
                                                                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 blur-xl -translate-y-1/2 translate-x-1/2"></div>
                                                                    <div className="relative size-12 flex-shrink-0">
                                                                        <div className="absolute -inset-1 bg-primary/10 rounded-full blur-sm opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                                                                        <div className="relative size-12 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-primary font-black uppercase text-sm shadow-inner group-hover/card:border-primary/50 transition-all italic">
                                                                            {sup.full_name?.substring(0, 2)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs font-black text-white uppercase tracking-tight truncate group-hover/card:text-primary transition-colors">{sup.full_name}</p>
                                                                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.1em] mt-0.5 truncate">{sup.job_title || 'Systems supervisor'}</p>
                                                                    </div>

                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="py-12 text-center bg-white/[0.01] rounded-2xl border border-dashed border-white/10 group-hover:border-primary/20 transition-colors">
                                                            <span className="material-symbols-outlined text-white/10 text-4xl mb-3">group_off</span>
                                                            <p className="text-xs text-white/20 font-bold uppercase tracking-widest italic">No supervisory personnel initialized</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
            </div>
        </div>
    );
};

export default UniversityCompanies;
