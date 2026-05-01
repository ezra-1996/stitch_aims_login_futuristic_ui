import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

type UserRole = 'student' | 'supervisor' | 'company_admin' | 'university_admin';

interface ProtectedRouteProps {
    children: React.ReactNode;
    /** If set, only these roles can access the route */
    allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user } = useUser();
    const token = localStorage.getItem('access_token');

    // Not logged in → redirect to login
    if (!user || !token) {
        return <Navigate to="/login" replace />;
    }

    // Role check (if roles are specified)
    if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(user.role)) {
            // Redirect to the user's own dashboard
            const dashboardMap: Record<UserRole, string> = {
                student: '/student-dashboard',
                supervisor: '/supervisor-dashboard',
                company_admin: '/company-dashboard',
                university_admin: '/university-dashboard',
            };
            return <Navigate to={dashboardMap[user.role as UserRole] || '/login'} replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
