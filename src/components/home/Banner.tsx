import React from 'react';
import bannerImg from '../../assets/banner.png';

const Banner: React.FC = () => {
    return (
        <div className="relative w-full overflow-hidden">
            <img
                src={bannerImg}
                alt="Toeic Banner"
                className="w-screen h-screen object-cover"
            />

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
