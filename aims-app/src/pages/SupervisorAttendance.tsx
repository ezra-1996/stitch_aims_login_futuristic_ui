import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { internshipsAPI, attendanceAPI } from '../services/api';

const SupervisorAttendance: React.FC = () => {
    const [interns, setInterns] = useState<any[]>([]);
    const [attendances, setAttendances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Manual Entry Form State
    const [selectedStudent, setSelectedStudent] = useState<number | ''>('');
    const [manualDate, setManualDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [manualStatus, setManualStatus] = useState('present');
    const [manualNotes, setManualNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAttendanceId, setEditingAttendanceId] = useState<number | null>(null);

    const refreshData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [assignments, attendanceData] = await Promise.all([
                internshipsAPI.getSupervisorAssignments(),
                attendanceAPI.getAttendance()
            ]);
            setInterns(assignments);
            setAttendances(attendanceData);
        } catch (err: any) {
            console.error("Failed to fetch attendance data", err);
            setError("Could not load attendance data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleUpdateStatus = async (attendanceId: number, status: string) => {
        try {
            await attendanceAPI.updateAttendanceStatus(attendanceId, status, "Supervisor updated");
            await refreshData();
            setSuccess(`Attendance marked as ${status.toUpperCase()}`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Failed to update attendance status.");
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent || !manualDate || !manualStatus) {
            setError("Please fill all required fields.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            if (editingAttendanceId) {
                await attendanceAPI.updateAttendance(editingAttendanceId, {
                    student: Number(selectedStudent),
                    date: manualDate,
                    status: manualStatus,
                    notes: manualNotes || "Updated by supervisor"
                });
                setSuccess("Attendance record updated.");
            } else {
                await attendanceAPI.createSupervisorAttendance({
                    student: Number(selectedStudent),
                    date: manualDate,
                    status: manualStatus,
                    notes: manualNotes || "Manual entry by supervisor"
                });
                setSuccess("Manual attendance record created.");
            }
            setManualNotes('');
            setEditingAttendanceId(null);
            await refreshData();
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to process attendance record.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (record: any) => {
        setEditingAttendanceId(record.attendance_id);
        setSelectedStudent(record.student);
        setManualDate(record.date);
        setManualStatus(record.status);
        setManualNotes(record.notes || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this attendance record?")) return;
        try {
            await attendanceAPI.deleteAttendance(id);
            setSuccess("Record deleted.");
            await refreshData();
        } catch {
            setError("Failed to delete record.");
        }
    };

    const cancelEdit = () => {
        setEditingAttendanceId(null);
        setManualNotes('');
        setSelectedStudent('');
        setError(null);
    };

    // Filter to only show pending or recent attendances to keep UI clean
    const recentAttendances = attendances.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden font-display">
            <Sidebar />
            <main className="flex-1 relative flex flex-col overflow-hidden">
                <Header />
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-8">
                        <div>
                            <h1 className="text-3xl font-black uppercase italic underline decoration-primary/30 underline-offset-8">
                                Attendance <span className="text-primary italic">Verification</span>
                            </h1>
                            <p className="text-white/40 text-sm mt-3 uppercase tracking-widest font-bold">Review student attendance or manually add records.</p>
                        </div>

                        {error && <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-bold uppercase tracking-widest">{error}</div>}
                        {success && <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest">{success}</div>}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Manual Entry Form */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
                                    <h2 className="text-lg font-black text-primary uppercase tracking-widest border-b border-white/10 pb-4">Manual Entry Override</h2>
                                    <form onSubmit={handleManualSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2">Student</label>
                                            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all text-sm" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value ? Number(e.target.value) : '')}>
                                                <option value="" className="bg-background-dark">Select a student...</option>
                                                {interns.map((intern, i) => (
                                                    <option key={intern.student || i} value={intern.student} className="bg-background-dark">
                                                        {intern.student_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2">Date</label>
                                            <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all text-sm" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2">Status</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button type="button" onClick={() => setManualStatus('present')} className={`py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all border ${manualStatus === 'present' ? 'bg-primary text-background-dark border-primary shadow-[0_0_15px_rgba(19,236,236,0.2)]' : 'bg-white/5 text-white/40 border-white/10'}`}>Present</button>
                                                <button type="button" onClick={() => setManualStatus('late')} className={`py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all border ${manualStatus === 'late' ? 'bg-yellow-400 text-background-dark border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]' : 'bg-white/5 text-white/40 border-white/10'}`}>Late</button>
                                                <button type="button" onClick={() => setManualStatus('absent')} className={`py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all border ${manualStatus === 'absent' ? 'bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-white/5 text-white/40 border-white/10'}`}>Absent</button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2">Notes (Optional)</label>
                                            <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white min-h-[80px] focus:border-primary transition-all text-sm" placeholder="Reason for manual entry..." value={manualNotes} onChange={(e) => setManualNotes(e.target.value)}></textarea>
                                        </div>
                                        <div className="flex gap-4 mt-4">
                                            <button type="submit" disabled={isSubmitting || interns.length === 0} className="flex-1 bg-primary text-background-dark font-black py-3 rounded-xl uppercase tracking-widest hover:bg-white hover:text-background-dark transition-all shadow-[0_0_20px_rgba(19,236,236,0.2)] disabled:opacity-50">
                                                {isSubmitting ? 'Syncing...' : editingAttendanceId ? 'Update Record' : 'Record Attendance'}
                                            </button>
                                            {editingAttendanceId && (
                                                <button type="button" onClick={cancelEdit} className="px-6 bg-white/10 text-white font-black py-3 rounded-xl uppercase tracking-widest hover:bg-white/20 transition-all">
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Attendance Records */}
                            <div className="lg:col-span-2">
                                <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                                        <h2 className="text-sm font-black uppercase tracking-widest">Attendance Logs</h2>
                                    </div>
                                    <table className="w-full text-left">
                                        <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-primary/60 hidden md:table-header-group">
                                            <tr>
                                                <th className="px-6 py-4">Student</th>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Method</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center">
                                                        <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
                                                    </td>
                                                </tr>
                                            ) : recentAttendances.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-white/20 italic uppercase tracking-widest text-sm font-bold">No attendance records found.</td>
                                                </tr>
                                            ) : (
                                                recentAttendances.map((record) => (
                                                    <tr key={record.attendance_id} className="hover:bg-white/[0.02] transition-all group flex flex-col md:table-row">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-sm text-white group-hover:text-primary transition-colors">
                                                                {record.student_name || interns.find(i => i.student === record.student)?.student_name || `Student #${record.student}`}
                                                            </div>
                                                            <div className="text-[10px] text-white/40 uppercase font-black truncate max-w-[150px]">{record.notes || 'No notes'}</div>
                                                        </td>
                                                        <td className="px-6 py-2 md:py-4 text-xs font-bold text-white/60">
                                                            {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                        </td>
                                                        <td className="px-6 py-2 md:py-4 text-[10px] uppercase font-black tracking-widest text-white/40">
                                                            {record.verification_method}
                                                        </td>
                                                        <td className="px-6 py-2 md:py-4">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${record.status === 'present' ? 'border-primary/30 text-primary bg-primary/5' :
                                                                    record.status === 'late' ? 'border-yellow-400/30 text-yellow-400 bg-yellow-400/5' :
                                                                        record.status === 'pending' ? 'border-white/30 text-white bg-white/5' :
                                                                            'border-red-500/30 text-red-500 bg-red-500/5'
                                                                }`}>
                                                                {record.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 md:text-right">
                                                            <div className="flex gap-2 md:justify-end">
                                                                {record.status === 'pending' && (
                                                                    <>
                                                                        <button onClick={() => handleUpdateStatus(record.attendance_id, 'present')} className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-background-dark border border-primary/30 rounded text-[9px] font-black uppercase tracking-widest transition-all">
                                                                            Approve
                                                                        </button>
                                                                        <button onClick={() => handleUpdateStatus(record.attendance_id, 'absent')} className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 rounded text-[9px] font-black uppercase tracking-widest transition-all">
                                                                            Deny
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button onClick={() => handleEdit(record)} className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/20 hover:text-primary">
                                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                                </button>
                                                                <button onClick={() => handleDelete(record.attendance_id)} className="p-2 hover:bg-red-500/10 rounded-lg transition-all text-white/20 hover:text-red-500">
                                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
                <Footer />
            </main>
        </div>
    );
};

export default SupervisorAttendance;
