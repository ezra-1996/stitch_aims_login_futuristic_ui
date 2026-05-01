import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="h-8 glass border-t border-white/5 flex items-center justify-center overflow-hidden z-40 bg-background-dark/80">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                AIMS © {new Date().getFullYear()} • Automated Internship Management System
            </span>
        </footer>
    );
};

export default Footer;
