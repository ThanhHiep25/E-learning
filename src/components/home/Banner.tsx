import { CheckCircle2 } from 'lucide-react';
import React from 'react';

const Banner: React.FC = () => {
    return (
        <div className="relative w-full overflow-hidden h-[60vh] md:h-[92vh]">
            <div className="absolute top-0 left-0 w-full h-full bg-linear-to-r from-black/80 via-black/50 to-black/10"></div>
            <img
                src='/elearning-1.jpg'
                alt="Toeic Banner"
                className="w-full h-full object-cover"
            />

            <div className="absolute bottom-30 md:left-10 left-3 p-2 flex flex-col md:items-start items-center justify-center gap-2">
                <p className='md:text-6xl text-4xl font-dancing-script-700 text-amber-400 flex items-center gap-2'>E-Learning <CheckCircle2 size={30} /></p>
                <p className='text-2xl font-bold text-white'>Cung cấp các khóa học chất lượng cao, phù hợp với như cầu của bạn</p>
                <p className='text-xl font-bold text-amber-400'>Học mọi lúc, mọi nơi, mọi thiết bị</p>

                <div className="flex gap-2 mt-10">
                    <button className='bg-amber-500 text-white px-6 py-4 text-xl font-bold rounded-full hover:bg-amber-600 cursor-pointer transition-all duration-200 w-fit'>Đăng ký ngay để nhận ưu đãi</button>
                </div>
            </div>

            {/* Dots navigation style like in image */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm cursor-pointer opacity-50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm cursor-pointer scale-125"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm cursor-pointer opacity-50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm cursor-pointer opacity-50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm cursor-pointer opacity-50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm cursor-pointer opacity-50"></div>
            </div>
        </div>
    );
};

export default Banner;
