import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCourseStore } from '../store/useCourseStore';
import { useEnrollmentStore } from '../store/useEnrollmentStore';
import { paymentService, type BackendPayment } from '../services/payment.service';

const Payment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { courses, loadCourseDetail } = useCourseStore();
  const { syncEnrollments } = useEnrollmentStore();

  const courseId = searchParams.get('courseId') || '';

  const course = useMemo(() => {
    return courses.find((c) => String(c.id) === String(courseId));
  }, [courses, courseId]);

  const [paymentMethod, setPaymentMethod] = useState<'mock' | 'stripe' | 'paypal' | 'bank_transfer'>('mock');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<BackendPayment | null>(null);
  const [bankInfo, setBankInfo] = useState<any>(null);

  useEffect(() => {
    if (!courseId) return;
    if (!course) {
      loadCourseDetail(String(courseId));
    }
  }, [courseId, course, loadCourseDetail]);

  useEffect(() => {
    const loadPending = async () => {
      if (!courseId) return;
      try {
        const history = await paymentService.listPayments({ status: 'pending', page: 1, limit: 50 });
        const p = (history.payments || []).find((x) => String(x.courseId) === String(courseId)) || null;
        setPendingPayment(p);

        if (p?.id) {
          const detail = await paymentService.getPayment(p.id);
          const details = (detail as any)?.paymentDetails;
          if (details?.bankInfo) setBankInfo(details.bankInfo);
        }
      } catch (e) {
        setPendingPayment(null);
        setBankInfo(null);
      }
    };

    loadPending();
  }, [courseId]);

  if (!courseId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-10">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 max-w-xl w-full text-center">
          <h1 className="text-xl font-black text-gray-900">Thiếu thông tin khóa học</h1>
          <p className="text-sm text-gray-500 font-medium mt-2">Vui lòng quay lại trang khóa học và thử lại.</p>
          <button
            onClick={() => navigate('/courses')}
            className="mt-6 bg-gray-900 text-white px-6 py-3 rounded-2xl font-black hover:bg-amber-600 transition-all"
          >
            VỀ DANH SÁCH KHÓA HỌC
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 pt-28">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/30 overflow-hidden">
          <div className="p-8 border-b border-gray-50">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Thanh toán</h1>
            <p className="text-gray-500 font-medium mt-2">Hoàn tất thanh toán để ghi danh vào khóa học.</p>
          </div>

          <div className="p-8 space-y-8">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Khóa học</p>
              <h2 className="text-xl font-black text-gray-900 mt-2">{course?.title || `#${courseId}`}</h2>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-bold">Giá</p>
                  <p className="text-2xl font-black text-amber-600">{Number(course?.price ?? 0).toLocaleString()} đ</p>
                </div>
                <button
                  onClick={() => navigate(`/course/${courseId}`)}
                  className="text-sm font-black text-gray-900 hover:text-amber-600 transition-colors"
                >
                  Xem khóa học
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phương thức thanh toán</p>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/10"
              >
                <option value="mock">Mock (demo)</option>
                <option value="stripe">Stripe (mock)</option>
                <option value="paypal">PayPal (mock)</option>
                <option value="bank_transfer">Chuyển khoản</option>
              </select>
              <p className="text-xs text-gray-500 font-medium">
                Gợi ý: chọn <span className="font-black">Mock</span> để demo nhanh (ghi danh ngay).
              </p>
            </div>

            {pendingPayment && (
              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Giao dịch đang chờ</p>
                <p className="text-sm font-bold text-gray-900 mt-2">Mã giao dịch: <span className="font-black">#{pendingPayment.id}</span></p>
                <p className="text-xs text-gray-600 font-medium mt-1">Trạng thái: <span className="font-black">{pendingPayment.status}</span> • Provider: <span className="font-black">{pendingPayment.provider}</span></p>

                {bankInfo && (
                  <div className="mt-4 bg-white border border-amber-200 rounded-2xl p-4">
                    <p className="text-xs font-black text-gray-900">Thông tin chuyển khoản</p>
                    <div className="mt-2 text-xs font-bold text-gray-700 space-y-1">
                      <div>Ngân hàng: {String(bankInfo.bankName || '-')}</div>
                      <div>STK: {String(bankInfo.accountNumber || '-')}</div>
                      <div>Chủ TK: {String(bankInfo.accountName || '-')}</div>
                      <div>Số tiền: {String(bankInfo.amount || '-')}</div>
                      <div>Nội dung: {String(bankInfo.content || '-')}</div>
                    </div>
                  </div>
                )}

                <button
                  disabled={isProcessing}
                  onClick={async () => {
                    if (!pendingPayment?.id) return;
                    setIsProcessing(true);
                    try {
                      await paymentService.verifyPayment({ paymentId: pendingPayment.id });
                      toast.success('Xác thực thanh toán thành công');
                      await syncEnrollments();
                      navigate('/my-learning');
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Xác thực thất bại');
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  className="mt-4 w-full bg-gray-900 hover:bg-amber-600 disabled:opacity-50 text-white px-6 py-4 rounded-2xl font-extrabold transition-all"
                >
                  TÔI ĐÃ THANH TOÁN (XÁC THỰC)
                </button>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-3">
              <button
                disabled={isProcessing}
                onClick={async () => {
                  if (!courseId) return;
                  setIsProcessing(true);
                  try {
                    const result = await paymentService.processPayment({
                      courseId,
                      paymentMethod,
                      paymentDetails: {},
                    });

                    if (paymentMethod === 'mock') {
                      toast.success(result.message || 'Thanh toán thành công');
                      await syncEnrollments();
                      navigate('/my-learning');
                      return;
                    }

                    if ((result as any)?.paymentUrl) {
                      window.open((result as any).paymentUrl as string, '_blank', 'noopener,noreferrer');
                      toast.success(result.message || 'Vui lòng hoàn tất thanh toán ở tab mới');
                    } else {
                      toast.success(result.message || 'Yêu cầu thanh toán đã được tạo');
                    }

                    const payment = (result as any)?.payment;
                    const paymentId = payment?.id;
                    if (paymentId) {
                      setPendingPayment(payment);
                      const details = (payment as any)?.paymentDetails;
                      if (details?.bankInfo) setBankInfo(details.bankInfo);
                    }
                  } catch (err) {
                    const maybePayload = (err as any)?.payload;
                    const pending = maybePayload?.data?.payment;
                    if (pending && pending.status === 'pending') {
                      setPendingPayment(pending);
                      toast.error(maybePayload?.message || 'Bạn có một giao dịch đang chờ xử lý');
                    } else {
                      toast.error(err instanceof Error ? err.message : 'Thanh toán thất bại');
                    }
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-900 px-6 py-4 rounded-2xl font-extrabold transition-all shadow-xl shadow-amber-200 active:scale-95"
              >
                {isProcessing ? 'ĐANG XỬ LÝ...' : 'THANH TOÁN & GHI DANH'}
              </button>

              <button
                disabled={isProcessing}
                onClick={() => navigate(`/course/${courseId}`)}
                className="md:w-48 bg-white border border-gray-100 hover:border-amber-200 disabled:opacity-50 text-gray-900 px-6 py-4 rounded-2xl font-extrabold transition-all"
              >
                HỦY
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
