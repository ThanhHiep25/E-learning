import React, { useEffect, useState } from 'react';
import {
    ChevronRight, ChevronLeft, ChevronDown,
    CalendarCheck, Zap, Plus, BookOpen, Clock, AlertCircle, Bookmark, X, Save, Trash2, AlertTriangle, RefreshCw,
    Video, Link, Hash, Key, ExternalLink,
    Copy
} from 'lucide-react';
import { type ScheduleItem } from '../../config/schedule-data';
import { scheduleService } from '../../services/schedule.service';
import { courseService, type BackendCourseListItem } from '../../services/course.service';
import toast from 'react-hot-toast';
import { format, parseISO, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';

const TeacherSchedule: React.FC = () => {
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filterType, setFilterType] = useState<ScheduleItem['type'] | 'all'>('all');
    const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [myCourses, setMyCourses] = useState<BackendCourseListItem[]>([]);

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<ScheduleItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditingPlan, setIsEditingPlan] = useState(false);
    const [planToEditId, setPlanToEditId] = useState<string | number | null>(null);

    const [newPlan, setNewPlan] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        type: 'note' as ScheduleItem['type'],
        courseId: '',
        description: '',
        platform: 'zoom' as "zoom" | "teams" | "google-meet" | "other",
        meetingId: '',
        passcode: '',
        zoomLink: ''
    });

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchCourses();
    }, []);

    useEffect(() => {
        fetchSchedule();
    }, [currentDate]);

    const fetchCourses = async () => {
        try {
            const courses = await courseService.getMyCourses();
            setMyCourses(courses);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const data = await scheduleService.getTeacherSchedule({
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear()
            });
            setScheduleItems(data.schedule || []);
        } catch (error) {
            console.error('Error fetching schedule:', error);
            // toast.error('Không thể tải lịch giảng dạy');
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type: ScheduleItem['type']) => {
        switch (type) {
            case 'lesson': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'lecture': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'exam': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'assignment': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'live': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'note': return 'bg-purple-50 text-purple-600 border-purple-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const handleEditClick = (item: ScheduleItem) => {
        const startDate = parseISO(item.startAt);
        const endDate = parseISO(item.endAt);

        setNewPlan({
            title: item.title,
            date: format(startDate, 'yyyy-MM-dd'),
            startTime: format(startDate, 'HH:mm'),
            endTime: format(endDate, 'HH:mm'),
            type: item.type,
            courseId: item.courseId?.toString() || '',
            description: item.description || '',
            platform: item.platform || 'zoom',
            meetingId: item.meetingId || '',
            passcode: item.passcode || '',
            zoomLink: item.zoomLink || ''
        });
        setPlanToEditId(item.id);
        setIsEditingPlan(true);
        setIsAddModalOpen(true);
        setSelectedItem(null);
    };

    const handleAddPlan = async () => {
        if (!newPlan.title.trim()) {
            toast.error('Vui lòng nhập tên kế hoạch');
            return;
        }

        setIsSubmitting(true);
        try {
            const startAt = `${newPlan.date}T${newPlan.startTime}:00.000Z`;
            const endAt = `${newPlan.date}T${newPlan.endTime}:00.000Z`;

            let newItem: ScheduleItem;

            if (isEditingPlan && planToEditId) {
                const isPersonal = scheduleItems.find(i => i.id === planToEditId)?.isPersonal;
                if (isPersonal) {
                    newItem = await scheduleService.updateTeacherNote(planToEditId, {
                        ...newPlan,
                        startAt,
                        endAt
                    });
                } else {
                    newItem = await scheduleService.updateCourseEvent(planToEditId, {
                        ...newPlan,
                        startAt,
                        endAt
                    });
                }
                setScheduleItems(scheduleItems.map(i => i.id === planToEditId ? newItem : i).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
                toast.success('Cập nhật thành công');
            } else {
                if (newPlan.type === 'note') {
                    newItem = await scheduleService.createTeacherNote({
                        title: newPlan.title,
                        startAt,
                        endAt,
                        type: 'note',
                        description: newPlan.description
                    });
                } else {
                    if (!newPlan.courseId) {
                        toast.error('Vui lòng chọn khóa học liên quan');
                        setIsSubmitting(false);
                        return;
                    }
                    newItem = await scheduleService.createCourseEvent(newPlan.courseId, {
                        title: newPlan.title,
                        startAt,
                        endAt,
                        type: newPlan.type,
                        description: newPlan.description,
                        zoomLink: newPlan.zoomLink,
                        meetingId: newPlan.meetingId,
                        passcode: newPlan.passcode,
                        platform: newPlan.platform
                    });
                }
                setScheduleItems([...scheduleItems, newItem].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
                toast.success('Đã thêm lịch thành công');
            }

            setIsAddModalOpen(false);
            resetForm();
        } catch (error) {
            console.error('Error saving plan:', error);
            toast.error('Không thể lưu kế hoạch');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setNewPlan({
            title: '',
            date: new Date().toISOString().split('T')[0],
            startTime: '09:00',
            endTime: '10:00',
            type: 'note',
            courseId: '',
            description: '',
            platform: 'zoom',
            meetingId: '',
            passcode: '',
            zoomLink: ''
        });
        setIsEditingPlan(false);
        setPlanToEditId(null);
    };

    const handleDeleteClick = (item: ScheduleItem) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    const handleExecuteDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            if (itemToDelete.isPersonal) {
                await scheduleService.deleteTeacherNote(itemToDelete.id);
            } else {
                await scheduleService.deleteCourseEvent(itemToDelete.id);
            }
            setScheduleItems(scheduleItems.filter(item => item.id !== itemToDelete.id));
            if (selectedItem?.id === itemToDelete.id) setSelectedItem(null);
            toast.success('Đã xóa thành công');
            setShowDeleteModal(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Không thể xóa');
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
            <div className="bg-white rounded-[30px] md:rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden overflow-x-auto no-scrollbar">
                <div className="min-w-[800px]">
                    <div className="grid grid-cols-7 bg-slate-50 border-b border-gray-100">
                        {weekDays.map(d => (
                            <div key={d} className="py-4 text-center text-[11px] font-black text-slate-400 tracking-[0.2em]">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
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
                                <div key={i} className={`min-h-[140px] p-4 relative group transition-all ${d.current ? 'hover:bg-amber-50/30' : 'bg-gray-50/50 opacity-40'}`}>
                                    <span className={`text-base font-bold ${isToday ? 'w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center' : d.current ? 'text-slate-900' : 'text-slate-300'}`}>
                                        {d.day}
                                    </span>
                                    <div className="mt-3 space-y-1.5">
                                        {dayEvents.slice(0, 3).map(event => (
                                            <div
                                                key={event.id}
                                                onClick={() => setSelectedItem(event)}
                                                className={`px-2 py-1.5 rounded-lg text-[9px] font-bold truncate cursor-pointer hover:translate-x-1 transition-all border ${getTypeColor(event.type)}`}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div className="text-[9px] font-bold text-slate-400 pl-1">+{dayEvents.length - 3} khác</div>
                                        )}
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
        <div className="min-h-screen bg-[#FDF8EE] pt-12">
            <div className="max-w-[1440px] mx-auto px-4 md:px-10 pb-20">
                <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                    <div>
                        <h1 className="text-4xl md:text-4xl font-bold text-slate-900 mb-4">
                            Lịch Giảng Dạy
                        </h1>
                        <p className="text-slate-500 font-bold flex items-center gap-2">
                            <Clock size={16} className="text-amber-500" />
                            Quản lý thời gian giảng dạy và ghi chú cá nhân của bạn
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex bg-white p-1.5 rounded-[22px] shadow-xl shadow-gray-200/50 border border-gray-100">
                            <button onClick={() => setViewMode('list')} className={`px-6 py-2.5 rounded-[18px] text-sm font-bold transition-all cursor-pointer ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:text-slate-600'}`}>Danh sách</button>
                            <button onClick={() => setViewMode('calendar')} className={`px-6 py-2.5 rounded-[18px] text-sm font-bold transition-all cursor-pointer ${viewMode === 'calendar' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:text-slate-600'}`}>Lịch</button>
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-8 py-4 bg-amber-500 text-slate-900 rounded-[22px] text-sm font-bold hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95 whitespace-nowrap cursor-pointer"
                        >
                            <Plus size={20} />
                            Tạo kế hoạch mới
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    <div className="lg:col-span-3 space-y-10">
                        <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <button onClick={prevMonth} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-slate-50 transition-all cursor-pointer"><ChevronLeft size={20} /></button>
                                <h2 className="text-xl font-bold text-slate-900 min-w-[200px] text-center">
                                    Tháng {format(currentDate, 'MM, yyyy', { locale: vi })}
                                </h2>
                                <button onClick={nextMonth} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-slate-50 transition-all cursor-pointer"><ChevronRight size={20} /></button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-1.5 rounded-[22px] border border-gray-200 shadow-inner">
                                {['all', 'lesson', 'lecture', 'exam', 'live', 'note'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type as any)}
                                        className={`px-4 py-2 rounded-[16px] text-sm font-bold transition-all cursor-pointer ${filterType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {type === 'all' ? 'Tất cả' :
                                            type === 'lesson' ? 'Bài học' :
                                                type === 'lecture' ? 'Bài giảng' :
                                                    type === 'exam' ? 'Kiểm tra' :
                                                        type === 'note' ? 'Ghi chú' : 'Live'}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {viewMode === 'list' ? (
                            <div className="space-y-6">
                                {loading ? (
                                    <div className="p-32 text-center bg-white rounded-[40px] border border-gray-100">
                                        <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-6"></div>
                                        <p className="text-slate-400 font-bold">Đang tải dữ liệu...</p>
                                    </div>
                                ) : scheduleItems.length === 0 ? (
                                    <div className="p-32 text-center bg-white rounded-[40px] border border-gray-100 shadow-sm">
                                        <AlertCircle size={64} className="text-slate-100 mx-auto mb-6" />
                                        <p className="text-slate-400 font-bold text-lg">Trống lịch giảng dạy</p>
                                        <p className="text-slate-300 font-bold mt-2">Hãy bắt đầu bằng việc tạo một kế hoạch mới</p>
                                    </div>
                                ) : (
                                    scheduleItems
                                        .filter(item => (filterType === 'all' || item.type === filterType))
                                        .map(item => (
                                            <div key={item.id} className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                                                <div className="flex md:flex-col items-center justify-center gap-2 w-24 shrink-0 p-4 bg-slate-50 rounded-[24px] group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                                                    <span className="text-xl font-bold">{item.startAt ? format(parseISO(item.startAt), 'dd') : '--'}</span>
                                                    <span className="text-sm font-bold opacity-60">TH.{item.startAt ? format(parseISO(item.startAt), 'MM') : '--'}</span>
                                                </div>

                                                <div className="flex-1 min-w-0 py-2">
                                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold border shadow-sm ${getTypeColor(item.type)}`}>
                                                            {item.type}
                                                        </span>
                                                        {item.isPersonal && (
                                                            <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-bold flex items-center gap-1.5">
                                                                <Bookmark size={10} /> Cá nhân
                                                            </span>
                                                        )}
                                                        {item.type === 'live' && (
                                                            <span className="px-4 py-1.5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center gap-1.5">
                                                                <Video size={10} /> Live Session
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2 leading-tight group-hover:text-amber-600 transition-colors">{item.title}</h3>
                                                    {item.courseTitle && <p className="text-sm font-bold text-amber-600 mb-3 flex items-center gap-2"><BookOpen size={16} /> {item.courseTitle}</p>}
                                                    <p className="text-sm text-slate-500 font-bold leading-relaxed line-clamp-2 italic opacity-80">{item.description}</p>

                                                    {item.type === 'live' && (item.meetingId || item.zoomLink) && (
                                                        <div className="mt-4 flex flex-wrap gap-4">
                                                            {item.platform && (
                                                                <div className="bg-slate-900 px-4 py-2 rounded-xl text-white flex items-center gap-2">
                                                                    <Video size={14} className="text-amber-500" />
                                                                    <span className="text-[11px] font-bold">{item.platform}</span>
                                                                </div>
                                                            )}
                                                            {item.meetingId && (
                                                                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
                                                                    <Hash size={14} className="text-slate-400" />
                                                                    <span className="text-[11px] font-bold text-slate-600">{item.meetingId}</span>
                                                                </div>
                                                            )}
                                                            {item.passcode && (
                                                                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
                                                                    <Key size={14} className="text-slate-400" />
                                                                    <span className="text-[11px] font-bold text-slate-600">{item.passcode}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
                                                    <div className="text-left md:text-right">
                                                        <div className="flex items-center gap-2 md:justify-end text-slate-900 mb-1">
                                                            <Clock size={20} className="text-amber-500" />
                                                            <p className="text-xl font-bold tabular-nums tracking-tighter">
                                                                {item.startAt ? format(parseISO(item.startAt), 'HH:mm') : '--:--'}
                                                            </p>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-400">Thời gian bắt đầu</p>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                                                            className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all shadow-sm active:scale-90 cursor-pointer"
                                                        >
                                                            <Save size={20} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}
                                                            className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90 cursor-pointer"
                                                        >
                                                            <Trash2 size={24} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                                                            className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center group-hover:bg-amber-500 transition-all shadow-xl shadow-slate-900/10 active:scale-90 cursor-pointer"
                                                        >
                                                            <ChevronRight size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        ) : renderCalendar()}
                    </div>

                    <aside className="space-y-8">
                        <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
                            <Video size={120} className="absolute -right-8 -bottom-8 opacity-10" />
                            <h3 className="text-lg font-bold text-amber-500 mb-6">Live Streaming</h3>
                            <p className="text-sm leading-relaxed opacity-60 mb-6 italic">Bạn có thể dễ dàng thiết lập link Zoom, Teams hoặc Google Meet trực tiếp cho sinh viên.</p>
                            <button
                                onClick={() => {
                                    setNewPlan(p => ({ ...p, type: 'live' }));
                                    setIsAddModalOpen(true);
                                }}
                                className="w-full py-4 bg-white/10 hover:bg-amber-500 hover:text-slate-900 rounded-2xl text-sm font-bold transition-all backdrop-blur-md border border-white/10 cursor-pointer"
                            >
                                Setup Live
                            </button>
                        </div>

                        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-8">Ghi chú gần đây</h3>
                            <div className="space-y-6">
                                {scheduleItems.filter(i => i.isPersonal).slice(0, 3).map(note => (
                                    <div key={note.id} className="group cursor-pointer" onClick={() => setSelectedItem(note)}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{note.startAt ? format(parseISO(note.startAt), 'dd/MM/yyyy') : ''}</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 group-hover:text-amber-600 transition-colors line-clamp-1">"{note.title}"</p>
                                    </div>
                                ))}
                                {scheduleItems.filter(i => i.isPersonal).length === 0 && (
                                    <p className="text-xs font-bold text-slate-300">Không có ghi chú nào</p>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* MODAL: ADD/EDIT PLAN */}
            {isAddModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500 cursor-pointer"
                    onClick={() => { setIsAddModalOpen(false); resetForm(); }}
                >
                    <div
                        className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl scale-in-center border border-gray-100 relative max-h-[90vh] overflow-y-auto no-scrollbar cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-slate-900 px-8 z-50 py-10 md:px-12 text-white sticky top-0">
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="p-4 bg-amber-500 rounded-[22px] text-slate-900 shadow-lg shadow-amber-500/20">
                                    <CalendarCheck size={32} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl md:text-3xl font-bold">
                                        {isEditingPlan ? 'Cập nhật kế hoạch' : 'Lập kế hoạch'}
                                    </h3>
                                    <p className="text-white/40 text-xs font-medium mt-1">
                                        {isEditingPlan ? 'Thay đổi thông tin lịch giảng dạy' : 'Sắp xếp công việc giảng dạy khoa học'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsAddModalOpen(false); resetForm(); }}
                                className="absolute top-1/2 -translate-y-1/2 right-8 p-3 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-2xl transition-all cursor-pointer border border-white/5 z-50 pointer-events-auto"
                            >
                                <X size={24} />
                            </button>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                        </div>

                        <div className="p-8 md:p-12 space-y-10">
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-slate-500 ml-1 flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                                    Tiêu đề kế hoạch / Ghi chú
                                </label>
                                <input
                                    type="text"
                                    placeholder="VD: 'Giải đáp thắc mắc Unit 10'..."
                                    className="w-full mt-1 bg-slate-50 border-2 border-slate-100 focus:border-amber-500 focus:bg-white rounded-[14px] px-6 py-4 text-sm transition-all outline-none shadow-sm placeholder:text-slate-300"
                                    value={newPlan.title}
                                    onChange={e => setNewPlan({ ...newPlan, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-500 ml-1">Ngày thực hiện</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            className="w-full mt-1 bg-slate-50 border-2 border-slate-100 focus:border-amber-500 focus:bg-white rounded-[10px] px-6 py-4 text-sm font-bold transition-all outline-none appearance-none"
                                            value={newPlan.date}
                                            onChange={e => setNewPlan({ ...newPlan, date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-500 ml-1">Bắt đầu</label>
                                    <input
                                        type="time"
                                        className="w-full mt-1 bg-slate-50 border-2 border-slate-100 focus:border-amber-500 focus:bg-white rounded-[10px] px-6 py-4 text-sm font-bold transition-all outline-none"
                                        value={newPlan.startTime}
                                        onChange={e => setNewPlan({ ...newPlan, startTime: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-500">Kết thúc</label>
                                    <input
                                        type="time"
                                        className="w-full mt-1 bg-slate-50 border-2 border-slate-100 focus:border-amber-500 focus:bg-white rounded-[10px] px-6 py-4 text-sm font-bold transition-all outline-none"
                                        value={newPlan.endTime}
                                        onChange={e => setNewPlan({ ...newPlan, endTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-5">
                                <label className="text-sm font-bold text-slate-500 ml-1">Loại sự kiện & Hình thức</label>
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-2">
                                    {[
                                        { id: 'note', label: 'Ghi chú', icon: Bookmark, color: 'hover:text-amber-500' },
                                        { id: 'live', label: 'Trực tuyến', icon: Video, color: 'hover:text-rose-500' },
                                        { id: 'lecture', label: 'Học phần', icon: BookOpen, color: 'hover:text-indigo-500' },
                                        { id: 'lesson', label: 'Bài học', icon: Zap, color: 'hover:text-emerald-500' },
                                        { id: 'exam', label: 'Kiểm tra', icon: CalendarCheck, color: 'hover:text-orange-500' }
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setNewPlan({ ...newPlan, type: t.id as any })}
                                            className={`flex flex-col items-center justify-center gap-3 p-5 rounded-[18px] border-2 transition-all cursor-pointer group ${newPlan.type === t.id ? 'bg-slate-900 border-slate-900 text-amber-500 shadow-xl shadow-slate-900/10 scale-[1.05]' : 'bg-white border-slate-100 text-slate-400 hover:border-amber-200 ' + t.color}`}
                                        >
                                            <div className={`p-3 rounded-full transition-colors ${newPlan.type === t.id ? 'bg-white/10' : 'bg-slate-50 group-hover:bg-amber-50'}`}>
                                                <t.icon size={24} />
                                            </div>
                                            <span className="text-[11px] font-bold">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {newPlan.type !== 'note' && (
                                <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                                    <label className="text-sm font-bold text-slate-500 ml-1">Áp dụng cho khóa học</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-slate-50 mt-2 border-2 border-slate-100 focus:border-amber-500 focus:bg-white rounded-[18px] px-8 py-6 text-base transition-all outline-none appearance-none cursor-pointer relative z-10"
                                            value={newPlan.courseId}
                                            onChange={e => setNewPlan({ ...newPlan, courseId: e.target.value })}
                                        >
                                            <option value="">-- Chọn khóa học của bạn --</option>
                                            {myCourses.map(c => (
                                                <option key={c.id} value={c.id}>{c.title}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={20} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-20" />
                                    </div>
                                </div>
                            )}

                            {newPlan.type === 'live' && (
                                <div className="space-y-8 bg-slate-50/80 p-8 md:p-10 rounded-[40px] border-2 border-slate-100 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Thiết lập Live Stream</p>
                                                <p className="text-xs text-slate-500 ">Cung cấp thông tin truy cập cho học viên</p>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="flex flex-wrap gap-3">
                                                {['Zoom', 'Teams', 'Google Meet', 'Other'].map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setNewPlan({ ...newPlan, platform: p as any })}
                                                        className={`px-8 py-3 rounded-2xl text-sm font-medium border-2 transition-all cursor-pointer ${newPlan.platform === p ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white border-slate-200 text-slate-400 hover:border-amber-500 hover:text-amber-500'}`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 ml-2">
                                                        <Hash size={16} className="text-amber-500" />
                                                        <label className="text-sm text-slate-500">Meeting ID</label>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="123 456 7890"
                                                        className="w-full bg-white border-2 border-slate-100 focus:border-amber-500 rounded-2xl px-6 py-4 text-sm font-bold outline-none shadow-sm transition-all"
                                                        value={newPlan.meetingId}
                                                        onChange={e => setNewPlan({ ...newPlan, meetingId: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 ml-2">
                                                        <Key size={16} className="text-amber-500" />
                                                        <label className="text-sm text-slate-500">Passcode</label>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="******"
                                                        className="w-full bg-white border-2 border-slate-100 focus:border-amber-500 rounded-2xl px-6 py-4 text-sm font-bold outline-none shadow-sm transition-all"
                                                        value={newPlan.passcode}
                                                        onChange={e => setNewPlan({ ...newPlan, passcode: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 ml-2">
                                                    <Link size={16} className="text-amber-500" />
                                                    <label className="text-sm text-slate-500">Đường dẫn tham gia</label>
                                                </div>
                                                <input
                                                    type="url"
                                                    placeholder="https://zoom.us/j/..."
                                                    className="w-full bg-white border-2 border-slate-100 focus:border-amber-500 rounded-2xl px-6 py-5 text-sm font-bold outline-none shadow-sm transition-all font-mono"
                                                    value={newPlan.zoomLink}
                                                    onChange={e => setNewPlan({ ...newPlan, zoomLink: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl"></div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <label className="text-sm text-slate-500 ml-1">Mô tả chi tiết kế hoạch</label>
                                <textarea
                                    rows={4}
                                    className="w-full mt-2 bg-slate-50 border-2 border-slate-100 focus:border-amber-500 focus:bg-white rounded-[18px] px-8 py-6 text-sm transition-all outline-none resize-none shadow-sm"
                                    placeholder="Nội dung chính hoặc các lưu ý chuẩn bị cho buổi học..."
                                    value={newPlan.description}
                                    onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                <button
                                    onClick={() => { setIsAddModalOpen(false); resetForm(); }}
                                    disabled={isSubmitting}
                                    className="flex-1 order-2 sm:order-1 py-5 bg-slate-100 text-slate-500 rounded-[22px] text-sm font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                                >
                                    Đóng cửa sổ
                                </button>
                                <button
                                    onClick={handleAddPlan}
                                    disabled={isSubmitting}
                                    className="flex-3 order-1 sm:order-2 py-5 bg-slate-900 text-white rounded-[22px] text-sm font-bold hover:bg-amber-500 hover:text-slate-900 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 cursor-pointer group"
                                >
                                    {isSubmitting ? (
                                        <RefreshCw size={20} className="animate-spin" />
                                    ) : (
                                        <Save size={20} className="group-hover:scale-110 transition-transform" />
                                    )}
                                    {isSubmitting ? 'Đang thực hiện...' : isEditingPlan ? 'Cập nhật kế hoạch ngay' : 'Lưu kế hoạch giảng dạy'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: DETAIL VIEW */}
            {selectedItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl scale-in-center border border-gray-100 relative shadow-slate-900/40 max-h-[90vh] overflow-y-auto no-scrollbar cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`p-10 text-white relative overflow-hidden ${selectedItem.type === 'exam' ? 'bg-rose-500' : selectedItem.type === 'lesson' ? 'bg-blue-500' : selectedItem.type === 'live' ? 'bg-amber-500' : selectedItem.type === 'lecture' ? 'bg-indigo-500' : 'bg-slate-900'}`}>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10 flex items-center justify-between mb-4">
                                <div className="px-5 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold border border-white/20 whitespace-nowrap">
                                    Event Detail / {selectedItem.type}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedItem(null); }}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer z-50 relative pointer-events-auto"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <h3 className="text-xl font-black mt-2 leading-tight">{selectedItem.title}</h3>
                            {selectedItem.courseTitle && (
                                <p className="text-white/80 text-sm font-bold mt-6 flex items-center gap-2 bg-white/10 w-fit px-5 py-2.5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <BookOpen size={16} className="text-amber-700" /> {selectedItem.courseTitle}
                                </p>
                            )}
                        </div>

                        <div className="p-10 space-y-10">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-slate-400 ml-1">Thời gian diễn ra</p>
                                    <div className="flex items-center font-bold gap-3 text-slate-900 group">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors shadow-sm"><Clock size={18} className="text-amber-500" /></div>
                                        <span className="text-md tabular-nums">
                                            {selectedItem.startAt ? format(parseISO(selectedItem.startAt), 'HH:mm, dd/MM') : '--/--'}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-slate-400 ml-1">Trạng thái hiện tại</p>
                                    <div className="flex items-center gap-3 text-slate-900 font-bold group">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors shadow-sm"><Zap size={18} className="text-emerald-500" /></div>
                                        <span className="text-md">{selectedItem.status || 'Upcoming'}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedItem.type === 'live' && (selectedItem.meetingId || selectedItem.zoomLink) && (
                                <div className="space-y-4 bg-slate-900 p-8 rounded-[35px] border border-slate-800 shadow-xl shadow-slate-900/20">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Video size={18} className="text-amber-500" />
                                        <p className="text-md font-bold text-amber-500">Thông tin kết nối</p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-white/5 py-4 px-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                            <span className="text-sm font-bold text-slate-400">Platform</span>
                                            <span className="text-sm font-bold text-white">{selectedItem.platform || 'General'}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white/5 py-4 px-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                            <span className="text-sm font-bold text-slate-400">Meeting ID</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-amber-500">{selectedItem.meetingId || 'N/A'}</span>
                                                <button className="text-slate-400 cursor-pointer hover:text-amber-500 transition-colors">
                                                    <Copy size={16} onClick={() => handleCopy(selectedItem.meetingId || '')} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center bg-white/5 py-4 px-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                            <span className="text-sm font-bold text-slate-400">Passcode</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-amber-500">{selectedItem.passcode || 'N/A'}</span>
                                                <button className="text-slate-400 cursor-pointer hover:text-amber-500 transition-colors">
                                                    <Copy size={16} onClick={() => handleCopy(selectedItem.passcode || '')} />
                                                </button>
                                            </div>
                                        </div>
                                        {selectedItem.zoomLink && (
                                            <a
                                                href={selectedItem.zoomLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full flex items-center justify-center gap-3 py-4 bg-amber-500 text-slate-900 rounded-2xl text-sm font-bold hover:bg-amber-400 hover:scale-[1.02] transition-all mt-6 shadow-lg shadow-amber-500/20"
                                            >
                                                <ExternalLink size={16} /> Bắt đầu ngay
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedItem.description && (
                                <div className="space-y-4">
                                    <p className="text-sm font-bold text-slate-400 ml-1">Mô tả nội dung</p>
                                    <div className="bg-slate-50 p-8 rounded-[35px] border border-slate-100 italic relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
                                        <p className="text-slate-600 font-bold leading-relaxed relative z-10 text-sm">
                                            "{selectedItem.description}"
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-6">
                                <button
                                    onClick={() => handleEditClick(selectedItem)}
                                    className="flex-1 py-5 bg-amber-50 text-amber-600 rounded-[22px] text-sm font-bold hover:bg-amber-500 hover:text-white transition-all border-2 border-amber-100 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                                >
                                    <Save size={20} /> Chỉnh sửa
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(selectedItem)}
                                    className="flex-1 py-5 bg-rose-50 text-rose-500 rounded-[22px] text-sm font-bold hover:bg-rose-500 hover:text-white transition-all border-2 border-rose-100 flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-rose-500/20"
                                >
                                    <Trash2 size={20} /> Gỡ bỏ
                                </button>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="flex-1 py-5 bg-slate-900 text-white rounded-[22px] text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[45px] overflow-hidden animate-in zoom-in-95 border border-slate-100 p-12 flex flex-col items-center text-center shadow-2xl shadow-rose-900/20">
                        <div className="w-24 h-24 bg-rose-50 rounded-[35px] flex items-center justify-center text-rose-500 mb-8 animate-bounce-subtle">
                            <AlertTriangle size={52} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-4">Xác nhận gỡ bỏ?</h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-10 px-6">
                            Bạn có chắc chắn muốn xóa <span className="text-slate-900 font-bold">"{itemToDelete?.title}"</span> khỏi lịch giảng dạy không? Hành động này không thể hoàn tác.
                        </p>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            <button
                                onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}
                                disabled={isDeleting}
                                className="px-6 py-5 bg-slate-50 hover:bg-slate-100 text-slate-400 font-bold text-sm rounded-[22px] shadow-xl shadow-slate-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleExecuteDelete}
                                disabled={isDeleting}
                                className="px-6 py-5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-[22px] shadow-xl shadow-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {isDeleting ? 'Đang gỡ...' : 'Xác nhận xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherSchedule;
