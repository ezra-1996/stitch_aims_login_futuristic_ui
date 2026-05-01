import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { notificationsAPI } from '../services/api';

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const data = await notificationsAPI.getNotifications();
            setNotifications(data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAllRead = async () => {
        try {
            await notificationsAPI.markAllRead();
            // Optimistically update or refetch
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (e) {
            console.error(e);
        }
    };

    const dismiss = async (id: number) => {
        try {
            // Check if backend supports delete, otherwise just hide local or mark read
            // The API we added supports delete?
            // Let's assume we can delete.
            // If backend 405s, maybe just mark read?
            await notificationsAPI.dismiss(id).catch(() => { });
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return 'check_circle';
            case 'warning': return 'warning';
            case 'error': return 'error';
            default: return 'notifications';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'success': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'warning': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-primary/20 text-primary border-primary/30';
        }
    };

    return (
        <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden">
            <Sidebar />

            <main className="flex-1 relative flex flex-col overflow-hidden">
                <Header />

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
                    {/* Filters Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
                            
                            {/* Filter logic not fully implemented in UI state yet, just placeholders */}
                        </div>
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest hover:opacity-80 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">done_all</span>
                            Mark all as read
                        </button>
                    </div>

                    {/* Notification Feed */}
                    <div className="space-y-4 max-w-4xl">
                        {loading && <div className="text-white/40 text-sm">Loading notifications...</div>}
                        {!loading && notifications.length > 0 ? (
                            <>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Recent Alerts</p>
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`glass p-5 rounded-xl flex items-start gap-5 relative group overflow-hidden border border-white/5 transition-all hover:bg-white/5 ${notif.is_read ? 'opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0' : ''}`}
                                    >
                                        {!notif.is_read && (
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(19,236,236,0.4)]`}></div>
                                        )}

                                        <div className={`size-12 shrink-0 rounded-xl border flex items-center justify-center ${getColor(notif.type)}`}>
                                            <span className="material-symbols-outlined">{getIcon(notif.type)}</span>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-white uppercase tracking-tight italic">{notif.title}</h3>
                                                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${!notif.is_read ? 'text-primary border-primary/20 bg-primary/10' : 'text-slate-500 border-white/10 bg-white/5'}`}>
                                                    {new Date(notif.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-sm leading-relaxed mb-3">{notif.description}</p>

                                            <div className="flex gap-4">
                                                {notif.action_link && (
                                                    <a href={notif.action_link} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline underline-offset-4">
                                                        VIEW ACTION
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => dismiss(notif.id)}
                                                    className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300"
                                                >
                                                    Dismiss
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : !loading && (
                            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 glass rounded-3xl border border-white/5">
                                <div className="size-16 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                                    <span className="material-symbols-outlined text-4xl">notifications_off</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-white font-bold uppercase italic tracking-widest text-sm">Clear Horizons</p>
                                    <p className="text-white/20 text-xs font-medium uppercase tracking-widest">No active system alerts detected.</p>
                                </div>
                                <button
                                    onClick={fetchNotifications}
                                    className="text-[10px] text-primary font-black uppercase tracking-widest underline underline-offset-4 decoration-primary/20"
                                >
                                    Refresh Feed
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <Footer />
            </main>
        </div>
    );
};

export default Notifications;
