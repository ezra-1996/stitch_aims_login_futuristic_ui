import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { usersAPI, aiAPI } from '../services/api';

// Types for the user profile data
interface StudentProfile {
    student_id: number;
    university_id: string;
    department: string;
    year: number;
    gpa: number | null;
    created_at: string;
}

interface SupervisorProfile {
    id: number;
    department: string | null;
    job_title: string | null;
    organization_id: number | null;
    organization_name: string | null;
    created_at: string;
}

interface Organization {
    org_id: number;
    org_name: string;
    description: string | null;
    address: string;
    contact_email: string;
    contact_phone: string;
    website: string | null;
    industry: string | null;
    status: string;
}

interface UserProfile {
    id: number;
    username: string;
    email: string;
    full_name: string | null;
    role: string;
    status: string;
    phone_number: string | null;
    date_joined: string;
    latitude: number | null;
    longitude: number | null;
    profile_photo_url: string | null;
    student_profile: StudentProfile | null;
    supervisor_profile: SupervisorProfile | null;
    organization: Organization | null;
}

const UserProfile: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await usersAPI.getCurrentUserProfile();
            setProfile(data);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch profile:', err);
            setError(err.response?.data?.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setUploadError(null);
        try {
            await usersAPI.uploadProfilePhoto(file);
            await fetchProfile();
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (err: any) {
            console.error('Photo upload failed', err);
            setUploadError(err.response?.data?.error || 'Failed to upload photo. Please try again.');
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Helper function to get role display name
    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case 'student': return 'Student';
            case 'supervisor': return 'Supervisor';
            case 'company_admin': return 'Company Admin';
            case 'university_admin': return 'University Admin';
            default: return role;
        }
    };

    // Helper function to get year suffix
    const getYearSuffix = (year: number) => {
        if (year === 1) return '1st';
        if (year === 2) return '2nd';
        if (year === 3) return '3rd';
        return `${year}th`;
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden">
                <Sidebar />
                <main className="flex-1 relative flex flex-col overflow-hidden">
                    <Header />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-primary text-xl animate-pulse">Loading profile...</div>
                    </div>
                    <Footer />
                </main>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden">
                <Sidebar />
                <main className="flex-1 relative flex flex-col overflow-hidden">
                    <Header />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-red-400 text-xl">{error || 'Failed to load profile'}</div>
                    </div>
                    <Footer />
                </main>
            </div>
        );
    }

    const studentProfile = profile.student_profile;
    const supervisorProfile = profile.supervisor_profile;
    const organization = profile.organization;

    return (
        <div className="flex h-screen w-full relative bg-background-dark text-white overflow-hidden">
            <Sidebar />

            <main className="flex-1 relative flex flex-col overflow-hidden">
                <Header />

                {/* Profile Content */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-5xl mx-auto space-y-10">

                        {/* Profile Header Card */}
                        <section className="glass rounded-2xl p-10 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden border border-white/5">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-30"></div>

                            {/* Circular Profile Orb */}
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="absolute -inset-2 bg-primary rounded-full blur-xl opacity-20 group-hover:opacity-40 transition duration-700"></div>
                                <div className="relative size-44 rounded-full glass p-2 border border-primary/30 shadow-[0_0_30px_rgba(19,236,236,0.2)]">
                                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-primary/10 bg-background-dark/80 relative">
                                        {profile.profile_photo_url ? (
                                            <img
                                                className="w-full h-full object-cover hover:brightness-110 transition-all duration-700 scale-105"
                                                src={profile.profile_photo_url}
                                                alt="Profile"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-primary/5 gap-2">
                                                <span className="material-symbols-outlined text-4xl text-primary/40">person</span>
                                                <span className="text-[8px] text-primary/40 uppercase font-bold tracking-widest">No Photo</span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Upload overlay on hover */}
                                    <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-all">
                                        <div className="text-center">
                                            <span className="material-symbols-outlined text-primary text-2xl block">{uploading ? 'sync' : 'photo_camera'}</span>
                                            <span className="text-[8px] text-primary uppercase font-black tracking-widest">{uploading ? 'Uploading...' : 'Change Photo'}</span>
                                        </div>
                                    </div>
                                </div>
                                {uploadSuccess && (
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-background-dark text-[8px] font-black uppercase rounded-full whitespace-nowrap shadow-[0_0_10px_rgba(19,236,236,0.4)]">Photo Updated!</div>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                            </div>

                            {/* Delete Photo Button */}
                            {profile.profile_photo_url && (
                                <button
                                    onClick={async () => {
                                        if (!window.confirm("Are you sure you want to remove your profile photo and biometric data?")) return;
                                        setUploading(true);
                                        try {
                                            await usersAPI.deleteProfilePhoto();
                                            await fetchProfile();
                                            setUploadSuccess(true);
                                            setTimeout(() => setUploadSuccess(false), 3000);
                                        } catch (err: any) {
                                            setUploadError("Failed to delete photo.");
                                        } finally {
                                            setUploading(false);
                                        }
                                    }}
                                    disabled={uploading}
                                    className="absolute top-8 right-8 size-10 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg group/del"
                                    title="Delete Profile Photo"
                                >
                                    <span className="material-symbols-outlined text-lg group-hover/del:scale-110 transition-transform">delete</span>
                                </button>
                            )}

                            {/* Profile Info Summary */}
                            <div className="flex-1 text-center md:text-left space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <h2 className="text-4xl font-black tracking-tight uppercase italic underline decoration-primary/40 decoration-4 underline-offset-8 decoration-solid">
                                        {profile.full_name || profile.username}
                                    </h2>
                                    <span className="px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase font-black tracking-[0.2em] rounded-full self-center md:self-auto shadow-[0_0_10px_rgba(19,236,236,0.2)]">
                                        {getRoleDisplayName(profile.role)}
                                    </span>
                                </div>
                                
                                {/* Dynamic subtitle based on role */}
                                <p className="text-white/50 text-xl font-medium tracking-tight">
                                    {profile.role === 'student' && studentProfile && 
                                        `${studentProfile.department} ${getYearSuffix(studentProfile.year)} Year`}
                                    {profile.role === 'supervisor' && supervisorProfile && 
                                        `${supervisorProfile.job_title || 'Supervisor'} at ${supervisorProfile.organization_name || 'Organization'}`}
                                    {profile.role === 'company_admin' && organization && 
                                        `${organization.org_name}`}
                                    {profile.role === 'university_admin' && 
                                        'University Administrator'}
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                                    {profile.role === 'student' && studentProfile && (
                                        <>
                                            <div className="glass rounded-xl p-4 border border-white/5 border-l-2 border-l-primary/40 text-left">
                                                <p className="text-[9px] text-primary uppercase font-black tracking-[0.2em] mb-1">University ID</p>
                                                <p className="text-sm font-bold tracking-tight font-mono text-white/80">{studentProfile.university_id}</p>
                                            </div>
                                            {studentProfile.gpa && (
                                                <div className="glass rounded-xl p-4 border border-white/5 border-l-2 border-l-primary/40 text-left">
                                                    <p className="text-[9px] text-primary uppercase font-black tracking-[0.2em] mb-1">Current GPA</p>
                                                    <p className="text-sm font-bold tracking-tight text-white/80">{studentProfile.gpa.toFixed(2)} / 4.00</p>
                                                </div>
                                            )}
                                            <div className="glass rounded-xl p-4 border border-white/5 border-l-2 border-l-primary/40 text-left">
                                                <p className="text-[9px] text-primary uppercase font-black tracking-[0.2em] mb-1">Status</p>
                                                <p className="text-sm font-bold tracking-tight text-primary">{profile.status === 'active' ? 'Active' : profile.status}</p>
                                            </div>
                                        </>
                                    )}
                                    {profile.role === 'supervisor' && supervisorProfile && (
                                        <>
                                            <div className="glass rounded-xl p-4 border border-white/5 border-l-2 border-l-primary/40 text-left">
                                                <p className="text-[9px] text-primary uppercase font-black tracking-[0.2em] mb-1">Department</p>
                                                <p className="text-sm font-bold tracking-tight text-white/80">{supervisorProfile.department || 'N/A'}</p>
                                            </div>
                                            <div className="glass rounded-xl p-4 border border-white/5 border-l-2 border-l-primary/40 text-left">
                                                <p className="text-[9px] text-primary uppercase font-black tracking-[0.2em] mb-1">Job Title</p>
                                                <p className="text-sm font-bold tracking-tight text-white/80">{supervisorProfile.job_title || 'N/A'}</p>
                                            </div>
                                            <div className="glass rounded-xl p-4 border border-white/5 border-l-2 border-l-primary/40 text-left">
                                                <p className="text-[9px] text-primary uppercase font-black tracking-[0.2em] mb-1">Organization</p>
                                                <p className="text-sm font-bold tracking-tight text-white/80">{supervisorProfile.organization_name || 'N/A'}</p>
                                            </div>
                                        </>
                                    )}
                                    {profile.role === 'company_admin' && organization && (
                                        <>
                                            <div className="glass rounded-xl p-4 border border-white/5 border-l-2 border-l-primary/40 text-left">
                                                <p className="text-[9px] text-primary uppercase font-black tracking-[0.2em] mb-1">Organization</p>
                                                <p className="text-sm font-bold tracking-tight text-white/80">{organization.org_name}</p>
                                            </div>
                                            <div className="glass rounded-xl p-4 border border-white/5 border-l-2 border-l-primary/40 text-left">
                                                <p className="text-[9px] text-primary uppercase font-black tracking-[0.2em] mb-1">Industry</p>
                                                <p className="text-sm font-bold tracking-tight text-white/80">{organization.industry || 'N/A'}</p>
                                            </div>
                                            <div className="glass rounded-xl p-4 border border-white/5 border-l-2 border-l-primary/40 text-left">
                                                <p className="text-[9px] text-primary uppercase font-black tracking-[0.2em] mb-1">Status</p>
                                                <p className="text-sm font-bold tracking-tight text-primary">{organization.status}</p>
                                            </div>
                                        </>
                                    )}
                                    {profile.role === 'university_admin' && (
                                        <div className="glass rounded-xl p-4 border border-white/5 border-l-2 border-l-primary/40 text-left">
                                            <p className="text-[9px] text-primary uppercase font-black tracking-[0.2em] mb-1">Admin Status</p>
                                            <p className="text-sm font-bold tracking-tight text-primary">{profile.status}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Detailed Tabs Area */}
                        <div className="glass rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                            {/* Tabs Navigation */}
                            <div className="flex border-b border-white/5 bg-white/[0.02]">
                            </div>

                            {/* Tab Form Content */}
                            <div className="p-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
                                    {/* Vertical Divider */}
                                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent -translate-x-1/2"></div>

                                    {/* Personal Section */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="size-2 bg-primary rounded-full shadow-[0_0_8px_#13ecec]"></div>
                                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary/80">Personal Information</h3>
                                        </div>

                                        <div className="space-y-6">
                                            {[
                                                { label: 'Full Legal Name', val: profile.full_name || 'N/A', icon: 'edit' },
                                                { label: 'Email Address', val: profile.email, icon: 'alternate_email', type: 'email' },
                                                { label: 'Phone Number', val: profile.phone_number || 'Not provided', icon: 'phone' },
                                            ].map(field => (
                                                <div key={field.label} className="space-y-2">
                                                    <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">{field.label}</label>
                                                    <div className="relative group/field">
                                                        <input
                                                            className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl py-4 px-6 text-sm transition-all duration-300 outline-none text-white/80"
                                                            type={field.type || 'text'}
                                                            defaultValue={field.val}
                                                            readOnly
                                                        />
                                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/10 text-lg group-hover/field:text-primary transition-colors cursor-pointer">{field.icon}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Professional Section */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="size-2 bg-primary rounded-full shadow-[0_0_8px_#13ecec]"></div>
                                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary/80">Professional Details</h3>
                                        </div>

                                        <div className="space-y-6">
                                            {profile.role === 'student' && studentProfile && [
                                                { label: 'University ID', val: studentProfile.university_id, icon: 'school' },
                                                { label: 'Department', val: studentProfile.department, icon: 'business' },
                                                { label: 'Year', val: `${getYearSuffix(studentProfile.year)} Year`, icon: 'calendar_today' },
                                            ].map(field => (
                                                <div key={field.label} className="space-y-2">
                                                    <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">{field.label}</label>
                                                    <div className="relative group/field">
                                                        <input
                                                            className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl py-4 px-6 text-sm transition-all duration-300 outline-none text-white/80"
                                                            type="text"
                                                            defaultValue={field.val}
                                                            readOnly
                                                        />
                                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/10 text-lg group-hover/field:text-primary transition-colors cursor-pointer">{field.icon}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {profile.role === 'supervisor' && supervisorProfile && [
                                                { label: 'Department', val: supervisorProfile.department || 'N/A', icon: 'business' },
                                                { label: 'Job Title', val: supervisorProfile.job_title || 'N/A', icon: 'work' },
                                                { label: 'Organization', val: supervisorProfile.organization_name || 'N/A', icon: 'corporate_fare' },
                                            ].map(field => (
                                                <div key={field.label} className="space-y-2">
                                                    <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">{field.label}</label>
                                                    <div className="relative group/field">
                                                        <input
                                                            className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl py-4 px-6 text-sm transition-all duration-300 outline-none text-white/80"
                                                            type="text"
                                                            defaultValue={field.val}
                                                            readOnly
                                                        />
                                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/10 text-lg group-hover/field:text-primary transition-colors cursor-pointer">{field.icon}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {profile.role === 'company_admin' && organization && [
                                                { label: 'Organization Name', val: organization.org_name, icon: 'corporate_fare' },
                                                { label: 'Industry', val: organization.industry || 'N/A', icon: 'business' },
                                                { label: 'Website', val: organization.website || 'N/A', icon: 'language' },
                                            ].map(field => (
                                                <div key={field.label} className="space-y-2">
                                                    <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">{field.label}</label>
                                                    <div className="relative group/field">
                                                        <input
                                                            className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl py-4 px-6 text-sm transition-all duration-300 outline-none text-white/80"
                                                            type="text"
                                                            defaultValue={field.val}
                                                            readOnly
                                                        />
                                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/10 text-lg group-hover/field:text-primary transition-colors cursor-pointer">{field.icon}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {profile.role === 'university_admin' && [
                                                { label: 'Role', val: 'University Administrator', icon: 'admin_panel_settings' },
                                                { label: 'Status', val: profile.status, icon: 'verified_user' },
                                            ].map(field => (
                                                <div key={field.label} className="space-y-2">
                                                    <label className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-1">{field.label}</label>
                                                    <div className="relative group/field">
                                                        <input
                                                            className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl py-4 px-6 text-sm transition-all duration-300 outline-none text-white/80"
                                                            type="text"
                                                            defaultValue={field.val}
                                                            readOnly
                                                        />
                                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/10 text-lg group-hover/field:text-primary transition-colors cursor-pointer">{field.icon}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Actions */}
                                <div className="mt-16 pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">Profile Last Updated: {new Date(profile.date_joined).toLocaleDateString()}</p>
                                    <div className="flex gap-4">
                                        <Link 
                                            to="/change-password"
                                            className="px-6 py-2.5 bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase font-black tracking-[0.2em] rounded-lg hover:bg-primary hover:text-background-dark transition-all flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">lock_reset</span>
                                            Change Password
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Biometric Identity Section - Only for Students */}
                        {profile.role === 'student' && (
                            <section className="glass rounded-2xl p-10 space-y-8 border border-white/5 relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-4">
                                            <div className="size-2 bg-primary rounded-full shadow-[0_0_8px_#13ecec]"></div>
                                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary/80">Biometric Identity Management</h3>
                                        </div>
                                        <p className="text-white/40 text-xs">Manage your neural-linked face recognition data for automated attendance.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary/40 animate-pulse">security</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Quantum Secure</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="glass bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined">face_retouching_natural</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Enrollment Status</p>
                                                <p className="text-sm font-bold text-white/90">
                                                    {profile.profile_photo_url ? 'Active & Synchronized' : 'Not Initialized'}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-white/40 leading-relaxed">
                                            Your biometric signature is used to verify your identity during attendance check-ins. Keep this updated for best accuracy.
                                        </p>
                                    </div>

                                    <div className="flex flex-col justify-center gap-4">
                                        <Link 
                                            to="/enroll-face?update=true"
                                            className="w-full py-4 rounded-xl bg-primary text-background-dark font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:shadow-[0_0_20px_#13ecec66] transition-all"
                                        >
                                            <span className="material-symbols-outlined">add_a_photo</span>
                                            {profile.profile_photo_url ? 'Update Neural Scan' : 'Initialize Enrollment'}
                                        </Link>
                                        
                                        {profile.profile_photo_url && (
                                            <button 
                                                onClick={async () => {
                                                    if (!window.confirm("WARNING: This will permanently delete your biometric signature. You will not be able to mark attendance until you re-enroll. Continue?")) return;
                                                    setUploading(true);
                                                    try {
                                                        const studentId = profile.student_profile?.university_id;
                                                        if (studentId) {
                                                            await aiAPI.deleteFaceEnrollment(studentId);
                                                            await usersAPI.deleteProfilePhoto();
                                                            localStorage.removeItem('student_face_id');
                                                            await fetchProfile();
                                                            alert("Biometric data cleared successfully.");
                                                        }
                                                    } catch (err: any) {
                                                        console.error("Failed to delete biometric data", err);
                                                        setUploadError("Failed to clear biometric data.");
                                                    } finally {
                                                        setUploading(false);
                                                    }
                                                }}
                                                disabled={uploading}
                                                className="w-full py-4 rounded-xl glass border border-red-500/30 text-red-400 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all"
                                            >
                                                <span className="material-symbols-outlined">delete_forever</span>
                                                Clear Biometric Signature
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Quick Stats Widgets - Only for students */}
                        {profile.role === 'student' && studentProfile && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {[
                                    { label: 'Applications Sent', val: '0', icon: 'send' },
                                    { label: 'Year of Study', val: getYearSuffix(studentProfile.year), icon: 'school' },
                                    { label: 'GPA', val: studentProfile.gpa ? `${studentProfile.gpa.toFixed(2)}` : 'N/A', icon: 'assignment_turned_in' },
                                ].map((stat, i) => (
                                    <div key={i} className="glass p-6 rounded-2xl flex items-center gap-5 border border-white/5 hover:border-primary/30 transition-all group cursor-pointer group shadow-lg">
                                        <div className="size-14 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                                            <span className="material-symbols-outlined text-2xl group-hover:drop-shadow-[0_0_5px_#13ecec]">{stat.icon}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-3xl font-black italic tracking-tighter">{stat.val}</p>
                                            <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.2em]">{stat.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <Footer />
            </main>
        </div>
    );
};

export default UserProfile;
