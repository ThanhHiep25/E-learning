import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ChevronRight, Users, Clock, BookOpen, GraduationCap } from 'lucide-react';
import { courseService } from '../../services/course.service';

interface CourseWithChat {
  id: string;
  title: string;
  thumbnail?: string;
  enrolledCount?: number;
  hasChat?: boolean;
}

interface LessonWithChat {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  hasChat?: boolean;
}

const ChatList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'course' | 'lesson'>('course');
  const [courses, setCourses] = useState<CourseWithChat[]>([]);
  const [lessons, setLessons] = useState<LessonWithChat[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<LessonWithChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    // Filter lessons based on search - will be used when expanded
    setFilteredLessons(lessons);
  }, [lessons]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      // Get teacher's courses
      const data = await courseService.getMyCourses();
      setCourses(data.map((c: any) => ({
        id: c.id,
        title: c.title,
        thumbnail: c.thumbnail || c.imageUrl,
        enrolledCount: c.enrollmentCount || c.students || c.enrolledCount || 0,
        hasChat: true
      })));
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageCourseChat = (courseId: string) => {
    navigate(`/teacher/chat/${courseId}`);
  };

  const handleManageLessonChat = (lessonId: string) => {
    navigate(`/teacher/lecture-chat/${lessonId}`);
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
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý Chat</h1>
        <p className="text-gray-600">
          Quản lý chat khóa học và chat bài học với học viên
        </p>
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

      {courses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa có khóa học nào
          </h3>
          <p className="text-gray-600 mb-4">
            Bạn cần tạo khóa học trước để sử dụng tính năng chat
          </p>
          <button
            onClick={() => navigate('/teacher/courses')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Tạo khóa học
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'course' ? (
            /* Course Chat List */
            <div className="grid gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
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
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {course.enrolledCount} học viên
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Chat đang hoạt động
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleManageCourseChat(course.id)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
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
          ) : (
            /* Lesson Chat List - All lessons grouped by course */
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-blue-700">
                  <strong>Gợi ý:</strong> Click "Xem bài học" trong tab "Chat Khóa học" để xem danh sách bài học của từng khóa học.
                </p>
              </div>

              {courses.map((course) => (
                <div key={course.id} className="bg-white border rounded-lg overflow-hidden">
                  <div 
                    className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                    onClick={() => handleExpandCourse(course.id)}
                  >
                    <div className="flex items-center gap-3">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />
                      <span className="font-medium text-gray-900">{course.title}</span>
                      <span className="text-sm text-gray-500">({course.enrolledCount} học viên)</span>
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
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChatList;
