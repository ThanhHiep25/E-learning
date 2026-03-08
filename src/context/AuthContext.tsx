import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../config/users-data';
import { ApiError, tokenStorage } from '../services/api';
import { authService } from '../services/auth.service';
import { enrollmentService } from '../services/enrollment.service';
import { useEnrollmentStore } from '../store/useEnrollmentStore';
import { useCourseStore } from '../store/useCourseStore';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (userData: Partial<User>) => Promise<boolean>;
    verifyEmailCode: (token: string) => Promise<boolean>;
    forgotPassword: (email: string) => Promise<boolean>;
    updateUser: (userData: Partial<User>) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const resetEnrollments = useEnrollmentStore((s) => s.reset);
    const syncEnrollments = useEnrollmentStore((s) => s.syncEnrollments);
    const resetCourses = useCourseStore((s) => s.reset);

    useEffect(() => {
        const bootstrap = async () => {
            try {
                const token = tokenStorage.get();
                if (!token) {
                    setIsLoading(false);
                    return;
                }

                const me = await authService.me();
                setUser(me as unknown as User);
                localStorage.setItem('elearning_user', JSON.stringify(me));
            } catch (err) {
                tokenStorage.clear();
                localStorage.removeItem('elearning_user');
                setUser(null);
                resetEnrollments();
                resetCourses();
                enrollmentService.clearCache();
            } finally {
                setIsLoading(false);
            }
        };

        bootstrap();
    }, []);

    useEffect(() => {
        if (!user) return;
        if (user.role !== 'STUDENT') return;
        syncEnrollments();
    }, [user]);

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            enrollmentService.clearCache();
            resetEnrollments();
            resetCourses();

            const result = await authService.login({ email, password });
            setUser(result.user as unknown as User);
            localStorage.setItem('elearning_user', JSON.stringify(result.user));
            return true;
        } catch (err) {
            if (err instanceof ApiError && err.status === 403) {
                throw err;
            }
            return false;
        }
    };

    const register = async (userData: Partial<User>): Promise<boolean> => {
        const email = userData.email || "";
        const name = userData.fullName || "User";
        const password = userData.password || "";
        const username =
            userData.username ||
            email.split("@")[0] ||
            `user_${Date.now()}`;

        try {
            const result = await authService.register({
                email,
                name,
                password,
                username,
                phone: userData.phone,
                role: "student",
            });
            if (result.token) {
                setUser(result.user as unknown as User);
                localStorage.setItem('elearning_user', JSON.stringify(result.user));
            }
            return true;
        } catch (err) {
            return false;
        }
    };

    const verifyEmailCode = async (token: string): Promise<boolean> => {
        try {
            const result = await authService.verifyEmailCode(token);
            if (result.token) {
                setUser(result.user as unknown as User);
                localStorage.setItem('elearning_user', JSON.stringify(result.user));
            }
            return true;
        } catch (err) {
            return false;
        }
    };

    const forgotPassword = async (email: string): Promise<boolean> => {
        try {
            await authService.forgotPassword(email);
            return true;
        } catch (err) {
            return false;
        }
    };

    const updateUser = async (updatedData: Partial<User>): Promise<boolean> => {
        if (!user) return false;

        try {
            const me = await authService.updateMe({
                name: updatedData.fullName,
                phone: updatedData.phone,
                avatar: updatedData.avatar,
            });
            setUser(me as unknown as User);
            localStorage.setItem('elearning_user', JSON.stringify(me));
            return true;
        } catch {
            const updatedUser = { ...user, ...updatedData };
            setUser(updatedUser);
            localStorage.setItem('elearning_user', JSON.stringify(updatedUser));
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('elearning_user');
        authService.logout();
        resetEnrollments();
        resetCourses();
        enrollmentService.clearCache();

        try {
            localStorage.removeItem('enrollment-storage');
            localStorage.removeItem('course-storage');
        } catch {
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, verifyEmailCode, forgotPassword, updateUser, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
