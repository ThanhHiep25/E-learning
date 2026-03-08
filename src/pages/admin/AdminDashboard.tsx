import React, { useEffect, useMemo, useState } from 'react';
import { Users, BookOpen, GraduationCap, BarChart3, CreditCard, Star, Layers } from 'lucide-react';
import { adminService, type AdminDashboardStats } from '../../services/admin.service';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await adminService.getDashboard();
        setStats(s);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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
      </div>
    </div>
  );
};

export default AdminDashboard;
