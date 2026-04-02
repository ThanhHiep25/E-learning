import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  TrendingUp,
  Award,
  BookOpen,
  Target,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { teacherService, type BackendTeacherCourse } from '../../services/teacher.service';

// Mock insights as we don't have a backend AI for this yet
const mockInsights = [
  {
    title: 'Cần bổ sung bài tập',
    description: 'Dựa trên tỷ lệ nộp bài, học viên đang có xu hướng chậm lại ở các chương lý thuyết dài.',
    type: 'warning',
    action: 'Thêm bài tập'
  },
  {
    title: 'Tỉ lệ giữ chân học viên tốt',
    description: 'Học viên quay lại học mỗi ngày tăng 25% sau khi cập nhật giao diện bài giảng mới.',
    type: 'success',
    action: 'Xem chi tiết'
  }
];

const TeacherStatistics: React.FC = () => {
  useAuth();
  const [courses, setCourses] = useState<BackendTeacherCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Stats States
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [avgProgress, setAvgProgress] = useState<number>(0);
  const [avgScore, setAvgScore] = useState<number>(0);
  const [avgDuration, setAvgDuration] = useState<string>('0 phút');
  const [scoreDistribution, setScoreDistribution] = useState<any[]>([]);
  const [rankedStudents, setRankedStudents] = useState<any[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'rank' | 'score_desc' | 'score_asc' | 'progress_desc' | 'progress_asc'>('rank');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch courses for the dropdown
        const myCourses = await teacherService.listMyCourses();
        setCourses(myCourses || []);

        // 2. Fetch statistics from AI/Backend
        const stats = await teacherService.getStatistics(selectedCourseId);

        // Update Overview Stats
        setTotalStudents(stats?.summary?.activeStudents || 0);
        setAvgProgress(Math.round(stats?.summary?.averageProgress || 0));
        const rawScore = Number(stats?.summary?.averageScore || 0);
        setAvgScore(isNaN(rawScore) ? 0 : Number(rawScore.toFixed(1)));

        // Update Score Distribution
        if (stats?.scoreDistribution) {
          const distWithColors = stats.scoreDistribution.map((d) => {
            let color = 'bg-blue-500';
            const lowerRange = d.range.toLowerCase();
            if (lowerRange.includes('90') || lowerRange.includes('80') || d.label?.includes('Xuất sắc')) color = 'bg-emerald-500';
            else if (lowerRange.includes('70') || lowerRange.includes('60') || d.label?.includes('Khá')) color = 'bg-blue-500';
            else if (lowerRange.includes('50') || lowerRange.includes('40') || d.label?.includes('Trung bình')) color = 'bg-amber-500';
            else if (d.label?.includes('Cần cải thiện') || lowerRange.includes('0') || lowerRange.includes('20')) color = 'bg-red-500';

            return { ...d, color };
          });
          setScoreDistribution(distWithColors);
        }

        // Update Ranking - Map API fields to UI fields
        if (stats?.ranking) {
          const ranked = stats.ranking.map(r => ({
            id: r.rank,
            name: r.studentName || "Ẩn danh",
            score: r.highestScore || 0,
            progress: r.courseProgress || 0,
            email: r.email || `${(r.studentName || 'student').toLowerCase().replace(/\s/g, '')}@student.edu`,
            avatar: r.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.studentName || 'U')}`,
            course: r.achievement || 'Khóa học'
          }));
          setRankedStudents(ranked);
        }

        // AI Suggestions
        if (stats?.aiSuggestions && stats.aiSuggestions.length > 0) {
          setAiSuggestions(stats.aiSuggestions);
        } else {
          setAiSuggestions(mockInsights);
        }

        setAvgDuration("Chưa xác định");

      } catch (error: any) {
        toast.error(error?.message || 'Không thể tải dữ liệu thống kê từ máy chủ.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedCourseId]);

  const filteredRankedStudents = useMemo(() => {
    let result = [...rankedStudents];

    // Search Term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(term) ||
        (s.email && s.email.toLowerCase().includes(term))
      );
    }

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(s => {
        const isCompleted = s.progress >= 100;
        return statusFilter === 'completed' ? isCompleted : !isCompleted;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'rank') return a.id - b.id;
      if (sortBy === 'score_desc') return b.score - a.score;
      if (sortBy === 'score_asc') return a.score - b.score;
      if (sortBy === 'progress_desc') return b.progress - a.progress;
      if (sortBy === 'progress_asc') return a.progress - b.progress;
      return 0;
    });

    return result;
  }, [rankedStudents, searchTerm, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredRankedStudents.length / itemsPerPage);
  const paginatedRankedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRankedStudents.slice(start, start + itemsPerPage);
  }, [filteredRankedStudents, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, selectedCourseId]);

  const statsOverview = [
    {
      label: 'Học viên hoạt động',
      value: totalStudents.toLocaleString(),
      trend: '+0%',
      isPositive: true,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Tiến độ trung bình',
      value: avgProgress + '%',
      trend: '+0.0%',
      isPositive: true,
      icon: Target,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Tổng khóa học',
      value: courses.length.toString(),
      trend: '+0',
      isPositive: true,
      icon: BookOpen,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Điểm trung bình',
      value: avgScore.toString(),
      trend: '+0.0%',
      isPositive: true,
      icon: Award,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            Thống Kê Chi Tiết
            <div className="p-2 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-500/20">
              <TrendingUp size={24} strokeWidth={3} />
            </div>
          </h1>
          <p className="text-gray-500 font-bold mt-2">
            Phân tích hiệu suất toàn diện dựa trên dữ liệu học tập thực tế
          </p>
        </div>

        <div className="bg-white p-2 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 min-w-[300px]">
          <div className="pl-4">
            <Filter size={20} className="text-gray-300" />
          </div>
          <select
            className="flex-1 bg-transparent border-none outline-none font-bold text-gray-700 p-3"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="all">Tất cả khóa học</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsOverview.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl shadow-sm`}>
                <stat.icon size={28} strokeWidth={2.5} />
              </div>
              <div
                className={`flex items-center cursor-pointer gap-1 text-[11px] font-black px-2.5 py-1.5 rounded-full ${stat.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}
              >
                {stat.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-gray-900 tracking-tight group-hover:text-amber-500 transition-colors">
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Phân phối điểm số</h2>
              <p className="text-sm font-bold text-gray-400 mt-1">Dựa trên kết quả thực tế của {selectedCourseId === 'all' ? 'tất cả các đề thi' : 'các đề thi trong khóa học'}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Xuất sắc</span>
              </div>
              <div className="flex items-center gap-1.5 ml-4">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Cần cải thiện</span>
              </div>
            </div>
          </div>

          <div className="relative h-64 flex items-end justify-between gap-4 px-4 pt-10">
            <div className="absolute inset-0 flex flex-col justify-between py-1 px-4 pointer-events-none">
              {[0, 1, 2, 3, 4].map((_, i) => {
                const counts = scoreDistribution.map(d => d.count);
                const maxVal = counts.length > 0 ? Math.max(...counts) : 100;
                const labelValue = Math.round((maxVal / 4) * (4 - i));
                return (
                  <div key={i} className="w-full border-t border-gray-100/80 relative">
                    <span className="absolute right-full mr-4 -top-2 text-[10px] font-black text-gray-400">
                      {labelValue}
                    </span>
                  </div>
                );
              })}
            </div>

            {scoreDistribution.map((bar, i) => {
              const maxCount = Math.max(...scoreDistribution.map(d => d.count), 1);
              return (
                <div key={i} className="relative flex-1 flex flex-col items-center group h-full justify-end">
                  {/* Bar Track (Background) */}
                  <div className="absolute inset-x-2 bottom-0 top-0 bg-gray-50/50 rounded-t-2xl "></div>

                  {/* Actual Bar */}
                  <div
                    className={`w-12 md:w-16 ${bar.color} rounded-t-2xl transition-all duration-1000 ease-out origin-bottom relative z-10 group-hover:brightness-110 shadow-lg group-hover:shadow-amber-500/20`}
                    style={{ height: `${Math.max((bar.count / maxCount) * 100, 2)}%` }}
                  >
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-xl text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all shadow-2xl whitespace-nowrap z-20">
                      <div className="text-amber-400 mb-0.5">{bar.label || 'Kết quả'}</div>
                      {bar.count} Học viên
                    </div>
                  </div>
                  <p className="text-center mt-4 text-[11px] font-black text-gray-400 uppercase tracking-tight z-10">{bar.range}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-20 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-amber-500/20 transition-colors duration-500"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl text-amber-500">
                <AlertCircle size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Gợi ý đổi mới</h2>
                <p className="text-xs font-bold text-gray-400 uppercase mt-1">Sử dụng AI Phân tích</p>
              </div>
            </div>

            <div className="space-y-6">
              {aiSuggestions.map((insight, i) => (
                <div
                  key={i}
                  className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-2 h-2 rounded-full ${insight.type === 'warning' || insight.type === 'improvement'
                        ? 'bg-amber-500'
                        : insight.type === 'success'
                          ? 'bg-emerald-500'
                          : 'bg-blue-500'
                        }`}
                    ></div>
                    <h4 className="text-[13px] font-bold text-gray-100">{insight.title}</h4>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-medium mb-4">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <button className="text-[10px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1 hover:translate-x-1 transition-transform">
                      {insight.action} <ChevronRight size={12} />
                    </button>
                    {i === 0 && (
                      <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold text-amber-500">
                        Dự kiến: {avgDuration}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden p-2">
        <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-10 border-b border-gray-50 gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              Bảng Xếp Hạng Học Viên
              <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest">Top 5</div>
            </h2>
            <p className="text-sm font-bold text-gray-400 mt-1">Dựa trên điểm trung bình và tiến độ hoàn thành</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm học viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 transition-all w-full md:w-64"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang học</option>
                <option value="completed">Đã xong</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="rank">Thứ hạng AI</option>
                <option value="score_desc">Điểm: Cao → Thấp</option>
                <option value="score_asc">Điểm: Thấp → Cao</option>
                <option value="progress_desc">Tiến độ: Cao nhất</option>
                <option value="progress_asc">Tiến độ: Thấp nhất</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase">Học viên</th>
                <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase">Khóa học / Đề thi</th>
                <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase">Tiến độ khóa học</th>
                <th className="px-10 py-6 text-[11px] font-bold text-gray-400 uppercase">Điểm Cao Nhất</th>
                <th className="py-6 text-[11px] font-bold text-gray-400 uppercase text-right px-10">Thành tích</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedRankedStudents
                .map((student, i) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden ring-4 ring-white shadow-md bg-amber-100 flex items-center justify-center">
                            {student.avatar ? (
                              <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-black text-amber-700">{student.name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">
                            {i + 1}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                            {student.name}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{student.email || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-[12px] font-bold text-gray-600 line-clamp-1">{student.course}</span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="w-40 space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                          <span>{student.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000"
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">{student.score}</span>
                        <div className="flex gap-0.5">
                          {student.score >= 9 && <Star size={10} className="fill-amber-400 text-amber-400" />}
                          {student.score >= 8 && <Star size={10} className="fill-amber-400 text-amber-400" />}
                          {student.score >= 5 && <Star size={10} className="fill-amber-400 text-amber-400" />}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end">
                        {i === 0 && (
                          <div className="px-4 py-1.5 bg-amber-100 text-amber-600 rounded-xl text-[10px] font-bold uppercase shadow-xs">
                            Quán quân
                          </div>
                        )}
                        {student.progress === 100 && (
                          <div className="px-4 py-1.5 bg-blue-100 text-blue-600 rounded-xl text-[10px] font-bold uppercase shadow-xs ml-2">
                            Hoàn thành
                          </div>
                        )}
                        {i > 0 && student.progress < 100 && (
                          <button className="p-2.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all">
                            <ChevronRight size={20} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="p-8 border-t border-gray-50 flex items-center justify-between bg-white">
            <p className="text-xs font-bold text-gray-400">
              Hiển thị {Math.min(filteredRankedStudents.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredRankedStudents.length, currentPage * itemsPerPage)} trên {filteredRankedStudents.length} học viên
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${currentPage === i + 1
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                      : 'text-gray-400 hover:bg-gray-50'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        <div className="p-8 text-center border-t border-gray-50 flex items-center justify-center group ">
          <button className="text-[11px] font-bold uppercase gap-2 text-amber-600 hover:underline cursor-pointer">
            Xem toàn bộ danh sách ({totalStudents} học viên)
          </button>{' '}
          <ChevronRight size={20} className="text-amber-600 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
};

export default TeacherStatistics;
