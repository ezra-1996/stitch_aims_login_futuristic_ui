import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Link } from 'react-router-dom';

import { aiAPI } from '../services/api';
import { useUser } from '../context/UserContext';

const FaceEnrollment: React.FC = () => {
    const { user, profilePhotoUrl, refreshProfile } = useUser();
    const webcamRef = useRef<Webcam>(null);
    const [step, setStep] = useState<'idle' | 'capturing' | 'processing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isReenrolling, setIsReenrolling] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('update') === 'true') {
            setIsReenrolling(true);
        }
    }, []);

    const getStudentId = (): string | null => {
        const userStr = localStorage.getItem('user');
        const stored = userStr ? JSON.parse(userStr) : null;
        return stored?.student_profile?.university_id || user?.username || null;
    };

    const captureAndEnroll = useCallback(async () => {
        if (!webcamRef.current) return;
        setStep('capturing');
        setMessage('Capturing face image...');

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            setStep('error');
            setMessage('Failed to capture image. Please allow camera access.');
            return;
        }

        setCapturedImage(imageSrc);
        setStep('processing');
        setMessage('Processing face enrollment...');

        try {
            const blob = await fetch(imageSrc).then(r => r.blob());
            const studentId = getStudentId();
            
            if (!studentId) {
                setStep('error');
                setMessage('Student ID not found. Please log in again or contact support.');
                return;
            }
            
            await aiAPI.enrollFace(studentId, blob, isReenrolling);
            localStorage.setItem('student_face_id', studentId);
            
            // Refresh profile to update photo in UI
            await refreshProfile();
            
            setStep('success');
            setMessage(`Face enrolled successfully for ID: ${studentId}`);
        } catch (err: any) {
            setStep('error');
            const errMsg = err.response?.data?.error || 'Enrollment failed. Try again.';
            setMessage(errMsg);
        }
    }, [webcamRef, user, refreshProfile, isReenrolling]);

    const reset = () => {
        setStep('idle');
        setMessage('');
        setCapturedImage(null);
    };

    if (profilePhotoUrl && step !== 'success' && !isReenrolling) {
        return (
            <div className="flex flex-col h-full bg-background-dark text-white rounded-2xl overflow-hidden glass border border-white/5 relative p-8 items-center justify-center text-center space-y-6">
                <div className="size-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <span className="material-symbols-outlined text-emerald-400 text-5xl">verified_user</span>
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase italic tracking-tight">Already <span className="text-emerald-400">Enrolled</span></h2>
                    <p className="text-white/40 text-sm max-w-md">Your biometric data and profile photo are already active in the system. You can update your photo in your profile settings if needed.</p>
                </div>
                <div className="flex gap-4">
                    <Link to="/attendance" className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">Back to Dashboard</Link>
                    <button 
                        onClick={() => setIsReenrolling(true)}
                        className="px-8 py-3 rounded-xl border border-primary/30 text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary/5 transition-all"
                    >
                        Re-Enroll Face
                    </button>
                    <Link to="/profile" className="px-8 py-3 rounded-xl bg-primary text-background-dark font-black uppercase tracking-widest text-[10px] hover:shadow-[0_0_20px_rgba(19,236,236,0.4)] transition-all">View Profile</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background-dark text-white rounded-2xl overflow-hidden glass border border-white/5 relative p-8 items-center justify-center">
                    <div className="w-full max-w-4xl space-y-8">

                        {/* Header */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                                <Link to="/attendance" className="hover:text-primary cursor-pointer transition-all">ATTENDANCE</Link>
                                <span className="material-symbols-outlined text-xs">chevron_right</span>
                                <span className="text-white">FACE ENROLLMENT</span>
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tight uppercase">
                                Face <span className="text-primary">Enrollment</span>
                            </h1>
                            <p className="text-white/40 text-sm font-medium">
                                Enroll your face once to enable AI-powered attendance verification.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Centered Circular Camera Frame */}
                            <div className="lg:col-span-2 flex items-center justify-center relative min-h-0 py-2">
                                <div className="relative size-[300px] rounded-full overflow-hidden border-4 border-primary/30 shadow-[0_0_50px_rgba(19,236,236,0.1)] bg-black">
                                    {step !== 'success' ? (
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            className="absolute inset-0 w-full h-full object-cover opacity-90 scale-125"
                                            videoConstraints={{ width: 720, height: 720, facingMode: 'user' }}
                                        />
                                    ) : (
                                        capturedImage && (
                                            <img src={capturedImage} alt="Enrolled" className="absolute inset-0 w-full h-full object-cover opacity-90 scale-125" />
                                        )
                                    )}

                                    {/* Scanning Animation */}
                                    {step === 'processing' && (
                                        <div className="absolute top-0 h-1 w-full bg-primary shadow-[0_0_20px_#13ecec] animate-scan z-10 opacity-60"></div>
                                    )}
                                </div>

                                {/* Status Overlay (Relative to circle) */}
                                {step !== 'idle' && (
                                    <div className="absolute -top-4 left-0 right-0 flex items-center justify-center pointer-events-none z-30">
                                        <div className={`px-8 py-3 glass rounded-full border font-black uppercase tracking-widest text-[10px] animate-pulse
                                            ${step === 'success' ? 'border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' :
                                                step === 'error' ? 'border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]' :
                                                    'border-primary/30 text-primary shadow-[0_0_20px_#13ecec]'}`}>
                                            {step === 'processing' && <span className="material-symbols-outlined animate-spin mr-2 text-sm">sync</span>}
                                            {step === 'success' && <span className="material-symbols-outlined mr-2 text-sm">check_circle</span>}
                                            {step === 'error' && <span className="material-symbols-outlined mr-2 text-sm">error</span>}
                                            {message}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Info Panel */}
                            <div className="flex flex-col gap-6">
                                <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
                                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">Instructions</h3>
                                    <div className="space-y-4">
                                        {[
                                            { icon: 'wb_sunny', label: 'Good Lighting', desc: 'Ensure face is well-lit' },
                                            { icon: 'center_focus_strong', label: 'Center Face', desc: 'Look straight at camera' },
                                            { icon: 'sentiment_neutral', label: 'Neutral Expression', desc: 'Relax your face muscles' },
                                            { icon: 'no_photography', label: 'No Glasses', desc: 'Remove sunglasses' },
                                        ].map(tip => (
                                            <div key={tip.label} className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-primary/60 text-lg">{tip.icon}</span>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest">{tip.label}</p>
                                                    <p className="text-[9px] text-white/30 font-bold">{tip.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="glass rounded-xl p-6 border border-white/5 space-y-3">
                                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">Account Details</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span className="text-white/40 uppercase tracking-widest">Student ID</span>
                                            <span className="text-primary font-mono">{getStudentId()}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span className="text-white/40 uppercase tracking-widest">Status</span>
                                            <span className={`font-mono ${step === 'success' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {step === 'success' ? 'ENROLLED' : 'PENDING'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-3 mt-6">
                                    {step === 'success' ? (
                                        <>
                                            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[11px] font-bold uppercase tracking-widest text-center">
                                                ✓ Enrollment Complete
                                            </div>
                                            <Link to="/attendance"
                                                className="w-full py-4 rounded-xl bg-primary text-background-dark font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(19,236,236,0.4)] transition-all">
                                                <span className="material-symbols-outlined">videocam</span>
                                                Go to Attendance
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={step === 'error' ? reset : captureAndEnroll}
                                                disabled={step === 'capturing' || step === 'processing'}
                                                className="w-full py-4 rounded-xl bg-primary text-background-dark font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(19,236,236,0.4)] transition-all disabled:opacity-50 disabled:cursor-wait"
                                            >
                                                <span className={`material-symbols-outlined ${step === 'processing' ? 'animate-spin' : ''}`}>
                                                    {step === 'error' ? 'refresh' : step === 'processing' ? 'sync' : 'face_retouching_natural'}
                                                </span>
                                                {step === 'error' ? 'Try Again' : step === 'processing' ? 'Processing...' : 'Enroll Face'}
                                            </button>
                                            <Link to="/attendance"
                                                className="w-full py-3 rounded-xl border border-white/10 text-white/40 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:border-primary/30 hover:text-primary transition-all">
                                                Skip to Attendance
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
        </div>
    );
};

export default FaceEnrollment;
