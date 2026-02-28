import React from 'react';
import Banner from '../components/home/Banner';
import Countdown from '../components/home/Countdown';
import CourseCard from '../components/home/CourseCard';

const Home: React.FC = () => {
    return (
        <div className="space-y-12 pb-20">
            <section>
                <Banner />
            </section>

            <Countdown />

            <section className="max-w-7xl mx-auto">
                <div className="flex flex-col items-center mb-8 gap-6">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-3">
                        <span className="text-4xl">🧧</span>
                        COMBO LUYỆN THI 2026 <span className="text-red-500 underline underline-offset-8">DÀNH CHO 2008</span>
                    </h2>

                    <div className="flex flex-wrap justify-center gap-3">
                        <button className="flex items-center gap-2 border-2 border-red-500 rounded-full px-6 py-2.5">
                            <span className="text-red-500 font-bold text-sm">VIP 90 PLUS 2026</span>
                            <div className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded flex flex-col items-center">
                                <span>MUA</span>
                                <span>COMBO</span>
                            </div>
                            <span className="text-red-500 font-black">1,300,000 VNĐ</span>
                        </button>

                        <button className="bg-white border text-gray-600 font-bold text-sm px-6 py-2.5 rounded-full hover:bg-gray-50 transition-colors">
                            COMBO CẤP TỐC 2026
                        </button>
                        <button className="bg-white border text-gray-600 font-bold text-sm px-6 py-2.5 rounded-full hover:bg-gray-50 transition-colors">
                            PRO3M - MỤC TIÊU 8+ (2026)
                        </button>
                        <button className="bg-white border text-gray-600 font-bold text-sm px-6 py-2.5 rounded-full hover:bg-gray-50 transition-colors">
                            PRO3M PLUS - MỤC TIÊU 9+ (2026)
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <CourseCard
                        title="VIP 90"
                        subtitle="TỔNG ÔN & LUYỆN ĐỀ"
                        image="https://placehold.co/400x400/transparent/white?text=User+Icon"
                        color="border-purple-600"
                        bgColor="bg-gradient-to-br from-purple-500 to-indigo-600"
                    />
                    <CourseCard
                        title="LUYỆN ĐỀ PRO VIP"
                        subtitle="MỘT SỐ DẠNG THƯỜNG GẶP"
                        image="https://placehold.co/400x400/transparent/white?text=User+Icon"
                        color="border-blue-600"
                        bgColor="bg-gradient-to-br from-blue-400 to-blue-600"
                    />
                    <CourseCard
                        title="NGÂN HÀNG ĐỀ THI THỬ"
                        subtitle="350+ ĐỀ"
                        image="https://placehold.co/400x400/transparent/white?text=User+Icon"
                        color="border-pink-600"
                        bgColor="bg-gradient-to-br from-pink-400 to-purple-500"
                    />
                    <CourseCard
                        title="EZ VOCAB"
                        subtitle="Học trực tuyến Web - App"
                        image="https://placehold.co/400x400/transparent/white?text=User+Icon"
                        color="border-indigo-600"
                        bgColor="bg-indigo-600"
                    />
                </div>
            </section>

            {/* Floating Zalo Button */}
            <div className="fixed bottom-6 right-6 z-50 animate-bounce">
                <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xl cursor-pointer border-4 border-white">
                    Zalo
                </div>
            </div>
        </div>
    );
};

export default Home;
