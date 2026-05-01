import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { authAPI, usersAPI } from '../services/api';

const ChangePassword: React.FC = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { user, refreshProfile } = useUser();

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsSubmitting(true);

        try {
            await usersAPI.changePassword({
                old_password: oldPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            });
            
            setSuccess('Password changed successfully! Redirecting...');
            
            // Refresh profile to update must_change_password flag
            await refreshProfile();
            
            setTimeout(() => {
                // Navigate based on role
                if (user?.role === 'supervisor') navigate('/supervisor-dashboard');
                else if (user?.role === 'company_admin') navigate('/company-dashboard');
                else if (user?.role === 'university_admin') navigate('/university-dashboard');
                else navigate('/student-dashboard');
            }, 2000);
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Failed to change password';
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center overflow-hidden relative font-display text-white bg-background-dark">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-glow-teal transform -rotate-12"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-glow-violet transform rotate-12"></div>
            </div>

            <div className="relative z-10 w-full max-w-[480px] px-6">
                <div className="glass rounded-xl p-8 md:p-12 relative overflow-hidden border border-primary/20 bg-background-dark/80 backdrop-blur-xl shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"></div>

                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 border-2 border-primary/40 rounded-full flex items-center justify-center mb-4 relative">
                            <span className="material-symbols-outlined text-primary text-4xl">
                                key
                            </span>
                            <div className="absolute -inset-1 border border-primary/20 rounded-full animate-pulse"></div>
                        </div>
                        <h1 className="text-white text-3xl font-bold tracking-[0.2em] mb-1 text-center">SECURE ACCESS</h1>
                        <p className="text-primary/70 text-xs font-medium tracking-widest uppercase text-center">
                            Update your credentials to continue
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handlePasswordChange}>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-shake">
                                <span className="material-symbols-outlined text-sm">warning</span>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-3">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                {success}
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <label className="text-white/60 text-xs font-bold tracking-widest uppercase ml-1">Current Security Key</label>
                            <div className="flex w-full items-stretch rounded border border-[#3b5454] bg-[#1c2727]/50 transition-all focus-within:border-primary">
                                <div className="text-[#9db9b9] flex items-center justify-center pl-4">
                                    <span className="material-symbols-outlined text-xl">lock_open</span>
                                </div>
                                <input
                                    className="w-full bg-transparent border-none text-white focus:ring-0 placeholder:text-white/20 p-4 outline-none"
                                    placeholder="Enter current password"
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-white/60 text-xs font-bold tracking-widest uppercase ml-1">New Security Key</label>
                            <div className="flex w-full items-stretch rounded border border-[#3b5454] bg-[#1c2727]/50 transition-all focus-within:border-primary">
                                <div className="text-[#9db9b9] flex items-center justify-center pl-4">
                                    <span className="material-symbols-outlined text-xl">lock</span>
                                </div>
                                <input
                                    className="w-full bg-transparent border-none text-white focus:ring-0 placeholder:text-white/20 p-4 outline-none"
                                    placeholder="Enter new password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-white/60 text-xs font-bold tracking-widest uppercase ml-1">Confirm New Key</label>
                            <div className="flex w-full items-stretch rounded border border-[#3b5454] bg-[#1c2727]/50 transition-all focus-within:border-primary">
                                <div className="text-[#9db9b9] flex items-center justify-center pl-4">
                                    <span className="material-symbols-outlined text-xl">verified_user</span>
                                </div>
                                <input
                                    className="w-full bg-transparent border-none text-white focus:ring-0 placeholder:text-white/20 p-4 outline-none"
                                    placeholder="Re-enter new password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="w-full relative group/btn pt-4">
                            <div className="absolute inset-0 bg-primary blur-md opacity-20 group-hover/btn:opacity-40 transition-opacity"></div>
                            <div className="btn-angled relative bg-primary hover:bg-[#15ffff] text-background-dark py-4 text-sm font-black tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                {isSubmitting ? (
                                    <>
                                        <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        Authorize Update
                                        <span className="material-symbols-outlined text-lg">security</span>
                                    </>
                                )}
                            </div>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
