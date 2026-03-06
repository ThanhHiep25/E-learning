import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../config/users-data';
import { authService } from '../api/authService';
import toast from 'react-hot-toast';

interface AuthContextType {
    user: (User & { token?: string }) | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (userData: Partial<User>) => Promise<boolean>;
    verifyEmailCode: (code: string) => Promise<boolean>;
    resendVerification: (email: string) => Promise<boolean>;
    forgotPassword: (email: string) => Promise<boolean>;
    updateUser: (userData: Partial<User>) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<(User & { token?: string }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        const storedUserStr = localStorage.getItem('elearning_user');
        if (storedUserStr) {
            try {
                const storedUser = JSON.parse(storedUserStr);
                const response = await authService.getCurrentUser();
                if (response.success && response.data) {
                    const userData = response.data;
                    const currentUser = {
                        ...userData,
                        fullName: userData.name,
                        role: userData.role.toUpperCase() as UserRole,
                        token: storedUser.token,
                        avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
                        enrolledCourses: []
                    };
                    setUser(currentUser);
                    localStorage.setItem('elearning_user', JSON.stringify(currentUser));
                } else {
                    logout();
                }
            } catch (error) {
                console.error("Auth check failed", error);
                logout();
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            const response = await authService.login({ email, password });
            if (response.success && response.data) {
                const { user: beUser, token } = response.data;
                const formattedUser: User & { token: string } = {
                    id: beUser.id,
                    fullName: beUser.name,
                    username: beUser.username,
                    email: beUser.email,
                    role: beUser.role.toUpperCase() as UserRole,
                    avatar: beUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${beUser.email}`,
                    phone: beUser.phone,
                    enrolledCourses: [],
                    token
                };
                setUser(formattedUser);
                localStorage.setItem('elearning_user', JSON.stringify(formattedUser));
                toast.success('Đăng nhập thành công!');
                return true;
            } else {
                toast.error(response.message || 'Đăng nhập thất bại');
                return false;
            }
        } catch (error) {
            toast.error('Lỗi khi đăng nhập');
            return false;
        }
    };

    const register = async (userData: Partial<User>): Promise<boolean> => {
        try {
            const response = await authService.register({
                name: userData.fullName,
                username: userData.username || userData.email?.split('@')[0],
                email: userData.email,
                password: userData.password,
                role: userData.role?.toLowerCase() || 'student'
            });

            if (response.success) {
                toast.success('Đăng ký thành công! Hãy kiểm tra email để xác nhận.');
                return true;
            } else {
                toast.error(response.message || 'Đăng ký thất bại');
                return false;
            }
        } catch (error) {
            toast.error('Lỗi khi đăng ký');
            return false;
        }
    };

    const verifyEmailCode = async (code: string): Promise<boolean> => {
        try {
            const response = await authService.verifyEmailCode(code);
            if (response.success) {
                toast.success('Xác thực thành công! Đang đăng nhập...');
                // Usually after verification, the backend might return the token, 
                // but the docs say it returns the verified user. 
                // If it doesn't return a token, user might have to login.
                // For simplicity, let's assume we need to login or redirect.
                return true;
            } else {
                toast.error(response.message || 'Mã xác thực không hợp lệ');
                return false;
            }
        } catch (error) {
            toast.error('Lỗi khi xác thực');
            return false;
        }
    };

    const updateUser = async (updatedData: Partial<User>): Promise<boolean> => {
        if (!user) return false;
        // Mock update for now, or you could implement an updateProfile endpoint
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem('elearning_user', JSON.stringify(newUser));
        return true;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('elearning_user');
        window.location.href = '/login'; // Redirect on logout
    };

    const resendVerification = async (email: string): Promise<boolean> => {
        try {
            const response = await authService.resendVerification(email);
            if (response.success) {
                toast.success('Mã xác thực đã được gửi lại!');
                return true;
            } else {
                toast.error(response.message || 'Gửi lại thất bại');
                return false;
            }
        } catch (error) {
            toast.error('Lỗi khi gửi lại mã');
            return false;
        }
    };

    const forgotPassword = async (email: string): Promise<boolean> => {
        try {
            const response = await authService.forgotPassword(email);
            if (response.success) {
                toast.success('Yêu cầu đặt lại mật khẩu đã được gửi!');
                return true;
            } else {
                toast.error(response.message || 'Gửi yêu cầu thất bại');
                return false;
            }
        } catch (error) {
            toast.error('Lỗi khi gửi yêu cầu');
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, verifyEmailCode, resendVerification, forgotPassword, updateUser, logout, isLoading }}>
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
