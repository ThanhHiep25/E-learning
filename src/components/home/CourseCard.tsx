import React from 'react';
import { Heart } from 'lucide-react';

interface CourseCardProps {
    title: string;
    subtitle: string;
    image: string;
    color: string;
    bgColor: string;
}

const CourseCard: React.FC<CourseCardProps> = ({ title, subtitle, image, color, bgColor }) => {
    return (
        <div className={`relative group rounded-3xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-b-4 border-r-4 ${color}`}>
            <div className={`h-64 md:h-72 p-6 flex flex-col justify-between ${bgColor}`}>
                <div>
                    <div className="flex justify-between items-start">
                        <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase text-gray-800 tracking-wider">2026</span>
                        <Heart size={20} className="text-white fill-gray-200 cursor-pointer pointer-events-auto hover:fill-red-500 hover:text-red-500 transition-colors" />
                    </div>
                    <h3 className="text-2xl font-black text-white mt-4 leading-tight drop-shadow-md">
                        {title}
                    </h3>
                    <p className="text-white/90 font-bold mt-2 text-sm">
                        {subtitle}
                    </p>
                </div>

                <div className="mt-auto">
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-auto object-contain transform group-hover:scale-105 transition-transform duration-500"
                    />
                </div>
            </div>

            {/* Bottom Label style from image */}
            <div className="bg-white/40 backdrop-blur-sm p-4 text-center">
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md bg-white ${color.replace('border-', 'text-')}`}>Học trên Web - App</span>
            </div>
        </div>
    );
};

export default CourseCard;
