import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from '../components/home/Banner';
import CourseCard from '../components/home/CourseCard';
import { useCourseStore } from '../store/useCourseStore';
import { Sparkles, GraduationCap, Flame, ArrowRight, Users } from 'lucide-react';
import slideShowLogo from '../config/slide-show';

const Home: React.FC = () => {
    const navigate = useNavigate();

    const { courses, loadCourses } = useCourseStore();

    useEffect(() => {
        loadCourses();
    }, []);

    const featuredCourses = useMemo(() => {
        return [...courses]
            .sort((a, b) => b.students - a.students)
            .slice(0, 4);
    }, [courses]);

    const categories = useMemo(() => {
        const set = new Set<string>();
        for (const c of courses) {
            const cat = String((c as any)?.category || '').trim();
            if (cat) set.add(cat);
        }
        return ['Tất cả', ...Array.from(set).slice(0, 6)];
    }, [courses]);

    const totalLearners = useMemo(() => {
        const total = courses.reduce((sum, c) => sum + Number((c as any)?.students ?? 0), 0);
        return Number.isFinite(total) ? Math.max(0, total) : 0;
    }, [courses]);

    const totalLearnersText = totalLearners > 0
        ? `${totalLearners.toLocaleString()} học viên`
        : 'nhiều học viên';

    return (
        <div className="space-y-16 pb-20 bg-gray-50/50">
            <section>
                <Banner />
            </section>


            {/* Featured Courses Section */}
            <section className="max-w-[1440px] mx-auto px-4 md:px-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                            <Sparkles size={14} />
                            Học nhiều nhất
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                            Khóa học <span className="text-red-600 underline decoration-4 underline-offset-8 decoration-red-100">Nổi bật nhất</span> 🧧
                        </h2>
                        <p className="text-gray-500 font-medium">Lộ trình học tập bài bản, giúp bạn nâng cao kiến thức và kỹ năng thực tế</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat, index) => (
                            <button
                                key={cat}
                                onClick={() => navigate(cat === 'Tất cả' ? '/courses' : `/courses?category=${cat}`)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${index === 0
                                    ? 'bg-gray-900 text-white shadow-lg'
                                    : 'bg-white text-gray-600 border border-gray-100 hover:border-amber-500 hover:text-amber-600'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {featuredCourses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <button
                        onClick={() => navigate('/courses')}
                        className="inline-flex items-center gap-2 text-gray-500 font-bold hover:text-amber-600 transition-colors cursor-pointer group"
                    >
                        Xem tất cả khóa học
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-amber-100 group-hover:text-amber-600 transition-all">
                            <ArrowRight size={18} />
                        </div>
                    </button>
                </div>
            </section>

            {/* Info Section - Premium Look */}
            <section className="bg-white border-y border-gray-100 py-20">
                <div className="max-w-[1440px] mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="flex flex-col items-center text-center space-y-4 group">
                        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                            <GraduationCap size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-gray-500">Giảng viên chuyên gia</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">Đội ngũ thầy cô giàu kinh nghiệm, tâm huyết từ các trường chuyên danh tiếng.</p>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-4 group">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                            <Flame size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-gray-500">Lộ trình bứt phá</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">Giáo trình được thiết kế cá nhân hóa, bám sát cấu trúc đề thi mới nhất.</p>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-4 group">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                            <Users size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-gray-500">Cộng đồng học tập</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">Hỗ trợ 24/7, cùng trao đổi và học hỏi với {totalLearnersText}.</p>
                    </div>
                </div>
            </section>

            {/* Slide Show Logo Section */}
            <section className="py-12 bg-white border-y border-gray-100 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 mb-8">
                    <h2 className="text-xl md:text-2xl  text-center text-gray-500 font-bold uppercase tracking-[0.2em]">
                        Đối tác đồng hành cùng chúng tôi
                    </h2>
                    <p className="text-center text-gray-500 text-xs mt-2">
                        {totalLearnersText} đã tin tưởng và chọn chúng tôi
                    </p>

                    <hr className="max-w-3xl mx-auto my-8 border-amber-200" />
                </div>

                <div className="marquee-container">
                    <div className="marquee-content py-4">
                        {[...slideShowLogo, ...slideShowLogo, ...slideShowLogo].map((logo, index) => (
                            <div
                                key={`${logo.id}-${index}`}
                                className="cursor-pointer w-40 h-24 md:w-56 md:h-32 flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-500 hover:bg-gray-50/80"
                            >
                                <img
                                    src={logo.image}
                                    alt={`Partner ${logo.id}`}
                                    className='max-w-full max-h-full object-contain'
                                />
                                <p className="text-center text-gray-800 font-bold text-xs uppercase tracking-[0.2em] mt-2">{logo.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Home;
