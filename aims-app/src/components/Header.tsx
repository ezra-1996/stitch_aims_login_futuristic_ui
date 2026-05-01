import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
    const { user, profilePhotoUrl, logout } = useUser();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const dateString = currentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    const timeString = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    return (
        <header className="h-20 flex items-center justify-between pl-16 pr-6 lg:px-10 border-b border-primary/10 glass z-40">
            <div>
                <h2 className="text-2xl font-bold tracking-tight neon-text uppercase">
                    {user?.role ? `${user.role.replace(/_/g, ' ')}_PORTAL` : 'AIMS_PORTAL'}<span className="text-primary animate-pulse ml-2">_</span>
                </h2>
                <p className="text-[10px] text-primary/40 uppercase tracking-widest leading-none mt-1">
                    {dateString} | {timeString}
                </p>
            </div>
            <div className="flex items-center gap-6">

                <button 
                    onClick={toggleTheme}
                    className="relative glass p-2.5 rounded-xl border border-white/5 hover:border-primary/40 transition-all group hidden sm:block"
                    title="Toggle Theme"
                >
                    <span className="material-symbols-outlined text-white/40 group-hover:text-primary transition-colors">
                        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>

                <Link to="/notifications" className="relative glass p-2.5 rounded-xl border border-white/5 hover:border-primary/40 transition-all group">
                    <span className="material-symbols-outlined text-white/40 group-hover:text-primary transition-colors">notifications</span>
                    <span className="absolute top-0 right-0 size-2 bg-primary rounded-full shadow-[0_0_8px_#13ecec]"></span>
                </Link>

                <Link to="/profile" className="flex items-center gap-3 glass p-1.5 pr-4 rounded-xl border border-white/5 hover:border-primary/20 transition-all group">
                    <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 overflow-hidden">
                        {profilePhotoUrl ? (
                            <img
                                src={profilePhotoUrl}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                alt="Profile"
                            />
                        ) : (
                            <span className="material-symbols-outlined text-primary/70 text-sm">person</span>
                        )}
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-[10px] font-black uppercase text-white leading-none">{(user?.full_name || user?.name || user?.username || 'SESSION_01').split(' ')[0]}</p>
                        <p className="text-[8px] text-primary/60 font-black uppercase tracking-widest mt-1">ONLINE</p>
                    </div>
                </Link>

                <div className="h-8 w-px bg-white/5 mx-2"></div>

                <button
                    onClick={handleLogout}
                    className="glass p-2.5 rounded-xl border border-red-500/20 hover:border-red-500/60 transition-all group hover:bg-red-500/10"
                    title="TERMINATE SESSION"
                >
                    <span className="material-symbols-outlined text-red-500/40 group-hover:text-red-500 transition-colors">logout</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
