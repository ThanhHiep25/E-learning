import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen, ExternalLink, Search, Trash2, CheckCircle2, XCircle,
  Users, Loader2, AlertCircle, X, Play, Clock, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { type BackendTeacherCourse } from '../../services/teacher.service';
import { adminService } from '../../services/admin.service';

type EnrollmentRow = {
  id: string | number;
  userId: string | number;
  courseId: string | number;
  status: string;
  progressPercent: number;
  enrolledAt?: string;
  User?: {
    id: string | number;
    name?: string;
    username?: string;
    email?: string;
    role?: string;
  };
};

type PendingCourse = BackendTeacherCourse & {
  creator?: {
    id: string | number;
    name?: string;
    username?: string;
    email?: string;
  };
};

const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<BackendTeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  // Pending review courses
  const [pendingCourses, setPendingCourses] = useState<PendingCourse[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  const [openEnrollmentsFor, setOpenEnrollmentsFor] = useState<BackendTeacherCourse | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // Delete Course Modal State
  const [courseToDelete, setCourseToDelete] = useState<BackendTeacherCourse | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Review Modal State
  const [courseToReview, setCourseToReview] = useState<PendingCourse | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  // Preview Course Content Modal State
  const [previewCourse, setPreviewCourse] = useState<PendingCourse | null>(null);
  const [courseContent, setCourseContent] = useState<any>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [viewRejectionReason, setViewRejectionReason] = useState<PendingCourse | null>(null);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const courses = await adminService.listAllCourses();
      console.log('[AdminCourses] loadCourses response:', courses);
      setCourses(courses || []);
    } catch (e: any) {
      console.error('[AdminCourses] loadCourses error:', e);
      toast.error(e?.message || 'Không thể tải danh sách khóa học');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingCourses = async () => {
    setLoadingPending(true);
    try {
      const res = await adminService.getPendingReviewCourses();
      console.log('[AdminCourses] loadPendingCourses response:', res);
      const courses = res?.courses || [];
      console.log('[AdminCourses] Parsed pending courses:', courses.length, 'items');
      setPendingCourses(courses);
    } catch (e: any) {
      console.error('[AdminCourses] loadPendingCourses error:', e);
      toast.error(e?.message || 'Không thể tải danh sách chờ duyệt');
      setPendingCourses([]);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingCourses();
    }
  }, [activeTab]);

  const filtered = useMemo(() => {
    let result = courses;
    if (q.trim()) {
      const query = q.toLowerCase();
      result = result.filter((c) => c.title?.toLowerCase().includes(query));
    }
    return result;
  }, [courses, q]);

  const deleteCourse = (course: BackendTeacherCourse) => {
    setCourseToDelete(course);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;

    setIsDeleting(true);
    try {
      await adminService.deleteCourse(String(courseToDelete.id));
      toast.success('Xóa khóa học thành công');
      setCourses((prev) => prev.filter((c) => String(c.id) !== String(courseToDelete.id)));
      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
    } catch (e: any) {
      toast.error(e?.message || 'Xóa khóa học thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReview = async () => {
    if (!courseToReview || !reviewAction) return;

    setIsReviewing(true);
    try {
      await adminService.reviewCourse(
        String(courseToReview.id),
        reviewAction,
        reviewAction === 'reject' ? rejectionReason : undefined
      );

      toast.success(
        reviewAction === 'approve'
          ? 'Đã phê duyệt và publish khóa học'
          : 'Đã từ chối khóa học'
      );

      // Refresh both lists
      loadPendingCourses();
      loadCourses();

      // Close modal
      setCourseToReview(null);
      setReviewAction(null);
      setRejectionReason('');
    } catch (e: any) {
      toast.error(e?.message || 'Thao tác thất bại');
    } finally {
      setIsReviewing(false);
    }
  };

  const openCourseEnrollments = async (course: BackendTeacherCourse) => {
    setOpenEnrollmentsFor(course);
    setLoadingEnrollments(true);
    try {
      const res = await adminService.getCourseEnrollmentsAdmin(course.id);
      setEnrollments(res?.enrollments || []);
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi tải enrollments');
      setEnrollments([]);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const loadCourseContent = async (courseId: string | number) => {
    setLoadingContent(true);
    try {
      const res = await adminService.getCourseContentForReview(courseId);
      setCourseContent(res || null);
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi tải nội dung khóa học');
      setCourseContent(null);
    } finally {
      setLoadingContent(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest bg-emerald-50 text-emerald-600">
            Published
          </span>
        );
      case 'draft':
        return (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest bg-gray-50 text-gray-500">
            Draft
          </span>
        );
      case 'pending_review':
        return (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest bg-amber-50 text-amber-600 flex items-center gap-1 w-fit">
            <Clock size={12} />
            Chờ duyệt
          </span>
        );
      case 'rejected':
        return (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest bg-rose-50 text-rose-600">
            Từ chối
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest bg-gray-50 text-gray-500">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900">Duyệt & quản lý khóa học</h1>
            <p className="text-gray-500 font-medium mt-1">Phê duyệt, publish/unpublish, xóa khóa học</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === 'all'
                ? 'bg-gray-900 text-white shadow-lg'
                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
            }`}
          >
            Tất cả khóa học
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
            }`}
          >
            <Clock size={16} />
            Chờ duyệt
            {pendingCourses?.length > 0 && (
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingCourses.length}
              </span>
            )}
          </button>
        </div>

        {/* Search - only for all tab */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                <Search size={18} />
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên khóa học..."
                className="w-full outline-none font-bold text-gray-700"
              />
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {activeTab === 'all' ? 'Danh sách khóa học' : 'Khóa học chờ duyệt'}
            </h2>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {activeTab === 'all' ? filtered.length : pendingCourses?.length || 0} courses
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center flex items-center justify-center font-bold text-gray-400">
              <Loader2 className="animate-spin text-amber-500" size={40} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Khóa học</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {/* All Courses Tab */}
                  {activeTab === 'all' &&
                    filtered.map((c) => (
                      <tr key={String(c.id)} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-sm flex items-center justify-center text-gray-300">
                              <BookOpen size={22} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900 line-clamp-1">{c.title}</div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                ID: {String(c.id)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">{getStatusBadge(c.status)}</td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => window.open(`/course/${c.id}`, '_blank')}
                              className="cursor-pointer p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                              title="Xem trang web"
                            >
                              <ExternalLink size={18} />
                            </button>

                            <button
                              onClick={() => window.open(`/course/${c.id}/lesson`, '_blank')}
                              className="cursor-pointer p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Vào quản lý (xem nội dung)"
                            >
                              <Play size={18} />
                            </button>

                            <button
                              onClick={() => openCourseEnrollments(c)}
                              className="cursor-pointer p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              title="Xem enrollments"
                            >
                              <Users size={18} />
                            </button>

                            {/* Publish/Unpublish Button */}
                            <button
                              onClick={async () => {
                                try {
                                  const res = await adminService.togglePublishCourse(c.id);
                                  // Refresh course list
                                  await loadCourses();
                                  toast.success(res.message);
                                } catch (error) {
                                  toast.error('Lỗi: ' + (error as Error).message);
                                }
                              }}
                              className={`cursor-pointer p-2 rounded-xl transition-all ${
                                c.status === 'published' || c.published
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={c.status === 'published' || c.published ? 'Unpublish (Ẩn khóa học)' : 'Publish (Hiển thị)'}
                            >
                              {c.status === 'published' || c.published ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>

                            <button
                              onClick={() => deleteCourse(c)}
                              className="cursor-pointer p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Xóa khóa học"
                            >
                              <Trash2 size={18} />
                            </button>

                            {c.status === 'rejected' && c.rejectionReason && (
                              <button
                                onClick={() => setViewRejectionReason(c as PendingCourse)}
                                className="cursor-pointer p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                title="Xem lý do từ chối"
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                  {/* Pending Review Tab */}
                  {activeTab === 'pending' &&
                    (loadingPending ? (
                      <tr>
                        <td colSpan={3} className="py-10 text-center">
                          <Loader2 className="animate-spin text-amber-500 mx-auto" size={40} />
                        </td>
                      </tr>
                    ) : (
                      (pendingCourses || []).map((c) => (
                        <tr key={String(c.id)} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-sm flex items-center justify-center text-gray-300">
                                <BookOpen size={22} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900 line-clamp-1">{c.title}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                  ID: {String(c.id)} | Giáo viên: {c.creator?.name || c.creator?.username || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest bg-amber-50 text-amber-600 flex items-center gap-1 w-fit">
                              <Clock size={12} />
                              Chờ duyệt
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => window.open(`/course/${c.id}`, '_blank')}
                                className="cursor-pointer p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                title="Xem trang web"
                              >
                                <ExternalLink size={18} />
                              </button>

                              <button
                                onClick={() => window.open(`/course/${c.id}/lesson`, '_blank')}
                                className="cursor-pointer p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                title="Vào quản lý (xem nội dung)"
                              >
                                <Play size={18} />
                              </button>

                              <button
                                onClick={() => {
                                  setPreviewCourse(c);
                                  loadCourseContent(c.id);
                                }}
                                className="cursor-pointer p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                title="Xem nội dung chi tiết"
                              >
                                <BookOpen size={18} />
                              </button>

                              <button
                                onClick={() => {
                                  setCourseToReview(c);
                                  setReviewAction('approve');
                                }}
                                className="cursor-pointer p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                title="Phê duyệt"
                              >
                                <CheckCircle2 size={18} />
                              </button>

                              <button
                                onClick={() => {
                                  setCourseToReview(c);
                                  setReviewAction('reject');
                                }}
                                className="cursor-pointer p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                title="Từ chối"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ))}

                  {/* Empty State */}
                  {((activeTab === 'all' && filtered.length === 0) ||
                    (activeTab === 'pending' && pendingCourses?.length === 0 && !loadingPending)) && (
                    <tr>
                      <td colSpan={3} className="py-20 text-center">
                        <AlertCircle className="mx-auto text-gray-200 mb-4" size={48} />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                          {activeTab === 'all' ? 'Không tìm thấy khóa học nào' : 'Không có khóa học chờ duyệt'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Enrollments Modal */}
        {openEnrollmentsFor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-3xl bg-white rounded-[28px] border border-gray-100 shadow-2xl overflow-hidden scale-in-center transition-all duration-300 relative">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Danh sách đăng ký</h3>
                  <p className="text-xs font-bold text-gray-400 mt-1">{openEnrollmentsFor.title}</p>
                </div>
                <button
                  onClick={() => {
                    setOpenEnrollmentsFor(null);
                    setEnrollments([]);
                  }}
                  className="px-4 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Đóng
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {loadingEnrollments ? (
                  <div className="py-10 text-center font-bold text-gray-400">
                    <Loader2 className="animate-spin text-amber-500" size={40} />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                          <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(enrollments || []).map((e) => (
                          <tr key={String(e.id)} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">
                              {e.User?.name || e.User?.username || String(e.userId)}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-500">{e.User?.email || '-'}</td>
                            <td className="px-4 py-3 text-sm font-bold text-amber-600">{Number(e.progressPercent || 0)}%</td>
                          </tr>
                        ))}
                        {(!enrollments || enrollments.length === 0) && (
                          <tr>
                            <td colSpan={3} className="px-4 py-10 text-center font-bold text-gray-500">
                              Chưa có enrollments
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Review Course Modal */}
        {courseToReview && reviewAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden scale-in-center transition-all duration-300 relative">
              <div className="p-10 mt-12 text-center">
                <div
                  className={`w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-lg ${
                    reviewAction === 'approve'
                      ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100/50'
                      : 'bg-rose-50 text-rose-500 shadow-rose-100/50'
                  }`}
                >
                  {reviewAction === 'approve' ? (
                    <CheckCircle2 size={40} strokeWidth={2.5} />
                  ) : (
                    <XCircle size={40} strokeWidth={2.5} />
                  )}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                  {reviewAction === 'approve' ? 'Phê duyệt khóa học' : 'Từ chối khóa học'}
                </h3>
                <p className="text-gray-500 font-medium mt-3 leading-relaxed">
                  {reviewAction === 'approve'
                    ? `Bạn có chắc chắn muốn phê duyệt và publish khóa học "${courseToReview.title}"?`
                    : `Bạn có chắc chắn muốn từ chối khóa học "${courseToReview.title}"?`}
                </p>

                {/* Course Info */}
                <div className="mt-4 flex items-center justify-center gap-3">
                  {courseToReview.durationType && (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                      courseToReview.durationType === 'lifetime' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                      {courseToReview.durationType === 'lifetime' 
                        ? 'Vĩnh viễn' 
                        : `${courseToReview.durationValue} ${courseToReview.durationUnit === 'months' ? 'tháng' : courseToReview.durationUnit === 'years' ? 'năm' : 'ngày'}`
                      }
                    </span>
                  )}
                  {courseToReview.price !== undefined && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-50 text-blue-600">
                      {courseToReview.price === 0 ? 'Miễn phí' : `${Number(courseToReview.price).toLocaleString('vi-VN')}đ`}
                    </span>
                  )}
                  {courseToReview.level && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                      {courseToReview.level}
                    </span>
                  )}
                </div>

                {reviewAction === 'reject' && (
                  <div className="mt-6">
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Nhập lý do từ chối..."
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-rose-500 transition-all font-medium text-sm resize-none"
                      rows={3}
                    />
                  </div>
                )}
              </div>

              <div className="px-10 pb-10 grid grid-cols-2 gap-4">
                <button
                  disabled={isReviewing}
                  onClick={() => {
                    setCourseToReview(null);
                    setReviewAction(null);
                    setRejectionReason('');
                  }}
                  className="px-8 py-4 cursor-pointer rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all border border-gray-100 active:scale-95 disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  disabled={isReviewing || (reviewAction === 'reject' && !rejectionReason.trim())}
                  onClick={handleReview}
                  className={`px-8 py-4 cursor-pointer rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 ${
                    reviewAction === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  }`}
                >
                  {isReviewing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Đang xử lý...
                    </>
                  ) : reviewAction === 'approve' ? (
                    <>
                      <CheckCircle2 size={18} />
                      Phê duyệt
                    </>
                  ) : (
                    <>
                      <XCircle size={18} />
                      Từ chối
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() =>
                  !isReviewing &&
                  (setCourseToReview(null), setReviewAction(null), setRejectionReason(''))
                }
                className="absolute cursor-pointer top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-50 rounded-xl"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && courseToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden scale-in-center transition-all duration-300 relative">
              <div className="p-10 mt-12 text-center">
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Xóa khóa học</h3>
                <p className="text-gray-500 font-medium mt-3 leading-relaxed">
                  Bạn có chắc chắn muốn xóa khóa học{' '}
                  <span className="text-red-600 font-bold">"{courseToDelete.title}"</span>?
                </p>
                <div className="mt-4 p-4 rounded-2xl ">
                  <p className="text-xs text-red-600 font-medium">
                    Hành động này không thể hoàn tác và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                  </p>
                </div>
              </div>

              <div className="px-10 pb-10 grid grid-cols-2 gap-4">
                <button
                  disabled={isDeleting}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-8 py-4 cursor-pointer rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all border border-gray-100 active:scale-95 disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-8 py-4 cursor-pointer bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    'Xác nhận xóa'
                  )}
                </button>
              </div>

              <button
                onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
                className="absolute cursor-pointer top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-50 rounded-xl"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        )}

        {/* Preview Course Content Modal */}
        {previewCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-4xl h-[85vh] bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{previewCourse.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-gray-500">Nội dung khóa học</p>
                    {previewCourse.durationType && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        previewCourse.durationType === 'lifetime' 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'bg-amber-100 text-amber-600'
                      }`}>
                        {previewCourse.durationType === 'lifetime' 
                          ? 'Vĩnh viễn' 
                          : `${previewCourse.durationValue} ${previewCourse.durationUnit === 'months' ? 'tháng' : previewCourse.durationUnit === 'years' ? 'năm' : 'ngày'}`
                        }
                      </span>
                    )}
                    {previewCourse.price !== undefined && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                        {previewCourse.price === 0 ? 'Miễn phí' : `${Number(previewCourse.price).toLocaleString('vi-VN')}đ`}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPreviewCourse(null);
                    setCourseContent(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-6">
                {loadingContent ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-amber-500" size={40} />
                  </div>
                ) : !courseContent?.chapters?.length ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <BookOpen size={48} className="mb-4 opacity-30" />
                    <p className="font-medium">Không có nội dung</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {courseContent.chapters.map((chapter: any, idx: number) => (
                      <div key={chapter.id} className="bg-gray-50 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="w-8 h-8 bg-amber-500 text-white rounded-lg font-bold flex items-center justify-center text-sm">
                            {idx + 1}
                          </span>
                          <h4 className="font-bold text-gray-900">{chapter.title}</h4>
                        </div>
                        {chapter.lectures?.length > 0 && (
                          <div className="ml-11 space-y-2">
                            {chapter.lectures.map((lecture: any, lidx: number) => (
                              <div key={lecture.id} className="flex items-center gap-3 py-2 px-3 bg-white rounded-xl">
                                <span className="text-xs font-bold text-gray-400 w-6">{idx + 1}.{lidx + 1}</span>
                                <span className="text-sm text-gray-700">{lecture.title}</span>
                                <span className="ml-auto text-xs text-gray-400">
                                  {lecture.videoUrl ? 'Video' : lecture.content ? 'Bài đọc' : 'Chưa có nội dung'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setPreviewCourse(null);
                    setCourseContent(null);
                  }}
                  className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setCourseToReview(previewCourse);
                    setReviewAction('approve');
                    setPreviewCourse(null);
                  }}
                  className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  <CheckCircle2 size={18} className="inline mr-2" />
                  Phê duyệt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Rejection Reason Modal */}
        {viewRejectionReason && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center">
                    <XCircle className="text-rose-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Lý do từ chối</h3>
                    <p className="text-sm text-gray-500">{viewRejectionReason.title}</p>
                  </div>
                </div>
                <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
                  <p className="text-rose-800 font-medium leading-relaxed">
                    {viewRejectionReason.rejectionReason || 'Không có lý do cụ thể'}
                  </p>
                </div>
                <div className="mt-4 text-xs text-gray-400">
                  Từ chối bởi: {viewRejectionReason.creator?.name || 'Admin'} | Ngày: {viewRejectionReason.reviewedAt ? new Date(viewRejectionReason.reviewedAt).toLocaleDateString('vi-VN') : 'N/A'}
                </div>
              </div>
              <div className="px-8 pb-8 flex justify-end">
                <button
                  onClick={() => setViewRejectionReason(null)}
                  className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourses;
