import React, { useState, useRef, useEffect } from 'react';
import { X, User, Lock, Mail, Phone, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'OTP_VERIFY';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: AuthMode;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'LOGIN' }) => {
    const { login, register } = useAuth();
    const [mode, setMode] = useState<AuthMode>(initialMode);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
    const [otpError, setOtpError] = useState(false);
    const [otpSuccess, setOtpSuccess] = useState(false);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setOtp(new Array(6).fill(''));
            setOtpError(false);
            setOtpSuccess(false);
            setError('');
            // Reset form
            setEmail('');
            setPassword('');
            setFullName('');
            setPhoneNumber('');
            setConfirmPassword('');
        }
    }, [isOpen, initialMode]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const success = await login(email, password);
            if (success) {
                onClose();
            } else {
                setError('Email hoặc mật khẩu không chính xác');
            }
        } catch (err) {
            setError('Đã có lỗi xảy ra. Vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterStep1 = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }
        if (!email || !password || !fullName) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }
        setMode('OTP_VERIFY');
    };

    const handleFinalRegister = async () => {
        setLoading(true);
        try {
            await register({
                email,
                password,
                fullName,
                phone: phoneNumber,
                role: 'STUDENT'
            });
            onClose();
        } catch (err) {
            setError('Không thể đăng ký. Vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return false;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        if (element.value !== '' && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }

        if (newOtp.every(val => val !== '')) {
            const code = newOtp.join('');
            if (code === '123456') {
                setOtpSuccess(true);
                setOtpError(false);
            } else {
                setOtpError(true);
                setOtpSuccess(false);
            }
        } else {
            setOtpError(false);
            setOtpSuccess(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    if (!isOpen) return null;

    const renderHeader = (title: string) => (
        <div className="flex items-center justify-between mb-6 relative">
            <h2 className="text-2xl font-bold text-gray-800 text-center w-full">{title}</h2>
            <button
                onClick={onClose}
                className="absolute right-[-10px] top-[-30px] cursor-pointer p-2 bg-white rounded-full shadow-lg text-gray-400 hover:text-gray-600 border border-gray-100 transition-all"
            >
                <X size={20} />
            </button>
        </div>
    );

    const inputClasses = "w-full border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none transition-all placeholder:text-gray-300 disabled:bg-gray-50";

    const renderLogin = () => (
        <form onSubmit={handleLogin} className="space-y-4 pt-4">
            {renderHeader('Đăng nhập')}
            {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg">{error}</p>}
            <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70" size={24} strokeWidth={2.5} />
                <input
                    type="email"
                    placeholder="Email đăng nhập"
                    className={inputClasses}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70" size={24} strokeWidth={2.5} />
                <input
                    type="password"
                    placeholder="Mật khẩu"
                    className={inputClasses}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <button
                type="button"
                onClick={() => setMode('FORGOT_PASSWORD')}
                className="text-blue-500 text-sm font-medium hover:underline block"
            >
                Quên mật khẩu?
            </button>
            <button
                type="submit"
                disabled={loading}
                className="w-full cursor-pointer bg-[#A32323] hover:bg-[#8B1E1E] text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-[0.98] mt-4 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {loading && <Loader2 size={20} className="animate-spin" />}
                Đăng nhập
            </button>
            <p className="text-center text-sm text-gray-600">
                Không có tài khoản?{' '}
                <button type="button" onClick={() => setMode('REGISTER')} className="text-blue-500 font-bold hover:underline cursor-pointer">
                    Đăng ký ngay
                </button>
            </p>
        </form>
    );

    const renderRegister = () => (
        <form onSubmit={handleRegisterStep1} className="space-y-6 pt-4">
            {renderHeader('Đăng ký tài khoản')}
            {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg">{error}</p>}
            <div className="grid grid-cols-2 gap-x-12 relative">
                <div className="absolute top-[-30px] left-0 right-0 flex justify-between px-2 text-sm font-bold text-gray-400">
                    <span className="text-amber-600">1. Thông tin tài khoản</span>
                    <span>2. Thông tin cá nhân</span>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70" size={20} />
                        <input
                            type="email"
                            placeholder="Email đăng ký*"
                            className={inputClasses}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70" size={20} />
                        <input
                            type="password"
                            placeholder="Mật khẩu*"
                            className={inputClasses}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70" size={20} />
                        <input
                            type="password"
                            placeholder="Xác nhận mật khẩu*"
                            className={inputClasses}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70" size={20} />
                        <input
                            type="text"
                            placeholder="Họ và tên*"
                            className={inputClasses}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70" size={20} />
                        <input
                            type="text"
                            placeholder="Số điện thoại"
                            className={inputClasses}
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                        <p className="text-[10px] text-amber-700 font-bold leading-tight">
                            Bằng cách đăng ký, bạn đồng ý với các điều khoản sử dụng của E-Learning.
                        </p>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                className="w-full cursor-pointer bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-[0.98] mt-4"
            >
                Tiếp tục (Nhận mã OTP)
            </button>
            <p className="text-center text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <button type="button" onClick={() => setMode('LOGIN')} className="text-blue-500 font-bold hover:underline cursor-pointer">
                    Đăng nhập ngay
                </button>
            </p>
        </form>
    );

    const renderForgotPassword = () => (
        <div className="space-y-6 pt-4">
            {renderHeader('Khôi phục mật khẩu')}
            <p className="text-center text-gray-800 font-medium px-4">
                Vui lòng nhập email đã đăng ký để nhận hướng dẫn lấy lại mật khẩu.
            </p>
            <div className="relative mt-8">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70" size={20} />
                <input
                    type="email"
                    placeholder="Email của bạn"
                    className={inputClasses}
                />
            </div>
            <div className="flex justify-center gap-6 pt-4">
                <button
                    onClick={() => setMode('LOGIN')}
                    className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all cursor-pointer"
                >
                    Hủy bỏ
                </button>
                <button className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-100">
                    Gửi yêu cầu
                </button>
            </div>
        </div>
    );

    const renderOtpVerify = () => (
        <div className="space-y-6 pt-4">
            {renderHeader('Xác thực OTP')}
            <p className="text-center text-gray-600">
                Mã xác thực đã được gửi tới email <b>{email}</b>. Nhập <b>123456</b> để test.
            </p>
            <div className="flex justify-center gap-3">
                {otp.map((data, index) => (
                    <input
                        key={index}
                        type="text"
                        maxLength={1}
                        ref={(el) => {
                            otpRefs.current[index] = el;
                        }}
                        value={data}
                        onChange={(e) => handleOtpChange(e.target, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all
                            ${otpError ? 'border-red-500 bg-red-50 text-red-600' :
                                otpSuccess ? 'border-green-500 bg-green-50 text-green-600' :
                                    'border-gray-200 focus:border-amber-500'}`}
                    />
                ))}
            </div>
            {otpError && (
                <p className="text-center text-red-500 text-sm font-bold animate-shake">Mã OTP không chính xác. Thử lại với 123456</p>
            )}
            {otpSuccess && (
                <p className="text-center text-green-500 text-sm font-bold">Xác thực thành công! Đang hoàn tất đăng ký...</p>
            )}
            <div className="text-center pt-2">
                <button
                    type="button"
                    className="text-amber-600 font-bold hover:underline cursor-pointer text-sm"
                    onClick={() => {
                        setOtp(new Array(6).fill(''));
                        setOtpError(false);
                        setOtpSuccess(false);
                    }}
                >
                    Gửi lại mã mới
                </button>
            </div>
            <button
                onClick={handleFinalRegister}
                disabled={!otpSuccess || loading}
                className={`w-full font-bold py-4 rounded-xl transition-all shadow-md mt-4 flex items-center justify-center gap-2
                    ${otpSuccess ? 'bg-[#A32323] hover:bg-[#8B1E1E] text-white cursor-pointer shadow-red-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
                {loading && <Loader2 size={20} className="animate-spin" />}
                Xác nhận & Đăng ký
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className={`bg-white rounded-[32px] w-full ${mode === 'REGISTER' ? 'max-w-4xl' : 'max-w-xl'} p-10 shadow-3xl relative animate-in slide-in-from-bottom-8 duration-500`}>
                {mode === 'LOGIN' && renderLogin()}
                {mode === 'REGISTER' && renderRegister()}
                {mode === 'FORGOT_PASSWORD' && renderForgotPassword()}
                {mode === 'OTP_VERIFY' && renderOtpVerify()}
            </div>
        </div>
    );
};

export default AuthModal;
