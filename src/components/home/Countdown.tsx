import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

const Countdown: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
        days: 0, hours: 0, minutes: 0, seconds: 0
    });

    useEffect(() => {
        // Set target date to 2 days from now for a "Limited Offer"
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 2);
        targetDate.setHours(23, 59, 59, 999);

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;

            if (distance < 0) {
                clearInterval(timer);
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const timeItems = [
        { value: timeLeft.days.toString().padStart(2, '0'), label: 'Ngày' },
        { value: timeLeft.hours.toString().padStart(2, '0'), label: 'Giờ' },
        { value: timeLeft.minutes.toString().padStart(2, '0'), label: 'Phút' },
        { value: timeLeft.seconds.toString().padStart(2, '0'), label: 'Giây' },
    ];

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-4xl py-6 px-8 my-8 shadow-xl shadow-amber-100/20 max-w-7xl mx-auto group">
            <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-2xl text-white flex items-center justify-center animate-ring">
                    <img src="/sticker/thinking.png" alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h3 className="text-gray-900 font-black text-lg md:text-xl flex items-center gap-2">
                        Thời gian ưu đãi <span className="text-amber-600">kết thúc sau:</span>
                    </h3>
                    <p className="text-amber-700/60 text-sm font-bold flex items-center gap-1">
                        <Zap size={14} className="fill-amber-500 text-amber-500" />
                        Đăng ký ngay để nhận ưu đãi 20%
                    </p>
                </div>
            </div>

            <div className="flex gap-4 md:gap-6">
                {timeItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                        <div className="relative">
                            <div className="bg-white text-gray-900 font-black text-2xl md:text-3xl px-4 py-3 rounded-2xl shadow-sm border-b-4 border-amber-200 min-w-[70px] text-center group-hover:scale-105 transition-transform">
                                {item.value}
                            </div>
                            {/* Decorative dot */}
                            {idx < timeItems.length - 1 && (
                                <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-amber-300 font-black text-2xl">:</div>
                            )}
                        </div>
                        <span className="text-[10px] md:text-xs text-amber-800/50 font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                ))}
            </div>

            <button className="bg-gray-900 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-amber-600 transition-all cursor-pointer shadow-lg active:scale-95 whitespace-nowrap">
                Ghé thăm khóa học
            </button>
        </div>
    );
};

export default Countdown;
