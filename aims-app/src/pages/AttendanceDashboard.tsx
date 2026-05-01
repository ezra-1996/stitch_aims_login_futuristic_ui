import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { attendanceAPI } from '../services/api';
import { useUser } from '../context/UserContext';
import FaceEnrollment from './FaceEnrollment';
import CameraAttendance from './CameraAttendance';

const AttendanceDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { profilePhotoUrl } = useUser();
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'verified' | 'failed'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<{ total_days: number; present_days: number; attendance_percentage: number; absent_days: number; late_days: number } | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [manualStatus, setManualStatus] = useState<'present' | 'late'>('present');
    const [manualNotes, setManualNotes] = useState('');
    const [submittingManual, setSubmittingManual] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'scan' | 'enroll'>('overview');
    const [selectedLog, setSelectedLog] = useState<any | null>(null);

    const fetchAttendanceData = async () => {
        setLoading(true);
        try {
            const studentId = localStorage.getItem('student_id');
            const data = await attendanceAPI.getAttendance();
            setRecentLogs(data);

            const today = new Date();
            const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
            const todayLog = data.find((a: any) => a.date === todayStr);
            if (todayLog) setIsCheckedIn(true);

            if (studentId) {
                const s = await attendanceAPI.getStudentSummary(Number(studentId));
                setSummary({
                    total_days: s.total_days ?? 0,
                    present_days: s.present_days ?? 0,
                    attendance_percentage: s.attendance_percentage ?? 0,
                    absent_days: s.absent_days ?? 0,
                    late_days: s.late_days ?? 0
                });
            }
        } catch (err) {
            setError('Could not load attendance data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendanceData();
    }, []);

    const handleMarkAttendance = () => {
        // Force the use of AI Scan by switching to the scan tab
        setActiveTab('scan');
    };

    const handleMonthChange = (direction: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1);
        setCurrentDate(newDate);
    };

    const openManualEntry = (dateStr: string) => {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        if (dateStr > todayStr) return; // Can't mark future attendance
        
        const existingLog = recentLogs.find(l => l.date === dateStr);
        if (existingLog) {
            setSelectedLog(existingLog);
            return;
        }

        setSelectedDate(dateStr);
        setIsManualModalOpen(true);
    };

    const handleManualSubmit = async () => {
        if (!selectedDate) return;
        setSubmittingManual(true);
        setError(null);
        try {
            await attendanceAPI.createAttendance({
                date: selectedDate,
                status: manualStatus,
                verification_method: 'manual',
                check_in_time: new Date().toISOString(),
                notes: manualNotes,
            });
            setIsManualModalOpen(false);
            setManualNotes('');
            fetchAttendanceData();
        } catch (err: any) {
            const data = err.response?.data;
            const msg = typeof data === 'string' ? data
                : data?.error ? (Array.isArray(data.error) ? data.error[0] : data.error)
                : data?.detail ?? data?.non_field_errors?.[0] ?? 'Failed to submit manual entry.';
            setError(msg);
        } finally {
            setSubmittingManual(false);
        }
    };

    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Add empty days for the start of the week
        const offset = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start
        for (let i = 0; i < offset; i++) {
            days.push({ day: null, status: 'empty' });
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            const log = recentLogs.find(l => l.date === dateStr);
            let status = 'none';
            if (log) {
                status = log.status;
            } else if (new Date(year, month, d) > new Date()) {
                status = 'future';
            } else if (new Date(year, month, d).getDay() === 0 || new Date(year, month, d).getDay() === 6) {
                status = 'weekend';
            } else {
                status = 'absent';
            }

            const today = new Date();
            const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
            const isToday = todayStr === dateStr;

            days.push({ day: d, dateStr, status, isToday });
        }
        return days;
    }, [currentDate, recentLogs]);

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Date,Status,Verification,Time\n"
            + recentLogs.map(l => `${l.date},${l.status},${l.verification_method},${l.check_in_time}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Attendance_Log_${currentDate.toISOString().slice(0, 7)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleAttendanceSuccess = () => {
        fetchAttendanceData();
        setActiveTab('overview');
    };

    return (
        <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden font-display">
            <Sidebar />

            <main className="flex-1 relative flex flex-col overflow-hidden">
                <Header />

                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col">
                    {/* Tab Navigation */}
                    <div className="max-w-[1400px] w-full mx-auto mb-8">
                        <div className="glass p-2 rounded-2xl flex gap-2 border border-white/10 shadow-2xl overflow-x-auto custom-scrollbar">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'overview' ? 'bg-primary text-background-dark shadow-[0_0_15px_rgba(19,236,236,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('scan')}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'scan' ? 'bg-violet-400 text-background-dark shadow-[0_0_15px_rgba(167,139,250,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                                AI Camera Scan
                            </button>
                            {!profilePhotoUrl && (
                                <button
                                    onClick={() => setActiveTab('enroll')}
                                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'enroll' ? 'bg-emerald-400 text-background-dark shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">face_retouching_natural</span>
                                    Face Enroll
                                </button>
                            )}
                        </div>
                    </div>

                    {error && activeTab === 'overview' && (
                        <div className="max-w-[1400px] w-full mx-auto mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest animate-pulse">{error}</div>
                    )}

                    <div className="flex-1 w-full max-w-[1400px] mx-auto">
                        {activeTab === 'scan' && (
                            <CameraAttendance 
                                onSuccess={handleAttendanceSuccess} 
                                onCancel={() => setActiveTab('overview')} 
                            />
                        )}
                        {activeTab === 'enroll' && <FaceEnrollment />}
                        
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-12 gap-8">
                        {/* Summary & Check-in */}
                        <div className="col-span-12 lg:col-span-4 space-y-8">
                            <div className="glass p-8 rounded-2xl flex flex-col items-center justify-center relative border border-white/5 overflow-hidden">
                                <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle className="text-white/5" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeWidth="6"></circle>
                                        <circle className="text-primary transition-all duration-1000" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor"
                                            strokeDasharray="502" strokeDashoffset={502 - (502 * (summary?.attendance_percentage || 0) / 100)} strokeLinecap="round" strokeWidth="10"
                                            style={{ filter: 'drop-shadow(0 0 8px #13ecec)' }}
                                        ></circle>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-black text-white">{Math.round(summary?.attendance_percentage || 0)}%</span>
                                        <span className="text-[10px] text-white/40 uppercase tracking-widest font-black">Presence</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleMarkAttendance}
                                    disabled={locationStatus === 'locating' || isCheckedIn}
                                    className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${isCheckedIn ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                        locationStatus === 'locating' ? 'bg-primary/20 text-white cursor-wait' :
                                            'bg-primary text-background-dark shadow-2xl hover:shadow-primary/40'
                                        }`}
                                >
                                    <span className={`material-symbols-outlined ${locationStatus === 'locating' ? 'animate-spin' : ''}`}>
                                        {isCheckedIn ? 'verified' : locationStatus === 'locating' ? 'sync' : 'fingerprint'}
                                    </span>
                                    {isCheckedIn ? 'Already Checked-in' : locationStatus === 'locating' ? 'Verifying Location...' : 'Initialize Check-in'}
                                </button>

                                <p className="mt-4 text-[10px] text-white/40 uppercase font-bold tracking-widest">Manual Entry Protocol active</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="glass p-5 rounded-xl border border-white/5 border-l-4 border-l-primary">
                                    <p className="text-[9px] text-white/40 uppercase font-black tracking-widest">Total Days</p>
                                    <p className="text-xl font-black mt-1">{summary?.total_days || 0}</p>
                                </div>
                                <div className="glass p-5 rounded-xl border border-white/5 border-l-4 border-l-yellow-400">
                                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Late</p>
                                    <p className="text-xl font-black mt-1">{summary?.late_days || 0}</p>
                                </div>
                                <div className="glass p-5 rounded-xl border border-white/5 border-l-4 border-l-red-500">
                                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Absent</p>
                                    <p className="text-xl font-black mt-1 text-red-500">{summary?.absent_days || 0}</p>
                                </div>
                                <div className="glass p-5 rounded-xl border border-white/5 border-l-4 border-l-emerald-500">
                                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Present</p>
                                    <p className="text-xl font-black mt-1 text-emerald-500">{summary?.present_days || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Calendar */}
                        <div className="col-span-12 lg:col-span-8">
                            <div className="glass rounded-2xl p-8 border border-white/5">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Attendance <span className="text-primary italic">Matrix</span></h3>
                                        <div className="flex items-center gap-4 mt-1">
                                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Manual Entry Log: {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                                            <span className="text-primary/20">•</span>
                                            
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleMonthChange(-1)} className="p-2 glass hover:bg-white/10 rounded-lg border border-white/5 transition-all">
                                            <span className="material-symbols-outlined">chevron_left</span>
                                        </button>
                                        
                                        <button onClick={() => handleMonthChange(1)} className="p-2 glass hover:bg-white/10 rounded-lg border border-white/5 transition-all">
                                            <span className="material-symbols-outlined">chevron_right</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-px bg-white/5 rounded-xl overflow-hidden shadow-2xl">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                        <div key={day} className="bg-background-dark/80 py-4 text-center text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{day}</div>
                                    ))}
                                    {calendarDays.map((d, i) => (
                                        <div
                                            key={i}
                                            onClick={() => d.day && d.status !== 'future' && openManualEntry(d.dateStr)}
                                            className={`min-h-[90px] p-3 relative border border-white/5 transition-all group/day ${d.status === 'weekend' ? 'bg-background-dark/20 opacity-40' :
                                                d.status === 'future' ? 'opacity-10 cursor-default' : 'bg-background-dark/60 hover:bg-white/5 cursor-pointer'
                                                } ${d.isToday ? 'ring-2 ring-primary ring-inset' : ''}`}
                                        >
                                            <span className={`text-[11px] font-black ${d.isToday ? 'text-primary' : 'text-white/40'}`}>{d.day}</span>

                                            {d.day && d.status !== 'future' && (
                                                <div className="absolute bottom-2 right-2 opacity-0 group-hover/day:opacity-100 transition-opacity">
                                                    <span className="material-symbols-outlined text-[14px] text-primary/40">edit_square</span>
                                                </div>
                                            )}

                                            {d.status === 'present' && (
                                                <div className="flex flex-col gap-1 mt-2">
                                                    <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
                                                    <span className="text-[7px] text-emerald-500 font-black uppercase tracking-tighter">Present</span>
                                                </div>
                                            )}
                                            {d.status === 'late' && (
                                                <div className="flex flex-col gap-1 mt-2">
                                                    <div className="size-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,1)]"></div>
                                                    <span className="text-[7px] text-yellow-400 font-black uppercase tracking-tighter">Late</span>
                                                </div>
                                            )}
                                            {d.status === 'absent' && d.day && (
                                                <div className="flex flex-col gap-1 mt-2">
                                                    <div className="size-1.5 rounded-full bg-red-500/50"></div>
                                                    <span className="text-[7px] text-red-500/40 font-black uppercase tracking-tighter">Absent</span>
                                                </div>
                                            )}
                                            {d.status === 'pending' && (
                                                <div className="flex flex-col gap-1 mt-2">
                                                    <div className="size-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)] animate-pulse"></div>
                                                    <span className="text-[7px] text-white/70 font-black uppercase tracking-tighter">Pending</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 flex flex-wrap gap-6 border-t border-white/5 pt-6">
                                    <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-emerald-500"></div><span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Present</span></div>
                                    <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-yellow-400"></div><span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Late</span></div>
                                    <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-red-500/50"></div><span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Absent</span></div>
                                    <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div><span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Pending</span></div>
                                    <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-primary animate-pulse"></div><span className="text-[9px] font-bold text-primary uppercase tracking-widest font-black">Today</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Recent History & Export */}
                        <div className="col-span-12 pb-12">
                            <div className="glass p-8 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div onClick={handleExport} className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary cursor-pointer hover:bg-primary/20 transition-all">
                                        <span className="material-symbols-outlined font-black">download</span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase italic tracking-tight">Export Academic Log</h4>
                                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Download full CSV for your university coordinator</p>
                                    </div>
                                </div>
                                <div className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] italic">
                                    Manual Entry Protocol Active
                                </div>
                            </div>
                        </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Manual Entry Modal */}
                {isManualModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm" onClick={() => setIsManualModalOpen(false)}></div>
                        <div className="glass w-full max-w-lg rounded-2xl border border-primary/30 relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="bg-primary/10 border-b border-primary/10 p-6 flex justify-between items-center">
                                <div>
                                    <h4 className="text-xl font-black text-primary uppercase italic tracking-tighter">Manual <span className="text-white">Protocol</span></h4>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Date: {selectedDate}</p>
                                </div>
                                <button onClick={() => setIsManualModalOpen(false)} className="text-white/40 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Attendance Status</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setManualStatus('present')}
                                            className={`py-4 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all ${manualStatus === 'present' ? 'bg-primary text-background-dark border-primary shadow-[0_0_20px_rgba(19,236,236,0.3)]' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}
                                        >
                                            Present
                                        </button>
                                        <button
                                            onClick={() => setManualStatus('late')}
                                            className={`py-4 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all ${manualStatus === 'late' ? 'bg-yellow-400 text-background-dark border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}
                                        >
                                            Late
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Justification Protocol</label>
                                    <textarea
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary outline-none transition-all h-32 resize-none"
                                        placeholder="Briefly state why you are marking this manually..."
                                        value={manualNotes}
                                        onChange={(e) => setManualNotes(e.target.value)}
                                    ></textarea>
                                </div>
                                <button
                                    onClick={handleManualSubmit}
                                    disabled={submittingManual}
                                    className="w-full bg-primary text-background-dark py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-primary/40 transition-all disabled:opacity-50"
                                >
                                    {submittingManual ? 'Initializing Matrix Mark...' : 'Finalize Digital Mark'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Details Modal */}
                {selectedLog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm" onClick={() => setSelectedLog(null)}></div>
                        <div className="glass w-full max-w-sm rounded-2xl border border-primary/30 relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="bg-primary/10 border-b border-primary/10 p-6 flex justify-between items-center">
                                <div>
                                    <h4 className="text-xl font-black text-primary uppercase italic tracking-tighter">Attendance <span className="text-white">Details</span></h4>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Date: {selectedLog.date}</p>
                                </div>
                                <button onClick={() => setSelectedLog(null)} className="text-white/40 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Status</p>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border inline-block ${
                                        selectedLog.status === 'present' ? 'border-primary/30 text-primary bg-primary/5' :
                                        selectedLog.status === 'late' ? 'border-yellow-400/30 text-yellow-400 bg-yellow-400/5' :
                                        selectedLog.status === 'pending' ? 'border-white/30 text-white bg-white/5' :
                                        'border-red-500/30 text-red-500 bg-red-500/5'
                                    }`}>
                                        {selectedLog.status}
                                    </span>
                                </div>
                                
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Time Marked</p>
                                    <p className="text-sm font-bold text-white">{selectedLog.check_in_time ? new Date(selectedLog.check_in_time).toLocaleString() : 'N/A'}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Verification Method</p>
                                    <p className="text-sm font-bold text-white uppercase tracking-widest">{selectedLog.verification_method || 'Unknown'}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">System Notes</p>
                                    <p className="text-sm text-white/70 italic">{selectedLog.notes || 'No specific notes.'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <Footer />
            </main>
        </div>
    );
};

export default AttendanceDashboard;
