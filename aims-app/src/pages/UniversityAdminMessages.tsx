import React, { useState } from 'react';

import api from '../services/api';

const UniversityAdminMessages: React.FC = () => {
    const [target, setTarget] = useState<'all' | 'students' | 'supervisors' | 'companies'>('all');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        setError('');
        setSuccess('');

        try {
            // This endpoint needs to be implemented in the backend
            await api.post('/auth/notifications/broadcast/', {
                target,
                title,
                description: message,
                type: 'info'
            });
            setSuccess(`Broadcast message sent to ${target}!`);
            setTitle('');
            setMessage('');
        } catch (err) {
            setError("Failed to send broadcast message.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-dark text-white rounded-2xl overflow-hidden glass border border-white/5 relative p-8">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div>
                            <h1 className="text-3xl font-black uppercase italic underline decoration-primary/30 underline-offset-8">
                                System <span className="text-primary italic">Broadcast</span>
                            </h1>
                            <p className="text-white/40 text-sm mt-3 uppercase tracking-widest font-bold">Send announcements and notifications to system users.</p>
                        </div>

                        {success && <div className="p-4 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded uppercase">{success}</div>}
                        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded uppercase">{error}</div>}

                        <div className="glass p-10 rounded-3xl border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <span className="material-symbols-outlined text-[200px] text-primary">campaign</span>
                            </div>

                            <form onSubmit={handleSendMessage} className="space-y-8 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em]">Recipient Group</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {(['all', 'students', 'supervisors', 'companies'] as const).map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setTarget(t)}
                                                    className={`py-3 px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${target === t ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em]">Subject</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-primary transition-all outline-none"
                                            placeholder="Emergency Update / Welcome Note"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em]">Message Content</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-6 text-sm focus:border-primary transition-all outline-none min-h-[250px] resize-none"
                                        placeholder="Type your announcement here..."
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSending}
                                    className="w-full bg-primary text-background-dark font-black uppercase tracking-[0.3em] py-5 rounded-2xl hover:shadow-[0_0_30px_rgba(19,236,236,0.4)] disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-3"
                                >
                                    {isSending ? 'Transmitting...' : (
                                        <>
                                            <span className="material-symbols-outlined">send</span>
                                            Broadcast Message
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
            </div>
        </div>
    );
};

export default UniversityAdminMessages;
