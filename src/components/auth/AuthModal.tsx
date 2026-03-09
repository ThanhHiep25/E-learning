import React, { useState, useRef, useEffect } from 'react';
import { X, User, Lock, Mail, Phone, Loader2, EyeOff, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'OTP_VERIFY';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: AuthMode;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'LOGIN' }) => {
    const { login, register, verifyEmailCode, forgotPassword } = useAuth();
    const [mode, setMode] = useState<AuthMode>(initialMode);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
    const [otpError, setOtpError] = useState(false);
    const [otpSuccess, setOtpSuccess] = useState(false);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [pendingRegister, setPendingRegister] = useState<{
        email: string;
        password: string;
        fullName: string;
        phone?: string;
    } | null>(null);

    const [forgotEmail, setForgotEmail] = useState('');

    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setOtp(new Array(6).fill(''));
            setOtpError(false);
            setOtpSuccess(false);
            setError('');
            setPendingRegister(null);
            // Reset form
            setEmail('');
            setPassword('');
            setFullName('');
            setPhoneNumber('');
            setConfirmPassword('');
            setForgotEmail('');

            // Load remembered email
            const savedEmail = localStorage.getItem('remembered_email');
            if (savedEmail) {
                setEmail(savedEmail);
                setRememberMe(true);
            } else {
                setRememberMe(false);
            }
        }
    }, [isOpen, initialMode]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const success = await login(email, password);
            if (success) {
                if (rememberMe) {
                    localStorage.setItem('remembered_email', email);
                } else {
                    localStorage.removeItem('remembered_email');
                }
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

    //check password register
    const checkPassword = (password: string) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    };

    //Check password match register
    const checkPasswordMatch = (password: string, confirmPassword: string) => {
        return password === confirmPassword;
    };

    const handleRegisterStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkPassword(password)) {
            setError('Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
            return;
        }
        if (!checkPasswordMatch(password, confirmPassword)) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }
        if (!email || !password || !fullName) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        setError('');
        setLoading(true);
        try {
            const ok = await register({
                email,
                password,
                fullName,
                phone: phoneNumber,
                role: 'STUDENT'
            });

            if (!ok) {
                setError('Không thể đăng ký. Vui lòng thử lại');
                return;
            }

            setPendingRegister({
                email,
                password,
                fullName,
                phone: phoneNumber,
            });

            setMode('OTP_VERIFY');
        } catch (err) {
            setError('Không thể đăng ký. Vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalRegister = async (customOtp?: string) => {
        const code = customOtp || otp.join('');
        if (code.length !== 6) return;
        if (!pendingRegister) {
            setError('Phiên đăng ký đã hết hạn. Vui lòng thử lại.');
            setMode('REGISTER');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const verified = await verifyEmailCode(code);
            if (!verified) {
                setOtpError(true);
                setOtpSuccess(false);
                return;
            }

            setOtpSuccess(true);
            setOtpError(false);

            // Wait a bit to show success message before closing/logging in
            setTimeout(async () => {
                // Try to login if not already logged in by verifyEmailCode
                const loggedIn = await login(pendingRegister.email, pendingRegister.password);
                if (loggedIn) {
                    onClose();
                }
            }, 1000);
        } catch (err) {
            setOtpError(true);
            setOtpSuccess(false);
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
            setOtpError(false);
            // Auto submit when all digits are filled
            const fullOtp = newOtp.join('');
            setTimeout(() => {
                handleFinalRegister(fullOtp);
            }, 100);
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
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    onClose();
                }}
                className="absolute right-[-10px] top-[-30px] cursor-pointer p-2 bg-white rounded-full  text-gray-400 hover:text-gray-600 transition-all"
            >
                <X size={20} />
            </button>
        </div>
    );

    const inputClasses = "w-full border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none transition-all placeholder:text-gray-300 disabled:bg-gray-50";

    const renderLogin = () => (
        <form onSubmit={handleLogin} className="space-y-4 pt-4">
            {renderHeader('Đăng nhập')}
            {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 mb-12 rounded-lg">{error}</p>}
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
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mật khẩu"
                    className={inputClasses}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2  cursor-pointer"
                >
                    {showPassword ? <EyeOff size={18} className="text-gray-400" strokeWidth={2.5} /> : <Eye size={18} className="text-gray-400" strokeWidth={2.5} />}
                </button>
            </div>
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                        <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded-md transition-all flex items-center justify-center ${rememberMe ? 'bg-amber-600 border-amber-600' : 'border-gray-200 group-hover:border-amber-300'}`}>
                            {rememberMe && (
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors">Ghi nhớ đăng nhập</span>
                </label>
                <button
                    type="button"
                    onClick={() => setMode('FORGOT_PASSWORD')}
                    className="text-amber-600 text-sm cursor-pointer font-bold hover:underline"
                >
                    Quên mật khẩu?
                </button>
            </div>

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
            {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 mb-12 rounded-lg">{error}</p>}
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
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mật khẩu*"
                            className={inputClasses}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                        >
                            {showPassword ? <EyeOff size={18} className="text-gray-400" strokeWidth={2.5} /> : <Eye size={18} className="text-gray-400" strokeWidth={2.5} />}
                        </button>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70" size={20} />
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Xác nhận mật khẩu*"
                            className={inputClasses}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                        >
                            {showConfirmPassword ? <EyeOff size={18} className="text-gray-400" strokeWidth={2.5} /> : <Eye size={18} className="text-gray-400" strokeWidth={2.5} />}
                        </button>
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

            <div className="flex w-full items-center justify-center gap-2 text-[14px] text-gray-500 mt-10">
                <a href="#" className="text-amber-600 font-bold hover:underline cursor-pointer">Chính sách bảo mật </a>
                <p> và </p>
                <a href="#" className="text-amber-600 font-bold hover:underline cursor-pointer">Điều khoản sử dụng</a>
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
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                />
            </div>
            <div className="flex justify-center gap-6 pt-4">
                <button
                    onClick={() => setMode('LOGIN')}
                    className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all cursor-pointer"
                >
                    Hủy bỏ
                </button>
                <button
                    disabled={loading || !forgotEmail}
                    onClick={async () => {
                        setLoading(true);
                        setError('');
                        try {
                            const ok = await forgotPassword(forgotEmail);
                            if (ok) {
                                setMode('LOGIN');
                            } else {
                                setError('Không thể gửi yêu cầu. Vui lòng thử lại');
                            }
                        } finally {
                            setLoading(false);
                        }
                    }}
                    className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-100 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Gửi yêu cầu
                </button>
            </div>
        </div>
    );

    const renderOtpVerify = () => (
        <div className="space-y-6 pt-4">
            {renderHeader('Xác thực OTP')}
            <p className="text-center text-gray-600">
                Mã xác thực đã được gửi tới email <b>{email}</b>.
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
                <p className="text-center text-red-500 text-sm font-bold animate-shake">Mã OTP không chính xác.</p>
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
                onClick={() => handleFinalRegister()}
                disabled={otp.join('').length !== 6 || loading}
                className={`w-full font-bold py-4 rounded-xl transition-all shadow-md mt-4 flex items-center justify-center gap-2
                    ${otp.join('').length === 6 ? 'bg-[#A32323] hover:bg-[#8B1E1E] text-white cursor-pointer shadow-red-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
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
