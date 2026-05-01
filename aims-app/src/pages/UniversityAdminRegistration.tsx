import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import LocationInput from '../components/LocationInput';

const UniversityAdminRegistration: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        username: '',
        password: '',
        password2: '',
        reg_org_name: '',
        reg_org_type: 'Technical Center',
        reg_address: '',
        latitude: null as number | null,
        longitude: null as number | null
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            await authAPI.registerUniversityAdmin(formData);
            setSuccess('University Admin account created! Pending final security verification.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-background-dark text-white min-h-screen relative font-display flex flex-col">
            {/* Background */}
            <div className="fixed inset-0 z-[-1] radial-bg">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]"></div>
                <div className="absolute top-[20%] right-[-10%] h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent -rotate-[45deg]"></div>
            </div>

            <header className="flex items-center justify-between border-b border-white/10 px-6 md:px-20 py-4 glass sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="size-8 text-primary font-bold">A</div>
                    <h2 className="text-white text-2xl font-bold tracking-tight uppercase">AIMS</h2>
                </div>
                <Link to="/login" className="text-primary text-sm font-bold border border-primary/40 px-5 py-2 rounded hover:bg-primary/10 transition-all text-center">
                    Login
                </Link>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                <div className="max-w-[700px] w-full">
                    <div className="mb-10 text-center">
                        <h1 className="text-white text-4xl md:text-5xl font-black leading-tight uppercase mb-4 tracking-tighter">
                            University <span className="text-primary">Admin</span> Setup
                        </h1>
                        <p className="text-white/60 text-lg font-normal mb-8">
                            Initialize institutional oversight access. Set your primary office location for system logging.
                        </p>
                    </div>

                    <div className="glass rounded-xl p-8 border border-primary/20 shadow-2xl relative overflow-hidden">
                        {/* Decorative side bar */}
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary shadow-[0_0_10px_#13ecec]"></div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-bold flex items-center gap-2 animate-pulse">
                                <span className="material-symbols-outlined">gpp_maybe</span>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-sm font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined">verified_user</span>
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Full Name</label>
                                    <input
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="Admin Full Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Official Email</label>
                                    <input
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        type="email"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="admin@university.edu.et"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Username</label>
                                    <input
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="uni_admin"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Phone Number</label>
                                    <input
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleInputChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="+251 ..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Password</label>
                                    <input
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        type="password"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Confirm Password</label>
                                    <input
                                        name="password2"
                                        value={formData.password2}
                                        onChange={handleInputChange}
                                        required
                                        type="password"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                                  {/* Institution Identity Section */}
                            <div className="pt-6 border-t border-white/10 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="material-symbols-outlined text-primary">corporate_fare</span>
                                    <h3 className="text-xl font-bold text-white tracking-tight uppercase italic">Organization <span className="text-primary">Identity</span></h3>
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/30 to-transparent ml-4"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Institution Name</label>
                                        <input
                                            name="reg_org_name"
                                            value={formData.reg_org_name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                            placeholder="e.g. Jimma University Hub"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Entity Type</label>
                                        <select
                                            name="reg_org_type"
                                            value={formData.reg_org_type}
                                            onChange={handleInputChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                        >
                                            <option value="Technical Center">Technical Center</option>
                                            <option value="University Hub">University Hub</option>
                                            <option value="Administrative Center">Administrative Center</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Institutional Location Section */}
                            <div className="pt-6 border-t border-white/10 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Physical Address Search</label>
                                        <LocationInput
                                            onLocationSelect={(loc) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    reg_address: loc.address,
                                                    latitude: loc.latitude,
                                                    longitude: loc.longitude
                                                }));
                                            }}
                                            onAddressChange={(addr) => setFormData(prev => ({ ...prev, reg_address: addr }))}
                                            initialValue={formData.reg_address}
                                            placeholder="Search for office address (Google Suggested)..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-inner focus:bg-white/10"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 mb-4">
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
                                </div>
                            </div>
                                <p className="text-[10px] text-white/30 italic uppercase tracking-widest text-center mt-2">
                                    * Location data is used for institutional audit trails and security logging.
                                </p>

                            <button
                                disabled={isSubmitting}
                                className="w-full bg-white/10 hover:bg-white/20 border border-primary/20 text-white font-black text-sm uppercase tracking-widest py-4 px-8 rounded-lg flex items-center justify-center gap-2 transition-all mt-8 hover:border-primary group"
                                type="submit"
                            >
                                {isSubmitting ? 'Initializing...' : 'Create Admin Account'}
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">security</span>
                            </button>
                        </form>
                    </div>

                    <Link to="/login" className="mt-8 flex justify-center text-xs font-bold text-white/30 uppercase tracking-widest hover:text-primary transition-colors gap-2">
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                        Back to Authentication
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default UniversityAdminRegistration;
