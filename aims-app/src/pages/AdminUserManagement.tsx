import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import LocationInput from '../components/LocationInput';
import { useUser } from '../context/UserContext';

interface UserFormData {
    username: string;
    email: string;
    full_name: string;
    phone_number: string;
    role: 'student' | 'supervisor' | 'company_admin' | 'university_admin';
    // Student specific
    university_id?: string;
    department?: string;
    year?: number;
    // Supervisor specific
    organization?: string;
    job_title?: string;
    // Company specific
    org_name?: string;
    org_type?: string;
    org_description?: string;
    industry?: string;
    website?: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
}

function generateSecurePassword(): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%';
    const all = upper + lower + digits + special;
    let pwd = [
        upper[Math.floor(Math.random() * upper.length)],
        lower[Math.floor(Math.random() * lower.length)],
        digits[Math.floor(Math.random() * digits.length)],
        special[Math.floor(Math.random() * special.length)],
    ];
    for (let i = 4; i < 12; i++) pwd.push(all[Math.floor(Math.random() * all.length)]);
    return pwd.sort(() => Math.random() - 0.5).join('');
}

const AdminUserManagement: React.FC = () => {
    const { user } = useUser();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'student' | 'company' | 'supervisor'>('student');
    const [organizations, setOrganizations] = useState<any[]>([]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        const orgId = searchParams.get('orgId');

        if (tab === 'student' || tab === 'company' || (tab === 'supervisor' && user?.role === 'company_admin')) {
            setActiveTab(tab);
            setFormData(prev => ({
                ...prev,
                role: tab === 'student' ? 'student' : tab === 'company' ? 'company_admin' : 'supervisor',
                organization: orgId || prev.organization
            }));
        } else if (user?.role === 'company_admin') {
            // Company admins can only register supervisors, auto-switch
            setActiveTab('supervisor');
            setFormData(prev => ({ ...prev, role: 'supervisor' }));
        } else if (user?.role === 'university_admin' && tab === 'supervisor') {
            // Uni admins cannot register supervisors, default to student
            setActiveTab('student');
            setFormData(prev => ({ ...prev, role: 'student' }));
        }

        // Fetch organizations for supervisor registration
        import('../services/api').then(({ organizationsAPI }) => {
            organizationsAPI.getOrganizations().then(orgs => {
                setOrganizations(orgs);
                if (user?.role === 'company_admin' && orgs.length > 0 && !orgId) {
                    const myOrg = orgs.find((o: any) => o.created_by === user.id);
                    if (myOrg) {
                        setFormData(prev => ({
                            ...prev,
                            organization: myOrg.org_id.toString()
                        }));
                    }
                }
            }).catch(console.error);
        });
    }, [searchParams, user]);

    const [formData, setFormData] = useState<UserFormData>({
        username: '',
        email: '',
        full_name: '',
        phone_number: '',
        role: 'student',
        university_id: '',
        department: '',
        year: 1,
        organization: '',
        job_title: '',
        org_name: '',
        org_type: 'Private limited Company (PLC)',
        org_description: '',
        industry: '',
        website: '',
        address: '',
        latitude: null,
        longitude: null
    });
    const [generatedCredentials, setGeneratedCredentials] = useState<{username: string; password: string} | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [faceImage, setFaceImage] = useState<string | null>(null);

    const getCurrentLocation = () => {
        setIsGettingLocation(true);
        setError('');

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setIsGettingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }));
                setIsGettingLocation(false);
            },
            (err) => {
                setError(`Location error: ${err.message}`);
                setIsGettingLocation(false);
            }
        );
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleTabChange = (tab: 'student' | 'company' | 'supervisor') => {
        if (tab === 'supervisor' && user?.role !== 'company_admin') return;
        
        setActiveTab(tab);
        setFormData({
            ...formData,
            role: tab === 'student' ? 'student' : tab === 'company' ? 'company_admin' : 'supervisor'
        });
        setError('');
        setSuccess('');
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFaceImage(reader.result as string);
            setError('');
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setGeneratedCredentials(null);

        // Auto-generate a secure password
        const autoPassword = generateSecurePassword();

        setIsSubmitting(true);

        try {
            if (activeTab === 'student') {
                const response = await authAPI.registerStudent({
                    username: formData.username,
                    email: formData.email,
                    password: autoPassword,
                    password2: autoPassword,
                    full_name: formData.full_name,
                    phone_number: formData.phone_number,
                    university_id: formData.university_id!,
                    department: formData.department!,
                    year: formData.year!,
                    organization: formData.organization ? parseInt(formData.organization) : undefined,
                    admin_created: true
                } as any);

                // Enroll face if photo was uploaded
                if (faceImage) {
                    try {
                        const blob = await fetch(faceImage).then(res => res.blob());
                        const studentId = response.student_profile.university_id;
                        const { aiAPI } = await import('../services/api');
                        await aiAPI.enrollFace(studentId, blob);
                    } catch (faceErr) {
                        // Face enrollment can be done later
                    }
                }

                setGeneratedCredentials({ username: formData.username, password: autoPassword });
                setSuccess(`Student ${formData.username} registered and activated successfully!`);
                setFaceImage(null);
            } else if (activeTab === 'supervisor') {
                await authAPI.registerSupervisor({
                    username: formData.username,
                    email: formData.email,
                    password: autoPassword,
                    password2: autoPassword,
                    full_name: formData.full_name,
                    phone_number: formData.phone_number,
                    organization: formData.organization ? parseInt(formData.organization) : undefined,
                    department: formData.department,
                    job_title: formData.job_title
                });
                setGeneratedCredentials({ username: formData.username, password: autoPassword });
                setSuccess(`Supervisor ${formData.username} registered and activated successfully!`);
            } else if (activeTab === 'company') {
                await authAPI.registerCompany({
                    username: formData.username,
                    email: formData.email,
                    password: autoPassword,
                    password2: autoPassword,
                    full_name: formData.full_name,
                    phone_number: formData.phone_number,
                    org_name: formData.org_name,
                    industry: formData.org_type ? `${formData.org_type} | ${formData.industry}` : formData.industry,
                    website: formData.website,
                    address: formData.address,
                    description: formData.org_description,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    admin_created: true
                });
                setGeneratedCredentials({ username: formData.username, password: autoPassword });
                setSuccess(`Company ${formData.org_name} registered and activated successfully!`);
            }

            // Save credential to local vault for retrieval
            try {
                const savedCreds = JSON.parse(localStorage.getItem('recent_credentials') || '{}');
                savedCreds[formData.username] = autoPassword;
                localStorage.setItem('recent_credentials', JSON.stringify(savedCreds));
            } catch (e) {
                console.warn('Could not save credential to local vault');
            }

            // Reset form
            setFormData({
                username: '',
                email: '',
                full_name: '',
                phone_number: '',
                role: formData.role,
                university_id: '',
                department: '',
                year: 1,
                organization: '',
                job_title: '',
                org_name: '',
                industry: '',
                website: '',
                address: '',
                latitude: null,
                longitude: null
            });
        } catch (err: any) {
            setError(err.response?.data?.error || err.response?.data?.username?.[0] || 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen bg-background-dark text-white overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Page Header */}
                        <div className="mb-8">
                            <h1 className="text-4xl font-black text-primary uppercase tracking-wider mb-2">
                                User Management
                            </h1>
                            <p className="text-white/60 text-sm">
                                {user?.role === 'university_admin'
                                    ? 'Manually register students and partner companies'
                                    : 'Manually register supervisors for your organization'}
                            </p>
                        </div>

                        {/* Administrative Tools (Admin Only) */}
                        {user?.role === 'university_admin' && (
                            <div className="mb-8 glass p-6 rounded-2xl border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em]">AI Biometric Synchronization</h3>
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-tight">Regenerate all student face embeddings from their profile photos.</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!window.confirm("This will re-process every student's profile photo to regenerate biometric data. Continue?")) return;
                                        setIsSubmitting(true);
                                        try {
                                            const { usersAPI } = await import('../services/api');
                                            const result = await usersAPI.reEnrollAllStudents();
                                            setSuccess(`Sync Complete: ${result.success_count} success, ${result.fail_count} failed.`);
                                            if (result.errors?.length > 0) {
                                                setError(`Some errors occurred: ${result.errors[0]}`);
                                            }
                                        } catch (err: any) {
                                            setError(err.response?.data?.error || 'Sync failed');
                                        } finally {
                                            setIsSubmitting(false);
                                        }
                                    }}
                                    disabled={isSubmitting}
                                    className="bg-background-dark border border-primary text-primary hover:bg-primary hover:text-background-dark px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-3 shadow-[0_0_15px_rgba(19,236,236,0.1)]"
                                >
                                    <span className={`material-symbols-outlined text-sm ${isSubmitting ? 'animate-spin' : ''}`}>
                                        {isSubmitting ? 'sync' : 'neurology'}
                                    </span>
                                    {isSubmitting ? 'Syncing Biometrics...' : 'Start Bulk AI Sync'}
                                </button>
                            </div>
                        )}

                        {/* Tab Navigation */}
                        <div className="flex gap-4 mb-8">
                            {user?.role === 'university_admin' && (
                                <button
                                    onClick={() => handleTabChange('student')}
                                    className={`px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${activeTab === 'student'
                                        ? 'bg-primary text-background-dark shadow-[0_0_20px_rgba(19,236,236,0.3)]'
                                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                                        }`}
                                >
                                    Register Student
                                </button>
                            )}
                            {user?.role === 'university_admin' && (
                                <button
                                    onClick={() => handleTabChange('company')}
                                    className={`px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${activeTab === 'company'
                                        ? 'bg-primary text-background-dark shadow-[0_0_20px_rgba(19,236,236,0.3)]'
                                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                                        }`}
                                >
                                    Register Company
                                </button>
                            )}
                            {user?.role === 'company_admin' && (
                                <button
                                    onClick={() => handleTabChange('supervisor')}
                                    className={`px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${activeTab === 'supervisor'
                                        ? 'bg-primary text-background-dark shadow-[0_0_20px_rgba(19,236,236,0.3)]'
                                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                                        }`}
                                >
                                    Register Supervisor
                                </button>
                            )}
                        </div>

                        {/* Registration Form */}
                        <div className="glass p-8 rounded-2xl border border-primary/20">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Identity Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="material-symbols-outlined text-primary">fingerprint</span>
                                        <h3 className="text-sm font-black text-white/80 tracking-widest uppercase">Admin Identity</h3>
                                        <div className="h-[1px] flex-1 bg-primary/20"></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Full Name</label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40 text-sm group-focus-within:text-primary transition-colors">person</span>
                                                <input
                                                    type="text"
                                                    name="full_name"
                                                    value={formData.full_name}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full bg-background-dark/50 border border-primary/20 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Email Protocol</label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40 text-sm group-focus-within:text-primary transition-colors">alternate_email</span>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full bg-background-dark/50 border border-primary/20 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                                                    placeholder="admin@company.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Username</label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40 text-sm group-focus-within:text-primary transition-colors">account_circle</span>
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={formData.username}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full bg-background-dark/50 border border-primary/20 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                                                    placeholder="company_admin_name"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Contact Phone</label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40 text-sm group-focus-within:text-primary transition-colors">call</span>
                                                <input
                                                    type="tel"
                                                    name="phone_number"
                                                    value={formData.phone_number}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-background-dark/50 border border-primary/20 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                                                    placeholder="+251 9XX XXX XXX"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                 {/* Student Specific Fields */}
                                 {activeTab === 'student' && (
                                     <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                                         <div className="flex items-center gap-3 mb-2">
                                             <span className="material-symbols-outlined text-primary">school</span>
                                             <h3 className="text-sm font-black text-white/80 tracking-widest uppercase">Academic Profile</h3>
                                             <div className="h-[1px] flex-1 bg-primary/20"></div>
                                         </div>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div className="space-y-1.5">
                                                  <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">University ID</label>
                                                  <div className="relative group">
                                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40 text-sm group-focus-within:text-primary transition-colors">badge</span>
                                                      <input
                                                          type="text"
                                                          name="university_id"
                                                          value={formData.university_id}
                                                          onChange={handleInputChange}
                                                          required
                                                          className="w-full bg-background-dark/50 border border-primary/20 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner uppercase font-mono"
                                                          placeholder="JU/0001/2024"
                                                      />
                                                  </div>
                                              </div>
                                              <div className="space-y-1.5">
                                                  <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Department</label>
                                                  <div className="relative group">
                                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40 text-sm group-focus-within:text-primary transition-colors">account_tree</span>
                                                      <select
                                                          name="department"
                                                          value={formData.department}
                                                          onChange={handleInputChange}
                                                          required
                                                          className="w-full bg-background-dark/50 border border-primary/20 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner appearance-none"
                                                      >
                                                          <option value="">Select Dept</option>
                                                          <option value="Software Engineering">Software Engineering</option>
                                                          <option value="Computer Science">Computer Science</option>
                                                          <option value="Information Technology">Information Technology</option>
                                                          <option value="Electrical Engineering">Electrical Engineering</option>
                                                      </select>
                                                  </div>
                                              </div>
                                              <div className="space-y-1.5">
                                                  <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Level</label>
                                                  <div className="relative group">
                                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40 text-sm group-focus-within:text-primary transition-colors">stairs</span>
                                                      <select
                                                          name="year"
                                                          value={formData.year}
                                                          onChange={handleInputChange}
                                                          required
                                                          className="w-full bg-background-dark/50 border border-primary/20 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner appearance-none"
                                                      >
                                                          <option value="1">Year 1</option>
                                                          <option value="2">Year 2</option>
                                                          <option value="3">Year 3</option>
                                                          <option value="4">Year 4</option>
                                                          <option value="5">Year 5</option>
                                                      </select>
                                                  </div>
                                              </div>

                                              {/* Organization Allocation (Uni Admin Only) */}
                                              {user?.role === 'university_admin' && (
                                                  <div className="space-y-1.5">
                                                      <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Internship Allocation (Company)</label>
                                                      <div className="relative group">
                                                          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40 text-sm group-focus-within:text-primary transition-colors">corporate_fare</span>
                                                          <select
                                                              name="organization"
                                                              value={formData.organization}
                                                              onChange={handleInputChange}
                                                              className="w-full bg-background-dark/50 border border-primary/20 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner appearance-none"
                                                          >
                                                              <option value="">Not Allocated (Pending)</option>
                                                              {organizations.map(org => (
                                                                  <option key={org.org_id} value={org.org_id}>{org.org_name}</option>
                                                              ))}
                                                          </select>
                                                      </div>
                                                  </div>
                                              )}
                                          </div>

                                     </div>
                                 )}

                                 {/* Supervisor Specific Fields */}
                                 {activeTab === 'supervisor' && (
                                     <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                                         <div className="flex items-center gap-3 mb-2">
                                             <span className="material-symbols-outlined text-primary">work</span>
                                             <h3 className="text-sm font-black text-white/80 tracking-widest uppercase">Professional Credentials</h3>
                                             <div className="h-[1px] flex-1 bg-primary/20"></div>
                                         </div>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <div className="space-y-1.5">
                                                 <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Organization Association</label>
                                                 {user?.role === 'company_admin' || (user?.role === 'university_admin' && searchParams.get('orgId')) ? (
                                                     <div className="w-full bg-background-dark/30 border border-primary/20 rounded-xl px-5 py-3.5 text-white/40 cursor-not-allowed italic font-bold flex items-center gap-3">
                                                         <span className="material-symbols-outlined text-sm">lock</span>
                                                         {organizations.find(o => o.org_id === parseInt(formData.organization || ''))?.org_name || 'Organization Locked'}
                                                     </div>
                                                 ) : (
                                                     <div className="relative group">
                                                         <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40 text-sm group-focus-within:text-primary transition-colors">corporate_fare</span>
                                                         <select
                                                             name="organization"
                                                             value={formData.organization}
                                                             onChange={handleInputChange}
                                                             required={user?.role === 'university_admin'}
                                                             className="w-full bg-background-dark/50 border border-primary/20 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner appearance-none"
                                                         >
                                                             <option value="">Select Organization</option>
                                                             {organizations.map(org => (
                                                                 <option key={org.org_id} value={org.org_id}>{org.org_name}</option>
                                                             ))}
                                                         </select>
                                                     </div>
                                                 )}
                                             </div>
                                             <div className="space-y-1.5">
                                                 <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Division / Unit</label>
                                                 <div className="relative group">
                                                     <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40 text-sm group-focus-within:text-primary transition-colors">hub</span>
                                                     <input
                                                         type="text"
                                                         name="department"
                                                         value={formData.department}
                                                         onChange={handleInputChange}
                                                         required
                                                         className="w-full bg-background-dark/50 border border-primary/20 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                                                         placeholder="e.g. Engineering Dept"
                                                     />
                                                 </div>
                                             </div>
                                             <div className="space-y-1.5 md:col-span-2">
                                                 <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Professional Job Title</label>
                                                 <div className="relative group">
                                                     <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40 text-sm group-focus-within:text-primary transition-colors">badge</span>
                                                     <input
                                                         type="text"
                                                         name="job_title"
                                                         value={formData.job_title}
                                                         onChange={handleInputChange}
                                                         required
                                                         className="w-full bg-background-dark/50 border border-primary/20 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                                                         placeholder="e.g. Senior Project Manager"
                                                     />
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                 )}

                                {activeTab === 'company' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                        {/* Organization Detail Section */}
                                        <div className="space-y-4 pt-6 border-t border-primary/10">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="material-symbols-outlined text-primary">domain</span>
                                                <h3 className="text-sm font-black text-white/80 tracking-widest uppercase">Organization Profile</h3>
                                                <div className="h-[1px] flex-1 bg-primary/20"></div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Legal Entity Name</label>
                                                    <div className="relative group">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40 text-sm group-focus-within:text-primary transition-colors">corporate_fare</span>
                                                        <input
                                                            type="text"
                                                            name="org_name"
                                                            value={formData.org_name}
                                                            onChange={handleInputChange}
                                                            required
                                                            className="w-full bg-background-dark/50 border border-primary/20 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                                                            placeholder="e.g. Ethio Telecom"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Institutional Type</label>
                                                    <div className="relative group">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40 text-sm group-focus-within:text-primary transition-colors">account_balance</span>
                                                        <select
                                                            name="org_type"
                                                            value={formData.org_type}
                                                            onChange={handleInputChange}
                                                            className="w-full bg-background-dark/50 border border-primary/20 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner appearance-none"
                                                        >
                                                            <option value="Private limited Company (PLC)">Private limited Company (PLC)</option>
                                                            <option value="Share Company (SC)">Share Company (SC)</option>
                                                            <option value="Governmental Agency">Governmental Agency</option>
                                                            <option value="NGO / Non-Profit">NGO / Non-Profit</option>
                                                            <option value="Technology Hub / Startup">Technology Hub / Startup</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Industry Sector</label>
                                                    <div className="relative group">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40 text-sm group-focus-within:text-primary transition-colors">precision_manufacturing</span>
                                                        <input
                                                            type="text"
                                                            name="industry"
                                                            value={formData.industry}
                                                            onChange={handleInputChange}
                                                            required
                                                            className="w-full bg-background-dark/50 border border-primary/20 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                                                            placeholder="e.g. Software & Data Analytics"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Official Website</label>
                                                    <div className="relative group">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40 text-sm group-focus-within:text-primary transition-colors">language</span>
                                                        <input
                                                            type="url"
                                                            name="website"
                                                            value={formData.website}
                                                            onChange={handleInputChange}
                                                            className="w-full bg-background-dark/50 border border-primary/20 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                                                            placeholder="https://www.company.com"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-span-2 space-y-1.5">
                                                    <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Mission / Description</label>
                                                    <textarea
                                                        name="org_description"
                                                        value={formData.org_description}
                                                        onChange={handleInputChange}
                                                        rows={2}
                                                        className="w-full bg-background-dark/50 border border-primary/20 rounded-xl px-5 py-4 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner resize-none"
                                                        placeholder="Describe the organization's core activities and internship potential..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Physical & Geofence Section */}
                                        <div className="space-y-4 pt-6 border-t border-primary/10">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="material-symbols-outlined text-primary">location_on</span>
                                                <h3 className="text-sm font-black text-white/80 tracking-widest uppercase">Global Localization</h3>
                                                <div className="h-[1px] flex-1 bg-primary/20"></div>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Headquarters Physical Address</label>
                                                    <LocationInput
                                                        onLocationSelect={(loc) => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                address: loc.address,
                                                                latitude: loc.latitude,
                                                                longitude: loc.longitude
                                                            }));
                                                        }}
                                                        onAddressChange={(addr) => setFormData(prev => ({ ...prev, address: addr }))}
                                                        initialValue={formData.address}
                                                        placeholder="SEARCH FOR OFFICE ADDRESS (GOOGLE OPTIMIZED)..."
                                                        className="w-full bg-background-dark/70 border border-primary/20 rounded-xl px-5 py-4 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                                                    />
                                                </div>

                                                 <div className="flex items-center gap-2 mb-4 mt-6">
                                                     <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                                                     <label className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">
                                                         Administrative Center GPS
                                                     </label>
                                                 </div>

                                                 <div className="flex flex-col md:flex-row gap-3">
                                                     <div className="flex-1">
                                                         <input
                                                             type="number"
                                                             step="any"
                                                             name="latitude"
                                                             value={formData.latitude !== null ? formData.latitude : ''}
                                                             onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value === '' ? null : parseFloat(e.target.value) }))}
                                                             className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-white/20"
                                                             placeholder="Lat"
                                                         />
                                                     </div>
                                                     <div className="flex-1">
                                                         <input
                                                             type="number"
                                                             step="any"
                                                             name="longitude"
                                                             value={formData.longitude !== null ? formData.longitude : ''}
                                                             onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value === '' ? null : parseFloat(e.target.value) }))}
                                                             className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-white/20"
                                                             placeholder="Lng"
                                                         />
                                                     </div>
                                                     <button
                                                         type="button"
                                                         onClick={getCurrentLocation}
                                                         disabled={isGettingLocation}
                                                         className="bg-primary hover:bg-primary/80 text-background-dark px-6 py-3 rounded-lg font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 min-w-[160px]"
                                                     >
                                                         <span className={`material-symbols-outlined text-sm ${isGettingLocation ? 'animate-spin' : ''}`}>
                                                             {isGettingLocation ? 'sync' : 'my_location'}
                                                         </span>
                                                         {isGettingLocation ? 'Syncing...' : 'Capture GPS'}
                                                     </button>
                                                 </div>
                                                <p className="text-[10px] text-white/30 italic uppercase tracking-widest mt-2">
                                                    * Location data is used for institutional audit trails and security logging.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                 {/* Biometric Enrollment Section */}
                                 {activeTab === 'student' && (
                                     <div className="space-y-4 pt-6 border-t border-primary/10">
                                         <div className="flex items-center gap-3 mb-2">
                                             <span className="material-symbols-outlined text-primary">face</span>
                                             <h3 className="text-sm font-black text-white/80 tracking-widest uppercase">Biometric Recognition Hub</h3>
                                             <div className="h-[1px] flex-1 bg-primary/20"></div>
                                         </div>
                                         
                                         <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                             <div className="flex flex-col md:flex-row items-center gap-8">
                                                 <div className="relative group">
                                                     <div className="absolute -inset-1.5 bg-primary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                     {faceImage ? (
                                                         <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-primary/30 shadow-2xl">
                                                             <img src={faceImage} alt="Biometric Face" className="w-full h-full object-cover" />
                                                             <button
                                                                 type="button"
                                                                 onClick={() => setFaceImage(null)}
                                                                 className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg p-1.5 transition-all backdrop-blur-md"
                                                             >
                                                                 <span className="material-symbols-outlined text-sm">close</span>
                                                             </button>
                                                             <div className="absolute bottom-0 inset-x-0 bg-primary/80 text-background-dark text-[8px] font-black uppercase text-center py-1 tracking-[0.2em] backdrop-blur-md">
                                                                 Verified Frame
                                                             </div>
                                                         </div>
                                                     ) : (
                                                         <div className="w-40 h-40 bg-background-dark/80 border-2 border-dashed border-primary/20 rounded-xl flex flex-col items-center justify-center gap-2 group-hover:border-primary/40 transition-all">
                                                             <span className="material-symbols-outlined text-5xl text-primary/20 group-hover:text-primary/40 transition-colors">account_circle</span>
                                                             <span className="text-[8px] font-black text-primary/20 uppercase tracking-widest">Awaiting Input</span>
                                                         </div>
                                                     )}
                                                 </div>
                                                 
                                                 <div className="flex-1 space-y-4 text-center md:text-left">
                                                     <div>
                                                         <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">Face Profile Injection</h4>
                                                         <p className="text-[10px] text-white/40 uppercase font-medium leading-relaxed max-w-sm font-bold tracking-tight">
                                                             Upload a high-resolution facial profile for automated AI check-in validation. Supported formats: JPG/PNG, Max 5MB.
                                                         </p>
                                                     </div>
                                                     
                                                     <label className="cursor-pointer bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary px-8 py-3.5 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all inline-flex items-center gap-3 hover:scale-105 active:scale-95 shadow-lg">
                                                         <span className="material-symbols-outlined text-sm">{faceImage ? 'sync' : 'upload_file'}</span>
                                                         {faceImage ? 'Replace Biometric Data' : 'Initialize Enrollment'}
                                                         <input
                                                             type="file"
                                                             accept="image/*"
                                                             onChange={handlePhotoUpload}
                                                             className="hidden"
                                                         />
                                                     </label>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                 )}

                                 {/* Auto-Generated Credentials Info */}
                                 <div className="space-y-4 pt-6 border-t border-primary/10">
                                     <div className="flex items-center gap-3 mb-2">
                                         <span className="material-symbols-outlined text-primary">security</span>
                                         <h3 className="text-sm font-black text-white/80 tracking-widest uppercase">Security Protocol</h3>
                                         <div className="h-[1px] flex-1 bg-primary/20"></div>
                                     </div>
                                     <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                                         <span className="material-symbols-outlined text-primary text-lg mt-0.5">lock</span>
                                         <div>
                                             <p className="text-[10px] font-black text-primary uppercase tracking-widest">Auto-Generated Credentials</p>
                                             <p className="text-[10px] text-white/40 mt-1 font-bold">A secure password will be automatically generated and displayed after registration. Share these credentials with the user securely.</p>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Messages */}
                                 {error && (
                                     <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-shake">
                                         <span className="material-symbols-outlined text-sm">warning</span>
                                         {error}
                                     </div>
                                 )}

                                 {success && (
                                     <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                         <span className="material-symbols-outlined text-sm">verified_user</span>
                                         {success}
                                     </div>
                                 )}

                                 {generatedCredentials && (
                                     <div className="bg-primary/10 border-2 border-primary/40 rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                         <div className="flex items-center gap-3">
                                             <span className="material-symbols-outlined text-primary text-lg">key</span>
                                             <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Generated Login Credentials</h4>
                                         </div>
                                         <div className="bg-background-dark/60 rounded-lg p-4 font-mono text-sm space-y-2">
                                             <div className="flex items-center gap-3">
                                                 <span className="text-white/40 text-[10px] uppercase font-black w-24">Username:</span>
                                                 <span className="text-primary font-bold">{generatedCredentials.username}</span>
                                             </div>
                                             <div className="flex items-center gap-3">
                                                 <span className="text-white/40 text-[10px] uppercase font-black w-24">Password:</span>
                                                 <span className="text-primary font-bold">{generatedCredentials.password}</span>
                                                 <button
                                                     type="button"
                                                     onClick={() => { navigator.clipboard.writeText(generatedCredentials.password); }}
                                                     className="ml-2 text-white/30 hover:text-primary transition-colors"
                                                     title="Copy password"
                                                 >
                                                     <span className="material-symbols-outlined text-sm">content_copy</span>
                                                 </button>
                                             </div>
                                         </div>
                                         <p className="text-[9px] text-red-400/80 font-black uppercase tracking-widest flex items-center gap-2">
                                             <span className="material-symbols-outlined text-xs">warning</span>
                                             Save these credentials now. The password will not be shown again.
                                         </p>
                                     </div>
                                 )}

                                 {/* Submit Button */}
                                 <div className="flex justify-end pt-4">
                                     <button
                                         type="submit"
                                         disabled={isSubmitting}
                                         className="group relative px-10 py-4 overflow-hidden rounded-xl bg-primary text-background-dark font-black uppercase tracking-[0.2em] text-xs transition-all hover:bg-primary/90 shadow-[0_0_30px_rgba(19,236,236,0.3)] disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                                     >
                                         <span className="relative z-10 flex items-center gap-3">
                                            {isSubmitting ? (
                                                <>
                                                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                                                    INITIALIZING...
                                                </>
                                            ) : (
                                                <>
                                                    FINALIZE {activeTab.toUpperCase()} REGISTRATION
                                                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                                </>
                                            )}
                                         </span>
                                     </button>
                                 </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminUserManagement;
