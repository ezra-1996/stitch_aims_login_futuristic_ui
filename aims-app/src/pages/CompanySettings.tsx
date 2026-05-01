import React, { useState, useEffect } from 'react';
import { organizationsAPI } from '../services/api';
import LocationInput from '../components/LocationInput';

const CompanySettings: React.FC = () => {
    const [organization, setOrganization] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    // Form fields
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [website, setWebsite] = useState('');
    const [coords, setCoords] = useState<{ lat: number, lon: number } | null>(null);

    useEffect(() => {
        organizationsAPI.getOrganizations()
            .then(orgs => {
                if (orgs && orgs.length > 0) {
                    const org = orgs[0];
                    setOrganization(org);
                    setDescription(org.description || '');
                    setAddress(org.address || '');
                    setWebsite(org.website || '');
                    if (org.latitude && org.longitude) {
                        setCoords({ lat: org.latitude, lon: org.longitude });
                    }
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setStatus(null);

        try {
            await organizationsAPI.updateOrganization(organization.org_id, {
                description,
                address,
                website,
                latitude: coords?.lat,
                longitude: coords?.lon
            });
            setStatus('success');
        } catch (err) {
            console.error(err);
            setStatus('error');
        } finally {
            setSaving(false);
        }
    };

    const updateLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCoords({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("GPS Error", error);
                    alert("Could not retrieve location.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    if (loading) return <div className="text-white">Loading...</div>;
    if (!organization) return <div className="text-white">No organization found. Please register one first.</div>;

    return (
        <div className="flex flex-col h-full bg-background-dark text-white rounded-2xl overflow-hidden glass border border-white/5 relative p-8">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black text-white tracking-tight uppercase italic underline decoration-primary/30 underline-offset-8">Company <span className="text-primary italic">Settings</span></h2>
                            <p className="text-slate-400 max-w-lg text-sm">Manage your organization profile and location settings for attendance verification.</p>
                        </div>

                        <form onSubmit={handleUpdate} className="glass p-8 rounded-2xl border border-white/5 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Organization Name</label>
                                    <input
                                        type="text"
                                        value={organization.org_name}
                                        disabled
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/50 font-bold text-sm focus:outline-none cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Website</label>
                                    <input
                                        type="url"
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                        placeholder="https://example.com"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Headquarters Address</label>
                                    <LocationInput
                                        onLocationSelect={(loc) => {
                                            setAddress(loc.address);
                                            setCoords({ lat: loc.latitude, lon: loc.longitude });
                                        }}
                                        initialValue={address}
                                        placeholder="Search for office address..."
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/5 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-white uppercase italic tracking-tight">Geofence Location</h3>
                                        <p className="text-slate-400 text-xs">Set your office location for intern attendance verification.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={updateLocation}
                                        className="bg-white/5 hover:bg-white/10 text-primary border border-primary/30 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">my_location</span>
                                        Use Current Location
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-4 bg-black/20 rounded-xl border border-white/10 focus-within:border-primary/50 transition-all">
                                        <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={coords?.lat || ''}
                                            onChange={(e) => setCoords(prev => prev ? { ...prev, lat: parseFloat(e.target.value) || 0 } : { lat: parseFloat(e.target.value) || 0, lon: 0 })}
                                            className="w-full bg-transparent border-none p-0 text-xl font-mono text-primary font-bold mt-1 focus:outline-none focus:ring-0 placeholder:text-white/5"
                                            placeholder="0.000000"
                                        />
                                    </div>
                                    <div className="p-4 bg-black/20 rounded-xl border border-white/10 focus-within:border-primary/50 transition-all">
                                        <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={coords?.lon || ''}
                                            onChange={(e) => setCoords(prev => prev ? { ...prev, lon: parseFloat(e.target.value) || 0 } : { lat: 0, lon: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-transparent border-none p-0 text-xl font-mono text-primary font-bold mt-1 focus:outline-none focus:ring-0 placeholder:text-white/5"
                                            placeholder="0.000000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-primary text-background-dark px-8 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_20px_rgba(19,236,236,0.3)] hover:shadow-[0_0_30px_rgba(19,236,236,0.5)] transition-all disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>

                            {status === 'success' && (
                                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-widest text-center">
                                    Settings updated successfully.
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest text-center">
                                    Failed to update settings.
                                </div>
                            )}
                        </form>
                    </div>
            </div>
        </div>
    );
};

export default CompanySettings;
