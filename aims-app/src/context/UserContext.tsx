import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usersAPI } from '../services/api';

type UserRole = 'student' | 'supervisor' | 'company_admin' | 'university_admin';

interface User {
    name: string;
    role: UserRole;
    avatar?: string;
    must_change_password?: boolean;
}

interface UserContextType {
    user: User | any | null;
    profilePhotoUrl: string | null;
    login: (userData: any) => void;
    logout: () => void;
    refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | any | null>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

    // Fetch profile photo once when user changes (instead of in every Header/Sidebar)
    useEffect(() => {
        if (user) {
            usersAPI.getCurrentUserProfile().then((data: any) => {
                if (data.profile_photo_url) setProfilePhotoUrl(data.profile_photo_url);
            }).catch(() => {});
        } else {
            setProfilePhotoUrl(null);
        }
    }, [user]);

    const login = (userData: any) => {
        const enrichedUser = {
            name: userData.full_name || userData.name || userData.email,
            role: userData.role,
            avatar: userData.avatar || undefined,
            ...userData
        };
        setUser(enrichedUser);
        localStorage.setItem('user', JSON.stringify(enrichedUser));
    };

    const logout = () => {
        setUser(null);
        setProfilePhotoUrl(null);
        localStorage.clear();
    };

    const refreshProfile = async () => {
        if (user) {
            try {
                const data = await usersAPI.getCurrentUserProfile();
                if (data.profile_photo_url) setProfilePhotoUrl(data.profile_photo_url);
                // Also update user object if needed
                const enrichedUser = { ...user, ...data };
                setUser(enrichedUser);
                localStorage.setItem('user', JSON.stringify(enrichedUser));
            } catch (err) {
                console.error('Failed to refresh profile:', err);
            }
        }
    };

    return (
        <UserContext.Provider value={{ user, profilePhotoUrl, login, logout, refreshProfile }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
