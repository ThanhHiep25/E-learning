import React, { useEffect, useMemo, useState } from 'react';
import { Users, BookOpen, GraduationCap, BarChart3, CreditCard, Star, Layers, MousePointer2, Globe, Laptop, Smartphone, Tablet, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminService, type AdminDashboardStats, type TrackingAnalytics } from '../../services/admin.service';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [tracking, setTracking] = useState<TrackingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingSearch, setTrackingSearch] = useState('');
  const [trackingPage, setTrackingPage] = useState(1);
  const trackingLimit = 10;

  const loadDashboard = async () => {
    try {
      const s = await adminService.getDashboard();
      setStats(s);
    } catch (error) {
      console.error('Stats load failed');
    }
  };

  const loadTracking = async (page = 1, search = '') => {
    setTrackingLoading(true);
    try {
      const t = await adminService.getTrackingAnalytics({ page, limit: trackingLimit, search });
      setTracking(t);
    } catch (error) {
      console.error('Tracking load failed');
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadDashboard(), loadTracking(1, '')]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) loadTracking(trackingPage, trackingSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [trackingSearch, trackingPage]);

  const cards = [
    { label: 'Tổng người dùng', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Tổng khóa học', value: stats?.totalCourses ?? 0, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Tổng lượt ghi danh', value: stats?.totalEnrollments ?? 0, icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const extraCards = [
    { label: 'Tổng giao dịch', value: stats?.totalPayments ?? 0, icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    {
      label: 'Doanh thu (Completed)',
      value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(stats?.totalRevenue ?? 0)),
      icon: BarChart3,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    { label: 'Tổng reviews', value: stats?.totalReviews ?? 0, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Danh mục', value: stats?.totalCategories ?? 0, icon: Layers, color: 'text-teal-600', bg: 'bg-teal-50' },
  ];

  const learningSeries = stats?.learning?.last7Days || [];
  const chartPoints = useMemo(() => {
    const values = learningSeries.map((d) => Number(d.avgPercentage || 0));
    const maxV = Math.max(100, ...values);
    const minV = 0;
    const w = 600;
    const h = 160;
    const padX = 24;
    const padY = 18;
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;
    const n = learningSeries.length;
    if (n === 0) return { w, h, path: '', dots: [] as Array<{ x: number; y: number; v: number; label: string }> };

    const scaleX = (i: number) => (n === 1 ? padX + innerW / 2 : padX + (innerW * i) / (n - 1));
    const scaleY = (v: number) => padY + innerH - ((v - minV) / (maxV - minV || 1)) * innerH;

    const dots = learningSeries.map((d, i) => {
      const v = Number(d.avgPercentage || 0);
      return {
        x: scaleX(i),
        y: scaleY(v),
        v,
        label: String(d.date).slice(5),
      };
    });

    const path = dots.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return { w, h, path, dots };
  }, [learningSeries]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 flex items-center gap-3">
              <BarChart3 size={32} className="text-amber-500" />
              Bảng điều khiển
            </h1>
            <p className="text-gray-500 font-medium mt-1">Thống kê tổng quan hệ thống</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {cards.map((c) => (
            <div key={c.label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${c.bg} ${c.color} p-3 rounded-2xl`}>
                  <c.icon size={24} />
                </div>
                <BarChart3 size={20} className="text-gray-200" />
              </div>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">{c.label}</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{Number(c.value).toLocaleString()}</h3>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Thống kê học tập (Quiz)</h2>
              <p className="text-gray-500 font-medium mt-1">Điểm trung bình theo ngày (7 ngày gần nhất)</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total attempts</div>
                <div className="text-sm font-bold text-gray-800 mt-1">{Number(stats?.learning?.totalAttempts ?? 0).toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Avg % overall</div>
                <div className="text-sm font-bold text-gray-800 mt-1">{Number(stats?.learning?.avgPercentageOverall ?? 0).toFixed(2)}%</div>
              </div>
            </div>
          </div>

          {learningSeries.length === 0 ? (
            <div className="p-10 text-center font-bold text-gray-400">Chưa có dữ liệu attempts</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <svg viewBox={`0 0 ${chartPoints.w} ${chartPoints.h}`} className="w-full min-w-[600px] h-[180px]">
                <rect x="0" y="0" width={chartPoints.w} height={chartPoints.h} fill="#ffffff" />
                <line x1="24" y1="18" x2="24" y2="142" stroke="#f3f4f6" strokeWidth="2" />
                <line x1="24" y1="142" x2="576" y2="142" stroke="#f3f4f6" strokeWidth="2" />
                <path d={chartPoints.path} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {chartPoints.dots.map((p: { x: number; y: number; v: number; label: string }) => (
                  <g key={p.label}>
                    <circle cx={p.x} cy={p.y} r="4" fill="#f59e0b" />
                    <text x={p.x} y={156} textAnchor="middle" fontSize="10" fill="#9ca3af" fontWeight="700">
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-7 gap-2">
                {learningSeries.map((d) => (
                  <div key={d.date} className="bg-gray-50 rounded-2xl px-3 py-2 border border-gray-100">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{String(d.date).slice(5)}</div>
                    <div className="text-xs font-bold text-gray-800 mt-1">{Number(d.avgPercentage ?? 0).toFixed(2)}%</div>
                    <div className="text-[10px] font-bold text-gray-400">{Number(d.attempts ?? 0)} attempts</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {extraCards.map((c) => (
            <div key={c.label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${c.bg} ${c.color} p-3 rounded-2xl`}>
                  <c.icon size={24} />
                </div>
                <BarChart3 size={20} className="text-gray-200" />
              </div>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">{c.label}</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{typeof c.value === 'number' ? Number(c.value).toLocaleString() : c.value}</h3>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Payments completed</div>
              <div className="text-sm font-bold text-gray-800 mt-1">{Number(stats?.completedPayments ?? 0).toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Payments failed</div>
              <div className="text-sm font-bold text-gray-800 mt-1">{Number(stats?.failedPayments ?? 0).toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Avg rating</div>
              <div className="text-sm font-bold text-gray-800 mt-1">{Number(stats?.avgRating ?? 0).toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* User Behavior Analytics */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          {/* Left: Tracking Summary */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <MousePointer2 size={20} className="text-amber-500" />
                    Hoạt động người dùng
                  </h2>
                  <p className="text-xs font-bold text-gray-400 mt-1">Dữ liệu từ Cookie & Tracking</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Tìm tên, URL, IP..."
                      value={trackingSearch}
                      onChange={(e) => { setTrackingSearch(e.target.value); setTrackingPage(1); }}
                      className="pl-11 pr-6 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500/20 transition-all w-full md:w-[260px]"
                    />
                    {trackingLoading && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-500 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400">Tổng lượt xem</p>
                      <p className="text-lg font-black text-gray-900">{tracking?.stats.totalViews.toLocaleString() || 0}</p>
                    </div>
                    <div className="text-right border-l border-gray-100 pl-4">
                      <p className="text-[10px] font-bold text-gray-400">Users duy nhất</p>
                      <p className="text-lg font-black text-gray-900">{tracking?.stats.uniqueUsers.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-gray-400">Danh sách hoạt động</h3>
                  {tracking?.activities.total && (
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 uppercase tracking-widest">
                      {tracking.activities.total} Kết quả
                    </span>
                  )}
                </div>
                <div className="overflow-hidden rounded-2xl border border-gray-50">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <tr>
                        <th className="px-6 py-4">Người dùng</th>
                        <th className="px-6 py-4">Hành động</th>
                        <th className="px-6 py-4">Trang</th>
                        <th className="px-6 py-4 text-right">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y divide-gray-50 transition-opacity duration-200 ${trackingLoading ? 'opacity-50' : 'opacity-100'}`}>
                      {(tracking?.activities.items || []).length === 0 ? (
                        <tr><td colSpan={4} className="p-12 text-center text-gray-400 font-bold">Chưa có dữ liệu hoạt động</td></tr>
                      ) : (
                        tracking?.activities.items.map((act) => (
                          <tr key={act.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">{act.user?.name || 'Anonymous'}</span>
                                <span className="text-[10px] text-gray-400 font-medium">{act.ipAddress}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest ${act.action === 'page_view' ? 'text-blue-600' :
                                act.action === 'cookie_consent_granted' ? 'text-emerald-600' :
                                  'text-amber-600'
                                }`}>
                                {act.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-500 truncate max-w-[150px]" title={act.page || ''}>
                              {act.page}
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-400 text-right">
                              {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {tracking && tracking.activities.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-xs font-bold text-gray-400">
                      Trang <span className="text-gray-900">{tracking.activities.page}</span> trên <span className="text-gray-900">{tracking.activities.totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTrackingPage(p => Math.max(1, p - 1))}
                        disabled={tracking.activities.page === 1}
                        className="p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                      >
                        <ChevronLeft size={18} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => setTrackingPage(p => Math.min(tracking.activities.totalPages, p + 1))}
                        disabled={tracking.activities.page === tracking.activities.totalPages}
                        className="p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                      >
                        <ChevronRight size={18} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Top Pages & Device Stats */}
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Globe size={18} className="text-amber-500" />
                Trang xem nhiều nhất
              </h2>
              <div className="space-y-4">
                {(tracking?.pageStats || []).length === 0 && <p className="text-center text-gray-400 text-xs font-bold py-4">Chưa có dữ liệu trang</p>}
                {tracking?.pageStats.map((p, idx) => (
                  <div key={p.page} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-gray-600 truncate max-w-[150px]" title={p.page}>{p.page}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-lg">
                      {p.count} <span className="text-[10px] text-gray-400 ml-0.5">lượt</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl shadow-slate-200">
              <h3 className="text-xs font-bold text-slate-400 mb-6">Thiết bị truy cập</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-2 text-slate-300">
                    <Laptop size={18} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400">Desktop</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-2 text-slate-300">
                    <Smartphone size={18} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400">Mobile</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-2 text-slate-300">
                    <Tablet size={18} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400">Tablet</p>
                </div>
              </div>
              <div className="mt-8 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <p className="text-xs font-medium text-slate-300 leading-relaxed">
                  <span className="text-amber-400 font-bold">Mẹo:</span> Tối ưu hóa khóa học cho thiết bị di động sẽ giúp tăng 25% tỷ lệ hoàn thành bài học.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
