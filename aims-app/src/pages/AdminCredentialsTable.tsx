import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';

const AdminCredentialsTable: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeUserCreds, setActiveUserCreds] = useState<{username: string, password: string} | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        try {
            const data = await usersAPI.getUsers();
            setUsers(data);
        } catch (err) {
            setError("Failed to load user credentials registry.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleResetPassword = async (userId: number, sendEmail: boolean = false) => {
        try {
            const result = await usersAPI.demoResetPassword(userId, sendEmail);
            setActiveUserCreds({
                username: result.username,
                password: result.new_password
            });
            if (sendEmail) {
                alert(result.message || "Credentials emailed successfully!");
            }
        } catch (err: any) {
            alert(err.response?.data?.error || "Security Override Failed: Could not reset authentication key.");
        }
    };

    const filteredUsers = users.filter(u => 
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-background-dark text-white rounded-2xl overflow-hidden glass border border-white/5 relative p-8">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black uppercase italic underline decoration-primary/30 underline-offset-8">
                                Authentication <span className="text-primary italic">Vault</span>
                            </h1>
                            <p className="text-white/40 text-[10px] mt-3 uppercase tracking-[0.3em] font-black">Secure credential registry for in-person administrative distribution.</p>
                        </div>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40 text-sm group-focus-within:text-primary transition-colors">search</span>
                            <input 
                                type="text" 
                                placeholder="FILTER BY IDENTITY..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-[10px] font-black tracking-widest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all w-64"
                            />
                        </div>
                    </div>

                    {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black rounded uppercase tracking-widest">{error}</div>}

                    {activeUserCreds && (
                        <div className="glass p-8 rounded-2xl border border-primary/40 bg-primary/5 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl text-primary material-symbols-outlined animate-pulse">security</div>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                <div>
                                    <h4 className="text-xs font-black text-primary uppercase tracking-[0.4em] mb-4">Generated Access Credentials</h4>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mb-1">Username Protocol</p>
                                            <p className="text-2xl font-black text-white font-mono tracking-tighter">{activeUserCreds.username}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mb-1">Temporary Encryption Key</p>
                                            <p className="text-2xl font-black text-primary font-mono tracking-tighter">{activeUserCreds.password}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => window.print()}
                                        className="px-6 py-3 bg-primary text-background-dark rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-[0_0_20px_rgba(19,236,236,0.4)] transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">print</span>
                                        Print Token
                                    </button>
                                    <button 
                                        onClick={() => setActiveUserCreds(null)}
                                        className="px-6 py-3 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        Close Vault
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
                                    <th className="px-6 py-5">Full Identity</th>
                                    <th className="px-6 py-5">System Username</th>
                                    <th className="px-6 py-5">Role Designation</th>
                                    <th className="px-6 py-5">Account Status</th>
                                    <th className="px-6 py-5 text-right">Administrative Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-white/20 uppercase font-black tracking-widest text-xs italic">
                                            No matches found in authentication registry.
                                        </td>
                                    </tr>
                                ) : filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-primary text-xs uppercase italic group-hover:border-primary/30 transition-all">
                                                    {(u.full_name || u.username).substring(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-white uppercase tracking-tight">{u.full_name || 'N/A'}</p>
                                                    <p className="text-[9px] text-white/30 font-bold tracking-widest">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-mono text-[11px] text-primary/80 group-hover:text-primary transition-colors">{u.username}</td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                                u.role === 'student' ? 'border-orange-500/30 text-orange-500 bg-orange-500/5' :
                                                u.role === 'supervisor' ? 'border-violet-400/30 text-violet-400 bg-violet-400/5' :
                                                'border-primary/30 text-primary bg-primary/5'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className={`size-1.5 rounded-full ${u.status === 'active' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-white/20'}`}></div>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${u.status === 'active' ? 'text-green-500' : 'text-white/20'}`}>{u.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {(() => {
                                                let localCred = null;
                                                try {
                                                    const savedCreds = JSON.parse(localStorage.getItem('recent_credentials') || '{}');
                                                    localCred = savedCreds[u.username];
                                                } catch (e) {}

                                                if (localCred) {
                                                    return (
                                                        <div className="flex items-center justify-end gap-3">
                                                            <div className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded font-mono text-primary text-[10px] font-bold">
                                                                {localCred}
                                                            </div>
                                                            <button 
                                                                onClick={() => setActiveUserCreds({ username: u.username, password: localCred })}
                                                                className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary hover:bg-primary hover:text-background-dark rounded text-[9px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(19,236,236,0.1)]"
                                                            >
                                                                Print Token
                                                            </button>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleResetPassword(u.id, false)}
                                                            className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-background-dark rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(19,236,236,0.1)]"
                                                        >
                                                            <span className="material-symbols-outlined text-xs">key</span>
                                                            Reset & Show
                                                        </button>
                                                        <button 
                                                            onClick={() => handleResetPassword(u.id, true)}
                                                            className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                                                        >
                                                            <span className="material-symbols-outlined text-xs">mail</span>
                                                            Reset & Email
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCredentialsTable;
