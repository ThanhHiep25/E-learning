import React, { useEffect, useMemo, useState } from 'react';
import {
  Users, BookOpen, GraduationCap, BarChart3, CreditCard, Star,
  MousePointer2, Globe, Laptop, Smartphone, Tablet, Search, ChevronLeft, ChevronRight,
  TrendingUp, Calendar, Activity, DollarSign, Award, PieChart, TrendingDown,
  CheckCircle, AlertCircle, FileText, ArrowRight, Clock, Bell
} from 'lucide-react';
import { adminService, type AdminDashboardStats, type TrackingAnalytics, type RevenueByDay, type TopCourse, type PaymentStatusCounts } from '../../services/admin.service';

// ==========================================
// TYPES
// ==========================================
interface ChartData {
  label: string;
  value: number;
}

// ==========================================
// CHART COMPONENTS
// ==========================================
const LineChart: React.FC<{ data: ChartData[]; color?: string; height?: number }> = ({ data, color = '#f59e0b', height = 180 }) => {
  if (data.length === 0) return <div className="h-full flex items-center justify-center text-gray-400">Chưa có dữ liệu</div>;

  const values = data.map(d => d.value);
  const maxV = Math.max(...values, 1);
  const minV = 0;
  const w = 600;
  const h = height - 20;
  const padX = 30;
  const padY = 20;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const n = data.length;

  const scaleX = (i: number) => (n === 1 ? padX + innerW / 2 : padX + (innerW * i) / (n - 1));
  const scaleY = (v: number) => padY + innerH - ((v - minV) / (maxV - minV || 1)) * innerH;

  const dots = data.map((d, i) => ({
    x: scaleX(i),
    y: scaleY(d.value),
    v: d.value,
    label: d.label,
  }));

  const path = dots.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <rect x="0" y="0" width={w} height={height} fill="#ffffff" />
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
        <line key={i} x1={padX} y1={padY + innerH * ratio} x2={w - padX} y2={padY + innerH * ratio} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4,4" />
      ))}
      <path d={`${path} L ${dots[dots.length - 1]?.x || padX} ${padY + innerH} L ${dots[0]?.x || padX} ${padY + innerH} Z`} fill={`${color}20`} />
      <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {dots.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill={color} stroke="white" strokeWidth="2" />
          <text x={p.x} y={height - 5} textAnchor="middle" fontSize="10" fill="#9ca3af" fontWeight="600">{p.label}</text>
        </g>
      ))}
    </svg>
  );
};

const BarChart: React.FC<{ data: ChartData[]; color?: string; height?: number }> = ({ data, color = '#3b82f6', height = 180 }) => {
  if (data.length === 0) return <div className="h-full flex items-center justify-center text-gray-400">Chưa có dữ liệu</div>;

  const maxV = Math.max(...data.map(d => d.value), 1);
  const w = 800; // Increased width
  const h = height - 70; // More space for text
  const padX = 60; // Increased padding
  const padY = 25;
  const innerW = w - padX * 2;
  const barWidth = Math.min((innerW / data.length) * 0.7, 80); // Wider bars
  const gap = (innerW / data.length) * 0.3; // Smaller gap

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <rect x="0" y="0" width={w} height={height} fill="#ffffff" />
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
        <line key={i} x1={padX} y1={padY + h * ratio} x2={w - padX} y2={padY + h * ratio} stroke="#f3f4f6" strokeWidth="1" />
      ))}
      {data.map((d, i) => {
        const barHeight = (d.value / maxV) * h;
        const x = padX + i * (barWidth + gap) + gap / 2;
        const y = padY + h - barHeight;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barHeight} fill={color} rx="6" />
            <text x={x + barWidth / 2} y={y - 10} textAnchor="middle" fontSize="13" fill="#1f2937" fontWeight="700">{d.value}</text>
            {/* Word wrap for long course names */}
            {(() => {
              const words = d.label.split(' ');
              const lines = [];
              let currentLine = '';
              
              words.forEach(word => {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                // Estimate width (rough calculation)
                if (testLine.length > 20 && currentLine) {
                  lines.push(currentLine);
                  currentLine = word;
                } else {
                  currentLine = testLine;
                }
              });
              if (currentLine) lines.push(currentLine);
              
              return lines.map((line, i) => (
                <text 
                  key={i}
                  x={x + barWidth / 2} 
                  y={padY + h + 15 + i * 12} 
                  textAnchor="middle" 
                  fontSize="9" 
                  fill="#6b7280" 
                  fontWeight="500"
                >
                  {line}
                </text>
              ));
            })()}
          </g>
        );
      })}
    </svg>
  );
};

const DonutChart: React.FC<{ data: { label: string; value: number; color: string }[]; size?: number }> = ({ data, size = 160 }) => {
  if (data.length === 0 || data.every(d => d.value === 0)) {
    return <div className="flex items-center justify-center text-gray-400 text-sm" style={{ width: size, height: size }}>Không có dữ liệu</div>;
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2 - 20;
  const center = size / 2;
  let currentAngle = -Math.PI / 2;

  return (
    <svg width={size} height={size}>
      {data.map((d, i) => {
        const angle = (d.value / total) * Math.PI * 2;
        const x1 = center + radius * Math.cos(currentAngle);
        const y1 = center + radius * Math.sin(currentAngle);
        const x2 = center + radius * Math.cos(currentAngle + angle);
        const y2 = center + radius * Math.sin(currentAngle + angle);
        const largeArc = angle > Math.PI ? 1 : 0;
        currentAngle += angle;
        return <path key={i} d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={d.color} stroke="white" strokeWidth="2" />;
      })}
      <circle cx={center} cy={center} r={radius * 0.6} fill="white" />
      <text x={center} y={center - 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#374151">{total.toLocaleString()}</text>
      <text x={center} y={center + 12} textAnchor="middle" fontSize="9" fill="#9ca3af">Tổng</text>
    </svg>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [tracking, setTracking] = useState<TrackingAnalytics | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueByDay[]>([]);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingSearch, setTrackingSearch] = useState('');
  const [trackingPage, setTrackingPage] = useState(1);
  const trackingLimit = 10;
  const [pendingCourses, setPendingCourses] = useState(0);
  const [pendingEnrollments, setPendingEnrollments] = useState(0);

  const loadDashboard = async () => {
    try {
      const s = await adminService.getDashboard();
      setStats(s);
    } catch (error) {
      console.error('Stats load failed');
    }
  };

  const loadRevenueData = async () => {
    try {
      const res = await adminService.getRevenueByDay();
      setRevenueData(res.revenueByDay || []);
    } catch (error) {
      console.error('Revenue data load failed');
    }
  };

  const loadTopCourses = async () => {
    try {
      console.log('[AdminDashboard] Loading top courses...');
      const res = await adminService.getTopCourses(5);
      console.log('[AdminDashboard] Top courses response:', res);
      setTopCourses(res.topCourses || []);
    } catch (error) {
      console.error('Top courses load failed:', error);
    }
  };

  const loadPaymentStatus = async () => {
    try {
      const res = await adminService.getPaymentStatusCounts();
      setPaymentStatus(res);
    } catch (error) {
      console.error('Payment status load failed');
    }
  };

  const loadPendingItems = async () => {
    try {
      const coursesRes = await adminService.getPendingReviewCourses({ page: 1, limit: 1 });
      setPendingCourses(coursesRes.pagination?.total || 0);
      // TODO: Load pending enrollments when API available
      setPendingEnrollments(0);
    } catch (error) {
      console.error('Pending items load failed');
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
      await Promise.all([
        loadDashboard(),
        loadTracking(1, ''),
        loadRevenueData(),
        loadTopCourses(),
        loadPaymentStatus(),
        loadPendingItems(),
      ]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) loadTracking(trackingPage, trackingSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [trackingSearch, trackingPage, loading]);

  // Stats cards data
  const mainStats = [
    { label: 'Tổng người dùng', value: stats?.totalUsers ?? 0, trend: '+12%', trendUp: true, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', borderColor: 'border-blue-100' },
    { label: 'Tổng khóa học', value: stats?.totalCourses ?? 0, trend: '+5%', trendUp: true, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', borderColor: 'border-emerald-100' },
    { label: 'Tổng ghi danh', value: stats?.totalEnrollments ?? 0, trend: '+18%', trendUp: true, icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-50', borderColor: 'border-amber-100' },
    { label: 'Doanh thu', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(stats?.totalRevenue ?? 0)), rawValue: stats?.totalRevenue ?? 0, trend: '+24%', trendUp: true, icon: DollarSign, color: 'text-rose-600', bg: 'bg-rose-50', borderColor: 'border-rose-100' },
  ];

  const secondaryStats = [
    { label: 'Giao dịch', value: stats?.totalPayments ?? 0, icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Hoàn thành', value: stats?.completedPayments ?? 0, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Thất bại', value: stats?.failedPayments ?? 0, icon: Activity, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Đánh giá', value: stats?.totalReviews ?? 0, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  // Chart data from APIs
  const learningSeries = stats?.learning?.last7Days || [];

  const revenueChartData: ChartData[] = useMemo(() => {
    return revenueData.map(d => ({ label: d.dayOfWeek, value: d.revenue }));
  }, [revenueData]);

  const enrollmentChartData: ChartData[] = useMemo(() => {
    return topCourses.map(c => ({ label: c.title, value: c.enrollmentCount }));
  }, [topCourses]);

  const paymentStatusData = useMemo(() => [
    { label: 'Completed', value: paymentStatus?.statusCounts.completed ?? stats?.completedPayments ?? 0, color: '#10b981' },
    { label: 'Pending', value: paymentStatus?.statusCounts.pending ?? 0, color: '#f59e0b' },
    { label: 'Failed', value: paymentStatus?.statusCounts.failed ?? stats?.failedPayments ?? 0, color: '#ef4444' },
    { label: 'Cancelled', value: paymentStatus?.statusCounts.cancelled ?? 0, color: '#6b7280' },
  ], [paymentStatus, stats]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 flex items-center gap-3">
              <BarChart3 size={32} className="text-amber-500" />
              Bảng điều khiển
            </h1>
            <p className="text-gray-500 font-medium mt-1">Thống kê tổng quan hệ thống</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500 bg-white px-4 py-2 rounded-2xl border border-gray-100">
            <Calendar size={16} />
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity size={16} />
            Thao tác nhanh
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/admin/courses" className="group bg-white rounded-xl p-4 border border-gray-100 hover:border-amber-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <CheckCircle size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Duyệt khóa học</p>
                  <p className="text-xs text-gray-500">Quản lý & phê duyệt</p>
                </div>
              </div>
              {pendingCourses > 0 && (
                <span className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-600 text-xs font-bold rounded-lg">
                  <AlertCircle size={12} />
                  {pendingCourses} chờ duyệt
                </span>
              )}
            </a>
            <a href="/admin/users" className="group bg-white rounded-xl p-4 border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Quản lý Users</p>
                  <p className="text-xs text-gray-500">Xem & chỉnh sửa</p>
                </div>
              </div>
            </a>
            <a href="/admin/dashboard" className="group bg-white rounded-xl p-4 border border-gray-100 hover:border-emerald-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <FileText size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Xem báo cáo</p>
                  <p className="text-xs text-gray-500">Thống kê chi tiết</p>
                </div>
              </div>
            </a>
            <a href="/admin/notifications" className="group bg-white rounded-xl p-4 border border-gray-100 hover:border-purple-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Bell size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Thông báo</p>
                  <p className="text-xs text-gray-500">Gửi thông báo</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Pending Alerts */}
        {(pendingCourses > 0 || pendingEnrollments > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingCourses > 0 && (
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl border border-rose-100 p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
                    <Clock size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-rose-600 font-medium">Khóa học chờ duyệt</p>
                    <p className="text-2xl font-black text-gray-900">{pendingCourses}</p>
                  </div>
                </div>
                <a href="/admin/courses" className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-xl transition-colors flex items-center gap-2">
                  Xem ngay
                  <ArrowRight size={16} />
                </a>
              </div>
            )}
            {pendingEnrollments > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-100 p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                    <GraduationCap size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-amber-600 font-medium">Ghi danh chờ xác nhận</p>
                    <p className="text-2xl font-black text-gray-900">{pendingEnrollments}</p>
                  </div>
                </div>
                <a href="/admin/enrollments" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors flex items-center gap-2">
                  Xem ngay
                  <ArrowRight size={16} />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainStats.map((card) => (
            <div key={card.label} className={`bg-white p-6 rounded-3xl border-2 ${card.borderColor} shadow-sm hover:shadow-lg transition-all duration-300 group`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.bg} ${card.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                  <card.icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${card.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {card.trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {card.trend}
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium">{card.label}</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</h3>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={20} className="text-rose-500" />
                  Doanh thu 7 ngày qua
                </h2>
                <p className="text-gray-500 text-sm mt-1">Biến động doanh thu theo ngày</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-rose-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(revenueData.reduce((sum, d) => sum + d.revenue, 0))}
                </p>
                <p className="text-xs text-gray-400">Tổng 7 ngày</p>
              </div>
            </div>
            <LineChart data={revenueChartData} color="#f43f5e" height={200} />
          </div>

          {/* Learning Progress Chart */}
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <GraduationCap size={20} className="text-amber-500" />
                  Tiến độ học tập
                </h2>
                <p className="text-gray-500 text-sm mt-1">Điểm trung bình Quiz (7 ngày)</p>
              </div>
              <div className="flex gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Total attempts</p>
                  <p className="text-lg font-bold text-gray-800">{Number(stats?.learning?.totalAttempts ?? 0).toLocaleString()}</p>
                </div>
                <div className="text-right border-l border-gray-100 pl-3">
                  <p className="text-xs text-gray-400">Avg %</p>
                  <p className="text-lg font-bold text-amber-600">{Number(stats?.learning?.avgPercentageOverall ?? 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>
            <LineChart data={learningSeries.map(d => ({ label: String(d.date).slice(5), value: Number(d.avgPercentage || 0) }))} color="#f59e0b" height={200} />
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Courses Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen size={20} className="text-blue-500" />
                  Top khóa học được đăng ký
                </h2>
                <p className="text-gray-500 text-sm mt-1">5 khóa học có nhiều học viên nhất</p>
              </div>
            </div>
            <BarChart data={enrollmentChartData} color="#3b82f6" height={300} />
          </div>

          {/* Payment Status Donut Chart */}
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <PieChart size={20} className="text-emerald-500" />
                Trạng thái thanh toán
              </h2>
              <p className="text-gray-500 text-sm mt-1">Phân bổ giao dịch</p>
            </div>
            <div className="flex items-center justify-center">
              <DonutChart data={paymentStatusData} size={200} />
            </div>
            <div className="mt-6 space-y-2">
              {paymentStatusData.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600">{item.label}</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {secondaryStats.map((card) => (
            <div key={card.label} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`${card.bg} ${card.color} p-2.5 rounded-xl`}>
                  <card.icon size={20} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium">{card.label}</p>
                  <h4 className="text-lg font-bold text-gray-900">{Number(card.value).toLocaleString()}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cookie Consent Stats */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[32px] border border-emerald-100 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Cookie Consent</h2>
                <p className="text-sm text-gray-500">Trạng thái đồng ý cookie của người dùng</p>
              </div>
            </div>
            <button
              onClick={() => {
                // Clear all cookies and reload
                document.cookie.split(';').forEach(c => {
                  document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
                });
                localStorage.removeItem('cookieConsent');
                window.location.reload();
              }}
              className="px-4 py-2 bg-white text-emerald-600 font-bold text-sm rounded-xl hover:bg-emerald-100 transition-all shadow-sm"
            >
              Reset Cookie Consent
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Accepted */}
            <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đã đồng ý</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {tracking?.activities?.items?.filter(a => a.action === 'cookie_consent_granted').length || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="mt-3 h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${tracking?.activities?.items?.length
                      ? (tracking.activities.items.filter(a => a.action === 'cookie_consent_granted').length / tracking.activities.items.length) * 100
                      : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Denied */}
            <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Từ chối</p>
                  <p className="text-2xl font-black text-rose-600 mt-1">
                    {tracking?.activities?.items?.filter(a => a.action === 'cookie_consent_denied').length || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="mt-3 h-2 bg-rose-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{
                    width: `${tracking?.activities?.items?.length
                      ? (tracking.activities.items.filter(a => a.action === 'cookie_consent_denied').length / tracking.activities.items.length) * 100
                      : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Pending/No Action */}
            <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chưa phản hồi</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {Math.max(0, (tracking?.stats?.uniqueUsers || 0) - (tracking?.activities?.items?.filter(a => a.action?.includes('cookie_consent')).length || 0))}
                  </p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-3 h-2 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${tracking?.stats?.uniqueUsers
                      ? (Math.max(0, (tracking.stats.uniqueUsers - (tracking.activities?.items?.filter(a => a.action?.includes('cookie_consent')).length || 0))) / tracking.stats.uniqueUsers) * 100
                      : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* User Behavior Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
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
                    {trackingLoading && <div className="absolute right-4 top-1/2 -translate-y-1/2"><div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-500 border-t-transparent"></div></div>}
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
                  {tracking?.activities.total && <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 uppercase tracking-widest">{tracking.activities.total} Kết quả</span>}
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
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest ${act.action === 'page_view' ? 'text-blue-600' : act.action === 'cookie_consent_granted' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {act.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-500 truncate max-w-[150px]" title={act.page || ''}>{act.page}</td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-400 text-right">{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {tracking && tracking.activities.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-xs font-bold text-gray-400">Trang <span className="text-gray-900">{tracking.activities.page}</span> trên <span className="text-gray-900">{tracking.activities.totalPages}</span></p>
                    <div className="flex gap-2">
                      <button onClick={() => setTrackingPage(p => Math.max(1, p - 1))} disabled={tracking.activities.page === 1} className="p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30 transition-all cursor-pointer"><ChevronLeft size={18} className="text-gray-600" /></button>
                      <button onClick={() => setTrackingPage(p => Math.min(tracking.activities.totalPages, p + 1))} disabled={tracking.activities.page === tracking.activities.totalPages} className="p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30 transition-all cursor-pointer"><ChevronRight size={18} className="text-gray-600" /></button>
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
                      <span className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">{idx + 1}</span>
                      <span className="text-sm font-bold text-gray-600 truncate max-w-[150px]" title={p.page}>{p.page}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-lg">{p.count} <span className="text-[10px] text-gray-400 ml-0.5">lượt</span></span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl shadow-slate-200">
              <h3 className="text-xs font-bold text-slate-400 mb-6">Thiết bị truy cập</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-2 text-slate-300"><Laptop size={18} /></div>
                  <p className="text-[10px] font-bold text-slate-400">Desktop</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-2 text-slate-300"><Smartphone size={18} /></div>
                  <p className="text-[10px] font-bold text-slate-400">Mobile</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-2 text-slate-300"><Tablet size={18} /></div>
                  <p className="text-[10px] font-bold text-slate-400">Tablet</p>
                </div>
              </div>
              <div className="mt-8 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <p className="text-xs font-medium text-slate-300 leading-relaxed"><span className="text-amber-400 font-bold">Mẹo:</span> Tối ưu hóa khóa học cho thiết bị di động sẽ giúp tăng 25% tỷ lệ hoàn thành bài học.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
