import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Sidebar: React.FC = () => {
    const location = useLocation();
    const { user, profilePhotoUrl } = useUser();
    const [isOpen, setIsOpen] = useState(false);

    const getNavItems = () => {
        switch (user?.role) {
            case 'university_admin':
                return [
                    { name: 'DASHBOARD', icon: 'dashboard', path: '/university-dashboard' },
                    { name: 'SYSTEM USERS', icon: 'admin_panel_settings', path: '/admin/users' },
                    { name: 'SETTINGS', icon: 'settings', path: '/settings' },
                    { name: 'HELP', icon: 'help', path: '/support' },
                ];
            case 'company_admin':
                return [
                    { name: 'DASHBOARD', icon: 'dashboard', path: '/company-dashboard' },
                    { name: 'REGISTER SUPERVISOR', icon: 'person_add', path: '/admin/users?tab=supervisor' },
                    { name: 'MESSAGES', icon: 'forum', path: '/notifications' },
                    { name: 'HELP', icon: 'help', path: '/support' },
                ];
            case 'supervisor':
                return [
                    { name: 'DASHBOARD', icon: 'dashboard', path: '/supervisor-dashboard' },
                    { name: 'ATTENDANCE', icon: 'how_to_reg', path: '/supervisor/attendance' },
                    { name: 'TASKS', icon: 'task', path: '/supervisor/tasks' },
                    { name: 'REPORTS', icon: 'history_edu', path: '/report-history' },
                    { name: 'EVALUATIONS', icon: 'analytics', path: '/evaluation-results' },
                    { name: 'MESSAGES', icon: 'forum', path: '/notifications' },
                    { name: 'HELP', icon: 'help', path: '/support' },
                ];
            default: // student
                return [
                    { name: 'DASHBOARD', icon: 'dashboard', path: '/student-dashboard' },
                    { name: 'INTERNSHIPS', icon: 'business_center', path: '/browse-internships' },
                    { name: 'MY APPLICATIONS', icon: 'contract', path: '/my-applications' },
                    { name: 'ATTENDANCE', icon: 'calendar_today', path: '/attendance' },
                    { name: 'TASKS & REPORTS', icon: 'edit_document', path: '/submit-report' },
                    { name: 'HELP', icon: 'help', path: '/support' },
                ];
        }
    };

    const navItems = getNavItems();

    return (
        <>
            {/* Mobile Hamburger Button */}
            <button 
                className="lg:hidden absolute top-5 left-5 z-[45] text-primary glass p-2 rounded-lg hover:bg-primary/10 transition-colors"
                onClick={() => setIsOpen(true)}
            >
                <span className="material-symbols-outlined">menu</span>
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black/60 z-[65] backdrop-blur-sm" 
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static top-0 left-0 h-full w-64 glass border-r border-primary/20 flex flex-col items-center py-8 z-[70] transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <button 
                    className="lg:hidden absolute top-6 right-6 text-white/50 hover:text-white glass p-1 rounded" 
                    onClick={() => setIsOpen(false)}
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="mb-12 flex items-center gap-3 px-6 w-full justify-center">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/40 shadow-[0_0_15px_rgba(19,236,236,0.2)]">
                        <span className="material-symbols-outlined text-primary neon-text font-bold">deployed_code</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-widest text-primary neon-text italic">AIMS</h1>
                        <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-primary/60">Jimma University</p>
                    </div>
                </div>

                <nav className="flex-1 w-full space-y-3 px-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={`relative group cursor-pointer flex items-center gap-4 py-3.5 px-4 transition-all rounded-xl border border-transparent ${location.pathname === item.path
                                ? 'glass bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(19,236,236,0.1)]'
                                : 'hover:bg-white/5 hover:border-white/5'
                                }`}
                        >
                            {location.pathname === item.path && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-primary rounded-r-full shadow-[0_0_10px_#13ecec]"></div>
                            )}
                            <span className={`material-symbols-outlined text-xl transition-all duration-300 ${location.pathname === item.path ? 'text-primary' : 'text-primary/40 group-hover:text-primary'
                                }`}>
                                {item.icon}
                            </span>
                            <span className={`text-[10px] font-black tracking-[0.2em] transition-all duration-300 ${location.pathname === item.path ? 'text-white' : 'text-white/40 group-hover:text-white'
                                } uppercase`}>
                                {item.name}
                            </span>
                        </Link>
                    ))}
                </nav>

                <div className="mt-auto w-full px-4 pt-6 border-t border-white/5">
                    <Link to="/profile" className="glass p-3 rounded-xl border border-white/5 hover:border-primary/30 transition-all flex items-center gap-4 group">
                        <div
                            className="size-10 rounded-full bg-cover border border-primary/40 shadow-[0_0_10px_rgba(19,236,236,0.2)] group-hover:scale-110 transition-transform overflow-hidden flex items-center justify-center bg-primary/10 shrink-0"
                        >
                            {profilePhotoUrl ? (
                                <img src={profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-primary/70 text-lg">person</span>
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-black truncate uppercase text-white group-hover:text-primary transition-colors">{user?.full_name || user?.name || user?.username || 'GUEST USER'}</p>
                            <p className="text-[9px] text-primary/60 uppercase font-black tracking-widest leading-tight truncate">{user?.role?.replace(/_/g, ' ') || 'RESTRICTED'}</p>
                        </div>
                    </Link>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
