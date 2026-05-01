import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import StudentRegistration from './StudentRegistration';
import CompanyRegistration from './CompanyRegistration';
import UniversityAdminRegistration from './UniversityAdminRegistration';

const Registration: React.FC = () => {
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'student';
    
    return (
        <div className="bg-background-dark min-h-screen relative font-display">
            {/* Top Navigation for switching registration modes */}
            <div className="absolute top-0 left-0 w-full z-50 p-6 flex justify-center">
                <div className="glass p-2 rounded-2xl flex gap-2 border border-white/10 shadow-2xl">
                    <button 
                        onClick={() => window.location.href = '/register?type=student'}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === 'student' ? 'bg-primary text-background-dark shadow-[0_0_15px_rgba(19,236,236,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        Student
                    </button>
                    <button 
                        onClick={() => window.location.href = '/register?type=company'}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === 'company' ? 'bg-violet-400 text-background-dark shadow-[0_0_15px_rgba(167,139,250,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        Company
                    </button>
                    <button 
                        onClick={() => window.location.href = '/register?type=university'}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === 'university' ? 'bg-emerald-400 text-background-dark shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        University
                    </button>
                </div>
            </div>

            {/* Render the appropriate component */}
            <div className="pt-20">
                {type === 'student' && <StudentRegistration />}
                {type === 'company' && <CompanyRegistration />}
                {type === 'university' && <UniversityAdminRegistration />}
            </div>
        </div>
    );
};

export default Registration;
