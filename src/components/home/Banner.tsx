import { CheckCircle2, BookOpen, Trophy } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
    {
        icon: <CheckCircle2 size={30} />,
        headline: 'E-Learning',
        sub: 'Cung cấp các khóa học chất lượng cao, phù hợp với nhu cầu của bạn',
        highlight: 'Học mọi lúc, mọi nơi',
        cta: 'KHÁM PHÁ KHÓA HỌC NGAY',
        nav: '/courses',
    },
    {
        icon: <Trophy size={30} />,
        headline: 'Lộ trình CEFR A1–C2',
        sub: 'Hệ thống bài kiểm tra đánh giá định kỳ giúp bạn biết rõ trình độ thực tế',
        highlight: 'Lên level liên tục với lộ trình cá nhân hóa',
        cta: 'LÀM BÀI TEST ĐẦU VÀO',
        nav: '/placement',
    },
    {
        icon: <BookOpen size={30} />,
        headline: '4 Kỹ năng Toàn diện',
        sub: 'Nghe · Nói · Đọc · Viết — mỗi kỹ năng một khóa học chuyên sâu',
        highlight: 'Giảng viên bản ngữ + AI trợ giảng 24/7',
        cta: 'XEM LỘ TRÌNH HỌC TẬP',
        nav: '/my-path',
    },
];

const AUTO_SLIDE_INTERVAL = 5000; // 5 seconds

const Banner: React.FC = () => {
    const navigate = useNavigate();
    const [active, setActive] = useState(0);

    const goTo = useCallback((idx: number) => {
        setActive(idx);
    }, []);

    const next = useCallback(() => {
        setActive((prev) => (prev + 1) % SLIDES.length);
    }, []);

    useEffect(() => {
        const timer = setInterval(next, AUTO_SLIDE_INTERVAL);
        return () => clearInterval(timer);
    }, [next]);

    return (
        <div className="relative w-full overflow-hidden h-[60vh] md:h-[92vh]">
            {/* Background image */}
            <div className="absolute top-0 left-0 w-full h-full bg-linear-to-r from-black/80 via-black/50 to-black/10 z-[1]"></div>
            <img
                src='/elearning-1.jpg'
                alt="E-Learning Banner"
                className="w-full h-full object-cover"
            />

            {/* Slide content with fade transition */}
            <div className="absolute inset-0 z-[2] flex items-end md:items-center">
                <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pb-24 md:pb-0">
                    {SLIDES.map((s, idx) => (
                        <div
                            key={idx}
                            className={`transition-all duration-700 ${
                                idx === active
                                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                                    : 'opacity-0 translate-y-4 pointer-events-none absolute inset-0 flex items-end md:items-center'
                            }`}
                        >
                            {idx === active && (
                                <div className="flex flex-col md:items-start items-center gap-2 md:gap-3 max-w-2xl">
                                    <p className='md:text-6xl text-4xl font-dancing-script-700 text-amber-400 flex items-center gap-2'>
                                        {s.headline} {s.icon}
                                    </p>
                                    <p className='text-lg md:text-2xl font-bold text-white text-center md:text-left'>
                                        {s.sub}
                                    </p>
                                    <p className='text-base md:text-xl font-bold text-amber-400 text-center md:text-left'>
                                        {s.highlight}
                                    </p>
                                    <div className="flex gap-2 mt-6 md:mt-10">
                                        <button
                                            onClick={() => navigate(s.nav)}
                                            className='bg-amber-500 text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-xl font-black rounded-full hover:bg-amber-600 cursor-pointer transition-all duration-300 shadow-xl shadow-amber-500/20 active:scale-95'
                                        >
                                            {s.cta}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Dots navigation */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-[3]">
                {SLIDES.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => goTo(idx)}
                        className={`w-2.5 h-2.5 rounded-full shadow-sm cursor-pointer transition-all duration-300 ${
                            idx === active
                                ? 'bg-white scale-125'
                                : 'bg-white/50 hover:bg-white/80'
                        }`}
                        aria-label={`Slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default Banner;
