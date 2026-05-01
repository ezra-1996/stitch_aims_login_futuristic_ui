import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { aiAPI } from '../services/api';

interface CameraAttendanceProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

const CameraAttendance: React.FC<CameraAttendanceProps> = ({ onSuccess, onCancel }) => {
    const [scanning, setScanning] = useState(false);
    const webcamRef = useRef<Webcam>(null);
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
    const [gpsStatus, setGpsStatus] = useState<string>("Initializing GPS...");
    const [isGpsVerified, setIsGpsVerified] = useState<boolean>(false);
    const [coords, setCoords] = useState<{ lat: number, lon: number } | null>(null);
    const [verificationDetails, setVerificationDetails] = useState<any>(null);
    const { user } = useUser();

    // Get location on mount
    React.useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCoords({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                    setGpsStatus(`LOCKED: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
                },
                (error) => {
                    console.error("GPS Error", error);
                    setGpsStatus("GPS ERROR: Signal Lost");
                }
            );
        } else {
            setGpsStatus("GPS UNAVAILABLE");
        }
    }, []);

    const getStudentId = (): string => {
        const userStr = localStorage.getItem('user');
        let stored = null;
        try {
            stored = userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            // Handle corrupted localStorage data - clear invalid data
            console.error('Failed to parse user from localStorage:', e);
            localStorage.removeItem('user');
        }
        // Priority: university_id from student_profile → username → user context username
        return stored?.student_profile?.university_id
            || stored?.username
            || user?.username
            || localStorage.getItem('student_face_id')
            || '';
    };

    const captureAndVerify = useCallback(async () => {
        if (!webcamRef.current) return;

        const studentId = getStudentId();
        if (!studentId) {
            setVerificationStatus("ERROR: Student ID not found. Please log in again.");
            return;
        }

        setScanning(true);
        setVerificationStatus("Scanning face...");

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            setVerificationStatus("ERROR: Camera not ready or permission denied. Please wait.");
            setScanning(false);
            return;
        }

        try {
            // Convert base64 to blob inside the try block to catch any unexpected errors
            const blob = await fetch(imageSrc).then(res => res.blob());
            
            const response = await aiAPI.verifyFace(
                studentId,
                blob,
                coords ? coords.lat : undefined,
                coords ? coords.lon : undefined
            );

            if (response.verified || response.success) {
                setVerificationDetails(response);
                setVerificationStatus("BIOMETRIC_MATCH_CONFIRMED: Identity Verified.");
                if (response.gps_verified) {
                    setIsGpsVerified(true);
                }
                if (response.gps_info) {
                    setGpsStatus(response.gps_info); // Show server-side GPS message
                }
                // Call the success callback if provided
                if (onSuccess) {
                    setTimeout(() => onSuccess(), 2000); // Small delay to let user see success message
                }
            } else {
                setVerificationStatus(`VERIFICATION_FAILED: ${response.message || 'No match found.'}`);
            }
        } catch (error: any) {
            console.error("Verification error:", error);
            const errData = error.response?.data;
            const errMsg = typeof errData === 'string' ? errData
                : errData?.error ? (Array.isArray(errData.error) ? errData.error[0] : errData.error)
                : errData?.message ? errData.message // Look for message field (common in your backend 400s)
                : errData?.detail ?? errData?.non_field_errors?.[0] ?? error.message ?? "System Error: API Unreachable";
            
            setVerificationStatus(`VERIFICATION_FAILED: ${errMsg}`);
        } finally {
            setScanning(false);
        }
    }, [webcamRef, coords]);

    return (
        <div className="flex flex-col h-full bg-background-dark text-white rounded-2xl overflow-hidden glass border border-white/5 relative">
                {/* Main Content Area */}
                <div className="flex-1 p-4 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a3a3a] via-background-dark to-background-dark overflow-y-auto custom-scrollbar">
                    <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 min-h-0">
                        {/* Left Control Panel */}
                        <aside className="w-full lg:w-64 flex flex-col gap-4 shrink-0">
                            <div className="glass rounded-xl p-4 space-y-3 border border-white/5">
                                <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">Attendance Check</h3>
                                <div className="space-y-2">
                                    {[
                                        { label: 'Camera', val: webcamRef.current ? 'Active' : 'Loading' },
                                        { label: 'GPS', val: coords ? 'Locked' : 'Pending' },
                                        { label: 'AI Model', val: 'Ready' },
                                        { label: 'Status', val: scanning ? 'Scanning...' : 'Idle' },
                                    ].map(item => (
                                        <div key={item.label} className="flex justify-between items-center text-[10px] font-bold">
                                            <span className="text-white/40 uppercase tracking-widest">{item.label}</span>
                                            <span className="text-primary font-mono tracking-tighter italic">{item.val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="glass rounded-xl p-4 space-y-4 flex-1 border border-white/5">
                                <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">Pre-Scan Checklist</h3>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Lighting', sub: 'Optimal Condition', done: true },
                                        { label: 'Position', sub: 'Face Centered', done: true },
                                        { label: 'Location', sub: isGpsVerified ? 'GPS Matched' : 'Awaiting Verify', done: isGpsVerified },
                                        { label: 'Identity', sub: 'Awaiting Capture', done: false },
                                    ].map(check => (
                                        <div key={check.label} className={`flex items-center gap-4 ${check.done ? 'opacity-100' : 'opacity-30'}`}>
                                            <span className={`material-symbols-outlined text-base ${check.done ? 'text-primary' : 'text-white/20'}`}>
                                                {check.done ? 'check_circle' : 'circle'}
                                            </span>
                                            <div>
                                                <p className="text-[10px] font-black uppercase leading-none tracking-widest">{check.label}</p>
                                                <p className="text-[9px] text-primary/60 uppercase font-bold mt-1 tracking-tighter">{check.sub}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        {/* Centered Circular Camera Frame */}
                        <div className="flex-1 flex items-center justify-center relative min-h-0 py-4">
                            <div className="relative size-[320px] rounded-full overflow-hidden border-4 border-primary/30 shadow-[0_0_50px_rgba(19,236,236,0.2)] bg-black">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    className="absolute inset-0 w-full h-full object-cover opacity-90 scale-125"
                                    videoConstraints={{
                                        width: 720,
                                        height: 720,
                                        facingMode: "user"
                                    }}
                                />

                                {/* Scanning Animation (Clipping to circle) */}
                                {scanning && (
                                    <div className="absolute top-0 h-1 w-full bg-primary shadow-[0_0_20px_#13ecec] animate-scan z-10 opacity-60"></div>
                                )}

                                {/* GPS Lock Indicator - Big & Noticeable */}
                                {coords && !verificationDetails && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                        <div className="bg-emerald-500/20 border border-emerald-500/40 px-6 py-2 rounded-full backdrop-blur-md animate-in fade-in zoom-in duration-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm animate-pulse">location_searching</span>
                                                GPS Target Locked
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Success Glow */}
                                {verificationDetails && (
                                    <div className="absolute inset-0 bg-emerald-500/20 animate-pulse z-20 flex flex-col items-center justify-center backdrop-blur-[2px]">
                                        <span className="material-symbols-outlined text-7xl text-emerald-400 drop-shadow-[0_0_20px_#10b981]">verified</span>
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-4">Identity Confirmed</p>
                                    </div>
                                )}
                            </div>

                            {/* Status Message Overlay (Now positioned relative to the circle) */}
                            {verificationStatus && (
                                <div className="absolute -top-4 left-0 right-0 z-30 text-center flex flex-col items-center gap-2">
                                    <div className={`inline-block px-6 py-2 glass rounded-full border border-primary/30 font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_#13ecec] animate-pulse ${verificationStatus.includes('FAILED') ? 'text-red-400 border-red-500/50' : 'text-primary'}`}>
                                        {verificationStatus}
                                    </div>
                                    {isGpsVerified && (
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                            <span className="material-symbols-outlined text-[10px]">location_on</span>
                                            Global GPS Match Confirmed
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Info Panel */}
                        <aside className="w-full lg:w-64 flex flex-col gap-4 shrink-0">
                            <div className="glass rounded-xl p-6 space-y-5 border border-white/5">
                                <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">Attendance Context</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 group">
                                        <div className={`size-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/20 transition-all ${isGpsVerified ? 'text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : ''}`}>
                                            <span className="material-symbols-outlined text-xl">location_on</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/80">GPS Status</p>
                                            <p className={`text-[9px] uppercase font-bold mt-0.5 ${isGpsVerified ? 'text-emerald-400' : 'text-primary/40'}`}>
                                                {isGpsVerified ? 'Verified Organization' : coords ? 'Locked: Local Signal' : 'Acquiring Signal...'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group">
                                        <div className={`size-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/20 transition-all ${verificationDetails ? 'text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : ''}`}>
                                            <span className="material-symbols-outlined text-xl">psychology</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/80">AI Analysis</p>
                                            <p className={`text-[9px] uppercase font-bold mt-0.5 ${verificationDetails ? 'text-emerald-400' : 'text-primary/40'}`}>
                                                {verificationDetails ? 'Biometric Locked' : 'Engine Ready'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={`glass rounded-xl p-6 space-y-6 flex-1 border border-white/5 transition-all duration-500 ${verificationDetails ? 'border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : ''}`}>
                                <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">Neural Match Evidence</h3>
                                <div className="space-y-5">
                                    <div>
                                        <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-2">Confidence Level</p>
                                        <div className="flex items-end gap-2">
                                            <p className={`text-4xl font-black italic tracking-tighter transition-all duration-700 ${verificationDetails ? 'text-emerald-400 scale-110 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-primary'}`}>
                                                {verificationDetails ? `${(verificationDetails.confidence * 100).toFixed(1)}%` : '--%'}
                                            </p>
                                            <div className="mb-1 flex gap-1">
                                                {[1,2,3,4,5].map(i => (
                                                    <div key={i} className={`size-1 rounded-full ${verificationDetails?.confidence * 5 >= i ? 'bg-emerald-400' : 'bg-white/10'}`}></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-2">Verification Engine</p>
                                        <p className="text-[10px] font-black uppercase italic text-white/80">
                                            {verificationDetails?.details?.method === 'gemini_multimodal' ? 'Gemini 2.0 Vision' : 
                                             verificationDetails?.details?.method === 'multi_method' ? 'Local Hybrid AI' : 'Waiting...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>

                    {/* Footer Action Area */}
                    <div className="mt-2 flex flex-col items-center gap-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button
                                onClick={captureAndVerify}
                                disabled={scanning || !coords}
                                className="bg-primary text-background-dark px-16 py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-sm shadow-[0_0_40px_rgba(19,236,236,0.3)] hover:shadow-[0_0_60px_rgba(19,236,236,0.5)] hover:scale-105 active:scale-95 transition-all italic flex items-center gap-2 group disabled:opacity-50 disabled:cursor-wait"
                            >
                                <span className={`material-symbols-outlined font-black ${scanning ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`}>
                                    {scanning ? 'autorenew' : 'camera'}
                                </span>
                                {scanning ? 'Scanning...' : !coords ? 'Acquiring GPS...' : 'Initialize Capture'}
                            </button>
                            {verificationStatus?.includes('CONFIRMED') && (
                                <button
                                    onClick={onCancel}
                                    className="px-8 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] glass hover:bg-white/10 transition-all text-emerald-400 border border-emerald-500/20"
                                >
                                    Return to Overview
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-white/20 uppercase font-black tracking-[0.3em] italic">
                            Biometric Attendance System
                        </div>
                    </div>
                </div>

        </div>
    );
};

export default CameraAttendance;
