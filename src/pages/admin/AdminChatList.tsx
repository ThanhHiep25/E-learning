import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ChevronRight, Users, Clock, Shield, Search, Filter, BookOpen, GraduationCap } from 'lucide-react';
import { courseService } from '../../services/course.service';

interface CourseWithChat {
  id: string;
  title: string;
  thumbnail?: string;
  enrolledCount?: number;
  hasChat?: boolean;
  teacherName?: string;
  status?: string;
  chapters?: { id: string; title: string; lessons: { id: string; title: string; hasChat?: boolean }[] }[];
}

interface LessonWithChat {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  teacherName?: string;
  hasChat?: boolean;
}

const AdminChatList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'course' | 'lesson'>('course');
  const [courses, setCourses] = useState<CourseWithChat[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseWithChat[]>([]);
  const [lessons, setLessons] = useState<LessonWithChat[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<LessonWithChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'with_chat' | 'no_chat'>('all');
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    // Filter courses based on search and status
    let filtered = courses;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(query) || 
        c.teacherName?.toLowerCase().includes(query)
      );
    }
    
    if (filterStatus === 'with_chat') {
      filtered = filtered.filter(c => c.hasChat);
    } else if (filterStatus === 'no_chat') {
      filtered = filtered.filter(c => !c.hasChat);
    }
    
    setFilteredCourses(filtered);
  }, [courses, searchQuery, filterStatus]);

  useEffect(() => {
    // Filter lessons based on search
    let filtered = lessons;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(l => 
        l.title.toLowerCase().includes(query) || 
        l.courseTitle.toLowerCase().includes(query) ||
        l.teacherName?.toLowerCase().includes(query)
      );
    }
    
    setFilteredLessons(filtered);
  }, [lessons, searchQuery]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      // Get all courses (admin has access to all)
      const data = await courseService.listCourses();
      console.log('[AdminChatList] Courses data:', data);
      setCourses(data.map((c: any) => ({
        id: c.id,
        title: c.title,
        thumbnail: c.thumbnail || c.image,
        enrolledCount: c.students || c.enrolledCount || c.enrollments || 0,
        hasChat: true, // Assume all courses can have chat
        teacherName: c.teacher || c.teacherName || c.creator?.name || 'Unknown',
        status: c.status || 'published'
      })));
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageCourseChat = (courseId: string) => {
    navigate(`/admin/chat/${courseId}`);
  };

  const handleManageLessonChat = (lessonId: string) => {
    navigate(`/admin/lecture-chat/${lessonId}`);
  };

  const handleExpandCourse = (courseId: string) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
    if (expandedCourse !== courseId) {
      loadCourseDetail(courseId);
    }
  };

  const loadCourseDetail = async (courseId: string) => {
    try {
      const course = await courseService.getCourseDetail(courseId);
      // Extract lessons from curriculum
      const newLessons: LessonWithChat[] = [];
      course.curriculum?.forEach((chapter: any) => {
        chapter.lessons?.forEach((lesson: any) => {
          newLessons.push({
            id: lesson.id,
            title: lesson.title,
            courseId: courseId,
            courseTitle: course.title,
            teacherName: course.teacher,
            hasChat: true,
          });
        });
      });
      setLessons(prev => [...prev.filter(l => l.courseId !== courseId), ...newLessons]);
    } catch (error) {
      console.error('Failed to load course detail:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Chat (Admin)</h1>
            <p className="text-gray-600">
              Quản lý chat trên toàn hệ thống với quyền admin cao nhất
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('course')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'course'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Chat Khóa học
        </button>
        <button
          onClick={() => setActiveTab('lesson')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'lesson'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Chat Bài học
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm khóa học hoặc giảng viên..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">Tất cả khóa học</option>
              <option value="with_chat">Có chat</option>
              <option value="no_chat">Chưa có chat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <div className="text-2xl font-bold text-indigo-600">{courses.length}</div>
          <div className="text-sm text-indigo-700">Tổng khóa học</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <div className="text-2xl font-bold text-emerald-600">
            {courses.filter(c => c.hasChat).length}
          </div>
          <div className="text-sm text-emerald-700">Đang có chat</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="text-2xl font-bold text-amber-600">
            {courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0)}
          </div>
          <div className="text-sm text-amber-700">Tổng học viên</div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'course' ? (
        /* Course Chat List */
        filteredCourses.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy khóa học
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Chưa có khóa học nào trong hệ thống'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <GraduationCap className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.enrolledCount} học viên
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Chat đang hoạt động
                        </span>
                        {course.teacherName && (
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                            GV: {course.teacherName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleManageCourseChat(course.id)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Quản lý chat
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleExpandCourse(course.id)}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                    >
                      {expandedCourse === course.id ? 'Thu gọn' : 'Xem bài học'}
                    </button>
                  </div>
                </div>
                
                {/* Lessons under this course */}
                {expandedCourse === course.id && (
                  <div className="mt-4 pl-20 border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Bài học có chat:</h4>
                    <div className="space-y-2">
                      {filteredLessons.filter(l => l.courseId === course.id).length === 0 ? (
                        <p className="text-sm text-gray-500">Đang tải danh sách bài học...</p>
                      ) : (
                        filteredLessons.filter(l => l.courseId === course.id).map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                          >
                            <div className="flex items-center gap-3">
                              <BookOpen className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{lesson.title}</span>
                            </div>
                            <button
                              onClick={() => handleManageLessonChat(lesson.id)}
                              className="px-3 py-1 bg-indigo-500 text-white text-sm rounded hover:bg-indigo-600"
                            >
                              Quản lý chat
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        /* Lesson Chat List - All lessons */
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-blue-700">
              <strong>Gợi ý:</strong> Click "Xem bài học" trong tab "Chat Khóa học" để xem danh sách bài học của từng khóa học, 
              hoặc chọn một khóa học bên dưới để xem tất cả bài học.
            </p>
          </div>
          
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy khóa học
              </h3>
              <p className="text-gray-600">
                Chưa có khóa học nào trong hệ thống
              </p>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div key={course.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div 
                  className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                  onClick={() => handleExpandCourse(course.id)}
                >
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-gray-900">{course.title}</span>
                    <span className="text-sm text-gray-500">- {course.teacherName}</span>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedCourse === course.id ? 'rotate-90' : ''}`} />
                </div>
                
                {expandedCourse === course.id && (
                  <div className="p-4">
                    {filteredLessons.filter(l => l.courseId === course.id).length === 0 ? (
                      <div className="text-center py-8">
                        <div className="animate-pulse flex justify-center">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Đang tải danh sách bài học...</p>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {filteredLessons.filter(l => l.courseId === course.id).map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-3 hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <BookOpen className="w-4 h-4 text-indigo-400" />
                              <span className="text-sm text-gray-700">{lesson.title}</span>
                            </div>
                            <button
                              onClick={() => handleManageLessonChat(lesson.id)}
                              className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              Quản lý chat
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminChatList;
