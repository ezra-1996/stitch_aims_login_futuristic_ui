import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { authAPI, aiAPI } from '../services/api';

const StudentRegistration: React.FC = () => {
    const navigate = useNavigate();
    const webcamRef = useRef<Webcam>(null);

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        university_id: '',
        department: '',
        year: 1,
        username: '',
        password: '',
        password2: ''
    });

    const [step, setStep] = useState<'form' | 'camera' | 'processing'>('form');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [captureMethod, setCaptureMethod] = useState<'camera' | 'upload'>('camera');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.password2) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        // Move to camera step for face enrollment
        setStep('camera');
    };

    const captureFace = () => {
        if (!webcamRef.current) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            setCapturedImage(imageSrc);
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        // Read and display the image
        const reader = new FileReader();
        reader.onloadend = () => {
            setCapturedImage(reader.result as string);
            setError('');
        };
        reader.readAsDataURL(file);
    };

    const completeRegistration = async () => {
        if (!capturedImage) {
            setError('Please capture your face photo');
            return;
        }

        setIsSubmitting(true);
        setStep('processing');
        setError('');

        try {
            // Step 1: Register student
            const response = await authAPI.registerStudent({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                password2: formData.password2,
                full_name: formData.full_name,
                phone_number: formData.phone_number,
                university_id: formData.university_id,
                department: formData.department,
                year: Number(formData.year),
            });

            // Save tokens immediately so subsequent API calls (like enrollFace) are authenticated
            if (response.access) {
                localStorage.setItem('access_token', response.access);
            }
            if (response.refresh) {
                localStorage.setItem('refresh_token', response.refresh);
            }

            const studentProfile = response.student_profile;

            // Persist identifiers for later use (attendance, AI verification, summaries)
            if (studentProfile) {
                if (studentProfile.university_id) {
                    localStorage.setItem('student_face_id', String(studentProfile.university_id));
                }
                if (studentProfile.student_id) {
                    localStorage.setItem('student_id', String(studentProfile.student_id));
                }
            }

            // Step 2: Enroll face
            const blob = await fetch(capturedImage).then(res => res.blob());
            const studentId = studentProfile?.university_id;

            if (studentId) {
                try {
                    await aiAPI.enrollFace(studentId, blob);
                } catch (enrollErr: any) {
                    console.error("Face enrollment failed:", enrollErr);
                    // We don't necessarily want to fail the whole registration if biometric fails,
                    // but since the UI says "Processing Registration", let's inform the user.
                    throw new Error(enrollErr.response?.data?.error || "Face biometric enrollment failed, but account was created. Please try to log in and update your profile.");
                }
            }

            setSuccess('Registration submitted successfully! Your account is now pending. Please wait for a University Administrator to manually review and approve your account before you can log in.');

            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err: any) {
            console.error("Registration flow error:", err);
            const d = err.response?.data;
            const msg = err.message || d?.error || d?.username?.[0] || d?.email?.[0] || d?.university_id?.[0] || (Array.isArray(d?.password) ? d.password[0] : d?.password) || 'Registration failed. Please try again.';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
            setStep('form');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Camera Step
    if (step === 'camera') {
        return (
            <div className="bg-background-dark font-display text-slate-100 min-h-screen flex items-center justify-center p-6">
                <div className="max-w-2xl w-full glass p-8 rounded-2xl border border-primary/20">
                    <h2 className="text-3xl font-black text-primary mb-2 text-center uppercase tracking-wider">Face Enrollment</h2>
                    <p className="text-white/60 text-center mb-6 text-sm">Capture or upload your photo for biometric verification</p>

                    {/* Toggle between Camera and Upload */}
                    <div className="flex gap-4 mb-6">
                        <button
                            type="button"
                            onClick={() => {
                                setCaptureMethod('camera');
                                setCapturedImage(null);
                            }}
                            className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${captureMethod === 'camera'
                                ? 'bg-primary text-background-dark shadow-[0_0_20px_rgba(19,236,236,0.3)]'
                                : 'bg-white/10 text-white/60 hover:bg-white/20'
                                }`}
                        >
                            <span className="material-symbols-outlined">photo_camera</span>
                            Use Camera
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setCaptureMethod('upload');
                                setCapturedImage(null);
                            }}
                            className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${captureMethod === 'upload'
                                ? 'bg-primary text-background-dark shadow-[0_0_20px_rgba(19,236,236,0.3)]'
                                : 'bg-white/10 text-white/60 hover:bg-white/20'
                                }`}
                        >
                            <span className="material-symbols-outlined">upload_file</span>
                            Upload Photo
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="relative aspect-video bg-black rounded-xl overflow-hidden border-2 border-primary/30">
                            {!capturedImage ? (
                                captureMethod === 'camera' ? (
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className="w-full h-full object-cover"
                                        videoConstraints={{
                                            width: 1280,
                                            height: 720,
                                            facingMode: "user"
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
                                        <span className="material-symbols-outlined text-6xl text-primary/40">upload_file</span>
                                        <p className="text-white/60 text-center">Click the button below to select a photo</p>
                                        <label className="cursor-pointer bg-primary hover:bg-primary/80 text-background-dark px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(19,236,236,0.3)] flex items-center gap-2">
                                            <span className="material-symbols-outlined">add_photo_alternate</span>
                                            Choose Photo
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="text-white/40 text-xs">Supported: JPG, PNG (Max 5MB)</p>
                                    </div>
                                )
                            ) : (
                                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setStep('form')}
                                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all"
                            >
                                Back
                            </button>

                            {!capturedImage ? (
                                captureMethod === 'camera' && (
                                    <button
                                        type="button"
                                        onClick={captureFace}
                                        className="flex-1 bg-primary hover:bg-primary/80 text-background-dark px-6 py-3 rounded-lg font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(19,236,236,0.3)]"
                                    >
                                        Capture Face
                                    </button>
                                )
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={retakePhoto}
                                        className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all"
                                    >
                                        {captureMethod === 'camera' ? 'Retake' : 'Choose Another'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={completeRegistration}
                                        disabled={isSubmitting}
                                        className="flex-1 bg-primary hover:bg-primary/80 text-background-dark px-6 py-3 rounded-lg font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(19,236,236,0.3)] disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Processing...' : 'Complete Registration'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Processing Step
    if (step === 'processing') {
        return (
            <div className="bg-background-dark font-display text-slate-100 min-h-screen flex items-center justify-center p-6">
                <div className="max-w-md w-full glass p-8 rounded-2xl border border-primary/20 text-center space-y-6">
                    <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <h2 className="text-2xl font-black text-primary uppercase tracking-wider">Processing Registration</h2>
                    <p className="text-white/60">Please wait while we create your account and enroll your biometric data...</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg text-sm text-left">
                            <p className="font-bold mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined">error</span>
                                Error Occurred
                            </p>
                            {error}
                            <button
                                onClick={() => setStep('form')}
                                className="mt-4 w-full bg-red-500/20 hover:bg-red-500/30 text-red-500 py-2 rounded font-bold uppercase text-xs transition-all"
                            >
                                Back to Form
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Main Registration Form
    return (
        <div className="bg-background-dark min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black text-primary uppercase tracking-wider mb-2">
                        Student Registration
                    </h1>
                    <p className="text-white/60">Create your AIMS account with biometric enrollment</p>
                </div>

                {/* Registration Form */}
                <form onSubmit={handleFormSubmit} className="glass p-8 rounded-2xl border border-primary/20 space-y-8">
                    {/* Personal Information */}
                    <div>
                        <h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined">person</span>
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-primary/60 uppercase mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full bg-background-dark/50 border border-primary/20 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="e.g. Abraham Solomon"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-primary/60 uppercase mb-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full bg-background-dark/50 border border-primary/20 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="student@ju.edu.et"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-primary/60 uppercase mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleInputChange}
                                    className="w-full bg-background-dark/50 border border-primary/20 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="+251 912 345 678"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-primary/60 uppercase mb-2">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full bg-background-dark/50 border border-primary/20 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="username"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Academic Information */}
                    <div>
                        <h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined">school</span>
                            Academic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-primary/60 uppercase mb-2">University ID</label>
                                <input
                                    type="text"
                                    name="university_id"
                                    value={formData.university_id}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full bg-background-dark/50 border border-primary/20 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="JU/0001/2024"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-primary/60 uppercase mb-2">Department</label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full bg-background-dark/50 border border-primary/20 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                >
                                    <option value="">Select Department</option>
                                    <option value="Software Engineering">Software Engineering</option>
                                    <option value="Computer Science">Computer Science</option>
                                    <option value="Information Technology">Information Technology</option>
                                    <option value="Electrical Engineering">Electrical Engineering</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-primary/60 uppercase mb-2">Year</label>
                                <select
                                    name="year"
                                    value={formData.year}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full bg-background-dark/50 border border-primary/20 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                >
                                    <option value="1">Year 1</option>
                                    <option value="2">Year 2</option>
                                    <option value="3">Year 3</option>
                                    <option value="4">Year 4</option>
                                    <option value="5">Year 5</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Security Credentials */}
                    <div>
                        <h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined">lock</span>
                            Security Credentials
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-primary/60 uppercase mb-2">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full bg-background-dark/50 border border-primary/20 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-primary/60 uppercase mb-2">Confirm Password</label>
                                <input
                                    type="password"
                                    name="password2"
                                    value={formData.password2}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full bg-background-dark/50 border border-primary/20 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg text-sm font-bold flex items-center gap-3">
                            <span className="material-symbols-outlined">error</span>
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex items-center justify-between pt-4">
                        <Link
                            to="/login"
                            className="text-primary hover:text-primary/80 text-sm font-bold transition-all"
                        >
                            ← Back to Login
                        </Link>
                        <button
                            type="submit"
                            className="bg-primary hover:bg-primary/80 text-background-dark px-8 py-3 rounded-lg font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(19,236,236,0.3)] flex items-center gap-2"
                        >
                            Continue to Face Enrollment
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </div>
                </form>

                {/* Footer Note */}
                <p className="text-center text-white/40 text-xs mt-6">
                    By registering, you agree to the AIMS Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
};

export default StudentRegistration;
