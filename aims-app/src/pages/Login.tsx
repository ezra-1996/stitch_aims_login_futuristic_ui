import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { authAPI } from '../services/api';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { login } = useUser();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await authAPI.login(username, password);

            // Store tokens (persist based on Remember Me)
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('access_token', response.access);
            storage.setItem('refresh_token', response.refresh);
            // Also keep in localStorage for API interceptor compatibility
            localStorage.setItem('access_token', response.access);
            localStorage.setItem('refresh_token', response.refresh);

            // Update context (also persists to localStorage automatically)
            const user = response.user;
            login(user);

            // Persist student-specific IDs for attendance + face recognition
            if (user.student_profile?.student_id) {
                localStorage.setItem('student_id', String(user.student_profile.student_id));
            }
            if (user.student_profile?.university_id) {
                localStorage.setItem('student_face_id', user.student_profile.university_id);
            }

            // Navigate based on role
            if (user.must_change_password) {
                navigate('/change-password');
            } else if (user.role === 'supervisor') {
                navigate('/supervisor-dashboard');
            } else if (user.role === 'company_admin') {
                navigate('/company-dashboard');
            } else if (user.role === 'university_admin') {
                navigate('/university-dashboard');
            } else {
                navigate('/student-dashboard');
            }
        } catch (err: any) {
            if (!err.response) {
                setError('Cannot reach server. Check that the backend is running and CORS is allowed.');
                return;
            }
            const msg = err.response?.data?.error ?? err.response?.data?.detail;
            const fallback = err.response?.status === 401 ? 'Invalid username or password.' : 'Login failed. Try again.';
            setError(typeof msg === 'string' ? msg : fallback);
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
                <div className="absolute inset-0 diagonal-line opacity-30"></div>
                <div className="absolute inset-0 diagonal-line opacity-20 translate-x-20 -translate-y-20"></div>
                <div className="absolute top-20 right-40 w-1 h-40 bg-primary/20 blur-sm"></div>
                <div className="absolute bottom-20 left-40 w-1 h-40 bg-primary/20 blur-sm"></div>
            </div>

            <div className="relative z-10 w-full max-w-[480px] px-6">
                {/* Main Login Card */}
                <div className="glass rounded-xl p-8 md:p-12 relative overflow-hidden group border border-primary/20 bg-background-dark/80 backdrop-blur-xl shadow-2xl">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"></div>

                    {/* Branding Header */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 border-2 border-primary/40 rounded-full flex items-center justify-center mb-4 relative">
                            <span className="material-symbols-outlined text-primary text-4xl">
                                shield_person
                            </span>
                            <div className="absolute -inset-1 border border-primary/20 rounded-full animate-pulse"></div>
                        </div>
                        <h1 className="text-white text-4xl font-bold tracking-[0.2em] mb-1">AIMS</h1>
                        <p className="text-primary/70 text-xs font-medium tracking-widest uppercase text-center">
                            Jimma University Internship Portal
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-shake">
                                <span className="material-symbols-outlined text-sm">warning</span>
                                {error}
                            </div>
                        )}

                        {/* Username Field */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-white/60 text-xs font-bold tracking-widest uppercase">Identity Access</label>
                                <Link className="text-violet-400/60 hover:text-violet-400 text-[10px] font-bold tracking-widest uppercase transition-colors" to="/account-recovery">Forgot Username?</Link>
                            </div>
                            <div className="flex w-full items-stretch rounded border border-[#3b5454] bg-[#1c2727]/50 transition-all duration-300 focus-within:border-primary focus-within:shadow-[0_0_15px_rgba(19,236,236,0.4)]">
                                <div className="text-[#9db9b9] flex items-center justify-center pl-4">
                                    <span className="material-symbols-outlined text-xl">alternate_email</span>
                                </div>
                                <input
                                    className="w-full bg-transparent border-none text-white focus:ring-0 placeholder:text-white/20 p-4 text-base font-normal placeholder:italic outline-none whitespace-nowrap overflow-hidden text-ellipsis shadow-none focus:outline-none"
                                    placeholder="e.g. student123"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-white/60 text-xs font-bold tracking-widest uppercase">Security Key</label>
                                <Link className="text-primary/60 hover:text-primary text-[10px] font-bold tracking-widest uppercase transition-colors" to="/account-recovery">Forgot Access?</Link>
                            </div>
                            <div className="flex w-full items-stretch rounded border border-[#3b5454] bg-[#1c2727]/50 transition-all duration-300 focus-within:border-primary focus-within:shadow-[0_0_15px_rgba(19,236,236,0.4)]">
                                <div className="text-[#9db9b9] flex items-center justify-center pl-4">
                                    <span className="material-symbols-outlined text-xl">lock</span>
                                </div>
                                <input
                                    className="w-full bg-transparent border-none text-white focus:ring-0 placeholder:text-white/20 p-4 text-base font-normal outline-none"
                                    placeholder="••••••••"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                                <button
                                    className="text-[#9db9b9] flex items-center justify-center pr-4 hover:text-primary transition-colors"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center px-1">
                            <label className="flex items-center gap-3 cursor-pointer group/check">
                                <input className="h-4 w-4 rounded-sm border-[#3b5454] border-2 bg-transparent text-primary focus:ring-primary/50 focus:ring-offset-0 focus:border-primary transition-all cursor-pointer" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                <span className="text-white/60 text-xs font-medium group-hover/check:text-white transition-colors uppercase tracking-widest">Persist Session</span>
                            </label>
                        </div>

                        {/* Login Button */}
                        <button type="submit" disabled={isSubmitting} className="w-full relative group/btn pt-4">
                            <div className="absolute inset-0 bg-primary blur-md opacity-20 group-hover/btn:opacity-40 transition-opacity"></div>
                            <div className="btn-angled relative bg-primary hover:bg-[#15ffff] text-background-dark py-4 text-sm font-black tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? (
                                    <>
                                        <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                                        Synchronizing...
                                    </>
                                ) : (
                                    <>
                                        Initialize Session
                                        <span className="material-symbols-outlined text-lg">bolt</span>
                                    </>
                                )}
                            </div>
                        </button>
                    </form>

                    {/* Test credentials (create with: python reseed.py) */}
                    <details className="mt-8 rounded-xl border border-white/5 bg-white/2 overflow-hidden">
                        <summary className="p-4 cursor-pointer text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic text-center hover:text-white/60 transition-colors select-none">
                            Show test accounts
                        </summary>
                        <div className="px-4 pb-4 space-y-3">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] italic text-center">Create with: <code className="text-primary/80">python reseed.py</code></p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { role: 'Admin', user: 'uni_admin', pass: 'admin123' },
                                    { role: 'Company', user: 'company_1', pass: 'company123' },
                                    { role: 'Supervisor', user: 'supervisor_1_1', pass: 'supervisor123' },
                                    { role: 'Student', user: 'student_1', pass: 'student123' },
                                ].map(cred => (
                                    <div key={cred.role} className="p-2 rounded bg-black/40 border border-white/5 flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-primary/60 uppercase">{cred.role}</span>
                                        <span className="text-[8px] text-white/40 font-mono truncate">{cred.user}</span>
                                        <span className="text-[8px] text-white/40 font-mono">{cred.pass}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </details>
                    {/* Registration Links */}
                    <div className="mt-10 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-4 w-full">
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/20"></div>
                            <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">New Deployment</span>
                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/20"></div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
                            <Link className="group flex items-center gap-2" to="/register?type=student">
                                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full group-hover:bg-primary transition-colors"></div>
                                <span className="text-white/50 text-[11px] font-bold uppercase tracking-tighter hover:text-primary transition-colors">Register Student</span>
                            </Link>
                            <Link className="group flex items-center gap-2" to="/register?type=company">
                                <div className="w-1.5 h-1.5 bg-violet-400/40 rounded-full group-hover:bg-violet-400 transition-colors"></div>
                                <span className="text-white/50 text-[11px] font-bold uppercase tracking-tighter hover:text-violet-400 transition-colors">Register Company</span>
                            </Link>
                            <Link className="group flex items-center gap-2" to="/register?type=university">
                                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full group-hover:bg-primary transition-colors"></div>
                                <span className="text-white/50 text-[11px] font-bold uppercase tracking-tighter hover:text-primary transition-colors">University Admin</span>
                            </Link>
                        </div>
                    </div>

                    {/* Corner Accents */}
                    <div className="absolute bottom-0 right-0 w-8 h-8 opacity-20">
                        <div className="absolute bottom-2 right-2 w-4 h-[1px] bg-primary"></div>
                        <div className="absolute bottom-2 right-2 w-[1px] h-4 bg-primary"></div>
                    </div>
                    <div className="absolute top-0 left-0 w-8 h-8 opacity-20">
                        <div className="absolute top-2 left-2 w-4 h-[1px] bg-primary"></div>
                        <div className="absolute top-2 left-2 w-[1px] h-4 bg-primary"></div>
                    </div>
                </div>

                {/* System Status Footer */}
                <div className="mt-8 flex justify-between items-center px-4 opacity-40">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span className="text-[10px] text-white font-bold uppercase tracking-widest">System Online</span>
                    </div>
                    <span className="text-[10px] text-white font-bold uppercase tracking-widest">v4.0.2-Build</span>
                </div>
            </div>

            {/* Decorative Image Overlays */}
            <div className="absolute top-10 left-10 w-32 h-32 opacity-10 pointer-events-none">
                <img className="w-full h-full object-cover filter grayscale invert" alt="Abstract cyber circuit board pattern" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjhPXfomyZxYd0_5EW7ym8jy6AP1mXoolxBsHi1ixQHTIw_8VN5d8p8xCSfr1Pw3VC2DkVxpW0HYWqaw7E1h-6oEIGNSlvi73nHLZktUQWDitf0J3v0Kd8eDkElEi4BpZahkYO3GjwIc4vs1fN9N5f6chYAI_AhZqLyXckgs6twwbvn6nAu-vjZbzO2ntcdlxl4yyJ52Mg3eImBT-7q9j1y1YsVbVkTa-F2Lxc7ZCrQh9pbhuz0M5ZdO4rad2YV84H8t8NK262PtQ" />
            </div>
            <div className="absolute bottom-10 right-10 w-32 h-32 opacity-10 pointer-events-none">
                <img className="w-full h-full object-cover filter grayscale invert" alt="Digital globe network visualization background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBIy5sYt1Kqa2PL6x6Zz47ab2B0nK_SVWHpNkxLb1AGxbDFRbVWy9ttckyvkoOYysRxCkrAZ_30LfkG0JDr9QB60tvb_t2B5WBv0kuWqVrze7VzF_DW6yUKwAAU27aaAOQWy3HcWWlumsQb6TLTBGSZFhXqlAVyU6zonymJy8WG1Uag8yus9P9aac2tzedeEKm913Z7KcNVwFRW0qhZCUQl2UshLbuzMy0JpEtpYgCvh44UbfmwPCv_IwUyI-QnPL-v8iZYebe2TI" />
            </div>
        </div>
    );
};

export default Login;
