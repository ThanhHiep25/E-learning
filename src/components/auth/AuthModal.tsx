import React, { useState, useRef, useEffect } from 'react';
import { X, User, Lock, Mail, Phone } from 'lucide-react';

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'OTP_VERIFY';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: AuthMode;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'LOGIN' }) => {
    const [mode, setMode] = useState<AuthMode>(initialMode);
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
        }
    }, [isOpen, initialMode]);

    const handleOtpChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return false;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Move to next input if value is entered
        if (element.value !== '' && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }

        // Check if all filled
        if (newOtp.every(val => val !== '')) {
            const code = newOtp.join('');
            // Simulation for demo: if 123456 is success, otherwise error
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

    const inputClasses = "w-full border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none transition-all placeholder:text-gray-300";

    const renderLogin = () => (
        <div className="space-y-4 pt-4">
            {renderHeader('Đăng nhập')}
            <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70" size={24} strokeWidth={2.5} />
                <input type="text" placeholder="Tài khoản đăng nhập" className={inputClasses} />
            </div>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70" size={24} strokeWidth={2.5} />
                <input type="password" placeholder="Mật khẩu" className={inputClasses} />
            </div>
            <button
                onClick={() => setMode('FORGOT_PASSWORD')}
                className="text-blue-500 text-sm font-medium hover:underline block"
            >
                Quên mật khẩu
            </button>
            <button className="w-full bg-[#A32323] hover:bg-[#8B1E1E] text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-[0.98] mt-4">
                Đăng nhập
            </button>
            <p className="text-center text-sm text-gray-600">
                Không có tài khoản?{' '}
                <button onClick={() => setMode('REGISTER')} className="text-blue-500 font-bold hover:underline">
                    Đăng ký ngay
                </button>
            </p>
        </div>
    );

    const renderRegister = () => (
        <div className="space-y-6 pt-4">
            {renderHeader('Đăng ký')}
            <div className="grid grid-cols-2 gap-x-12 relative">
                {/* Step labels */}
                <div className="absolute top-[-30px] left-0 right-0 flex justify-between px-2 text-sm font-bold">
                    <span>1. Thông tin tài khoản</span>
                    <span>2. Thông tin cá nhân</span>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70" size={20} />
                        <input type="text" placeholder="Tài khoản đăng nhập*" className={inputClasses} />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70" size={20} />
                        <input type="password" placeholder="Mật khẩu*" className={inputClasses} />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70" size={20} />
                        <input type="password" placeholder="Xác nhận mật khẩu*" className={inputClasses} />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70" size={20} />
                        <input type="text" placeholder="Họ và tên*" className={inputClasses} />
                    </div>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70" size={20} />
                        <input type="email" placeholder="Email*" className={inputClasses} />
                    </div>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/70" size={20} />
                        <input type="text" placeholder="Số điện thoại*" className={inputClasses} />
                    </div>
                </div>
            </div>

            <button
                onClick={() => setMode('OTP_VERIFY')}
                className="w-full bg-[#A32323] hover:bg-[#8B1E1E] text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-[0.98] mt-4"
            >
                Đăng ký
            </button>
            <p className="text-center text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <button onClick={() => setMode('LOGIN')} className="text-blue-500 font-bold hover:underline">
                    Đăng nhập ngay
                </button>
            </p>
        </div>
    );

    const renderForgotPassword = () => (
        <div className="space-y-6 pt-4">
            {renderHeader('Lấy lại mật khẩu?')}
            <p className="text-center text-gray-800 font-medium px-4">
                Để đặt lại mật khẩu của bạn, nhập tài khoản của bạn mà bạn sử dụng để đăng nhập
            </p>
            <div className="relative mt-8">
                <input
                    type="text"
                    placeholder="Tài khoản đăng nhập"
                    className="w-full border border-gray-200 rounded-xl py-5 px-6 text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none transition-all placeholder:text-gray-300"
                />
            </div>
            <div className="flex justify-center gap-8 pt-4">
                <button
                    onClick={() => setMode('LOGIN')}
                    className="text-blue-500 font-bold px-4 py-2 hover:text-blue-600"
                >
                    Đóng
                </button>
                <button className="text-blue-500 font-bold px-4 py-2 hover:text-blue-600">
                    Đồng ý
                </button>
            </div>
        </div>
    );

    const renderOtpVerify = () => (
        <div className="space-y-6 pt-4">
            {renderHeader('Xác thực OTP')}
            <p className="text-center text-gray-600">
                Vui lòng nhập mã OTP vừa được gửi về email của bạn
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
                        className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-lg outline-none transition-all
                            ${otpError ? 'border-red-500 bg-red-50' :
                                otpSuccess ? 'border-green-500 bg-green-50' :
                                    'border-gray-200 focus:border-red-500'}`}
                    />
                ))}
            </div>
            {otpError && (
                <p className="text-center text-red-500 text-sm font-medium">Mã OTP không chính xác. Vui lòng thử lại.</p>
            )}
            {otpSuccess && (
                <p className="text-center text-green-500 text-sm font-medium">Xác thực thành công!</p>
            )}
            <div className="text-center pt-2">
                <button
                    className="text-blue-500 font-bold hover:underline"
                    onClick={() => {
                        setOtp(new Array(6).fill(''));
                        setOtpError(false);
                        setOtpSuccess(false);
                    }}
                >
                    Gửi lại mã
                </button>
            </div>
            <button
                onClick={() => otpSuccess && onClose()}
                disabled={!otpSuccess}
                className={`w-full font-bold py-4 rounded-xl transition-all shadow-md mt-4 
                    ${otpSuccess ? 'bg-[#A32323] hover:bg-[#8B1E1E] text-white shadow-red-200 cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
                Xác nhận
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`bg-white rounded-[32px] w-full max-w-3xl p-8 shadow-2xl relative animate-in fade-in zoom-in duration-300`}>
                {mode === 'LOGIN' && renderLogin()}
                {mode === 'REGISTER' && renderRegister()}
                {mode === 'FORGOT_PASSWORD' && renderForgotPassword()}
                {mode === 'OTP_VERIFY' && renderOtpVerify()}
            </div>
        </div>
    );
};

export default AuthModal;
