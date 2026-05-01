import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available; do not set Content-Type for FormData
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
        delete (config.headers as any)['Content-Type'];
    }
    return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                        refresh: refreshToken,
                    });

                    localStorage.setItem('access_token', response.data.access);
                    originalRequest.headers.Authorization = `Bearer ${response.data.access}`;

                    return api(originalRequest);
                } catch (refreshError) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: async (username: string, password: string) => {
        const response = await api.post('/auth/login/', { username, password });
        return response.data;
    },

    registerStudent: async (data: {
        username: string;
        email: string;
        password: string;
        password2: string;
        full_name: string;
        phone_number?: string;
        university_id: string;
        department: string;
        year: number;
    }) => {
        const response = await api.post('/auth/register/student/', data);
        return response.data;
    },

    registerSupervisor: async (data: {
        username: string;
        email: string;
        password: string;
        password2: string;
        full_name: string;
        phone_number?: string;
        organization?: number;
        department?: string;
        job_title?: string;
    }) => {
        const response = await api.post('/auth/register/supervisor/', data);
        return response.data;
    },

    registerCompany: async (data: any) => {
        const response = await api.post('/auth/register/company/', data);
        return response.data;
    },

    registerUniversityAdmin: async (data: any) => {
        const response = await api.post('/auth/register/university-admin/', data);
        return response.data;
    },

    // Password reset
    passwordResetRequest: async (email: string) => {
        const response = await api.post('/auth/password-reset/', { email });
        return response.data;
    },

    passwordResetConfirm: async (uid: string, token: string, newPassword: string, newPasswordConfirm: string) => {
        const response = await api.post('/auth/password-reset/confirm/', {
            uid,
            token,
            new_password: newPassword,
            new_password_confirm: newPasswordConfirm,
        });
        return response.data;
    },

    // Username recovery
    usernameRecovery: async (email: string) => {
        const response = await api.post('/auth/username-recovery/', { email });
        return response.data;
    },
};

// Organizations & Internship posts
export const organizationsAPI = {
    getActiveInternships: () => api.get('/organizations/active-internships/').then((r) => r.data),
    getInternshipPost: (id: number) => api.get(`/organizations/internship-posts/${id}/`).then((r) => r.data),
    getOrganizations: () => api.get('/organizations/organizations/').then((r) => r.data),
    createInternshipPost: (data: {
        organization?: number;
        title: string;
        description: string;
        requirements: string;
        duration_months: number;
        capacity: number;
        application_deadline: string;
        is_active?: boolean;
    }) => api.post('/organizations/internship-posts/', data).then((r) => r.data),
    approveOrganization: (orgId: number) => api.post(`/organizations/organizations/${orgId}/approve/`).then((r) => r.data),
    rejectOrganization: (orgId: number) => api.post(`/organizations/organizations/${orgId}/reject/`).then((r) => r.data),
    updateOrganization: (id: number, data: any) => api.patch(`/organizations/organizations/${id}/`, data).then((r) => r.data),
};

// Evaluation / weekly reports
export const evaluationAPI = {
    getWeeklyReports: () => api.get('/evaluation/weekly-reports/').then((r) => r.data),
    getWeeklyReport: (id: number) => api.get(`/evaluation/weekly-reports/${id}/`).then((r) => r.data),
    submitWeeklyReport: (data: any) => api.post('/evaluation/weekly-reports/', data).then((r) => r.data),
    updateWeeklyReport: (id: number, data: any) => api.patch(`/evaluation/weekly-reports/${id}/`, data).then((r) => r.data),
    createWeeklyReport: (data: { week_number: number; title: string; content: string; tasks_completed: string; challenges_faced?: string; lessons_learned?: string }) =>
        api.post('/evaluation/weekly-reports/', data).then((r) => r.data),
    getAIEvaluation: (reportId: number) => api.get(`/evaluation/weekly-reports/${reportId}/ai-evaluation/`).then((r) => r.data),
    getSupervisorEvaluation: (reportId: number) => api.get(`/evaluation/weekly-reports/${reportId}/supervisor-evaluation/`).then((r) => r.data),
    createSupervisorEvaluation: (data: {
        report: number;
        supervisor?: number;
        technical_skill: number;
        communication: number;
        teamwork: number;
        initiative: number;
        overall_performance: number;
        final_score: number;
        remarks?: string;
    }) => api.post('/evaluation/supervisor-evaluations/', data).then((r) => r.data),
    updateReportStatus: (reportId: number, status: string, feedback?: string) =>
        api.patch(`/evaluation/weekly-reports/${reportId}/`, { status, supervisor_feedback: feedback }).then((r) => r.data),
};

// Notifications
export const notificationsAPI = {
    getNotifications: () => api.get('/auth/notifications/').then((r) => r.data),
    markAllRead: () => api.post('/auth/notifications/mark-read/').then((r) => r.data),
    dismiss: (id: number) => api.delete(`/auth/notifications/${id}/`).then((r) => r.data),
};

// Attendance
export const attendanceAPI = {
    getAttendance: () => api.get('/attendance/attendance/').then((r) => r.data),
    createAttendance: (data: { date: string; status: string; verification_method?: string; check_in_time?: string; notes?: string }) =>
        api.post('/attendance/attendance/', data).then((r) => r.data),
    createSupervisorAttendance: (data: { student: number; date: string; status: string; notes?: string }) =>
        api.post('/attendance/attendance/', data).then((r) => r.data),
    updateAttendanceStatus: (id: number, status: string, notes?: string) =>
        api.patch(`/attendance/attendance/${id}/`, { status, notes }).then((r) => r.data),
    updateAttendance: (id: number, data: any) =>
        api.patch(`/attendance/attendance/${id}/`, data).then((r) => r.data),
    deleteAttendance: (id: number) =>
        api.delete(`/attendance/attendance/${id}/`).then((r) => r.data),
    getStudentSummary: (studentId: number) =>
        api.get(`/attendance/students/${studentId}/attendance-summary/`).then((r) => r.data),
};

// Internship applications
export const internshipsAPI = {
    getApplications: () => api.get('/internships/applications/').then((r) => r.data),
    getApplication: (id: number) => api.get(`/internships/applications/${id}/`).then((r) => r.data),
    createApplication: (postId: number, coverLetter?: string) =>
        api.post('/internships/applications/', { post: postId, cover_letter: coverLetter || '' }).then((r) => r.data),
    getSupervisorAssignments: () => api.get('/internships/supervisor-assignments/').then((r) => r.data),
    createSupervisorAssignment: (data: { supervisor?: number; student: number; organization: number; is_active?: boolean; start_date?: string; end_date?: string }) =>
        api.post('/internships/supervisor-assignments/', { ...data, is_active: data.is_active ?? true }).then((r) => r.data),
    updateSupervisorAssignment: (id: number, data: any) => api.patch(`/internships/supervisor-assignments/${id}/`, data).then((r) => r.data),
    approveApplication: (applicationId: number) =>
        api.post(`/internships/applications/${applicationId}/approve/`).then((r) => r.data),
    updateApplicationStatus: (id: number, status: string) => api.patch(`/internships/applications/${id}/`, { status }).then((r) => r.data),

    // Tasks
    getTasks: () => api.get('/internships/tasks/').then((r) => r.data),
    getTask: (id: number) => api.get(`/internships/tasks/${id}/`).then((r) => r.data),
    createTask: (data: { student: number; title: string; description: string; due_date?: string }) =>
        api.post('/internships/tasks/', data).then((r) => r.data),
    updateTask: (id: number, data: any) => api.patch(`/internships/tasks/${id}/`, data).then((r) => r.data),
};

// Users helpers (role-based lists)
export const usersAPI = {
    getStudents: () => api.get('/auth/students/').then((r) => r.data),
    getSupervisors: () => api.get('/auth/supervisors/').then((r) => r.data),
    approveStudent: (studentId: number) => api.post(`/auth/students/${studentId}/approve/`).then((r) => r.data),
    
    // Get current user profile
    getCurrentUserProfile: () => api.get('/auth/users/me/').then((r) => r.data),
    
    // Upload profile photo (specialized endpoint with AI re-enrollment)
    uploadProfilePhoto: async (file: File) => {
        const formData = new FormData();
        formData.append('profile_photo', file);
        const response = await api.post('/auth/users/profile-photo/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Delete profile photo
    deleteProfilePhoto: () => api.delete('/auth/users/profile-photo/').then((r) => r.data),

    // Bulk biometric re-enrollment (Admin only)
    reEnrollAllStudents: () => api.post('/auth/users/re-enroll-all/').then((r) => r.data),

    // Get all users (Admin only)
    getUsers: () => api.get('/auth/users/').then((r) => r.data),

    // Demo password reset (Admin only)
    demoResetPassword: (userId: number, sendEmail: boolean = false) => api.post(`/auth/users/${userId}/demo-reset-password/`, { send_email: sendEmail }).then((r) => r.data),

    // Change password (Authenticated users)
    changePassword: (data: any) => api.post('/auth/change-password/', data).then((r) => r.data),
};

// AI Services API (use api instance so Bearer token is sent)
export const aiAPI = {
    enrollFace: async (studentId: string, imageBlob: Blob, forceUpdate: boolean = false) => {
        const formData = new FormData();
        formData.append('student_id', studentId);
        formData.append('image', imageBlob, 'face.jpg');
        if (forceUpdate) formData.append('force_update', 'true');
        const response = await api.post('/ai/face/enroll/', formData);
        return response.data;
    },

    getEnrollmentStatus: async (studentId: string) => {
        const response = await api.get(`/ai/face/enroll/?student_id=${studentId}`);
        return response.data;
    },

    deleteFaceEnrollment: async (studentId: string) => {
        const response = await api.delete(`/ai/face/enroll/?student_id=${studentId}`);
        return response.data;
    },

    verifyFace: async (studentId: string, imageBlob: Blob, latitude?: number, longitude?: number) => {
        const formData = new FormData();
        formData.append('student_id', studentId);
        formData.append('image', imageBlob, 'capture.jpg');
        if (latitude !== undefined) formData.append('latitude', String(latitude));
        if (longitude !== undefined) formData.append('longitude', String(longitude));
        // Endpoint changed to attendance verify
        const response = await api.post('/attendance/mark-ai/', formData);
        return response.data;
    },

    evaluateReport: async (reportText: string, taskDescription: string = '') => {
        const response = await api.post('/ai/report/evaluate/', {
            report_text: reportText,
            task_description: taskDescription,
        });
        return response.data;
    },
};

export default api;
