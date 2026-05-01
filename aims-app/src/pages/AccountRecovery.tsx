import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const AccountRecovery: React.FC = () => {
    const [mode, setMode] = useState<'password' | 'username'>('password');
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [recoveredUsername, setRecoveredUsername] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setRecoveredUsername('');

        try {
            if (mode === 'password') {
                await authAPI.passwordResetRequest(email);
                setIsSubmitted(true);
            } else {
                const data = await authAPI.usernameRecovery(email);
                setIsSubmitted(true);
                if (data.username) {
                    setRecoveredUsername(data.username);
                }
            }
        } catch (err: any) {
            // Error handling matching original files
            if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setIsSubmitted(true);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-background-dark min-h-screen flex items-center justify-center relative overflow-hidden font-display">
            {/* Background Depth Effects */}
            <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-gradient-to-br from-primary/10 to-transparent blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-tl from-primary/10 to-transparent blur-[120px] rounded-full pointer-events-none"></div>

            <div className="layout-container relative z-10 w-full max-w-[480px] px-6">
                {/* Logo/Header Area */}
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center gap-3 text-primary mb-2">
                        <div className="size-8">
                            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.578 8.578C5.528 11.628 3.451 15.514 2.609 19.745C1.768 23.976 2.2 28.361 3.85 32.346C5.501 36.331 8.297 39.738 11.883 42.134C15.47 44.53 19.687 45.81 24 45.81C28.314 45.81 32.53 44.53 36.117 42.134C39.703 39.738 42.499 36.331 44.15 32.346C45.8 28.361 46.232 23.976 45.39 19.745C44.549 15.515 42.472 11.628 39.422 8.578L24 24L8.578 8.578Z" fill="currentColor"></path>
                            </svg>
                        </div>
                        <h2 className="text-white text-2xl font-bold leading-tight tracking-tight">AIMS</h2>
                    </div>
                    <p className="text-primary/60 text-xs font-medium tracking-[0.2em] uppercase">Jimma University</p>
                </div>

                {/* Main Glass Panel */}
                <div className="glass p-8 md:p-10 rounded-lg shadow-2xl border border-white/10 overflow-hidden relative">
                    
                    {/* Toggle Mode */}
                    {!isSubmitted && (
                        <div className="flex bg-white/5 rounded-xl p-1 mb-8">
                            <button
                                type="button"
                                onClick={() => setMode('password')}
                                className={`flex-1 py-2 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all ${mode === 'password' ? 'bg-primary text-background-dark shadow-[0_0_15px_rgba(19,236,236,0.2)]' : 'text-white/40 hover:text-white/80'}`}
                            >
                                Password Reset
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('username')}
                                className={`flex-1 py-2 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all ${mode === 'username' ? 'bg-primary text-background-dark shadow-[0_0_15px_rgba(19,236,236,0.2)]' : 'text-white/40 hover:text-white/80'}`}
                            >
                                Username Recovery
                            </button>
                        </div>
                    )}

                    {/* Success Overlay */}
                    {isSubmitted && mode === 'password' && (
                        <div className="absolute inset-0 z-50 bg-background-dark/95 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center animate-fade-in">
                            <div className="size-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(19,236,236,0.2)]">
                                <span className="material-symbols-outlined text-primary text-4xl font-black">mark_email_read</span>
                            </div>
                            <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter mb-4">Transmission Sent</h2>
                            <p className="text-white/60 text-sm leading-relaxed mb-10 italic">
                                A recovery link has been dispatched to <span className="text-primary font-bold">{email}</span>. Please verify your secure inbox.
                            </p>
                            <Link to="/login" className="w-full bg-primary text-background-dark font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(19,236,236,0.3)] block">
                                Return to Login
                            </Link>
                        </div>
                    )}

                    {isSubmitted && mode === 'username' && (
                        <div className="absolute inset-0 z-50 bg-background-dark/95 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center animate-fade-in">
                            <div className="size-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(19,236,236,0.2)]">
                                <span className="material-symbols-outlined text-primary text-4xl font-black">person_search</span>
                            </div>

                            {recoveredUsername ? (
                                <>
                                    <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter mb-4">Identity Located</h2>
                                    <p className="text-white/60 text-sm leading-relaxed mb-4 italic">
                                        Your username associated with <span className="text-primary font-bold">{email}</span> is:
                                    </p>
                                    <div className="bg-primary/10 border border-primary/30 rounded-xl px-8 py-4 mb-8 shadow-[0_0_20px_rgba(19,236,236,0.15)]">
                                        <span className="text-primary text-2xl font-black tracking-wider font-mono">{recoveredUsername}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter mb-4">Transmission Sent</h2>
                                    <p className="text-white/60 text-sm leading-relaxed mb-10 italic">
                                        If an account with <span className="text-primary font-bold">{email}</span> exists, recovery information has been dispatched to your inbox.
                                    </p>
                                </>
                            )}

                            <Link to="/login" className="w-full bg-primary text-background-dark font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(19,236,236,0.3)] text-center block">
                                Return to Login
                            </Link>
                        </div>
                    )}

                    {!isSubmitted && (
                        <>
                            <div className="flex flex-col gap-2 mb-8 text-center px-2">
                                <h1 className="text-white text-3xl font-black uppercase italic tracking-tighter">
                                    {mode === 'password' ? 'Access Recovery' : 'Username Recovery'}
                                </h1>
                                <p className="text-white/40 text-[11px] font-medium uppercase tracking-[0.2em] leading-relaxed italic">
                                    {mode === 'password' ? 'Initialize neural handshake for account restoration.' : 'Enter your registered email to retrieve your identity access code.'}
                                </p>
                            </div>

                            <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}
                                <div className="flex flex-col gap-3">
                                    <label className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] ml-1 italic">Institutional Terminal Email</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary/40 group-focus-within:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">mail</span>
                                        </div>
                                        <input
                                            className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-sm py-4 pl-12 pr-4 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/40 placeholder:text-white/10 italic"
                                            placeholder="e.g. user@ju.edu.et"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-primary text-background-dark font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(19,236,236,0.3)] flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                                                Processing...
                                            </>
                                        ) : (
                                            'Initialize Recovery'
                                        )}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-10 text-center">
                                <Link to="/login" className="inline-flex items-center gap-2 text-white/50 hover:text-primary text-sm font-medium transition-colors duration-200 group">
                                    <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:-translate-x-1">arrow_back</span>
                                    Back to Login
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-white/20 text-[10px] tracking-[0.3em] uppercase">Automated Internship Management System v2.0</p>
                </div>
            </div>

            {/* Decorative Corner Element */}
            <div className="absolute top-10 right-10 hidden lg:block opacity-20">
                <div className="w-16 h-16 border-t-2 border-r-2 border-primary"></div>
            </div>
            <div className="absolute bottom-10 left-10 hidden lg:block opacity-20">
                <div className="w-16 h-16 border-b-2 border-l-2 border-primary"></div>
            </div>
        </div>
    );
};

export default AccountRecovery;
