import React, { useState, useEffect } from 'react';
import { cookieService, type CookieConsentPreferences } from '../../services/cookie.service';
import { ShieldCheck, X, Check, Cookie, Settings2, ArrowLeft } from 'lucide-react';

const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [prefs, setPrefs] = useState<CookieConsentPreferences>({
        necessary: true,
        analytics: true,
        marketing: false
    });

    useEffect(() => {
        if (cookieService.isUndecided()) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        cookieService.setConsent(true);
        setIsVisible(false);
    };

    const handleDeclineAll = () => {
        cookieService.setConsent(false);
        setIsVisible(false);
    };

    const handleSaveCustom = () => {
        cookieService.setConsent(prefs);
        setIsVisible(false);
    };

    const togglePref = (key: keyof CookieConsentPreferences) => {
        if (key === 'necessary') return;
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 md:left-6 md:right-auto md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="bg-white/95 backdrop-blur-2xl border border-amber-100 shadow-[0_20px_50px_rgba(251,191,36,0.15)] rounded-[32px] p-6 md:p-8 relative overflow-hidden group">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 group-hover:bg-amber-100 transition-colors duration-500"></div>

                <div className="relative z-10">
                    {!isCustomizing ? (
                        <>
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                                    <Cookie size={28} className="animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 leading-tight">Cookie & Trải nghiệm</h3>
                                    <p className="text-[11px] font-medium text-amber-600 mt-1">Cá nhân hóa việc học của bạn</p>
                                </div>
                                <button
                                    onClick={handleDeclineAll}
                                    className="ml-auto p-2 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Đóng"
                                    aria-label="Đóng"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
                                Chúng tôi sử dụng cookie để <span className="text-gray-900 font-bold underline decoration-amber-400/50">nâng cao tốc độ</span> và hiển thị nội dung phù hợp nhất. Bạn có thể tùy chỉnh hoặc đồng ý tất cả.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleAcceptAll}
                                    className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold text-xs hover:bg-amber-600 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-gray-200 cursor-pointer"
                                >
                                    <Check size={16} />
                                    Đồng ý tất cả
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsCustomizing(true)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-600 px-6 py-4 rounded-2xl font-bold text-xs hover:bg-gray-100 transition-all active:scale-95 cursor-pointer"
                                    >
                                        <Settings2 size={16} />
                                        Tùy chỉnh
                                    </button>
                                    <button
                                        onClick={handleDeclineAll}
                                        className="px-6 py-4 rounded-2xl font-bold text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all active:scale-95 cursor-pointer"
                                    >
                                        Từ chối
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-6">
                                <button
                                    onClick={() => setIsCustomizing(false)}
                                    className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h3 className="text-lg font-bold text-gray-900">Tùy chỉnh Cookie</h3>
                            </div>

                            <div className="space-y-4 mb-8">
                                {(['necessary', 'analytics', 'marketing'] as const).map((key) => (
                                    <div key={key} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 border border-gray-100">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-900 leading-none">
                                                {key === 'necessary' ? 'Bắt buộc' : key === 'analytics' ? 'Phân tích' : 'Marketing'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 mt-1">
                                                {key === 'necessary' ? 'Cần thiết để hệ thống hoạt động.' : key === 'analytics' ? 'Giúp chúng tôi hiểu hành vi học tập.' : 'Hiển thị quảng cáo dựa trên sở thích.'}
                                            </span>
                                        </div>
                                        <button
                                            disabled={key === 'necessary'}
                                            onClick={() => togglePref(key)}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${prefs[key] ? 'bg-amber-500' : 'bg-gray-200'
                                                } ${key === 'necessary' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${prefs[key] ? 'translate-x-4' : 'translate-x-0'
                                                }`} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSaveCustom}
                                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold text-xs hover:bg-amber-600 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-gray-200 cursor-pointer"
                            >
                                <Check size={16} />
                                Lưu lựa chọn của tôi
                            </button>
                        </>
                    )}

                    <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        Bảo mật thông tin theo tiêu chuẩn quốc tế
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
