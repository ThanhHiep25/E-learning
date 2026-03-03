import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    User as UserIcon, Mail, Phone, MapPin, Calendar,
    Star, Award, BookOpen,
    ChevronRight, CheckCircle2, MessageSquare,
    Plus, Edit2, Zap
} from 'lucide-react';
import { useCourseStore } from '../store/useCourseStore';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
    const { user } = useAuth();
    const { courses } = useCourseStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('learning');

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);


    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-black text-gray-900 mb-4">Bạn cần đăng nhập để xem thông tin này</h2>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all cursor-pointer"
                    >
                        VỀ TRANG CHỦ
                    </button>
                </div>
            </div>
        );
    }

    const enrolledCourses = courses.filter(c => user.enrolledCourses.includes(c.id));

    return (
        <div className="min-h-screen bg-[#FDF8EE] pt-28 pb-20">
            <div className="max-w-[1440px] mx-auto px-6 md:px-10">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* LEFT SIDEBAR - PROFILE INFO */}
                    <aside className="w-full lg:w-96 space-y-6">
                        {/* Avatar & Basic Info Card */}
                        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-br from-amber-500/10 to-orange-500/5 z-0"></div>

                            <div className="relative z-10">
                                <div className="relative inline-block mb-6">
                                    <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                                        <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg border border-gray-50">
                                        <div className="flex gap-0.5">
                                            <Star size={14} fill="currentColor" className="text-amber-500" />
                                            <Star size={14} fill="currentColor" className="text-amber-500" />
                                        </div>
                                    </div>
                                </div>

                                <h1 className="text-2xl font-bold text-gray-700 mb-2">{user.fullName}</h1>

                                {/* Experience Bar */}
                                <div className="mt-6 space-y-2">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                                            <Zap size={10} fill="currentColor" />
                                            <span className="text-[10px] font-black uppercase">Level 12</span>
                                        </div>
                                        <span className="text-[11px] font-bold text-gray-400">{user.exp || 0}/{user.maxExp || 1000} EXP</span>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                                        <div
                                            className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000"
                                            style={{ width: `${((user.exp || 0) / (user.maxExp || 1000)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Information */}
                        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 space-y-8">
                            <div>
                                <h3 className="text-xs font-bold text-gray-700 uppercase mb-6 flex items-center justify-between">
                                    Thông tin
                                    <Edit2 size={14} className="text-gray-300 cursor-pointer hover:text-amber-500" />
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                                            <UserIcon size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Username</p>
                                            <p className="text-sm font-bold text-gray-700">{user.username || 'n/a'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                                            <Mail size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Email</p>
                                            <p className="text-sm font-bold text-gray-700 truncate">{user.email}</p>
                                        </div>
                                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                    </div>
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                                            <Phone size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Phone</p>
                                            <p className="text-sm font-bold text-gray-700">{user.phone || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                                            <MapPin size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Vị trí</p>
                                            <p className="text-sm font-bold text-gray-700">{user.location || 'Vietnam'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Ngày tham gia</p>
                                            <p className="text-sm font-bold text-gray-700">{user.joinDate || '01/01/2024'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-50" />

                            <div>
                                <h3 className="text-xs font-bold text-gray-700 uppercase mb-6">Kỹ năng</h3>
                                <div className="space-y-4">
                                    {user.skills?.map((skill, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                <span className="text-sm font-bold text-gray-700">{skill.name}</span>
                                            </div>
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={12}
                                                        fill={i < skill.level ? "currentColor" : "none"}
                                                        className={i < skill.level ? "text-amber-500" : "text-gray-200"}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {!user.skills?.length && <p className="text-sm text-gray-400 text-center italic">Chưa có thông tin kỹ năng</p>}
                                </div>
                            </div>
                        </div>

                        {/* Experience & Education */}
                        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 space-y-8">
                            <div>
                                <h3 className="text-xs font-bold text-gray-700 uppercase mb-6 flex items-center justify-between">
                                    Kinh nghiệm
                                    <Plus size={16} className="text-gray-300 cursor-pointer hover:text-amber-500" />
                                </h3>
                                <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-gray-100 before:z-0">
                                    {user.experienceList?.map((exp, index) => (
                                        <div key={index} className="relative z-10 pl-10">
                                            <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-amber-500"></div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{exp.period}</p>
                                            <p className="text-sm font-black text-gray-900">{exp.position}</p>
                                            <p className="text-xs font-bold text-amber-600">{exp.company}</p>
                                        </div>
                                    ))}
                                    {!user.experienceList?.length && <p className="text-sm text-gray-400 text-center italic">Chưa có thông tin kinh nghiệm</p>}
                                </div>
                            </div>

                            <hr className="border-gray-50" />

                            <div>
                                <h3 className="text-xs font-bold text-gray-700 uppercase mb-6 flex items-center justify-between">
                                    Học vấn
                                    <Plus size={16} className="text-gray-300 cursor-pointer hover:text-amber-500" />
                                </h3>
                                <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-gray-100 before:z-0">
                                    {user.educationList?.map((edu, index) => (
                                        <div key={index} className="relative z-10 pl-10">
                                            <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-emerald-500"></div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{edu.period}</p>
                                            <p className="text-sm font-black text-gray-900">{edu.major}</p>
                                            <p className="text-xs font-bold text-emerald-600">{edu.school}</p>
                                        </div>
                                    ))}
                                    {!user.educationList?.length && <p className="text-sm text-gray-400 text-center italic">Chưa có thông tin học vấn</p>}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* RIGHT CONTENT AREA */}
                    <main className="flex-1 space-y-8">

                        {/* MAIN TABS */}
                        <div className="bg-white rounded-[40px] p-3 shadow-sm border border-gray-100 inline-flex gap-2">
                            <button
                                onClick={() => setActiveTab('learning')}
                                className={`px-8 py-3.5 rounded-[28px] text-[13px] font-black uppercase transition-all cursor-pointer ${activeTab === 'learning' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <BookOpen size={18} />
                                    <span>Học tập</span>
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'learning' ? 'bg-white/20' : 'bg-gray-100'}`}>
                                        {enrolledCourses.length}
                                    </span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('contests')}
                                className={`px-8 py-3.5 rounded-[28px] text-[13px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'contests' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Award size={18} />
                                    <span>Cuộc thi</span>
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'contests' ? 'bg-white/20' : 'bg-gray-100'}`}>0</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('discussions')}
                                className={`px-8 py-3.5 rounded-[28px] text-[13px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'discussions' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={18} />
                                    <span>Thảo luận</span>
                                </div>
                            </button>
                        </div>

                        {activeTab === 'learning' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {enrolledCourses.map(course => (
                                    <div
                                        key={course.id}
                                        className="bg-white rounded-[32px] overflow-hidden border border-gray-100 group hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500 cursor-pointer"
                                        onClick={() => navigate(`/course/${course.id}`)}
                                    >
                                        <div className="aspect-video relative overflow-hidden">
                                            <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                                    <div className="h-full bg-amber-500 w-[65%] shadow-[0_0_10px_#f59e0b]"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h4 className="font-black text-gray-900 line-clamp-2 mb-4 group-hover:text-amber-600 transition-colors uppercase text-sm tracking-tight leading-tight min-h-[40px]">{course.title}</h4>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <Star size={14} fill="currentColor" className="text-amber-500" />
                                                    <span className="text-xs font-bold text-gray-400">5.0</span>
                                                </div>
                                                <div className="text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">65% ĐÃ HỌC</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {enrolledCourses.length === 0 && (
                                    <div className="col-span-full py-20 bg-white rounded-[40px] border border-dashed border-gray-200 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <BookOpen size={32} className="text-gray-300" />
                                        </div>
                                        <p className="text-gray-500 font-bold">Bạn chưa tham gia khóa học nào</p>
                                        <button
                                            onClick={() => navigate('/courses')}
                                            className="mt-6 text-amber-600 font-black uppercase text-xs tracking-widest hover:underline"
                                        >
                                            Khám phá ngay →
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'contests' && (
                            <div className="bg-white rounded-[40px] p-12 shadow-sm border border-gray-100 text-center">
                                <div className="w-24 h-24 bg-amber-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                                    <Award size={48} className="text-amber-500" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Chưa có cuộc thi nào</h3>
                                <p className="text-gray-400 font-bold max-w-sm mx-auto mb-8">Hành trình của bạn sẽ thú vị hơn khi tham gia các thử thách cùng cộng đồng.</p>
                                <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-gray-200 hover:bg-amber-600 transition-all cursor-pointer">
                                    XEM CÁC CUỘC THI HOT
                                </button>
                            </div>
                        )}

                        {/* Practice Section - High Score Summary */}
                        <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100 space-y-10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-gray-400 uppercase">Luyện tập & Phân tích</h3>
                                <button className="flex items-center gap-2 text-amber-600 font-black text-[11px] uppercase tracking-widest hover:underline cursor-pointer">
                                    Thống kê chi tiết <ChevronRight size={14} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-50 text-center group hover:bg-blue-50 transition-all">
                                    <p className="text-3xl font-black text-blue-600 mb-1 group-hover:scale-110 transition-transform">560</p>
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Tổng điểm</p>
                                </div>
                                <div className="bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-50 text-center group hover:bg-emerald-50 transition-all">
                                    <p className="text-3xl font-black text-emerald-600 mb-1 group-hover:scale-110 transition-transform">400</p>
                                    <div className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">4 Bài dễ</div>
                                </div>
                                <div className="bg-amber-50/50 p-6 rounded-[32px] border border-amber-50 text-center group hover:bg-amber-50 transition-all">
                                    <p className="text-3xl font-black text-amber-600 mb-1 group-hover:scale-110 transition-transform">160</p>
                                    <div className="inline-flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">1 Bài vừa</div>
                                </div>
                                <div className="bg-rose-50/50 p-6 rounded-[32px] border border-rose-50 text-center group hover:bg-rose-50 transition-all">
                                    <p className="text-3xl font-black text-rose-600 mb-1 group-hover:scale-110 transition-transform">0</p>
                                    <div className="inline-flex items-center gap-1.5 bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">0 Bài khó</div>
                                </div>
                            </div>

                            {/* Recent Table */}
                            <div className="overflow-hidden border border-gray-50 rounded-3xl">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tên bài tập</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Độ khó</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ngôn ngữ</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Điểm số</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {[
                                            { name: 'checkNumber', diff: 'Dễ', lang: 'C++', score: '100/100', color: 'emerald' },
                                            { name: 'createPhoneNumber', diff: 'Dễ', lang: 'C++', score: '100/100', color: 'emerald' },
                                            { name: 'maxComNumbers', diff: 'Trung bình', lang: 'Java', score: '160/160', color: 'amber' },
                                            { name: 'moneyBill', diff: 'Dễ', lang: 'Java', score: '100/100', color: 'emerald' },
                                            { name: 'sumOfThree', diff: 'Dễ', lang: 'C++', score: '100/100', color: 'emerald' },
                                        ].map((item, idx) => (
                                            <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-gray-700 group-hover:text-amber-600 transition-colors">{item.name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                        {item.diff}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-400">{item.lang}</td>
                                                <td className="px-6 py-4 text-sm font-black text-gray-700 text-right">{item.score}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Profile;
