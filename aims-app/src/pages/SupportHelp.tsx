import React from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SupportHelp: React.FC = () => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const faqs = [
        { q: 'How do I submit my weekly logbook?', a: "Navigate to the 'Internships' tab, select your current placement, and click on 'Weekly Logs'. You can upload documents or type directly into the editor provided. All uploads are end-to-end encrypted." },
        { q: "What if my supervisor doesn't approve my hours?", a: "If your hours are pending for more than 5 business days, use the 'Nudge Neural Link' button. If they are rejected, check the metadata comments for requested changes." },
        { q: 'Can I change my internship company mid-semester?', a: 'Mid-semester transfers require executive authorization. You must submit a formal hardship request via the Internal Reports section for departmental review.' },
    ];

    const filteredFaqs = faqs.filter(faq =>
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden font-display">
            <Sidebar />

            <main className="flex-1 relative flex flex-col overflow-hidden">
                <Header />

                {/* Main Content Area */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col items-center">
                    <div className="max-w-6xl w-full py-10 space-y-20 relative z-10">

                        {/* Hero Section */}
                        <section className="text-center space-y-10 max-w-3xl mx-auto">
                            <div className="space-y-4">
                                <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
                                    How can we <span className="text-primary underline decoration-white/10 underline-offset-8">Support</span> you today?
                                </h1>
                                <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em] italic">Access the AIMS Knowledge Neural Network</p>
                            </div>

                            <div className="relative group max-w-2xl mx-auto">
                                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 text-2xl font-black">search</span>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-6 text-sm font-medium focus:ring-1 focus:ring-primary focus:border-primary/40 backdrop-blur-md transition-all outline-none placeholder:text-white/10 italic"
                                    placeholder="SEARCH FAQS, SYSTEM PROTOCOLS, OR VIDEO MODULES..."
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] text-white/20 font-black uppercase tracking-widest hidden sm:block">
                                    PROTOCOL: SEARCH_KNOWLEDGE
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-3">
                                <span className="text-[10px] text-white/20 font-black uppercase tracking-widest self-center italic mr-2">Frequently Queried:</span>
                            </div>
                        </section>

                        {/* Category Tiles Grid */}
                        <section className="grid md:grid-cols-3 gap-8">
                            {[
                                { title: 'COMPREHENSIVE FAQS', icon: 'quiz', desc: 'Find quick answers to common questions about placement, grading, and portal access.', color: 'primary' },
                                { title: 'VIDEO TUTORIALS', icon: 'play_circle', desc: 'Step-by-step visual walkthroughs of the AIMS platform for all user roles.', color: 'primary' },
                                { title: 'SYSTEM GUIDES', icon: 'menu_book', desc: 'Detailed PDF documentation and user manuals for students, companies, and supervisors.', color: 'primary' },
                            ].map(card => (
                                <div key={card.title} className="glass group p-10 rounded-3xl flex flex-col gap-6 cursor-pointer border border-white/5 hover:border-primary/40 transition-all duration-500 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                                        <span className="material-symbols-outlined text-8xl text-primary">{card.icon}</span>
                                    </div>
                                    <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(19,236,236,0.1)]">
                                        <span className="material-symbols-outlined text-3xl font-black">{card.icon}</span>
                                    </div>
                                    <h3 className="text-xl font-black italic tracking-tighter text-white uppercase">{card.title}</h3>
                                    <p className="text-white/40 text-xs leading-relaxed font-medium italic">{card.desc}</p>
                                    <div className="mt-auto pt-6 flex items-center text-primary text-[10px] font-black uppercase tracking-widest group-hover:gap-3 transition-all italic">
                                        Access Module <span className="material-symbols-outlined text-sm font-black ml-2">arrow_forward</span>
                                    </div>
                                </div>
                            ))}
                        </section>

                        {/* Video Tutorials & FAQ */}
                        <div className="grid lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-8 space-y-16">
                                {/* Featured Videos */}
                                <section className="space-y-8">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3 italic underline decoration-primary/20 underline-offset-4">
                                        <span className="material-symbols-outlined text-base">video_library</span>
                                        Featured Tactical Modules
                                    </h3>
                                    <div className="grid sm:grid-cols-2 gap-8">
                                        {[
                                            { title: 'GETTING STARTED WITH AIMS', dur: '4:25', user: 'ALL USERS', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC23MMu6wy0ZhnUmu1zvbP_9jYSQJOw0itqNdx_crX4wU_DFTRNFUdK9rJVTppNF9uXzvWoADM3b1wL5_yB-9NoTNsBEV6v3em_v0MRg7UuBFv_emD4vBAyvkuO6guxxLl_blSFpNu8ZJV5l-DcOzCpOZ7j55WEMmupDo_I6glJUszzdJQEucb8pb5lFOaZg3TU7h-FkeT9-7r78_5AYkn5MOx5jlvknPgyZZm7Hpw15Si7dvEfBXWfRb-A9R8YGPdq1xHHiBrXDgA' },
                                            { title: 'COMPANY MATCHING PROTOCOL', dur: '6:12', user: 'STUDENTS', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIVkkBUYMu4rjP7JJy6PzVwwDICmoP2TOtHPDiDj1qZioDRNGqCmQA6Iw96rf_DMEnmE8FdLSl_EBUpzERx4CvYZngCYp86NXnI6WiW5e1bdP8OyKsmyKrn3mAo0OfWBfAIkzcAr9lAtaXYOCYI0bHv3jE9by7-n39ZNXm2fyYUU8YfwtcLW3DKiTitS_c8IeaahIyXPhjvd00HmFtWWQljNOaeaUqNtrSbYbAea2mKNHxo5s-eJHEq4SS09PYodr4_ykxxO0mSdE' },
                                        ].map(vid => (
                                            <div key={vid.title} className="group space-y-4">
                                                <div className="aspect-video relative rounded-3xl overflow-hidden glass border border-white/5 flex items-center justify-center">
                                                    <img className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-60 transition-all duration-700" src={vid.img} alt={vid.title} />
                                                    <div className="bg-primary size-12 rounded-full flex items-center justify-center text-background-dark cursor-pointer group-hover:scale-125 transition-all z-10 shadow-[0_0_20px_rgba(19,236,236,0.4)]">
                                                        <span className="material-symbols-outlined text-2xl font-black">play_arrow</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1 px-2">
                                                    <h4 className="text-sm font-black text-white italic tracking-tighter group-hover:text-primary transition-colors">{vid.title}</h4>
                                                    <p className="text-[9px] text-white/20 font-black uppercase tracking-widest italic leading-none">Duration: {vid.dur} Zulu • Access: {vid.user}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* FAQ Accordion */}
                                <section className="space-y-8">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary italic underline decoration-primary/20 underline-offset-4">Frequent Operational Queries</h3>
                                    <div className="space-y-4">
                                        {filteredFaqs.length > 0 ? filteredFaqs.map(faq => (
                                            <details key={faq.q} className="glass rounded-2xl group border border-white/5">
                                                <summary className="p-6 cursor-pointer list-none flex justify-between items-center font-black italic tracking-tighter text-white text-sm uppercase">
                                                    {faq.q}
                                                    <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-primary">expand_more</span>
                                                </summary>
                                                <div className="px-6 pb-6 text-white/40 text-xs leading-relaxed font-medium italic border-t border-white/5 pt-4">
                                                    {faq.a}
                                                </div>
                                            </details>
                                        )) : (
                                            <div className="p-10 text-center glass rounded-2xl border border-white/5">
                                                <p className="text-white/20 text-xs font-black uppercase tracking-widest italic">No data-nodes found for "{searchQuery}"</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* Sidebar Info */}
                            <aside className="lg:col-span-4 space-y-10">

                                <div className="bg-gradient-to-br from-primary/30 to-background-dark p-10 rounded-3xl border border-primary/20 relative overflow-hidden group">
                                    <div className="relative z-10 space-y-6">
                                        <div className="space-y-2">
                                            <h4 className="text-2xl font-black italic text-white tracking-tighter underline underline-offset-4 decoration-white/10">STILL STUCK?</h4>
                                            <p className="text-[11px] text-white/60 font-medium italic leading-relaxed">Our AI-assisted neural chat is available 24/7 to navigate your internship journey clusters.</p>
                                        </div>
                                        
                                    </div>
                                    <span className="material-symbols-outlined absolute -right-8 -bottom-8 text-[180px] text-primary/10 select-none group-hover:rotate-12 transition-transform duration-1000">chat</span>
                                </div>

                                <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic">SEND FEEDBACK</h4>
                                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Feedback Protocol Initiated."); }}>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest pl-1">Subject Vector</label>
                                            <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-primary/50 outline-none" placeholder="e.g. System Latency" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest pl-1">Message Payload</label>
                                            <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-primary/50 outline-none h-24 resize-none" placeholder="Describe anomaly..."></textarea>
                                        </div>
                                        <button type="submit" className="w-full py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-background-dark transition-all">
                                            Transmit Feedback
                                        </button>
                                    </form>
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

export default SupportHelp;
