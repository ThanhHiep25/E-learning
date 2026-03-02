import React, { useEffect, useState } from 'react';
import {
    ChevronRight, ChevronLeft,
    CalendarCheck, Zap, Star
} from 'lucide-react';
import { mockSchedule, type ScheduleItem } from '../config/schedule-data';

const LearningSchedule: React.FC = () => {
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [currentDate, setCurrentDate] = useState(new Date(2024, 2, 1));

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const getTypeColor = (type: ScheduleItem['type']) => {
        switch (type) {
            case 'lesson': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'exam': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'assignment': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'live': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
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
            <div className="bg-white/40 backdrop-blur-xl rounded-[40px] shadow-2xl shadow-amber-900/5 border border-white/60 overflow-hidden">
                <div className="grid grid-cols-7 bg-white/40 border-b border-gray-100/50">
                    {weekDays.map(d => (
                        <div key={d} className="py-6 text-center text-[11px] font-extrabold text-gray-400 uppercase tracking-[0.25em]">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 divide-x divide-y divide-gray-100/30">
                    {days.map((d, i) => {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
                        const dayEvents = d.current ? mockSchedule.filter(item => item.date === dateStr) : [];
                        const isToday = d.current && d.day === 20;

                        return (
                            <div key={i} className={`min-h-[150px] p-5 relative group transition-all duration-500 ${d.current ? 'hover:bg-amber-50/30' : 'bg-gray-50/40 opacity-40'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`text-lg font-bold tracking-tight ${isToday ? 'w-9 h-9 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200' : d.current ? 'text-gray-900' : 'text-gray-300'}`}>
                                        {d.day}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {dayEvents.map(event => (
                                        <div key={event.id} className={`px-3 py-2 rounded-xl text-[10px] font-bold leading-tight shadow-sm border ${getTypeColor(event.type)}`}>
                                            <div className="truncate uppercase tracking-tight">{event.title}</div>
                                            <div className="opacity-60 mt-1">{event.startTime}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    return (
        <div className="min-h-screen bg-[#FDF8EE]  ">
            <div className="bg-gray-900 w-full px-6 md:px-10 md:h-86 h-90 md:pt-40 pt-10 pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16 max-w-[1440px] mx-auto">
                    <div className="lg:col-span-2">
                        <h1 className="md:text-6xl text-4xl font-bold text-slate-100 mb-4 tracking-tighter leading-none italic">Lịch học <span className="text-amber-500">của bạn</span></h1>
                        <div className="flex items-center gap-2 p-1.5 bg-white shadow-xl shadow-gray-200/50 border border-gray-100 rounded-[28px] w-fit">
                            <button onClick={() => setViewMode('list')} className={`md:px-8 px-4 py-3.5 rounded-[22px] text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Timeline</button>
                            <button onClick={() => setViewMode('calendar')} className={`md:px-8 px-4 py-3.5 rounded-[22px] text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${viewMode === 'calendar' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Calendar</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 lg:col-span-2">
                        <div className="bg-amber-400 rounded-[20px] md:rounded-[40px] p-8 text-slate-900 shadow-xl relative overflow-hidden">
                            <CalendarCheck size={120} className="absolute -right-8 -bottom-8 opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Next Event</p>
                            <h3 className="text-2xl font-bold leading-tight">Kiểm tra Chương 1</h3>
                        </div>
                        <div className="bg-white rounded-[20px] md:rounded-[40px] p-8 shadow-xl relative overflow-hidden border border-gray-100">
                            <Zap size={120} className="absolute -right-8 -bottom-8 text-emerald-500/10" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Progress</p>
                            <h3 className="text-4xl font-bold text-emerald-500">85%</h3>
                        </div>
                    </div>
                </div>
            </div>


            <div className="flex flex-col xl:flex-row gap-12 px-6 md:px-10 max-w-[1440px] mx-auto mt-20 mb-20">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-10 px-4">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tighter">
                            Tháng {String(currentDate.getMonth() + 1).padStart(2, '0')}, {currentDate.getFullYear()}
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={prevMonth} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer"><ChevronLeft size={20} /></button>
                            <button onClick={nextMonth} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer"><ChevronRight size={20} /></button>
                        </div>
                    </div>

                    {viewMode === 'list' ? (
                        <div className="space-y-6">
                            {mockSchedule
                                .filter(item => {
                                    const d = new Date(item.date);
                                    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                                })
                                .map(item => (
                                    <div key={item.id} className="bg-white cursor-pointer rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 relative overflow-hidden group hover:shadow-xl transition-all">
                                        <div className="flex md:flex-col items-center justify-center gap-1 md:w-20 shrink-0 p-4 bg-slate-50 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all">
                                            <span className="text-3xl font-bold">{item.date.split('-')[2]}</span>
                                            <span className="text-[10px] font-black opacity-60 uppercase">TH.{String(currentDate.getMonth() + 1).padStart(2, '0')}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 ${getTypeColor(item.type)}`}>{item.type}</div>
                                            <h3 className="text-xl font-bold text-slate-900 uppercase">{item.title}</h3>
                                            <p className="text-sm text-slate-500 mt-2 line-clamp-1">{item.description}</p>
                                        </div>
                                        <div className="flex items-center gap-6 shrink-0 border-l border-gray-50 pl-8">
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-slate-900">{item.startTime}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Start</p>
                                            </div>
                                            <button className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center group-hover:bg-amber-500 transition-all cursor-pointer"><ChevronRight size={20} /></button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : renderCalendar()}
                </div>

                <aside className="w-full xl:w-96 space-y-8">
                    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-8">Weekly Progress</h3>
                        <div className="flex items-end justify-between gap-2 h-32">
                            {[60, 45, 90, 30, 75, 50, 20].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div className={`w-full rounded-t-lg bg-gray-100 ${i === 2 ? 'bg-amber-500' : ''}`} style={{ height: `${h}%` }}></div>
                                    <span className="text-[9px] font-bold text-gray-400">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6">Recent Tests</h3>
                        <div className="space-y-4">
                            {[{ title: 'TOEIC Mock #4', score: '850/990' }, { title: 'Python Basis', score: '10/10' }].map((t, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                                    <span className="text-xs font-bold uppercase truncate max-w-[120px]">{t.title}</span>
                                    <span className="text-xs font-bold text-emerald-600">{t.score}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>

    );
};

export default LearningSchedule;
