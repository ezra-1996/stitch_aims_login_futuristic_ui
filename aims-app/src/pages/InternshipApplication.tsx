import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { organizationsAPI, internshipsAPI } from '../services/api';
import { useUser } from '../context/UserContext';

const InternshipApplication: React.FC = () => {
    const { user } = useUser();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const postId = searchParams.get('postId') ? Number(searchParams.get('postId')) : null;
    const [post, setPost] = useState<any>(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!postId) return;
        organizationsAPI.getInternshipPost(postId).then(setPost).catch(() => setError('Could not load internship.'));
    }, [postId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!postId) return;
        setError(null);
        setSubmitting(true);
        try {
            await internshipsAPI.createApplication(postId, coverLetter);
            navigate('/my-applications');
        } catch (err: any) {
            setError(err.response?.data?.detail || err.response?.data?.post?.[0] || 'Application failed.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!postId) {
        return (
            <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 font-bold uppercase tracking-widest">No internship selected</p>
                    <Link to="/browse-internships" className="text-primary mt-4 inline-block text-sm font-bold uppercase">Browse internships</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden font-display">
            <Sidebar />

            <main className="flex-1 relative flex flex-col overflow-hidden">
                <Header />

                {/* Main Content Area */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-10">
                        {/* Breadcrumbs & Header */}
                        <div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Link className="text-primary/60 text-xs font-bold uppercase tracking-widest hover:text-primary" to="/student-dashboard">Dashboard</Link>
                                <span className="text-white/20 text-xs">/</span>
                                <Link className="text-primary/60 text-xs font-bold uppercase tracking-widest hover:text-primary" to="/browse-internships">Opportunities</Link>
                                <span className="text-white/20 text-xs">/</span>
                                <span className="text-white text-xs font-bold uppercase tracking-widest">Application Form</span>
                            </div>
                            <h1 className="text-white text-4xl lg:text-5xl font-black leading-tight tracking-tight uppercase">
                                Internship <span className="text-primary">Application</span>
                                {post && ` – ${post.title}`}
                            </h1>
                            <p className="text-[#9db9b9] mt-2 text-lg">Submit your digital credentials for Jimma University high-tech program.</p>
                            {error && (
                                <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-bold uppercase tracking-widest">{error}</div>
                            )}
                        </div>

                        {/* Split Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Left Section: Application Form */}
                            <div className="lg:col-span-8 space-y-10">
                                {/* Pre-filled Identity Data */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">fingerprint</span>
                                        <h2 className="text-white text-lg font-bold tracking-widest uppercase">Verified Profile Data</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { label: 'Full Name', val: user?.full_name || user?.name || 'Applicant' },
                                            { label: 'ID Cluster', val: user?.student_profile?.university_id || 'N/A' },
                                            { label: 'Academic GPA', val: user?.student_profile?.gpa ? `${Number(user.student_profile.gpa).toFixed(2)} / 4.00` : 'N/A', highlight: true },
                                            { label: 'Division', val: user?.student_profile?.department || 'N/A' },
                                        ].map(item => (
                                            <div key={item.label} className="glass p-4 rounded-lg border-l-2 border-primary">
                                                <p className="text-[#9db9b9] text-[10px] uppercase tracking-widest font-bold">{item.label}</p>
                                                <p className={`text-lg font-display ${item.highlight ? 'text-primary font-bold' : 'text-white'}`}>{item.val}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Cover Letter Editor */}
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">description</span>
                                            <h2 className="text-white text-lg font-bold tracking-widest uppercase">Cover Letter Compose</h2>
                                        </div>
                                        <div className="flex gap-2 glass p-1 rounded-lg border border-white/10">
                                            
                                            
                                            
                                            <div className="w-px h-4 bg-white/10 mx-1 self-center"></div>
                                            
                                        </div>
                                    </div>
                                    <div className="relative glass rounded-xl overflow-hidden min-h-[300px] flex flex-col border border-white/10">
                                        <textarea className="flex-1 bg-transparent border-none text-white focus:ring-0 p-6 resize-none font-display text-base leading-relaxed placeholder:text-white/20 outline-none" placeholder="State your motivation for the Jimma Tech internship program..." value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
                                        <div className="p-3 border-t border-white/5 flex justify-between items-center text-[10px] uppercase tracking-widest text-[#9db9b9]">
                                            <span>Draft saved 2 mins ago</span>
                                            <span>Words: 0 / 500</span>
                                        </div>
                                    </div>
                                </section>

                                {/* Resume Upload Area */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">upload_file</span>
                                        <h2 className="text-white text-lg font-bold tracking-widest uppercase">Portfolio & Resume</h2>
                                    </div>
                                    <div className="relative border-2 border-dashed border-primary/40 rounded-xl p-10 flex flex-col items-center justify-center gap-4 bg-primary/5 group cursor-pointer overflow-hidden hover:shadow-[0_0_20px_rgba(19,236,236,0.2)] transition-all">
                                        <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-white font-bold text-lg uppercase italic tracking-tighter">Drag & Drop Resume</p>
                                            <p className="text-[#9db9b9] text-xs mt-1">PDF, DOCX up to 10MB</p>
                                        </div>
                                        
                                    </div>
                                </section>
                            </div>

                            {/* Right Section: Live Preview */}
                            <aside className="lg:col-span-4">
                                <div className="glass rounded-2xl p-6 space-y-6 sticky top-0 border border-white/10 shadow-2xl">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-primary text-[10px] font-black tracking-[0.2em] uppercase italic underline decoration-primary/30 decoration-2 underline-offset-4">Live Document Preview</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="size-2 rounded-full bg-primary animate-pulse"></div>
                                            <span className="text-[10px] text-[#9db9b9] uppercase tracking-widest">Real-time Sync</span>
                                        </div>
                                    </div>
                                    {/* Progress Strength */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                            <span className="text-white/60">Application Strength</span>
                                            <span className="text-primary italic">65%</span>
                                        </div>
                                        <div className="w-full h-1 back-white/5 rounded-full overflow-hidden bg-white/5">
                                            <div className="bg-primary h-full w-[65%] shadow-[0_0_10px_#13ecec]"></div>
                                        </div>
                                    </div>
                                    {/* Preview Container */}
                                    <div className="bg-white/5 rounded-xl border border-white/5 p-8 h-[400px] overflow-y-auto custom-scrollbar text-white/80">
                                        <div className="flex justify-between items-start mb-8">
                                            <div>
                                                <h4 className="text-white font-display font-bold text-lg uppercase leading-none">{user?.full_name || user?.name || 'Applicant'}</h4>
                                                <p className="text-[10px] font-display text-primary mt-1 uppercase tracking-widest">{user?.student_profile?.department || 'Student'} Candidate</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] text-[#9db9b9] uppercase leading-tight">Applied on</p>
                                                <p className="text-[10px] font-display">Oct 24, 2024</p>
                                            </div>
                                        </div>
                                        <div className="space-y-6 text-sm">
                                            <div className="space-y-2">
                                                <div className="h-1.5 w-1/3 bg-white/10 rounded"></div>
                                                <div className="h-1.5 w-full bg-white/10 rounded"></div>
                                                <div className="h-1.5 w-full bg-white/10 rounded"></div>
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-white font-bold text-[10px] font-display uppercase tracking-[0.2em] border-b border-white/10 pb-1 italic">Cover Letter Preview</p>
                                                <p className="italic text-white/30 leading-relaxed text-[11px]">Composition in progress... The system will render your formal letter here in real-time as you type in the editor panel.</p>
                                            </div>
                                        </div>
                                        <div className="mt-12 pt-8 border-t border-white/10">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 glass flex items-center justify-center text-primary/40 rounded-lg border border-white/5">
                                                    <span className="material-symbols-outlined text-xl">qr_code_2</span>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] text-[#9db9b9] uppercase">Verification Token</p>
                                                    <p className="text-[10px] font-mono">AIMS-ID-8842-1X</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-3">
                                        <button type="button" onClick={handleSubmit} disabled={submitting} className="w-full bg-primary hover:bg-primary/90 text-background-dark font-black py-4 text-[10px] tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(19,236,236,0.3)] rounded-xl disabled:opacity-50">
                                            {submitting ? 'Submitting...' : 'Submit Application'}
                                        </button>
                                        
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                </div>

                <Footer />
            </main>
        </div>
    );
};

export default InternshipApplication;
