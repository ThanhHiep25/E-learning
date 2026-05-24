import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { User } from '../config/users-data';
import { ApiError, tokenStorage, setUnauthorizedHandler, clearUnauthorizedHandler } from '../services/api';
import { authService } from '../services/auth.service';
import { enrollmentService } from '../services/enrollment.service';
import { useEnrollmentStore } from '../store/useEnrollmentStore';
import toast from 'react-hot-toast';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<User | null>;
    register: (userData: Partial<User>) => Promise<boolean>;
    verifyEmailCode: (code: string) => Promise<boolean>;
    forgotPassword: (email: string) => Promise<boolean>;
    updateUser: (userData: Partial<User>) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    // 🛡️ P0-3 FIX: Track bootstrap state to prevent race with login
    const isBootstrappingRef = useRef(true);
    const resetEnrollments = useEnrollmentStore((s) => s.reset);
    const syncEnrollments = useEnrollmentStore((s) => s.syncEnrollments);

    // 🛡️ P0-3 FIX: Bootstrap with proper cleanup and race prevention
    useEffect(() => {
        isBootstrappingRef.current = true;
        
        const bootstrap = async () => {
            try {
                const token = tokenStorage.get();
                if (!token) {
                    setIsLoading(false);
                    isBootstrappingRef.current = false;
                    return;
                }

                const me = await authService.me();
                // Only update if still bootstrapping (not interrupted by login)
                if (isBootstrappingRef.current) {
                    setUser(me as unknown as User);
                    localStorage.setItem('elearning_user', JSON.stringify(me));
                }
            } catch (err) {
                if (isBootstrappingRef.current) {
                    tokenStorage.clear();
                    localStorage.removeItem('elearning_user');
                    setUser(null);
                    resetEnrollments();
                    enrollmentService.clearCache();
                }
            } finally {
                if (isBootstrappingRef.current) {
                    setIsLoading(false);
                    isBootstrappingRef.current = false;
                }
            }
        };

        bootstrap();
    }, []);

    useEffect(() => {
        if (!user) return;
        if (user.role !== 'STUDENT') return;
        syncEnrollments();
    }, [user]);

    // 🛡️ P0-3 FIX: Login with bootstrap race prevention
    const login = async (email: string, password: string): Promise<User | null> => {
        // Prevent race with bootstrap - mark bootstrap as done
        isBootstrappingRef.current = false;
        
        try {
            enrollmentService.clearCache();
            resetEnrollments();

            // Login to get token, then fetch complete user profile from /auth/me
            await authService.login({ email, password });
            const fullUser = await authService.me();
            setUser(fullUser as unknown as User);
            localStorage.setItem('elearning_user', JSON.stringify(fullUser));
            return fullUser as unknown as User;
        } catch (err) {
            if (err instanceof ApiError && err.status === 403) {
                throw err;
            }
            return null;
        } finally {
            setIsLoading(false);
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
                // Fetch complete user profile from /auth/me to ensure all fields (including avatar) are loaded
                const fullUser = await authService.me();
                setUser(fullUser as unknown as User);
                localStorage.setItem('elearning_user', JSON.stringify(fullUser));
            }
            return true;
        } catch (err) {
            return false;
        }
    };

    const verifyEmailCode = async (code: string): Promise<boolean> => {
        try {
            // Verify code and get token, then fetch complete user profile from /auth/me
            await authService.verifyEmailCode(code);
            const fullUser = await authService.me();
            setUser(fullUser as unknown as User);
            localStorage.setItem('elearning_user', JSON.stringify(fullUser));
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
                skills: updatedData.skills,
                experience: updatedData.experienceList,
                education: updatedData.educationList,
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
        enrollmentService.clearCache();

        try {
            localStorage.removeItem('enrollment-storage');
        } catch {
        }
    };

    // 🛡️ P1-2 FIX: Register global 401 handler
    useEffect(() => {
        const handleUnauthorized = () => {
            // Only show toast if user was actually logged in (had a token)
            const hadToken = !!localStorage.getItem('elearning_token');
            // Clear user state
            setUser(null);
            resetEnrollments();
            enrollmentService.clearCache();
            // Show notification only if previously authenticated
            if (hadToken) {
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }
        };

        setUnauthorizedHandler(handleUnauthorized);

        return () => {
            clearUnauthorizedHandler();
        };
    }, [resetEnrollments]);

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
