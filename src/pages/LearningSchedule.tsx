import React, { useEffect, useState } from 'react';
import {
    ChevronRight, ChevronLeft,
    CalendarCheck, Zap, Plus, BookOpen, Clock, AlertCircle, Bookmark, X, Save, Trash2, AlertTriangle, RefreshCw,
    Copy,
    ExternalLink
} from 'lucide-react';
import { type ScheduleItem } from '../config/schedule-data';
import { useEnrollmentStore } from '../store/useEnrollmentStore';
import { scheduleService } from '../services/schedule.service';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';

const LearningSchedule: React.FC = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filterType, setFilterType] = useState<ScheduleItem['type'] | 'all'>('all');
    const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
    const { enrolledCourses } = useEnrollmentStore();

    // Delete Modal States
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<ScheduleItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [newPlan, setNewPlan] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        type: 'note' as ScheduleItem['type'],
        courseId: '',
        description: ''
    });

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    useEffect(() => {
        fetchSchedule();
    }, [currentDate]);

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const data = await scheduleService.getSchedule({
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear()
            });
            setScheduleItems(data.schedule || []);
        } catch (error) {
            console.error('Error fetching schedule:', error);
            toast.error('Không thể tải lịch học');
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type: ScheduleItem['type']) => {
        switch (type) {
            case 'lesson': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'exam': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'assignment': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'live': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'note': return 'bg-purple-50 text-purple-600 border-purple-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const handleAddPlan = async () => {
        if (!newPlan.title.trim()) {
            toast.error('Vui lòng nhập tên kế hoạch');
            return;
        }

        try {
            const startAt = `${newPlan.date}T${newPlan.startTime}:00.000Z`;
            const endAt = `${newPlan.date}T23:59:59.000Z`;

            const newItem = await scheduleService.createNote({
                title: newPlan.title,
                startAt,
                endAt,
                type: newPlan.type,
                courseId: newPlan.courseId || undefined,
                description: newPlan.description
            });

            setScheduleItems([newItem, ...scheduleItems]);
            setIsAddModalOpen(false);
            setNewPlan({
                title: '',
                date: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                type: 'note',
                courseId: '',
                description: ''
            });
            toast.success('Đã thêm kế hoạch học tập mới');
        } catch (error) {
            console.error('Error creating plan:', error);
            toast.error('Không thể thêm kế hoạch');
        }
    };

    const handleDeleteClick = (item: ScheduleItem) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    const handleExecuteDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            await scheduleService.deleteNote(itemToDelete.id);
            setScheduleItems(scheduleItems.filter(item => item.id !== itemToDelete.id));
            if (selectedItem?.id === itemToDelete.id) setSelectedItem(null);
            toast.success('Đã xóa kế hoạch thành công');
            setShowDeleteModal(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Error deleting plan:', error);
            toast.error('Không thể xóa kế hoạch');
        } finally {
            setIsDeleting(false);
        }
    };

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
        const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        const prevMonthDays = getDaysInMonth(year, month - 1);

        for (let i = adjustedFirstDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, current: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, current: true });
        }
        const nextPadding = 42 - days.length;
        for (let i = 1; i <= nextPadding; i++) {
            days.push({ day: i, current: false });
        }

        return (
            <div className="bg-white/40 backdrop-blur-xl rounded-[30px] md:rounded-[40px] shadow-2xl shadow-amber-900/5 border border-white/60 overflow-hidden overflow-x-auto no-scrollbar">
                <div className="min-w-[800px]">
                    <div className="grid grid-cols-7 bg-white/40 border-b border-gray-100/50">
                        {weekDays.map(d => (
                            <div key={d} className="py-4 md:py-6 text-center text-[11px] font-extrabold text-gray-400 uppercase tracking-[0.25em]">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 divide-x divide-y divide-gray-100/30">
                        {days.map((d, i) => {
                            const dayEvents = d.current ? scheduleItems.filter(item => {
                                if (!item.startAt) return false;
                                try {
                                    const itemDate = parseISO(item.startAt);
                                    return itemDate.getDate() === d.day &&
                                        itemDate.getMonth() === month &&
                                        itemDate.getFullYear() === year;
                                } catch (e) {
                                    return false;
                                }
                            }) : [];
                            const isToday = d.current && isSameDay(new Date(year, month, d.day), new Date());

                            return (
                                <div key={i} className={`min-h-[120px] md:min-h-[150px] p-3 md:p-5 relative group transition-all duration-500 ${d.current ? 'hover:bg-amber-50/30' : 'bg-gray-50/40 opacity-40'}`}>
                                    <div className="flex items-center justify-between mb-3 md:mb-4">
                                        <span className={`text-base md:text-lg font-bold tracking-tight ${isToday ? 'w-8 h-8 md:w-9 md:h-9 bg-amber-500 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200' : d.current ? 'text-gray-900' : 'text-gray-300'}`}>
                                            {d.day}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 md:space-y-2">
                                        {dayEvents.map(event => (
                                            <div
                                                key={event.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedItem(event);
                                                }}
                                                className={`px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] font-bold leading-tight shadow-sm border cursor-pointer hover:scale-[1.02] active:scale-95 transition-all ${getTypeColor(event.type)}`}
                                            >
                                                <div className="truncate uppercase tracking-tight">{event.title}</div>
                                                <div className="opacity-60 mt-0.5 md:mt-1">
                                                    {event.startAt ? format(parseISO(event.startAt), 'HH:mm') : '--:--'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    // COPY METTING ID & PASSCODE
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Đã sao chép');
    };

    return (
        <div className="min-h-screen bg-[#FDF8EE]">
            <div className="bg-gray-900 w-full px-4 md:px-10 md:pt-40 pt-24 pb-12 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8 md:mb-16 max-w-[1440px] mx-auto">
                    <div className="lg:col-span-2">
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-slate-100 mb-6 tracking-tighter leading-none italic">
                            Lịch học <span className="text-amber-500">của bạn</span>
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 md:gap-4">
                            <div className="flex items-center gap-1.5 p-1.5 bg-white shadow-xl shadow-gray-200/50 border border-gray-100 rounded-[22px] w-fit">
                                <button onClick={() => setViewMode('list')} className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Timeline</button>
                                <button onClick={() => setViewMode('calendar')} className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${viewMode === 'calendar' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Calendar</button>
                            </div>

                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-amber-500 text-slate-900 rounded-[22px] text-xs sm:text-sm font-bold hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
                            >
                                <Plus size={18} />
                                Lên kế hoạch
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:col-span-2">
                        <div className="bg-amber-400 rounded-[30px] md:rounded-[40px] p-6 md:p-8 text-slate-900 shadow-xl relative overflow-hidden">
                            <CalendarCheck size={100} className="absolute -right-4 -bottom-4 md:-right-8 md:-bottom-8 opacity-10" />
                            <p className="text-[10px] font-bold uppercase opacity-60 mb-2">Sắp tới</p>
                            <h3 className="text-lg md:text-xl font-bold leading-tight line-clamp-2">
                                {scheduleItems.find(i => i.type === 'exam' && i.startAt && new Date(i.startAt) >= new Date())?.title || 'Không có bài kiểm tra'}
                            </h3>
                            <p className="text-xs font-bold mt-2 opacity-80">
                                {(() => {
                                    const upcomingExam = scheduleItems.find(i => i.type === 'exam' && i.startAt && new Date(i.startAt) >= new Date());
                                    return upcomingExam?.startAt ? format(parseISO(upcomingExam.startAt), 'dd/MM/yyyy HH:mm') : '';
                                })()}
                            </p>
                        </div>
                        <div className="bg-white rounded-[30px] md:rounded-[40px] p-6 md:p-8 shadow-xl relative overflow-hidden border border-gray-100">
                            <Zap size={100} className="absolute -right-4 -bottom-4 md:-right-8 md:-bottom-8 text-emerald-500/10" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Hoàn thành</p>
                            <h3 className="text-3xl md:text-4xl font-bold text-emerald-500">
                                {scheduleItems.length > 0 ? Math.round((scheduleItems.filter(i => i.status === 'completed').length / scheduleItems.length) * 100) : 0}%
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-8 md:gap-12 px-4 md:px-10 max-w-[1440px] mx-auto mt-8 md:mt-20 mb-20">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 md:mb-10 px-2 sm:px-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tighter uppercase whitespace-nowrap">
                                Tháng {format(currentDate, 'MM, yyyy', { locale: vi })}
                            </h2>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-400 tracking-tight">Bạn có {scheduleItems.length} sự kiện trong tháng này</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-[20px] border border-gray-200 shadow-inner overflow-x-auto no-scrollbar">
                                {['all', 'lesson', 'exam', 'note', 'live'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type as any)}
                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-[16px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${filterType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {type === 'all' ? 'Tất cả' :
                                            type === 'lesson' ? 'Bài học' :
                                                type === 'exam' ? 'Kiểm tra' :
                                                    type === 'note' ? 'Ghi chú' : 'Live'}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button onClick={prevMonth} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:bg-slate-50 transition-colors"><ChevronLeft size={20} /></button>
                                <button onClick={nextMonth} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:bg-slate-50 transition-colors"><ChevronRight size={20} /></button>
                            </div>
                        </div>
                    </div>

                    {viewMode === 'list' ? (
                        <div className="space-y-6">
                            {loading ? (
                                <div className="p-20 text-center">
                                    <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-slate-400 font-bold">Đang tải lịch học...</p>
                                </div>
                            ) : scheduleItems.length === 0 ? (
                                <div className="p-20 text-center bg-white rounded-[40px] border border-gray-100">
                                    <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold">Không có sự kiện nào trong tháng này</p>
                                </div>
                            ) : (
                                scheduleItems
                                    .filter(item => (filterType === 'all' || item.type === filterType) && item.startAt)
                                    .map(item => (
                                        <div key={item.id} className="bg-white cursor-pointer rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 md:gap-8 relative overflow-hidden group hover:shadow-xl transition-all">
                                            <div className="flex md:flex-col items-center justify-center gap-1.5 md:w-20 shrink-0 p-3 md:p-4 bg-slate-50 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all">
                                                <span className="text-2xl md:text-3xl font-bold">{item.startAt ? format(parseISO(item.startAt), 'dd') : '--'}</span>
                                                <span className="text-[10px] font-black opacity-60 uppercase">TH.{item.startAt ? format(parseISO(item.startAt), 'MM') : '--'}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                    <div className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold ${getTypeColor(item.type)} border`}>{item.type}</div>
                                                    {item.isPersonal && (
                                                        <div className="px-2.5 py-1 bg-slate-900 text-white rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                                                            <Bookmark size={8} /> Cá nhân
                                                        </div>
                                                    )}
                                                </div>
                                                <h3 className="text-lg md:text-xl font-bold text-slate-900 line-clamp-2 md:line-clamp-none">{item.title}</h3>
                                                {item.courseTitle && <p className="text-xs md:text-sm font-medium text-amber-600 mt-1.5 line-clamp-1">{item.courseTitle}</p>}
                                                <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed opacity-80">{item.description}</p>
                                            </div>
                                            <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8 mt-2 md:mt-0">
                                                <div className="text-left md:text-right">
                                                    <div className="flex items-center gap-1.5 md:justify-end text-slate-900 mb-0.5">
                                                        <Clock size={16} className="text-slate-400" />
                                                        <p className="text-base md:text-lg font-bold tracking-tighter">
                                                            {item.startAt ? format(parseISO(item.startAt), 'HH:mm') : '--:--'}
                                                        </p>
                                                    </div>
                                                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Bắt đầu</p>
                                                </div>
                                                {item.isPersonal && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(item);
                                                        }}
                                                        className="w-10 h-10 md:w-12 md:h-12 bg-rose-50 text-rose-500 rounded-[16px] md:rounded-[20px] flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all cursor-pointer shadow-lg shadow-rose-500/10 active:scale-90"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (item.isQuiz && item.id) {
                                                            navigate(`/bai-kiem-tra`);
                                                        } else {
                                                            setSelectedItem(item);
                                                        }
                                                    }}
                                                    className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 text-white rounded-[16px] md:rounded-[20px] flex items-center justify-center group-hover:bg-amber-500 transition-all cursor-pointer shadow-lg shadow-slate-900/10 active:scale-90"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    ) : renderCalendar()}
                </div>
                <aside className="w-full xl:w-96 space-y-8">
                    {/* Notes/Tips Box */}
                    <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <h3 className="text-md font-bold text-amber-500 mb-6">Mẹo học tập</h3>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                    <BookOpen size={18} className="text-amber-500" />
                                </div>
                                <p className="text-xs font-bold leading-relaxed opacity-80">Ghi chú lại những kiến thức quan trọng ngay sau bài giảng.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                    <Clock size={18} className="text-amber-500" />
                                </div>
                                <p className="text-xs font-bold leading-relaxed opacity-80">Phân bổ ít nhất 30 phút mỗi ngày để ôn tập lại từ vựng.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                        <h3 className="text-md font-bold text-slate-900 mb-8">Hiệu suất tuần này</h3>
                        <div className="flex items-end justify-between gap-2 h-32">
                            {[60, 45, 90, 30, 75, 50, 20].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div className={`w-full rounded-t-xl transition-all duration-1000 ${i === 2 ? 'bg-amber-500' : 'bg-slate-100'}`} style={{ height: `${h}%` }}></div>
                                    <span className="text-[9px] font-bold text-slate-400">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>

            {/* Add Plan Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden scale-in-center border border-gray-100 relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <div className="bg-slate-900 p-6 md:p-8 text-white sticky top-0 z-10">
                            <h3 className="text-xl md:text-2xl font-bold uppercase tracking-tight">Lên kế hoạch học tập</h3>
                            <p className="text-white/50 text-[10px] md:text-xs font-bold mt-1 md:mt-2">Thiết lập lộ trình riêng cho bản thân</p>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="absolute top-6 right-6 md:top-8 md:right-8 text-white/50 hover:text-white transition-colors cursor-pointer"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 md:p-8 space-y-5 md:space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 ml-1">Tên kế hoạch / Ghi chú</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: 'Ôn tập từ vựng Unit 5'..."
                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl px-5 md:px-6 py-3.5 md:py-4 text-sm font-medium transition-all outline-none"
                                    value={newPlan.title}
                                    onChange={e => setNewPlan({ ...newPlan, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400 ml-1">Ngày thực hiện</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl px-5 md:px-6 py-3.5 md:py-4 text-sm font-medium transition-all outline-none"
                                        value={newPlan.date}
                                        onChange={e => setNewPlan({ ...newPlan, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400 ml-1">Giờ bắt đầu</label>
                                    <input
                                        type="time"
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl px-5 md:px-6 py-3.5 md:py-4 text-sm font-medium transition-all outline-none"
                                        value={newPlan.startTime}
                                        onChange={e => setNewPlan({ ...newPlan, startTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 ml-1">Loại sự kiện</label>
                                <div className="grid grid-cols-3 gap-2 md:gap-3">
                                    {[
                                        { id: 'note', label: 'Ghi chú', icon: Bookmark },
                                        { id: 'lesson', label: 'Tự học', icon: BookOpen },
                                        { id: 'exam', label: 'Ôn thi', icon: CalendarCheck }
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setNewPlan({ ...newPlan, type: t.id as any })}
                                            className={`flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl md:rounded-3xl border-2 transition-all cursor-pointer ${newPlan.type === t.id ? 'bg-amber-50 border-amber-500 text-amber-600' : 'bg-white border-slate-100 text-slate-400 hover:border-amber-200'}`}
                                        >
                                            <t.icon size={18} className="md:w-5 md:h-5" />
                                            <span className="text-[9px] md:text-[10px] font-medium uppercase tracking-tight sm:tracking-widest">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 ml-1">Liên kết khóa học (Tùy chọn)</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl px-5 md:px-6 py-3.5 md:py-4 text-sm font-medium transition-all outline-none appearance-none cursor-pointer"
                                        value={newPlan.courseId}
                                        onChange={e => setNewPlan({ ...newPlan, courseId: e.target.value })}
                                    >
                                        <option value="">Chọn khóa học liên quan...</option>
                                        {enrolledCourses.map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronRight size={18} className="rotate-90" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 ml-1">Chi tiết nội dung</label>
                                <textarea
                                    rows={3}
                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl px-5 md:px-6 py-3.5 md:py-4 text-sm font-medium transition-all outline-none resize-none"
                                    placeholder="Bạn định học gì trong thời gian này?..."
                                    value={newPlan.description}
                                    onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 order-2 sm:order-1 py-3.5 md:py-4 bg-slate-100 text-slate-500 rounded-2xl text-md font-medium hover:bg-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleAddPlan}
                                    className="flex-1 order-1 sm:order-2 py-3.5 md:py-4 bg-slate-900 text-white rounded-2xl text-md font-medium hover:bg-amber-500 transition-all shadow-xl shadow-slate-900/10 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Save size={18} /> Lưu kế hoạch
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Detail View Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden scale-in-center border border-gray-100 relative">
                        <div className={`p-8 text-white relative overflow-hidden ${selectedItem.type === 'exam' ? 'bg-rose-500' : selectedItem.type === 'lesson' ? 'bg-blue-500' : selectedItem.type === 'live' ? 'bg-amber-500' : 'bg-slate-900'}`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 whitespace-nowrap">
                                    {selectedItem.type}
                                </div>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <h3 className="text-2xl font-bold mt-2 leading-tight">{selectedItem.title}</h3>
                            {selectedItem.courseTitle && (
                                <p className="text-white/70 text-sm font-bold mt-2 flex items-center gap-2">
                                    <BookOpen size={14} /> {selectedItem.courseTitle}
                                </p>
                            )}
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-md font-bold text-slate-400">Thời gian</p>
                                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                                        <Clock size={18} className="text-amber-500" />
                                        <span>{selectedItem.startAt ? format(parseISO(selectedItem.startAt), 'HH:mm, dd/MM') : '--/--'}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-md font-bold text-slate-400">Trạng thái</p>
                                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                                        <Zap size={18} className="text-emerald-500" />
                                        <span className="capitalize">{selectedItem.status || 'Chưa xác định'}</span>
                                    </div>
                                </div>
                            </div>

                            {
                                selectedItem.type === 'live' && (
                                    <div className="space-y-2">
                                        <p className="text-md font-bold text-slate-400">Link học</p>
                                        <div className="flex items-center gap-2 p-6 rounded-3xl border border-slate-100">
                                            <a href={selectedItem.zoomLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full bg-amber-500 text-white rounded-2xl py-4 gap-2 text-sm font-bold hover:bg-amber-400 transition-all cursor-pointer">
                                                <ExternalLink size={16} />
                                                Tham gia lớp học
                                            </a>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <p className="text-md font-bold text-slate-400">Mã phòng</p>
                                                <div className="flex items-center gap-2 relative">
                                                    <p className="text-slate-600 leading-relaxed w-full bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                        {selectedItem.meetingId}
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(selectedItem.meetingId || '');
                                                            toast.success('Đã sao chép mã phòng');
                                                        }}
                                                        className="absolute right-2 p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                                    >
                                                        <Copy size={16} className="text-slate-600" onChange={(() => {
                                                            handleCopy(selectedItem.meetingId || '');
                                                        })} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-md font-bold text-slate-400">Mật khẩu</p>
                                                <div className="flex items-center gap-2 relative">
                                                    <p className="text-slate-600 leading-relaxed w-full bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                        {selectedItem.passcode}
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(selectedItem.passcode || '');
                                                            toast.success('Đã sao chép mật khẩu');
                                                        }}
                                                        className="absolute right-2 p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                                    >
                                                        <Copy size={16} onChange={(() => {
                                                            handleCopy(selectedItem.passcode || '');
                                                        })} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }

                            {selectedItem.description && (
                                <div className="space-y-2">
                                    <p className="text-md font-bold text-slate-400">Ghi chú chi tiết</p>
                                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100 italic">
                                        "{selectedItem.description}"
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                {selectedItem.isQuiz && selectedItem.id && (
                                    <button
                                        onClick={() => navigate(`/quizzes/${selectedItem.id}`)}
                                        className="flex-1 py-4 bg-amber-500 text-slate-900 rounded-2xl text-md font-bold hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        Làm bài ngay
                                    </button>
                                )}
                                {selectedItem.isPersonal && (
                                    <button
                                        onClick={() => handleDeleteClick(selectedItem)}
                                        className="flex-1 py-4 bg-rose-500 text-white rounded-2xl text-md font-bold hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/10 cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={18} /> Xóa kế hoạch
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-md font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 cursor-pointer flex items-center justify-center gap-2"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="p-8 md:p-10 flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 bg-rose-50 rounded-[30px] flex items-center justify-center text-rose-500 animate-bounce-subtle">
                                <AlertTriangle size={36} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Xác nhận xóa?</h3>
                                <p className="text-sm text-slate-500 leading-relaxed px-4">
                                    Bạn có chắc chắn muốn xóa kế hoạch
                                    <span className="font-bold text-slate-700 block mt-1">"{itemToDelete?.title}"</span>
                                    khỏi lịch học của mình không?
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-8 pt-0">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setItemToDelete(null);
                                }}
                                disabled={isDeleting}
                                className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleExecuteDelete}
                                disabled={isDeleting}
                                className="px-6 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-xl shadow-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {isDeleting ? (
                                    <>
                                        <RefreshCw size={18} className="animate-spin" />
                                        Đang xóa...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={18} />
                                        Xóa ngay
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LearningSchedule;
