import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI, internshipsAPI, organizationsAPI } from '../services/api';

const UniversityAdminStudents: React.FC = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
    
    // Form state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedOrg, setSelectedOrg] = useState<string>('');
    const [updatingReq, setUpdatingReq] = useState(false);

    const fetchData = async () => {
        try {
            const [stData, assData, orgData] = await Promise.all([
                usersAPI.getStudents().catch(() => []),
                internshipsAPI.getSupervisorAssignments().catch(() => []),
                organizationsAPI.getOrganizations().catch(() => [])
            ]);
            setStudents(stData);
            setAssignments(assData);
            setOrganizations(orgData.filter((o: any) => o.status === 'approved'));
        } catch (err) {
            setError("Failed to load students data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleExpand = (studentId: number) => {
        if (expandedStudent === studentId) {
            setExpandedStudent(null);
            return;
        }
        setExpandedStudent(studentId);
        
        // Find if this student has an assignment
        const st = students.find(s => s.student_id === studentId);
        const stName = st?.user?.full_name || st?.user?.username;
        const studentAss = assignments.find(a => a.student_name === stName || a.student_id === studentId || a.student === studentId);

        if (studentAss) {
            setStartDate(studentAss.start_date || '');
            setEndDate(studentAss.end_date || '');
        } else {
            setStartDate('');
            setEndDate('');
            setSelectedOrg('');
        }
    };

    const allocateStudent = async (studentId: number) => {
        if (!selectedOrg) {
            setError("Please select an organization first.");
            return;
        }
        setError(null);
        setUpdatingReq(true);
        try {
            await internshipsAPI.createSupervisorAssignment({
                student: studentId,
                organization: parseInt(selectedOrg),
                is_active: true
            });
            setSuccessMsg("Student successfully allocated to organization.");
            await fetchData();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to allocate student.");
        } finally {
            setUpdatingReq(false);
            setTimeout(() => setSuccessMsg(null), 3000);
        }
    };

    const updateTimeline = async (assignmentId: number) => {
        setError(null);
        setSuccessMsg(null);
        setUpdatingReq(true);
        try {
            await internshipsAPI.updateSupervisorAssignment(assignmentId, {
                start_date: startDate || null,
                end_date: endDate || null
            });
            setSuccessMsg("Internship timeline updated successfully.");
            await fetchData(); // Refresh data
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to update timeline.");
        } finally {
            setUpdatingReq(false);
            setTimeout(() => setSuccessMsg(null), 3000);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-dark text-white rounded-2xl overflow-hidden glass border border-white/5 relative p-8">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-8">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black uppercase italic underline decoration-primary/30 underline-offset-8">
                                    Registered <span className="text-primary italic">Students</span>
                                </h1>
                                <p className="text-white/40 text-sm mt-3 uppercase tracking-widest font-bold">Monitor students and manage their internship execution timelines.</p>
                            </div>
                            <Link
                                to="/admin/users?tab=student"
                                className="bg-primary/10 border border-primary/30 text-primary px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-background-dark transition-all shadow-[0_0_15px_rgba(19,236,236,0.1)]"
                            >
                                Register New Student
                            </Link>
                        </div>

                        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded uppercase">{error}</div>}
                        {successMsg && <div className="p-4 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded uppercase shadow-[0_0_10px_rgba(19,236,236,0.1)]">{successMsg}</div>}

                        {loading ? (
                            <div className="flex items-center justify-center p-20">
                                <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {students.map((student: any) => {
                                    const stName = student.user?.full_name || student.user?.username || 'Unknown Student';
                                    const assignment = assignments.find((a: any) => a.student_name === stName || a.student === student.student_id || a.student_id === student.student_id);
                                    
                                    return (
                                        <div key={student.student_id} className="glass rounded-2xl border border-white/5 overflow-hidden transition-all group hover:border-primary/20 relative">
                                            {/* Card Decoration */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors"></div>
                                            <div className="absolute inset-0 diagonal-line opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity"></div>
                                            
                                            <div className="p-6 flex items-center justify-between cursor-pointer relative z-10" onClick={() => toggleExpand(student.student_id)}>
                                                <div className="flex items-center gap-6">
                                                    <div className="size-16 relative">
                                                        <div className="absolute -inset-1 bg-primary/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <div className="relative size-16 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center font-black text-2xl text-primary group-hover:border-primary/40 transition-all uppercase italic">
                                                            {stName.substring(0, 2)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors underline decoration-primary/0 group-hover:decoration-primary/30 underline-offset-4 uppercase tracking-tighter italic">
                                                                {stName}
                                                            </h3>
                                                            {assignment ? (
                                                                <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[8px] font-black uppercase rounded tracking-widest">Assigned</span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/30 text-[8px] font-black uppercase rounded tracking-widest">Unassigned</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <div className="flex items-center gap-1.5 text-white/40">
                                                                <span className="material-symbols-outlined text-xs">school</span>
                                                                <span className="text-[10px] font-bold uppercase tracking-widest">{student.department || 'Department N/A'}</span>
                                                            </div>
                                                            <span className="text-white/10">|</span>
                                                            <div className="flex items-center gap-1.5 text-white/40">
                                                                <span className="text-[10px] font-black uppercase tracking-widest">ID: {student.university_id || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-full border border-white/5 bg-white/5 transition-all duration-500 ${expandedStudent === student.student_id ? 'bg-primary/20 border-primary/40 rotate-180' : 'group-hover:bg-white/10'}`}>
                                                        <span className="material-symbols-outlined text-2xl text-white/40 group-hover:text-primary transition-colors">
                                                            expand_more
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {expandedStudent === student.student_id && (
                                                <div className="px-6 pb-8 animate-in slide-in-from-top-4 duration-500 relative z-10">
                                                    <div className="border-t border-white/10 pt-8 mt-2 space-y-8">
                                                        {assignment ? (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                {/* Assignment Details */}
                                                                <div className="space-y-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                                                                    <div className="flex items-center gap-4">
                                                                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Current Assignment</h4>
                                                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 to-transparent"></div>
                                                                    </div>
                                                                    <div className="space-y-4 text-sm text-white/70 font-bold uppercase tracking-wider">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-white/30">Organization</span>
                                                                            <span className="text-white">{assignment.organization_name || 'Unknown'}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-white/30">Supervisor</span>
                                                                            <span className="text-white">{assignment.supervisor_name || 'Pending'}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-2">
                                                                            <span className="text-white/30">Status</span>
                                                                            <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-widest border ${assignment.is_active ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                                                                {assignment.is_active ? 'Active' : 'Completed/Inactive'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Timeline Editor */}
                                                                <div className="space-y-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                                                                    <div className="flex items-center gap-4">
                                                                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Timeline Control Module</h4>
                                                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 to-transparent"></div>
                                                                    </div>
                                                                    
                                                                    <div className="space-y-4">
                                                                        <div className="flex flex-col gap-2">
                                                                            <label className="text-[10px] uppercase font-black tracking-widest text-primary/60">Start Date</label>
                                                                            <input 
                                                                                type="date" 
                                                                                value={startDate} 
                                                                                onChange={(e) => setStartDate(e.target.value)} 
                                                                                className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:ring-1 focus:ring-primary outline-none appearance-none"
                                                                            />
                                                                        </div>
                                                                        <div className="flex flex-col gap-2">
                                                                            <label className="text-[10px] uppercase font-black tracking-widest text-primary/60">End Date</label>
                                                                            <input 
                                                                                type="date" 
                                                                                value={endDate} 
                                                                                onChange={(e) => setEndDate(e.target.value)} 
                                                                                className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:ring-1 focus:ring-primary outline-none appearance-none"
                                                                            />
                                                                        </div>

                                                                        <button 
                                                                            disabled={updatingReq}
                                                                            onClick={() => updateTimeline(assignment.assignment_id || assignment.id)}
                                                                            className="w-full mt-4 bg-primary/10 border border-primary/30 hover:bg-primary hover:text-background-dark text-primary py-3 rounded-lg text-xs font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                                                                        >
                                                                            {updatingReq ? 'Calibrating...' : 'Set Timeline'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                <div className="py-10 text-center bg-white/[0.01] rounded-2xl border border-dashed border-white/10 group-hover:border-primary/20 transition-colors flex flex-col items-center justify-center">
                                                                    <span className="material-symbols-outlined text-white/10 text-4xl mb-3">not_listed_location</span>
                                                                    <p className="text-xs text-white/20 font-bold uppercase tracking-widest italic">No active internship assignment found.</p>
                                                                </div>

                                                                {/* Allocation Module */}
                                                                <div className="space-y-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                                                                    <div className="flex items-center gap-4">
                                                                        <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em]">Organization Allocation</h4>
                                                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-orange-500/20 to-transparent"></div>
                                                                    </div>
                                                                    
                                                                    <div className="space-y-4">
                                                                        <div className="flex flex-col gap-2">
                                                                            <label className="text-[10px] uppercase font-black tracking-widest text-orange-500/60">Select Organization</label>
                                                                            <select 
                                                                                value={selectedOrg} 
                                                                                onChange={(e) => setSelectedOrg(e.target.value)} 
                                                                                className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm font-bold focus:ring-1 focus:ring-orange-500 outline-none appearance-none"
                                                                            >
                                                                                <option value="">Choose Company...</option>
                                                                                {organizations.map(org => (
                                                                                    <option key={org.org_id} value={org.org_id}>{org.org_name}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>

                                                                        <button 
                                                                            disabled={updatingReq || !selectedOrg}
                                                                            onClick={() => allocateStudent(student.student_id)}
                                                                            className="w-full mt-4 bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500 hover:text-white text-orange-500 py-3 rounded-lg text-xs font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                                                                        >
                                                                            {updatingReq ? 'Allocating...' : 'Assign to Organization'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
            </div>
        </div>

    );
};

export default UniversityAdminStudents;
