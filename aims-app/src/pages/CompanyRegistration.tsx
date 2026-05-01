import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import LocationInput from '../components/LocationInput';

const CompanyRegistration: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        org_name: '',
        industry: 'Information Technology',
        website: '',
        address: '',
        full_name: '',
        email: '',
        phone_number: '',
        username: '',
        password: '',
        password2: '',
        latitude: null as number | null,
        longitude: null as number | null
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (formData.password !== formData.password2) {
            setError('Passwords do not match');
            setIsSubmitting(false);
            return;
        }

        try {
            await authAPI.registerCompany(formData);
            setSuccess('Company registration submitted successfully! Your account is now pending. Please wait for a University Administrator to manually review and approve your account before you can log in.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-background-dark text-white min-h-screen relative font-display">
            {/* Abstract Background Elements */}
            <div className="fixed inset-0 z-[-1] radial-bg">
                <div className="absolute top-[10%] left-[-20%] h-px w-full bg-gradient-to-r from-transparent via-primary/10 to-transparent -rotate-[35deg]"></div>
                <div className="absolute top-[40%] left-[10%] h-px w-full bg-gradient-to-r from-transparent via-primary/10 to-transparent -rotate-[35deg]"></div>
                <div className="absolute top-[70%] left-[-10%] h-px w-full bg-gradient-to-r from-transparent via-primary/10 to-transparent -rotate-[35deg]"></div>
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="layout-container flex h-full grow flex-col">
                {/* Header / Nav */}
                <header className="flex items-center justify-between whitespace-nowrap border-b border-white/10 px-6 md:px-20 py-4 glass sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <div className="size-8 text-primary">
                            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.578 8.578C5.528 11.628 3.451 15.515 2.609 19.745C1.768 23.976 2.2 28.361 3.85 32.346C5.501 36.331 8.297 39.738 11.883 42.134C15.47 44.53 19.687 45.81 24 45.81C28.314 45.81 32.53 44.53 36.117 42.134C39.703 39.738 42.499 36.331 44.15 32.346C45.8 28.361 46.232 23.976 45.39 19.745C44.549 15.515 42.472 11.628 39.422 8.578L24 24L8.578 8.578Z" fill="currentColor"></path>
                            </svg>
                        </div>
                        <h2 className="text-white text-2xl font-bold tracking-tight uppercase">AIMS</h2>
                    </div>
                    <div className="flex items-center gap-8">
                        <nav className="hidden md:flex items-center gap-8">
                            <Link className="text-white/70 hover:text-primary text-sm font-medium transition-colors" to="/">Home</Link>
                            <Link className="text-white/70 hover:text-primary text-sm font-medium transition-colors" to="/about">About</Link>
                            <Link className="text-white/70 hover:text-primary text-sm font-medium transition-colors" to="/support">Support</Link>
                        </nav>
                        <Link to="/login" className="flex min-w-[100px] cursor-pointer items-center justify-center rounded border border-primary/40 bg-primary/10 hover:bg-primary/20 h-10 px-5 text-primary text-sm font-bold transition-all">
                            Login
                        </Link>
                    </div>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20">
                    <div className="max-w-[1000px] w-full">
                        {/* Title & Intro */}
                        <div className="mb-10 text-center md:text-left">
                            <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-tighter uppercase mb-4">
                                Company <span className="text-primary">Registration</span>
                            </h1>
                            <p className="text-white/60 text-lg font-normal max-w-2xl">
                                Join the Jimma University network. Provide your organizational details to begin recruitment of top-tier student interns.
                            </p>
                        </div>

                        {/* Registration Card */}
                        <div className="glass rounded-xl p-6 md:p-10 border border-primary/20 shadow-2xl">
                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined">error</span>
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined">check_circle</span>
                                    {success}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-12">
                                {/* Section 1: Company Profile */}
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="material-symbols-outlined text-primary">corporate_fare</span>
                                        <h3 className="text-xl font-bold text-white tracking-tight uppercase">Company Profile</h3>
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/30 to-transparent ml-4"></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Legal Company Name</label>
                                            <input
                                                name="org_name"
                                                value={formData.org_name}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary transition-all focus:bg-white/10"
                                                placeholder="e.g. TechCorp Solutions"
                                                type="text"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Industry Sector</label>
                                            <select
                                                name="industry"
                                                value={formData.industry}
                                                onChange={handleInputChange}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all focus:bg-white/10 appearance-none pointer-events-auto"
                                            >
                                                <option className="bg-background-dark">Information Technology</option>
                                                <option className="bg-background-dark">Manufacturing</option>
                                                <option className="bg-background-dark">FinTech</option>
                                                <option className="bg-background-dark">Telecommunications</option>
                                                <option className="bg-background-dark">Construction</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Website URL</label>
                                            <input
                                                name="website"
                                                value={formData.website}
                                                onChange={handleInputChange}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary transition-all focus:bg-white/10"
                                                placeholder="https://www.example.com"
                                                type="url"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Headquarters Address</label>
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
                                                placeholder="Search for office address (Google Suggested)..."
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary transition-all focus:bg-white/10"
                                            />
                                        </div>

                                        {/* GPS Section */}
                                        <div className="space-y-4 md:col-span-2">
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                                                <label className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">
                                                    Organization Headquarters GPS
                                                </label>
                                            </div>

                                            <div className="flex flex-col md:flex-row gap-3">
                                                <div className="flex-1">
                                                    <input
                                                        type="number"
                                                        step="any"
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
                                            <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest ml-1">
                                                * These coordinates will define the geofence boundary.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Admin Information */}
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                                        <h3 className="text-xl font-bold text-white tracking-tight uppercase">Admin Account</h3>
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/30 to-transparent ml-4"></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Full Name</label>
                                            <input
                                                name="full_name"
                                                value={formData.full_name}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary transition-all focus:bg-white/10"
                                                placeholder="Admin Name"
                                                type="text"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Corporate Email</label>
                                            <input
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary transition-all focus:bg-white/10"
                                                placeholder="admin@company.com"
                                                type="email"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Username</label>
                                            <input
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary transition-all focus:bg-white/10"
                                                placeholder="system_admin"
                                                type="text"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Phone Number</label>
                                            <input
                                                name="phone_number"
                                                value={formData.phone_number}
                                                onChange={handleInputChange}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary transition-all focus:bg-white/10"
                                                placeholder="+251 ..."
                                                type="tel"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Password</label>
                                            <input
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary transition-all focus:bg-white/10"
                                                placeholder="••••••••"
                                                type="password"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Confirm Password</label>
                                            <input
                                                name="password2"
                                                value={formData.password2}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary transition-all focus:bg-white/10"
                                                placeholder="••••••••"
                                                type="password"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Area */}
                                <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-2">
                                        <input className="rounded bg-white/5 border-white/20 text-primary focus:ring-primary cursor-pointer" id="terms" type="checkbox" required />
                                        <label className="text-sm text-white/50" htmlFor="terms">I agree to the <a className="text-primary hover:underline" href="#">Terms of Service</a>.</label>
                                    </div>
                                    <button
                                        disabled={isSubmitting}
                                        className="w-full md:w-auto min-w-[220px] bg-primary text-background-dark font-black text-sm uppercase tracking-widest py-4 px-8 rounded-lg flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(19,236,236,0.2)] hover:shadow-[0_0_30px_rgba(19,236,236,0.5)] transition-all hover:-translate-y-1 disabled:opacity-50"
                                        type="submit"
                                    >
                                        {isSubmitting ? 'Processing...' : 'Register Company'}
                                        <span className="material-symbols-outlined">rocket_launch</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Footer Links */}
                        <div className="mt-8 flex justify-center gap-10 text-xs font-medium text-white/40 tracking-widest uppercase">
                            <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
                            <a className="hover:text-primary transition-colors" href="#">Documentation</a>
                            <Link to="/login" className="hover:text-primary transition-colors flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">login</span> Back to Login
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
            {/* Decorative Bottom Gradient */}
            <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
        </div>
    );
};

export default CompanyRegistration;
