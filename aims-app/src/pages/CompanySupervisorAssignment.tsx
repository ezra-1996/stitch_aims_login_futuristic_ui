import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { internshipsAPI, organizationsAPI, usersAPI } from '../services/api';
import { useUser } from '../context/UserContext';

const CompanySupervisorAssignment: React.FC = () => {
    const { user } = useUser();
    const [supervisors, setSupervisors] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);
    const [supervisorId, setSupervisorId] = useState<number | ''>('');

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const [sup, o, a] = await Promise.all([
                usersAPI.getSupervisors(),
                organizationsAPI.getOrganizations(),
                internshipsAPI.getSupervisorAssignments(),
            ]);

            setSupervisors(sup);

            // Filter assignments based on company organizations
            let myAssignments = a;
            if (user && user.role === 'company_admin') {
                const myOrgIds = o.filter((org: any) => org.created_by === user.id).map((org: any) => org.org_id);
                myAssignments = a.filter((ass: any) => myOrgIds.includes(ass.organization));
            }
            
            setAssignments(myAssignments);
        } catch (e: any) {
            setError('Could not load assignment data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) refresh();
    }, [user]);

    const toggleAssignment = (id: number) => {
        setSelectedAssignments((prev) =>
            prev.includes(id) ? prev.filter((aId) => aId !== id) : [...prev, id]
        );
    };

    const toggleAllAssignments = () => {
        if (selectedAssignments.length === assignments.length && assignments.length > 0) {
            setSelectedAssignments([]);
        } else {
            setSelectedAssignments(assignments.map((a) => a.assignment_id));
        }
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (selectedAssignments.length === 0 || !supervisorId) {
            setError('Select at least one student and a supervisor.');
            return;
        }
        try {
            await Promise.all(
                selectedAssignments.map((assignmentId) =>
                    internshipsAPI.updateSupervisorAssignment(assignmentId, {
                        supervisor: Number(supervisorId),
                    })
                )
            );
            setSuccess('Supervisors assigned successfully.');
            setSelectedAssignments([]);
            setSupervisorId('');
            await refresh();
        } catch (err: any) {
            const msg = err.response?.data?.detail || 'Assignment failed. Please try again.';
            setError(msg);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-dark text-white rounded-2xl overflow-hidden glass border border-white/5 relative p-8">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div className="flex justify-between items-end">
                            <h1 className="text-3xl font-black uppercase italic underline decoration-primary/30 underline-offset-8">
                                Assign <span className="text-primary italic">Supervisor</span>
                            </h1>
                            <Link
                                to="/admin/users?tab=supervisor"
                                className="bg-primary/10 border border-primary/30 text-primary px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-background-dark transition-all shadow-[0_0_15px_rgba(19,236,236,0.1)]"
                            >
                                Register New Supervisor
                            </Link>
                        </div>
                        <p className="text-white/40 text-sm -mt-4 uppercase tracking-widest font-bold">Assign supervisors to students who have been allocated to your organization by the University Admin.</p>

                        {error && <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-bold uppercase tracking-widest">{error}</div>}
                        {success && <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest">{success}</div>}

                        <form onSubmit={submit} className="space-y-6">
                            <div className="glass p-8 rounded-2xl border border-white/5 space-y-6">
                                <h2 className="text-lg font-black uppercase tracking-widest text-primary">Allocated Students</h2>
                                
                                <div className="overflow-x-auto rounded-xl border border-white/10 max-h-96 overflow-y-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-background-dark z-10">
                                            <tr className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                                                <th className="p-4 w-12 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 accent-primary" 
                                                        checked={selectedAssignments.length === assignments.length && assignments.length > 0} 
                                                        onChange={toggleAllAssignments} 
                                                    />
                                                </th>
                                                <th className="p-4 border-b border-white/5">Student Name</th>
                                                <th className="p-4 border-b border-white/5">Current Supervisor</th>
                                                <th className="p-4 border-b border-white/5">Duration</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-sm">
                                            {assignments.map((a) => (
                                                <tr key={a.assignment_id} className={`hover:bg-white/5 transition-colors cursor-pointer ${selectedAssignments.includes(a.assignment_id) ? 'bg-primary/5' : ''}`} onClick={() => toggleAssignment(a.assignment_id)}>
                                                    <td className="p-4 text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-4 h-4 accent-primary cursor-pointer" 
                                                            checked={selectedAssignments.includes(a.assignment_id)} 
                                                            onChange={() => toggleAssignment(a.assignment_id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </td>
                                                    <td className="p-4 font-bold text-white">{a.student_name}</td>
                                                    <td className="p-4 text-white/50">{a.supervisor_name || 'Unassigned'}</td>
                                                    <td className="p-4 text-white/50">{a.start_date || 'N/A'} - {a.end_date || 'N/A'}</td>
                                                </tr>
                                            ))}
                                            {assignments.length === 0 && !loading && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-white/40 italic text-sm">No students allocated to your organization yet.</td>
                                                </tr>
                                            )}
                                            {loading && (
                                                <tr>
                                                    <td colSpan={4} className="p-10 text-center">
                                                        <span className="material-symbols-outlined text-primary text-3xl animate-spin">sync</span>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="glass p-8 rounded-2xl border border-white/5">
                                <h2 className="text-lg font-black uppercase tracking-widest text-primary mb-6">Assign Supervisor</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-3">Supervisor</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all" value={supervisorId} onChange={(e) => setSupervisorId(e.target.value ? Number(e.target.value) : '')}>
                                            <option value="">Select a supervisor and click assign…</option>
                                            {supervisors.map((u) => (
                                                <option key={u.id} value={u.id} className="bg-background-dark">
                                                    {u.full_name || u.username}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="pt-2">
                                        <button type="submit" className="w-full bg-primary text-background-dark font-black py-3 rounded-xl uppercase tracking-widest hover:bg-white transition-colors" disabled={selectedAssignments.length === 0}>
                                            Assign to Selected ({selectedAssignments.length})
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>

                    </div>
            </div>
        </div>
    );
};

export default CompanySupervisorAssignment;
