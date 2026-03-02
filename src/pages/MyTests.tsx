import React, { useState, useEffect } from 'react';
import {
    ClipboardList, Clock, HelpCircle,
    Calendar, ChevronRight, Search,
    AlertCircle, CheckCircle2,
    Play, RotateCcw, Eye
} from 'lucide-react';
import { mockTests, type TestItem } from '../config/tests-data';

const MyTests: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const filteredTests = mockTests.filter(test => {
        const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            test.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || test.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status: TestItem['status']) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'in_progress': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'not_started': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getStatusLabel = (status: TestItem['status']) => {
        switch (status) {
            case 'completed': return 'Đã hoàn thành';
            case 'in_progress': return 'Đang làm dở';
            case 'not_started': return 'Chưa bắt đầu';
            default: return status;
        }
    };

    return (
        <div className="min-h-screen bg-[#FDF8EE]">

            {/* Header Section */}
            <div className=" bg-gray-900 pt-28 pb-20">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 max-w-[1440px] mx-auto">
                    <div className="max-w-2xl">

                        <h1 className="md:text-6xl text-4xl font-black text-slate-100 mb-4 leading-none">
                            Bài kiểm tra<span className="text-rose-500">.</span>
                        </h1>
                        <p className="text-slate-400 font-medium md:text-lg text-base leading-relaxed max-w-md">
                            Theo dõi và hoàn thành các bài đánh giá từ giảng viên để củng cố kiến thức của bạn.
                        </p>
                    </div>
                    {/* Quick Stats */}
                    <div className="flex flex-wrap gap-4">
                        <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-50 min-w-[160px]">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tổng số</p>
                            <h3 className="text-3xl font-black text-slate-900">{mockTests.length}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-50 min-w-[160px]">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Hoàn thành</p>
                            <h3 className="text-3xl font-black text-slate-900">
                                {mockTests.filter(t => t.status === 'completed').length}
                            </h3>
                        </div>
                        <div className="bg-amber-400 p-6 rounded-[32px] shadow-xl shadow-amber-200/50 min-w-[160px]">
                            <p className="text-[10px] font-black text-slate-900/60 uppercase tracking-widest mb-2">Sắp tới hạn</p>
                            <h3 className="text-3xl font-black text-slate-900">2</h3>
                        </div>
                    </div>

                </div>



            </div>

            {/* Filters & Search */}
            <div className="bg-white/60 backdrop-blur-xl max-w-[1440px] mx-auto mt-10 p-4 rounded-[32px] border border-white mb-10 shadow-2xl shadow-gray-200/30 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm bài kiểm tra hoặc khóa học..."
                        className="w-full bg-white/50 border border-gray-100 rounded-2xl py-4 pl-16 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'not_started', 'in_progress', 'completed'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-6 py-4 rounded-2xl text-[10px] font-bold uppercase  transition-all cursor-pointer border ${statusFilter === status
                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                : 'bg-white text-slate-400 border-gray-100 hover:text-slate-900 hover:border-slate-200'
                                }`}
                        >
                            {status === 'all' ? 'Tất cả' : getStatusLabel(status)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tests Grid */}
            <div className="grid grid-cols-1 max-w-[1440px] mx-auto mb-10 xl:grid-cols-2 gap-8">
                {filteredTests.length > 0 ? (
                    filteredTests.map((test) => (
                        <div
                            key={test.id}
                            className="group bg-white rounded-[48px] p-10 shadow-sm border border-gray-50 hover:shadow-2xl hover:shadow-gray-200/40 transition-all duration-700 relative overflow-hidden"
                        >
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Test Icon/Type */}
                                <div className="w-18 h-18 bg-slate-50 rounded-[20px] flex items-center justify-center shrink-0 group-hover:bg-rose-500/45 transition-all duration-500">
                                    <ClipboardList size={30} className="text-slate-400 group-hover:text-white transition-colors" />
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className={`px-4 py-1.5 rounded-2xl text-[12px] font-bold border transition-colors ${getStatusStyle(test.status)}`}>
                                            {getStatusLabel(test.status)}
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-400">
                                            {test.courseTitle}
                                        </span>
                                    </div>

                                    <h3 className="md:text-2xl text-xl font-bold text-slate-900 leading-tight group-hover:text-rose-600 transition-colors flex items-center justify-between">
                                        {test.title}
                                        <ChevronRight className="opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                                    </h3>

                                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Thời gian</p>
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                                <Clock size={16} className="text-slate-300" />
                                                <span>{test.duration} Phút</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Số câu hỏi</p>
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                                <HelpCircle size={16} className="text-slate-300" />
                                                <span>{test.questions} Câu</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar / Action Area */}
                            <div className="mt-10 flex items-center justify-between p-6 bg-slate-50/50 rounded-[32px] border border-gray-100 group-hover:bg-rose-50 group-hover:border-rose-100 transition-all">
                                <div className="flex items-center gap-4">
                                    <Calendar size={18} className="text-slate-300" />
                                    <div className="text-left">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Hạn chót</p>
                                        <p className="text-sm font-bold text-slate-900">
                                            {new Date(test.deadline).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                {test.status === 'completed' ? (
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-emerald-500 uppercase">Điểm số</p>
                                            <p className="text-xl font-bold text-slate-900">{test.score}/10</p>
                                        </div>
                                        <button className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-emerald-200 cursor-pointer">
                                            <Eye size={24} />
                                        </button>
                                    </div>
                                ) : (
                                    <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[24px] text-xs font-bold uppercase hover:bg-rose-500 hover:shadow-2xl hover:shadow-rose-300 transition-all active:scale-95 cursor-pointer">
                                        {test.status === 'in_progress' ? (
                                            <>
                                                <RotateCcw size={16} />
                                                <span>Tiếp tục</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play size={16} />
                                                <span>Bắt đầu</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 group-hover:scale-150 transition-all duration-1000">
                                <CheckCircle2 size={120} />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-1 xl:col-span-2 bg-white rounded-[48px] p-24 text-center border-2 border-dashed border-gray-100">
                        <AlertCircle size={48} className="mx-auto text-gray-200 mb-6" />
                        <p className="text-xl font-bold text-gray-400">Không tìm thấy bài kiểm tra nào phù hợp.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default MyTests;
