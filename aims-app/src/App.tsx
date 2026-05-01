import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import UniversityAdminDashboard from './pages/UniversityAdminDashboard';
import ReportHistory from './pages/ReportHistory';
import AttendanceDashboard from './pages/AttendanceDashboard';
import SubmitWeeklyReport from './pages/SubmitWeeklyReport';
import CompanyAdminDashboard from './pages/CompanyAdminDashboard';
import BrowseInternships from './pages/BrowseInternships';
import Notifications from './pages/Notifications';
import UserProfile from './pages/UserProfile';
import InternshipDetails from './pages/InternshipDetails';
import EvaluationResults from './pages/EvaluationResults';
import Registration from './pages/Registration';
import AccountRecovery from './pages/AccountRecovery';
import InternshipApplication from './pages/InternshipApplication';
import MyApplications from './pages/MyApplications';
import PostInternship from './pages/PostInternship';
import SupervisorReview from './pages/SupervisorReview';
import SystemSettings from './pages/SystemSettings';
import SupportHelp from './pages/SupportHelp';
import LandingPage from './pages/LandingPage';
import AdminUserManagement from './pages/AdminUserManagement';
import SupervisorTasks from './pages/SupervisorTasks';
import SupervisorAttendance from './pages/SupervisorAttendance';
import FaceEnrollment from './pages/FaceEnrollment';
import CameraAttendance from './pages/CameraAttendance';
import ChangePassword from './pages/ChangePassword';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <Router>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Registration />} />
                <Route path="/account-recovery" element={<AccountRecovery />} />
                <Route path="/" element={<LandingPage />} />

                {/* Student routes */}
                <Route path="/student-dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
                <Route path="/browse-internships" element={<ProtectedRoute allowedRoles={['student']}><BrowseInternships /></ProtectedRoute>} />
                <Route path="/internship/:id" element={<ProtectedRoute allowedRoles={['student']}><InternshipDetails /></ProtectedRoute>} />
                <Route path="/internship-application" element={<ProtectedRoute allowedRoles={['student']}><InternshipApplication /></ProtectedRoute>} />
                <Route path="/my-applications" element={<ProtectedRoute allowedRoles={['student']}><MyApplications /></ProtectedRoute>} />
                <Route path="/attendance" element={<ProtectedRoute allowedRoles={['student']}><AttendanceDashboard /></ProtectedRoute>} />
                <Route path="/enroll-face" element={<ProtectedRoute allowedRoles={['student']}><FaceEnrollment /></ProtectedRoute>} />
                <Route path="/camera-attendance" element={<ProtectedRoute allowedRoles={['student']}><CameraAttendance /></ProtectedRoute>} />
                <Route path="/submit-report" element={<ProtectedRoute allowedRoles={['student']}><SubmitWeeklyReport /></ProtectedRoute>} />

                {/* Supervisor routes */}
                <Route path="/supervisor-dashboard" element={<ProtectedRoute allowedRoles={['supervisor']}><SupervisorDashboard /></ProtectedRoute>} />
                <Route path="/supervisor/attendance" element={<ProtectedRoute allowedRoles={['supervisor']}><SupervisorAttendance /></ProtectedRoute>} />
                <Route path="/supervisor/tasks" element={<ProtectedRoute allowedRoles={['supervisor']}><SupervisorTasks /></ProtectedRoute>} />

                {/* University Admin routes */}
                <Route path="/university-dashboard" element={<ProtectedRoute allowedRoles={['university_admin']}><UniversityAdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['university_admin', 'company_admin']}><AdminUserManagement /></ProtectedRoute>} />

                {/* Company Admin routes */}
                <Route path="/company-dashboard" element={<ProtectedRoute allowedRoles={['company_admin']}><CompanyAdminDashboard /></ProtectedRoute>} />
                <Route path="/post-internship" element={<ProtectedRoute allowedRoles={['company_admin']}><PostInternship /></ProtectedRoute>} />

                {/* Shared authenticated routes (any logged-in user) */}
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/report-history" element={<ProtectedRoute><ReportHistory /></ProtectedRoute>} />
                <Route path="/evaluation-results" element={<ProtectedRoute><EvaluationResults /></ProtectedRoute>} />
                <Route path="/report/:id" element={<ProtectedRoute allowedRoles={['supervisor', 'university_admin']}><SupervisorReview /></ProtectedRoute>} />
                <Route path="/evaluate/:studentId" element={<ProtectedRoute allowedRoles={['supervisor', 'university_admin']}><EvaluationResults /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute allowedRoles={['university_admin']}><SystemSettings /></ProtectedRoute>} />
                <Route path="/support" element={<ProtectedRoute><SupportHelp /></ProtectedRoute>} />
                <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
