import React, { useEffect, useState } from 'react';
import { usersAPI } from '../services/api';
import { internshipsAPI } from '../services/api';

const UniversityAdminAssignments: React.FC = () => {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const assData = await internshipsAPI.getSupervisorAssignments();
            setAssignments(assData);
        } catch (err) {
            setError("Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="flex flex-col h-full bg-background-dark text-white rounded-2xl overflow-hidden glass border border-white/5 relative p-8">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div>
                            <h1 className="text-3xl font-black uppercase italic underline decoration-primary/30 underline-offset-8">
                                Internship <span className="text-primary italic">Assignments</span>
                            </h1>
                            <p className="text-white/40 text-sm mt-3 uppercase tracking-widest font-bold">View student-supervisor pairings and internship durations assigned by companies.</p>
                        </div>

                        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded uppercase">{error}</div>}

                        {/* List of Assignments */}
                        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-primary/60">
                                    <tr>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Supervisor</th>
                                        <th className="px-6 py-4">Organization</th>
                                        <th className="px-6 py-4">Duration</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {assignments.map(ass => (
                                        <tr key={ass.assignment_id} className="hover:bg-white/[0.02] transition-all group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-sm text-white group-hover:text-primary">{ass.student_name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-white/60">{ass.supervisor_name}</td>
                                            <td className="px-6 py-4 text-xs font-bold text-white/60">{ass.organization_name}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black uppercase text-primary/80">{ass.start_date || 'N/A'} - {ass.end_date || 'N/A'}</span>
                                                    <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary shadow-[0_0_5px_#13ecec]" style={{ width: '40%' }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded border ${ass.is_active ? 'border-primary/30 text-primary bg-primary/5' : 'border-white/10 text-white/20'}`}>
                                                    {ass.is_active ? 'Active' : 'Completed'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {assignments.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-white/40 italic text-sm">No assignments found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
            </div>
        </div>
    );
};

export default UniversityAdminAssignments;

