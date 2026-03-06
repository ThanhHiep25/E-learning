import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle, ShieldCheck, ArrowLeft, Loader2, GraduationCap, ShieldAlert, EyeOff, Eye } from 'lucide-react';
import { authService } from '../api/authService';
import toast from 'react-hot-toast';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Validate password
    const validatePassword = (password: string) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    };

    // check password match
    const checkPasswordMatch = (password: string, confirmPassword: string) => {
        return password === confirmPassword;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            toast.error('Token không hợp lệ hoặc đã hết hạn');
            return;
        }

        if (!checkPasswordMatch(password, confirmPassword)) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        if (!validatePassword(password)) {
            toast.error('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authService.resetPassword({
                token,
                password,
                confirmPassword
            });

            if (response.success) {
                toast.success('Đặt lại mật khẩu thành công!');
                setIsSuccess(true);
                // Redirect after 3 seconds
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } else {
                toast.error(response.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            toast.error('Lỗi kết nối máy chủ');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-xl w-full bg-white rounded-[40px] overflow-hidden shadow-2xl border border-gray-100 flex flex-col md:flex-row">
                    <div className="p-10 md:w-full text-center">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
                            <ShieldAlert size={40} />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">LIÊN KẾT HẾT HẠN</h1>
                        <p className="text-slate-500 font-medium mb-10 leading-relaxed text-lg">
                            Liên kết đặt lại mật khẩu đã hết hạn hoặc không chính xác.
                            Vui lòng kiểm tra lại email hoặc yêu cầu mã mới.
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center gap-3 bg-slate-900 text-white font-bold py-4 px-8 rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 w-full"
                        >
                            <ArrowLeft size={20} />
                            QUAY LẠI TRANG CHỦ
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-white md:bg-slate-50 flex items-center justify-center p-0 md:p-6">
                <div className="max-w-2xl w-full bg-white rounded-none md:rounded-[48px] p-8 md:p-16 shadow-none md:shadow-2xl border-none md:border border-slate-100 text-center animate-in zoom-in-95 duration-700">
                    <div className="w-28 h-28 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner ring-8 ring-emerald-50/50">
                        <CheckCircle size={56} className="animate-bounce" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-6">THÀNH CÔNG!</h1>
                    <p className="text-slate-500 font-medium mb-12 text-xl leading-relaxed">
                        Mật khẩu của bạn đã được cập nhật an toàn.
                        Hệ thống sẽ tự động đưa bạn về trang chủ trong vài giây...
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-linear-to-r from-emerald-600 to-teal-600 text-white font-bold py-5 rounded-[24px] hover:shadow-xl hover:shadow-emerald-200 hover:-translate-y-1 transition-all active:scale-95 text-lg uppercase"
                    >
                        BẮT ĐẦU HỌC NGAY
                    </button>

                    <div className="mt-10 flex justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="md:h-screen bg-slate-50 flex overflow-hidden">
            {/* Left Side: Illustration & Info */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-amber-50 items-center justify-center p-20 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-40">
                    <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-amber-200/50 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-blue-200/40 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-lg text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-amber-100 rounded-full text-amber-600 font-bold text-sm mb-10 shadow-sm">
                        <GraduationCap size={18} />
                        E-LEARNING SYSTEM
                    </div>

                    <h2 className="text-5xl font-bold text-slate-900 leading-[1.1] mb-8">
                        Khám phá tri thức, <br />
                        <span className="text-amber-600 relative">
                            kiến tạo
                            <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 8C50 2 150 2 198 8" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
                            </svg>
                        </span> tương lai.
                    </h2>

                    <p className="text-xl text-slate-500 font-medium mb-12 leading-relaxed">
                        Thiết lập lại mật khẩu để tiếp tục hành trình học tập cùng hơn 50,000 học viên tại nền tảng của chúng tôi.
                    </p>

                    <div className="relative md:w-[calc(100%-4rem)]  rounded-[40px] overflow-hidden shadow-2xl border-4 border-white group">
                        <img
                            src="/edu-auth-bg.png"
                            alt="Education"
                            className="w-full h-auto transform transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-slate-900/40 to-transparent" />
                    </div>
                </div>


            </div>

            {/* Right Side: Reset Form */}
            <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 md:p-16 relative">
                <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2 font-black text-amber-600 text-xl tracking-tighter">
                    <GraduationCap size={28} />
                    E-LEARNING
                </div>

                <div className="max-w-md w-full mt-20 md:mt-0 animate-in slide-in-from-right-8 duration-700">
                    <div className="mb-12">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                            <Lock size={32} />
                        </div>
                        <h1 className="text-4xl font-bold text-slate-900 leading-none mb-4">
                            Đặt lại Mật khẩu.
                        </h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Security Check Required</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-md font-bold text-slate-500 ml-1">Mật khẩu mới</label>
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                                    <Lock size={22} />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:bg-white rounded-[20px] py-5 pl-14 pr-6 text-slate-900 font-bold outline-none transition-all placeholder:text-slate-200"
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-md font-bold text-slate-500 ml-1">Xác nhận mật khẩu</label>
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                                    <ShieldCheck size={22} />
                                </span>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:bg-white rounded-[20px] py-5 pl-14 pr-6 text-slate-900 font-bold outline-none transition-all placeholder:text-slate-200"
                                    required
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                                    {showConfirmPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-slate-900 cursor-pointer hover:bg -slate-800 text-white font-bold py-5 rounded-[20px] shadow-2xl shadow-slate-200 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={24} />
                                        ĐANG XỬ LÝ...
                                    </>
                                ) : (
                                    <>
                                        XÁC NHẬN ĐẶT LẠI
                                        <CheckCircle size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-12 text-center pt-8 border-t border-slate-50">
                        <Link
                            to="/"
                            className="text-slate-400 hover:text-slate-900 font-bold text-sm transition-all inline-flex items-center gap-2 group"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            Quay lại trang chủ
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
