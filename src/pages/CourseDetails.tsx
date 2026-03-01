import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Star, Users, BookOpen, Clock, BarChart,
    CheckCircle2, ChevronDown, Play, Lock,
    ArrowLeft, Share2, Heart, Award, ShoppingCart, ArrowRight
} from 'lucide-react';
import { mockCourses } from '../config/mock-data';
import { useCartStore } from '../store/useCartStore';
import toast from 'react-hot-toast';

const CourseDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeAccordion, setActiveAccordion] = useState<string | null>('m1');
    const { addItem } = useCartStore();

    const course = useMemo(() => {
        return mockCourses.find(c => c.id === id);
    }, [id]);

    if (!course) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">Không tìm thấy khóa học</h2>
                <button
                    onClick={() => navigate('/courses')}
                    className="text-amber-600 font-bold hover:underline"
                >
                    Quay lại danh sách khóa học
                </button>
            </div>
        );
    }

    const toggleAccordion = (id: string) => {
        setActiveAccordion(activeAccordion === id ? null : id);
    };


    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);


    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Dark Header Section */}
            <div className="bg-gray-900 pt-32 pb-16 md:pb-24 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-amber-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Quay lại</span>
                    </button>

                    <div className="grid lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex flex-wrap gap-3">
                                <span className="bg-amber-500 text-gray-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    {course.category}
                                </span>
                                <span className="bg-white/10 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    {course.level}
                                </span>
                                <span className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase ml-2">
                                    <Clock size={12} />
                                    Cập nhật {course.lastUpdated}
                                </span>
                            </div>

                            <h1 className="text-3xl md:text-5xl font-black leading-tight">
                                {course.title}
                            </h1>

                            <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                                {course.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-6 pt-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={16} fill={i < Math.floor(course.rating) ? "currentColor" : "none"} />
                                        ))}
                                    </div>
                                    <span className="text-amber-400 font-bold">{course.rating}</span>
                                    <span className="text-gray-500">({course.reviewCount} đánh giá)</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-300">
                                    <Users size={18} className="text-blue-400" />
                                    <span className="font-bold">{course.students.toLocaleString()}</span>
                                    <span className="text-gray-500">học viên</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <img src={course.teacherAvatar} alt={course.teacher} className="w-12 h-12 rounded-full border-2 border-amber-500" />
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Giảng viên chuyên gia</p>
                                    <p className="text-lg font-bold text-white">{course.teacher}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                {course.tags.map((tag, i) => (
                                    <span key={i} className="text-[10px] font-bold text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/10 px-2 py-0.5 rounded">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content & Sticky Sidebar */}
            <div className="max-w-7xl mx-auto px-4 -mt-10 md:-mt-20 relative z-20">
                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Left Side: Body */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* What you'll learn */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
                            <h2 className="text-2xl font-black text-gray-900 mb-6">Bạn sẽ học được gì?</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {course.willLearn.map((item, index) => (
                                    <div key={index} className="flex gap-3 group">
                                        <div className="mt-1 shrink-0">
                                            <CheckCircle2 size={18} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Curriculum */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-gray-900">Nội dung khóa học</h2>
                                <p className="text-sm font-bold text-gray-500">
                                    {course.curriculum.length} chương • {course.totalLessons} bài học
                                </p>
                            </div>

                            <div className="space-y-3">
                                {course.curriculum.map((module) => (
                                    <div key={module.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                        <button
                                            onClick={() => toggleAccordion(module.id)}
                                            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="font-bold text-gray-800 text-left">{module.title}</span>
                                            <ChevronDown
                                                size={20}
                                                className={`text-gray-400 transition-transform duration-300 ${activeAccordion === module.id ? 'rotate-180' : ''}`}
                                            />
                                        </button>

                                        <div className={`transition-all duration-300 ease-in-out ${activeAccordion === module.id ? 'max-h-[1000px] border-t border-gray-50' : 'max-h-0'}`}>
                                            <div className="p-2 space-y-1">
                                                {module.lessons.map((lesson) => (
                                                    <div key={lesson.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-amber-50 group transition-all">
                                                        <div className="flex items-center gap-3">
                                                            {lesson.isPreview ? (
                                                                <Play size={16} className="text-amber-500 fill-amber-500" />
                                                            ) : (
                                                                <Lock size={16} className="text-gray-300" />
                                                            )}
                                                            <span className={`text-sm ${lesson.isPreview ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                                                                {lesson.title}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            {lesson.isPreview && (
                                                                <span className="text-[10px] font-black uppercase text-amber-600 border border-amber-200 px-2 py-0.5 rounded-md bg-white">
                                                                    Học thử
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-gray-400 font-medium">{lesson.duration}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Requirements */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <h2 className="text-2xl font-black text-gray-900 mb-6">Yêu cầu khóa học</h2>
                            <ul className="space-y-3">
                                {course.requirements.map((req, index) => (
                                    <li key={index} className="flex items-center gap-3 text-gray-600 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right Side: Sticky Purchase Card */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 sticky top-24 space-y-6">
                            {/* Course Preview Image */}
                            <div className="relative group overflow-hidden rounded-2xl aspect-video bg-gray-900 flex items-center justify-center">
                                <img src={course.image} alt={course.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                                <button className="relative z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center text-amber-600 shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer">
                                    <Play size={30} fill="currentColor" className="translate-x-0.5" />
                                </button>
                                <p className="absolute bottom-4 text-white text-xs font-bold w-full text-center">Xem giới thiệu khóa học</p>
                            </div>

                            {/* Price */}
                            <div className="space-y-1">
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-black text-red-600">{course.price}</span>
                                    {course.originalPrice && (
                                        <span className="text-lg text-gray-400 line-through font-bold">{course.originalPrice}</span>
                                    )}
                                </div>
                                <p className="text-emerald-600 text-sm font-bold flex items-center gap-1">
                                    <Clock size={14} />
                                    Ưu đãi sắp kết thúc!
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        addItem(course);
                                        toast.success('Đã thêm vào giỏ hàng!');
                                        navigate('/cart');
                                    }}
                                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-gray-900 font-black rounded-2xl shadow-xl shadow-amber-200 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                                >
                                    ĐĂNG KÝ NGAY
                                    <ArrowRight size={20} />
                                </button>
                                <button
                                    onClick={() => {
                                        addItem(course);
                                        toast.success('Đã thêm vào giỏ hàng!');
                                    }}
                                    className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-black rounded-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart size={20} />
                                    THÊM VÀO GIỎ HÀNG
                                </button>
                            </div>

                            <p className="text-center text-xs text-gray-400 font-medium">Đảm bảo hoàn tiền trong 30 ngày</p>

                            {/* Course Features */}
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <p className="font-bold text-gray-800 text-sm">Khóa học bao gồm:</p>
                                <div className="space-y-3">
                                    {[
                                        { icon: Clock, text: `${course.duration} nội dung video` },
                                        { icon: BookOpen, text: `${course.totalLessons} bài học chuyên môn` },
                                        { icon: BarChart, text: `Trình độ: ${course.level}` },
                                        { icon: Award, text: 'Chứng chỉ hoàn thành' },
                                        { icon: Users, text: 'Hỗ trợ 24/7 từ giáo viên' }
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3 text-gray-600 text-sm">
                                            <feature.icon size={18} className="text-amber-500" />
                                            <span>{feature.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Social Actions */}
                            <div className="flex border-t border-gray-100 pt-6">
                                <button className="flex-1 flex flex-col items-center gap-1 text-gray-400 hover:text-amber-600 transition-colors">
                                    <Share2 size={20} />
                                    <span className="text-[10px] font-bold uppercase">Chia sẻ</span>
                                </button>
                                <div className="w-px h-10 bg-gray-100"></div>
                                <button className="flex-1 flex flex-col items-center gap-1 text-gray-400 hover:text-red-500 transition-colors">
                                    <Heart size={20} />
                                    <span className="text-[10px] font-bold uppercase">Yêu thích</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetails;
