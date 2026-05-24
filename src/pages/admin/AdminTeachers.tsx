import React, { useEffect, useState } from 'react';
import { Users, DollarSign, Star, Award, X, Loader2, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService, type BackendAdminUser } from '../../services/admin.service';

// ==========================================
// TYPE DEFINITIONS
// ==========================================
interface TeacherKPIs {
  totalCourses: number;
  publishedCourses: number;
  pendingCourses: number;
  totalStudents: number;
  totalRevenue: number;
  avgRating: string;
  completionRate: string;
  compositeScore: string;
}

interface TopCourse {
  id: number;
  title: string;
  enrollmentCount: number;
  revenue: number;
}

interface PeriodInfo {
  label: string;
  period: string;
  startDate: string | null;
  endDate: string | null;
}

interface TeacherDetail {
  teacher: BackendAdminUser;
  kpis: TeacherKPIs;
  topCourses: TopCourse[];
  period?: PeriodInfo;
}

// ==========================================
// KPI CARD COMPONENT
// ==========================================
const KPICard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => (
  <div className={`${color} p-5 rounded-2xl border shadow-sm`}>
    <div className="flex items-center justify-between mb-3">
      <p className="text-[11px] font-black uppercase tracking-wider opacity-70">{title}</p>
      <div className="opacity-50">{icon}</div>
    </div>
    <p className="text-2xl font-black">{value}</p>
    {subtitle && <p className="text-xs font-medium mt-1 opacity-60">{subtitle}</p>}
  </div>
);

// ==========================================
// TEACHER KPI MODAL
// ==========================================
const TeacherKPIModal: React.FC<{
  teacher: BackendAdminUser | null;
  onClose: () => void;
}> = ({ teacher, onClose }) => {
  const [detail, setDetail] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'all' | 'month' | 'quarter' | 'year'>('all');

  useEffect(() => {
    if (teacher) {
      loadTeacherDetail();
    }
  }, [teacher, period]);

  const loadTeacherDetail = async () => {
    if (!teacher) return;
    setLoading(true);
    try {
      const data = await adminService.getTeacherKPIs(teacher.id, { period });
      setDetail(data);
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi tải dữ liệu KPI');
    } finally {
      setLoading(false);
    }
  };

  if (!teacher) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-white rounded-[32px] shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between rounded-t-[32px]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
              <Users size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">{teacher.name}</h2>
              <p className="text-sm text-gray-500">{teacher.email}</p>
              {detail?.period && (
                <p className="text-xs text-amber-600 font-medium mt-1">{detail.period.label}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Period Filter */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">Tất cả</option>
              <option value="month">Tháng này</option>
              <option value="quarter">Quý này</option>
              <option value="year">Năm nay</option>
            </select>
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-amber-500" size={40} />
            </div>
          ) : detail ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                  title="Tổng điểm"
                  value={detail.kpis.compositeScore}
                  subtitle="Điểm hiệu quả"
                  icon={<Award size={20} />}
                  color="bg-amber-50 border-amber-100"
                />
                <KPICard
                  title="Doanh thu"
                  value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(detail.kpis.totalRevenue)}
                  subtitle="Tổng doanh thu"
                  icon={<DollarSign size={20} />}
                  color="bg-emerald-50 border-emerald-100"
                />
                <KPICard
                  title="Học viên"
                  value={detail.kpis.totalStudents}
                  subtitle="Tổng số học viên"
                  icon={<Users size={20} />}
                  color="bg-blue-50 border-blue-100"
                />
                <KPICard
                  title="Đánh giá"
                  value={`${detail.kpis.avgRating} ⭐`}
                  subtitle="Trung bình"
                  icon={<Star size={20} />}
                  color="bg-purple-50 border-purple-100"
                />
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">Khóa học</p>
                  <p className="text-xl font-black text-gray-900">{detail.kpis.totalCourses}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {detail.kpis.publishedCourses} đã publish • {detail.kpis.pendingCourses} chờ duyệt
                  </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">Hoàn thành</p>
                  <p className="text-xl font-black text-gray-900">{detail.kpis.completionRate}%</p>
                  <p className="text-xs text-gray-400 mt-1">Tỷ lệ học viên hoàn thành khóa học</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">Hiệu quả/Khóa</p>
                  <p className="text-xl font-black text-gray-900">
                    {detail.kpis.totalCourses > 0
                      ? (detail.kpis.totalRevenue / detail.kpis.totalCourses).toLocaleString('vi-VN', { maximumFractionDigits: 0 })
                      : 0}đ
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Doanh thu trung bình mỗi khóa</p>
                </div>
              </div>

              {/* Top Courses */}
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-amber-500" />
                  Top khóa học hiệu quả nhất
                </h3>
                {detail.topCourses.length > 0 ? (
                  <div className="space-y-3">
                    {detail.topCourses.map((course, idx) => (
                      <div key={course.id} className="bg-white rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${
                            idx === 0 ? 'bg-amber-100 text-amber-600' :
                            idx === 1 ? 'bg-gray-200 text-gray-600' :
                            idx === 2 ? 'bg-orange-100 text-orange-600' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-gray-900">{course.title}</p>
                            <p className="text-xs text-gray-500">{course.enrollmentCount} học viên</p>
                          </div>
                        </div>
                        <p className="font-black text-emerald-600">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.revenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">Chưa có dữ liệu khóa học</p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN ADMIN TEACHERS COMPONENT
// ==========================================
const AdminTeachers: React.FC = () => {
  const [selectedTeacher, setSelectedTeacher] = useState<BackendAdminUser | null>(null);

  // Mở modal khi click vào teacher row
  const handleTeacherClick = (teacher: BackendAdminUser) => {
    setSelectedTeacher(teacher);
  };

  return (
    <div className="relative">
      {/* Import AdminUsers dynamically */}
      <AdminUsersComponent
        defaultRoleFilter="teacher"
        hideRoleFilter={true}
        pageTitle="Quản lý giảng viên"
        pageSubtitle="Xem KPI và hiệu suất giảng dạy."
        icon={<Users size={36} />}
        onRowClick={handleTeacherClick}
        showViewButton={true}
        enableRoleActions={true}
      />

      {/* KPI Modal */}
      <TeacherKPIModal
        teacher={selectedTeacher}
        onClose={() => setSelectedTeacher(null)}
      />
    </div>
  );
};

// ==========================================
// DYNAMIC IMPORT COMPONENT
// ==========================================
const AdminUsersComponent: React.FC<any> = (props) => {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import('./AdminUsers').then((mod) => {
      setComponent(() => mod.default);
    });
  }, []);

  if (!Component) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="animate-spin mx-auto text-amber-500" size={40} />
      </div>
    );
  }

  return <Component {...props} />;
};

export default AdminTeachers;
