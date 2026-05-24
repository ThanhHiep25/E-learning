import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Brain,
  BookOpen,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Database,
  Zap,
  Award,
  Trash2,
  RotateCcw,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  adminPlacementService,
  type PlacementDashboardStats,
  type PlacementLevelDistribution,
  type PlacementSkillPerformance,
  type PlacementTrendItem,
  type PlacementDifficultQuestion,
  type QuestionBankStats,
  type PlacementSession,
} from '../../services/adminPlacement.service';
import { adminService, type BackendAdminUser } from '../../services/admin.service';

// Simple progress bar component
const ProgressBar: React.FC<{ value: number; max?: number; color?: string }> = ({
  value,
  max = 100,
  color = 'bg-amber-500',
}) => {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div className={`${color} h-full transition-all duration-500`} style={{ width: `${percent}%` }} />
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}> = ({ title, value, subtitle, icon, trend }) => (
  <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
        {icon}
      </div>
      {trend && (
        <span className={`text-xs font-bold flex items-center gap-1 ${
          trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'
        }`}>
          {trend === 'up' && <ChevronUp size={14} />}
          {trend === 'down' && <ChevronDown size={14} />}
          {trend === 'neutral' && '-'}
        </span>
      )}
    </div>
    <h3 className="text-3xl font-black text-gray-900">{value}</h3>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{title}</p>
    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
  </div>
);

const AdminPlacementTests: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [dashboardStats, setDashboardStats] = useState<PlacementDashboardStats | null>(null);
  const [overallStats, setOverallStats] = useState<{
    totalTests: number;
    activeTests: number;
    completedToday: number;
    averageScore: number;
  } | null>(null);
  const [levelDistribution, setLevelDistribution] = useState<PlacementLevelDistribution[]>([]);
  const [skillPerformance, setSkillPerformance] = useState<PlacementSkillPerformance[]>([]);
  const [trends, setTrends] = useState<PlacementTrendItem[]>([]);
  const [difficultQuestions, setDifficultQuestions] = useState<PlacementDifficultQuestion[]>([]);
  const [questionBank, setQuestionBank] = useState<QuestionBankStats | null>(null);
  const [generating, setGenerating] = useState(false);

  // User & Session Management states
  const [userId, setUserId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [resettingCooldown, setResettingCooldown] = useState(false);
  const [users, setUsers] = useState<BackendAdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<BackendAdminUser[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [deletingSession, setDeletingSession] = useState(false);

  // All Sessions table states
  const [allSessions, setAllSessions] = useState<PlacementSession[]>([]);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessionsTotalPages, setSessionsTotalPages] = useState(1);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const loadAllData = async () => {
    try {
      setRefreshing(true);

      // Load all data in parallel
      const [
        dashData,
        overallData,
        levelData,
        skillData,
        trendData,
        difficultData,
        bankData,
      ] = await Promise.all([
        adminPlacementService.getDashboardStats(),
        adminPlacementService.getOverallStats(),
        adminPlacementService.getLevelDistribution(),
        adminPlacementService.getSkillPerformance(),
        adminPlacementService.getTrends(30),
        adminPlacementService.getDifficultQuestions(),
        adminPlacementService.getQuestionBankStats(),
      ]);

      setDashboardStats(dashData);
      setOverallStats(overallData);
      setLevelDistribution(levelData);
      setSkillPerformance(skillData);
      setTrends(trendData);
      setDifficultQuestions(difficultData);
      setQuestionBank(bankData);

      // Load sessions
      await loadAllSessions(1);
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi tải dữ liệu placement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const usersData = await adminService.listUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filter users based on search query
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    const query = userSearchQuery.toLowerCase();
    const filtered = users.filter(u => 
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      String(u.id).includes(query)
    );
    setFilteredUsers(filtered);
  }, [userSearchQuery, users]);

  useEffect(() => {
    loadAllData();
    loadUsers();
  }, []);

  const handleGenerateQuestions = async () => {
    try {
      setGenerating(true);
      const result = await adminPlacementService.generateQuestions(10);
      toast.success(`Đã tạo ${result.generated} câu hỏi mới`);
      const bankData = await adminPlacementService.getQuestionBankStats();
      setQuestionBank(bankData);
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi tạo câu hỏi');
    } finally {
      setGenerating(false);
    }
  };

  // User & Session Management handlers
  // Load all sessions with pagination
  const loadAllSessions = async (page: number) => {
    try {
      setLoadingSessions(true);
      const result = await adminPlacementService.getAllSessions(page, 10);
      setAllSessions(result.sessions);
      setSessionsTotal(result.pagination.total);
      setSessionsTotalPages(result.pagination.totalPages);
      setSessionsPage(result.pagination.page);
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi tải danh sách sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSessionsPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= sessionsTotalPages) {
      loadAllSessions(newPage);
    }
  };

  const handleGetUserHistory = async () => {
    if (!userId) {
      toast.error('Vui lòng nhập User ID');
      return;
    }
    try {
      setLoadingHistory(true);
      const history = await adminPlacementService.getUserHistory(userId);
      setUserHistory(history);
      toast.success(`Tìm thấy ${history.length} session`);
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi lấy lịch sử user');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleResetCooldown = async () => {
    if (!userId) {
      toast.error('Vui lòng nhập User ID');
      return;
    }
    try {
      setResettingCooldown(true);
      await adminPlacementService.resetUserCooldown(userId);
      toast.success('Đã reset cooldown cho user');
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi reset cooldown');
    } finally {
      setResettingCooldown(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionId) {
      toast.error('Vui lòng nhập Session ID');
      return;
    }
    if (!confirm('Bạn có chắc muốn xóa session này?')) return;
    try {
      setDeletingSession(true);
      await adminPlacementService.deleteSession(sessionId);
      toast.success('Đã xóa session');
      setSessionId('');
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi xóa session');
    } finally {
      setDeletingSession(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="animate-pulse text-amber-500 mx-auto mb-4" size={48} />
          <p className="text-gray-400 font-bold">Đang tải analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Placement Test Analytics</h1>
          <p className="text-gray-500 font-medium mt-2">
            Phân tích bài kiểm tra đầu vào và ngân hàng câu hỏi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateQuestions}
            disabled={generating}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            <Zap size={18} />
            {generating ? 'Đang tạo...' : 'Tạo câu hỏi AI'}
          </button>
          <button
            onClick={loadAllData}
            disabled={refreshing}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold hover:bg-amber-600 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Tổng bài test"
            value={overallStats.totalTests.toLocaleString()}
            subtitle={`${overallStats.activeTests} đang hoạt động`}
            icon={<Database size={24} />}
          />
          <StatCard
            title="Hoàn thành hôm nay"
            value={overallStats.completedToday}
            icon={<Users size={24} />}
            trend="up"
          />
          <StatCard
            title="Điểm trung bình"
            value={`${overallStats.averageScore}%`}
            icon={<Target size={24} />}
          />
          <StatCard
            title="Tỷ lệ hoàn thành"
            value={`${dashboardStats?.completionRate.toFixed(1) || 0}%`}
            subtitle={`${dashboardStats?.completedSessions.toLocaleString()} / ${dashboardStats?.totalSessions.toLocaleString()}`}
            icon={<Award size={24} />}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Level Distribution */}
        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900">Phân bố trình độ</h3>
              <p className="text-xs text-gray-400">Kết quả theo cấp độ CEFR</p>
            </div>
          </div>
          <div className="space-y-4">
            {levelDistribution.map((level) => (
              <div key={level.level}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-700">{level.level}</span>
                  <span className="text-sm font-bold text-gray-500">
                    {level.count} ({level.percentage.toFixed(1)}%)
                  </span>
                </div>
                <ProgressBar value={level.percentage} max={100} color="bg-blue-500" />
              </div>
            ))}
            {levelDistribution.length === 0 && (
              <p className="text-gray-400 text-center py-8">Chưa có dữ liệu</p>
            )}
          </div>
        </div>

        {/* Skill Performance */}
        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <Brain size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900">Hiệu suất theo kỹ năng</h3>
              <p className="text-xs text-gray-400">Độ chính xác trung bình</p>
            </div>
          </div>
          <div className="space-y-4">
            {skillPerformance.map((skill) => (
              <div key={skill.skill}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-700">{skill.skill}</span>
                  <span className="text-sm font-bold text-gray-500">
                    {skill.accuracy.toFixed(1)}% ({skill.total} câu)
                  </span>
                </div>
                <ProgressBar
                  value={skill.accuracy}
                  max={100}
                  color={skill.accuracy >= 70 ? 'bg-emerald-500' : skill.accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'}
                />
              </div>
            ))}
            {skillPerformance.length === 0 && (
              <p className="text-gray-400 text-center py-8">Chưa có dữ liệu</p>
            )}
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="font-black text-gray-900">Xu hướng 30 ngày</h3>
            <p className="text-xs text-gray-400">Số lượng hoàn thành và điểm TB</p>
          </div>
        </div>
        <div className="h-48 flex items-end gap-2">
          {trends.map((trend) => {
            const maxCount = Math.max(...trends.map(t => t.completedCount || 0), 1);
            const height = Math.min(((trend.completedCount || 0) / maxCount) * 100, 100);
            return (
              <div key={trend.date} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full bg-purple-200 rounded-t-lg relative overflow-hidden group-hover:bg-purple-300 transition-all"
                  style={{ height: `${Math.max(height, 5)}%` }}
                />
                <span className="text-[9px] text-gray-400 font-bold -rotate-45 origin-center">
                  {new Date(trend.date).getDate()}
                </span>
              </div>
            );
          })}
          {trends.length === 0 && (
            <div className="w-full text-center py-8 text-gray-400">Chưa có dữ liệu xu hướng</div>
          )}
        </div>
        <div className="flex justify-center gap-6 mt-4 text-xs">
          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-purple-200 rounded" /> Số lượng hoàn thành</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Question Bank Stats */}
        {questionBank && (
          <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900">Ngân hàng câu hỏi</h3>
                  <p className="text-xs text-gray-400">Tổng: {questionBank.totalQuestions} câu</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">Cập nhật: {new Date(questionBank.lastUpdated).toLocaleDateString('vi-VN')}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Theo cấp độ</p>
                <div className="space-y-1">
                  {Object.entries(questionBank.questionsByLevel).map(([level, count]) => (
                    <div key={level} className="flex justify-between text-sm">
                      <span className="font-bold text-gray-600">{level}</span>
                      <span className="text-gray-500">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Theo kỹ năng</p>
                <div className="space-y-1">
                  {Object.entries(questionBank.questionsBySkill).map(([skill, count]) => (
                    <div key={skill} className="flex justify-between text-sm">
                      <span className="font-bold text-gray-600">{skill}</span>
                      <span className="text-gray-500">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4">
              <span className="text-sm font-bold text-gray-600">Độ khó trung bình</span>
              <span className="text-lg font-black text-slate-700">{questionBank.averageDifficulty.toFixed(1)}/10</span>
            </div>
          </div>
        )}

        {/* Difficult Questions */}
        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900">Câu hỏi khó nhất</h3>
              <p className="text-xs text-gray-400">Tỷ lệ đúng thấp nhất</p>
            </div>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {difficultQuestions.slice(0, 5).map((q, i) => {
              // Backend sends: content, skillType, cefrLevel, wrongCount
              // Calculate correct rate (assuming wrongCount is the count of wrong answers, need total to calculate rate)
              // If we only have wrongCount, we can assume a default total or display wrong count instead
              const text = q.content || q.questionText || `Câu hỏi ID: ${q.questionId || q.id}`;
              const skill = q.skillType || q.skill || 'N/A';
              const level = q.cefrLevel || q.level || 'N/A';
              // Backend returns wrongCount, not correctRate. Display as "X lần sai" instead of percentage
              const wrongCount = q.wrongCount || 0;
              return (
                <div key={q.id || q.questionId || i} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-700 line-clamp-2">
                        {i + 1}. {text}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{level}</span>
                        <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{skill}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-red-500">
                        {wrongCount}
                      </p>
                      <p className="text-[10px] text-gray-400">lần sai</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {difficultQuestions.length === 0 && (
              <p className="text-gray-400 text-center py-8">Chưa có dữ liệu</p>
            )}
          </div>
        </div>
      </div>

      {/* Average Duration */}
      {dashboardStats && (
        <div className="mt-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-[24px] p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-2xl font-black">{Math.round(dashboardStats.averageTestDuration / 60)} phút</p>
              <p className="text-xs text-gray-300 font-bold uppercase tracking-wider">Thời gian làm bài trung bình</p>
            </div>
          </div>
        </div>
      )}

      {/* User & Session Management */}
      <div className="mt-8 bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-black text-gray-900">Quản lý User & Session</h3>
            <p className="text-xs text-gray-400">Xem lịch sử, reset cooldown, xóa session</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* View User History */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <History size={16} />
              Xem lịch sử user
            </p>
            <input
              type="text"
              placeholder="Tìm kiếm user (tên, email, ID)..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              disabled={loadingUsers}
            >
              <option value="">
                {loadingUsers ? 'Đang tải users...' : 
                 filteredUsers.length === 0 ? 'Không tìm thấy user' : 
                 `Chọn user (${filteredUsers.length} kết quả)...`}
              </option>
              {filteredUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) - ID: {user.id}
                </option>
              ))}
            </select>
            <button
              onClick={handleGetUserHistory}
              disabled={loadingHistory || !userId}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {loadingHistory ? 'Đang tải...' : 'Xem lịch sử'}
            </button>
            {userHistory.length > 0 && (
              <div className="mt-3 max-h-32 overflow-y-auto text-xs">
                <p className="font-bold text-gray-500 mb-1">{userHistory.length} sessions:</p>
                {userHistory.slice(0, 3).map((s, i) => (
                  <div key={i} className="text-gray-600 py-1 border-b border-gray-200 last:border-0">
                    {s.sessionId} - {s.finalLevel} - {s.status}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reset Cooldown */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <RotateCcw size={16} />
              Reset cooldown
            </p>
            <input
              type="text"
              placeholder="Tìm kiếm user (tên, email, ID)..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              disabled={loadingUsers}
            >
              <option value="">
                {loadingUsers ? 'Đang tải users...' : 
                 filteredUsers.length === 0 ? 'Không tìm thấy user' : 
                 `Chọn user (${filteredUsers.length} kết quả)...`}
              </option>
              {filteredUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) - ID: {user.id}
                </option>
              ))}
            </select>
            <button
              onClick={handleResetCooldown}
              disabled={resettingCooldown || !userId}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-700 transition-all disabled:opacity-50"
            >
              {resettingCooldown ? 'Đang reset...' : 'Reset cooldown'}
            </button>
          </div>

          {/* Delete Session */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Trash2 size={16} />
              Xóa session
            </p>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              disabled={loadingSessions}
            >
              <option value="">{loadingSessions ? 'Đang tải...' : 'Chọn session...'}</option>
              {allSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  #{session.id} - {session.userName || `User ${session.userId}`} - {session.status}
                </option>
              ))}
            </select>
            <button
              onClick={handleDeleteSession}
              disabled={deletingSession || !sessionId}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {deletingSession ? 'Đang xóa...' : 'Xóa session'}
            </button>
          </div>
        </div>
      </div>

      {/* All Sessions Table */}
      <div className="mt-8 bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-500 flex items-center justify-center">
              <Database size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900">Tất cả Sessions</h3>
              <p className="text-xs text-gray-400">Danh sách tất cả bài test placement</p>
            </div>
          </div>
          <span className="text-sm text-gray-500">Tổng: {sessionsTotal} sessions</span>
        </div>

        {loadingSessions ? (
          <div className="text-center py-8">
            <RefreshCw className="animate-spin mx-auto mb-2 text-cyan-500" size={24} />
            <p className="text-gray-400">Đang tải sessions...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-600 rounded-tl-xl">ID</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600">User</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600">Mục tiêu</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600">Trình độ</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600">Độ chính xác</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600 rounded-tr-xl">Bắt đầu lúc</th>
                  </tr>
                </thead>
                <tbody>
                  {allSessions?.map((session) => (
                    <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">#{session.id}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-bold text-gray-700">{session.userName || session.User?.name || `User ${session.userId}`}</p>
                          <p className="text-xs text-gray-400">{session.userEmail || session.User?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          {session.targetLevel || session.targetCourseId || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          (session.finalLevel || session.finalCefrLevel) === 'A1' ? 'bg-red-100 text-red-600' :
                          (session.finalLevel || session.finalCefrLevel) === 'A2' ? 'bg-orange-100 text-orange-600' :
                          (session.finalLevel || session.finalCefrLevel) === 'B1' ? 'bg-yellow-100 text-yellow-600' :
                          (session.finalLevel || session.finalCefrLevel) === 'B2' ? 'bg-blue-100 text-blue-600' :
                          (session.finalLevel || session.finalCefrLevel) === 'C1' ? 'bg-purple-100 text-purple-600' :
                          (session.finalLevel || session.finalCefrLevel) === 'C2' ? 'bg-emerald-100 text-emerald-600' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {session.finalLevel || session.finalCefrLevel || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          session.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                          session.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                session.accuracy >= 70 ? 'bg-emerald-500' :
                                session.accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${session.accuracy}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-600">{session.accuracy}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(session.startedAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                  {(!allSessions || allSessions.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        Chưa có session nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {sessionsTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleSessionsPageChange(sessionsPage - 1)}
                  disabled={sessionsPage === 1}
                  className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="text-sm text-gray-500">
                  Trang {sessionsPage} / {sessionsTotalPages}
                </span>
                <button
                  onClick={() => handleSessionsPageChange(sessionsPage + 1)}
                  disabled={sessionsPage === sessionsTotalPages}
                  className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPlacementTests;
