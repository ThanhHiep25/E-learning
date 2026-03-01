import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../config/users-data';
import { mockUsers } from '../config/users-data';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (userData: Partial<User>) => Promise<boolean>;
    updateUser: (userData: Partial<User>) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Mock session check from localStorage
        const storedUser = localStorage.getItem('elearning_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        // Find in mock data or localStorage (simulated registered users)
        const allUsers = [...mockUsers, ...JSON.parse(localStorage.getItem('registered_users') || '[]')];
        const foundUser = allUsers.find(u => u.email === email && u.password === password);

        if (foundUser) {
            const { password: _, ...userWithoutPassword } = foundUser;
            setUser(userWithoutPassword as User);
            localStorage.setItem('elearning_user', JSON.stringify(userWithoutPassword));
            return true;
        }
        return false;
    };

    const register = async (userData: Partial<User>): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newUser: User = {
            id: `u${Date.now()}`,
            fullName: userData.fullName || 'User',
            email: userData.email || '',
            password: userData.password,
            role: userData.role || 'STUDENT',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email || Date.now()}`,
            enrolledCourses: [],
            ...userData
        };

        // Save to mock database in localStorage
        const existing = JSON.parse(localStorage.getItem('registered_users') || '[]');
        localStorage.setItem('registered_users', JSON.stringify([...existing, newUser]));

        // Login automatically
        const { password: _, ...userWithoutPassword } = newUser;
        setUser(userWithoutPassword as User);
        localStorage.setItem('elearning_user', JSON.stringify(userWithoutPassword));

        return true;
    };

    const updateUser = async (updatedData: Partial<User>): Promise<boolean> => {
        if (!user) return false;

        const updatedUser = { ...user, ...updatedData };
        setUser(updatedUser);
        localStorage.setItem('elearning_user', JSON.stringify(updatedUser));

        // Update in the "database" of registered users
        const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const updatedRegisteredUsers = registeredUsers.map((u: User) =>
            u.id === user.id ? { ...u, ...updatedData } : u
        );
        localStorage.setItem('registered_users', JSON.stringify(updatedRegisteredUsers));

        return true;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('elearning_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, updateUser, logout, isLoading }}>
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
