import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ExternalLink, Search, Trash2, CheckCircle2, XCircle, Users, Loader2, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { teacherService, type BackendTeacherCourse } from '../../services/teacher.service';

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

const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<BackendTeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const [openEnrollmentsFor, setOpenEnrollmentsFor] = useState<BackendTeacherCourse | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // Delete Course Modal State
  const [courseToDelete, setCourseToDelete] = useState<BackendTeacherCourse | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setLoading(true);


    try {
      const data = await teacherService.listMyCourses();
      setCourses(data);
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi tải danh sách khóa học');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return courses;
    return courses.filter((c) => String(c.title || '').toLowerCase().includes(s));
  }, [courses, q]);

  const togglePublished = async (course: BackendTeacherCourse) => {
    try {
      const next = !Boolean(course.published);
      await teacherService.updateCourse(String(course.id), { published: next });
      toast.success(next ? 'Đã duyệt (publish) khóa học' : 'Đã ẩn (unpublish) khóa học');
      setCourses((prev) => prev.map((c) => (String(c.id) === String(course.id) ? { ...c, published: next } : c)));
    } catch (e: any) {
      toast.error(e?.message || 'Cập nhật publish thất bại');
    }
  };

  const deleteCourse = (course: BackendTeacherCourse) => {
    setCourseToDelete(course);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;

    setIsDeleting(true);
    try {
      await teacherService.deleteCourse(String(courseToDelete.id));
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

  const openCourseEnrollments = async (course: BackendTeacherCourse) => {
    setOpenEnrollmentsFor(course);
    setLoadingEnrollments(true);
    try {
      const res = await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000'}/api/admin/courses/${course.id}/enrollments-admin`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('elearning_token') || ''}`,
        },
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error(json?.message || 'Load enrollments failed');
      setEnrollments(json.data?.enrollments || json.data?.data?.enrollments || json.data?.enrollments || []);
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi tải enrollments');
      setEnrollments([]);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900">Duyệt & quản lý khóa học</h1>
            <p className="text-gray-500 font-medium mt-1">Publish/Unpublish, xóa khóa học, xem danh sách đăng ký khóa học</p>
          </div>
        </div>

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

        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Danh sách khóa học</h2>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{filtered.length} courses</span>
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
                  {filtered.map((c) => (
                    <tr key={String(c.id)} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-sm flex items-center justify-center text-gray-300">
                            <BookOpen size={22} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 line-clamp-1">{c.title}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">ID: {String(c.id)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${c.published ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'}`}>
                          {c.published ? 'Published' : 'Draft'}
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
                            onClick={() => openCourseEnrollments(c)}
                            className="cursor-pointer p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Xem enrollments"
                          >
                            <Users size={18} />
                          </button>

                          <button
                            onClick={() => togglePublished(c)}
                            className={`cursor-pointer p-2 rounded-xl transition-all ${c.published ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                            title={c.published ? 'Unpublish' : 'Publish'}
                          >
                            {c.published ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                          </button>

                          <button
                            onClick={() => deleteCourse(c)}
                            className="cursor-pointer p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Xóa khóa học"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <AlertCircle className="mx-auto text-gray-200 mb-4" size={48} />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Không tìm thấy khóa học nào</p>
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

              <div className="p-6">
                {loadingEnrollments ? (
                  <div className="py-10 text-center font-bold text-gray-400">
                    <Loader2 className="animate-spin text-amber-500" size={40} />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                          <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(enrollments || []).map((e) => (
                          <tr key={String(e.id)} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">{e.User?.name || e.User?.username || String(e.userId)}</td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-500">{e.User?.email || '-'}</td>
                            <td className="px-4 py-3 text-sm font-bold text-amber-600">{Number(e.progressPercent || 0)}%</td>
                          </tr>
                        ))}
                        {(!enrollments || enrollments.length === 0) && (
                          <tr>
                            <td colSpan={3} className="px-4 py-10 text-center font-bold text-gray-500">Chưa có enrollments</td>
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

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && courseToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden scale-in-center transition-all duration-300 relative">
              <div className="p-10 mt-12 text-center">
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Xóa khóa học</h3>
                <p className="text-gray-500 font-medium mt-3 leading-relaxed">
                  Bạn có chắc chắn muốn xóa khóa học <span className="text-red-600 font-bold">"{courseToDelete.title}"</span>?
                </p>
                <div className="mt-4 p-4 rounded-2xl ">
                  <p className="text-xs text-red-600 font-medium">Hành động này không thể hoàn tác và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.</p>
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
                  ) : 'Xác nhận xóa'}
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
      </div>
    </div>
  );
};

export default AdminCourses;
