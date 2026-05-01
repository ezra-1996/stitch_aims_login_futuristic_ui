import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-background-dark text-white font-display overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-glow-teal opacity-20 transform -rotate-12 blur-[100px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-glow-violet opacity-20 transform rotate-12 blur-[100px]"></div>
                <div className="absolute inset-0 diagonal-line opacity-10"></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-20 flex items-center justify-between px-8 py-6 glass border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border border-primary/40 rounded-full flex items-center justify-center bg-primary/10 shadow-[0_0_10px_rgba(19,236,236,0.2)]">
                        <span className="material-symbols-outlined text-primary text-xl">shield_person</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-[0.2em] text-white">AIMS</h1>
                        <p className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">Jimma University</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <Link to="/about" className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-primary transition-colors hidden md:block">About System</Link>
                    <Link to="/support" className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-primary transition-colors hidden md:block">Contact</Link>
                    <Link to="/login" className="px-6 py-2.5 bg-primary/10 text-primary border border-primary/40 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-background-dark transition-all shadow-[0_0_20px_rgba(19,236,236,0.15)] flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">login</span>
                        Portal Access
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 container mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center space-y-12">
                <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-[0_0_10px_rgba(19,236,236,0.2)]">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        Next-Gen Internship Automation
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none">
                        Automating the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#a5f3fc] to-primary animate-text-shimmer bg-[length:200%_auto]">Future</span> of <br />
                        Professional <span className="text-white underline decoration-primary/30 underline-offset-8">Growth</span>
                    </h1>
                    <p className="text-lg text-white/40 font-medium max-w-2xl mx-auto leading-relaxed">
                        The Automated Internship Management System (AIMS) streamlines the entire placement lifecycle using advanced AI for biometric attendance, semantic reporting, and predictive performance analytics.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
                    <Link to="/register?type=student" className="px-10 py-5 bg-primary text-background-dark rounded-xl text-sm font-black uppercase tracking-[0.2em] hover:scale-105 transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(19,236,236,0.3)] group">
                        Start Your Journey 
                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </Link>
                    <Link to="/register?type=company" className="px-10 py-5 glass border border-white/10 text-white rounded-xl text-sm font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center gap-3 group">
                        Partner With Us 
                        <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">corporate_fare</span>
                    </Link>
                </div>

                {/* Process Flow */}
                <div className="grid md:grid-cols-4 gap-6 w-full max-w-6xl mt-24">
                    {[
                        { step: '01', title: 'Apply', icon: 'description', desc: 'Browse and apply to top-tier industry partners matching your skill vector.' },
                        { step: '02', title: 'Attend', icon: 'location_on', desc: 'Verify presence via GPS geofencing and facial biometric signatures.' },
                        { step: '03', title: 'Report', icon: 'edit_document', desc: 'Submit weekly tactical logs analyzed by our NLP semantic engine.' },
                        { step: '04', title: 'Evaluate', icon: 'analytics', desc: 'Receive real-time performance metrics and supervisor neural feedback.' },
                    ].map((item, idx) => (
                        <div key={item.step} className="glass p-8 rounded-2xl border border-white/5 relative group hover:border-primary/30 transition-all duration-500">
                            <div className="absolute top-4 right-4 text-4xl font-black text-white/5 group-hover:text-primary/10 transition-colors italic">{item.step}</div>
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-background-dark transition-all duration-500 text-primary">
                                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                            </div>
                            <h3 className="text-lg font-black uppercase italic tracking-tighter mb-2">{item.title}</h3>
                            <p className="text-[11px] text-white/40 font-bold leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

            </main>

            {/* Footer Minimal */}
            <footer className="border-t border-white/5 py-8 text-center relative z-10 glass">
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">
                    © 2024 Jimma University AIMS // Secure System V4.0
                </p>
            </footer>
        </div>
    );
};

export default LandingPage;
