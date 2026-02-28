import React from 'react';

const Countdown: React.FC = () => {
    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 bg-white/60 backdrop-blur-sm border border-white rounded-3xl py-4 px-6 my-8 shadow-sm max-w-4xl mx-auto">
            <h3 className="text-gray-800 font-bold text-sm md:text-base whitespace-nowrap">
                Đếm ngược ngày thi tốt nghiệp <span className="text-red-500">THPT 2026</span>
            </h3>

            <div className="flex gap-3 md:gap-4">
                {[
                    { value: '102', label: 'ngày' },
                    { value: '01', label: 'giờ' },
                    { value: '15', label: 'phút' },
                    { value: '38', label: 'giây' },
                ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <div className="bg-blue-50 text-blue-600 font-black text-lg md:text-xl px-3 py-1.5 rounded-lg shadow-inner min-w-[50px] text-center border border-blue-100">
                            {item.value}
                        </div>
                        <span className="text-[10px] md:text-xs text-gray-500 font-medium uppercase">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Countdown;
