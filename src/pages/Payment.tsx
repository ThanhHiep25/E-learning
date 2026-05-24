import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  CreditCard, 
  BookOpen, 
  User,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCourseStore } from '../store/useCourseStore';
import { paymentService, type BackendPayment } from '../services/payment.service';
import { enrollmentService, type RenewalPriceResponse } from '../services/enrollment.service';
import { Breadcrumb } from '../components/common/Breadcrumb';

const slideIn = {
  hidden: { x: 20, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

const Payment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { courses, loadCourseDetail } = useCourseStore();

  const courseId = searchParams.get('courseId') || '';
  const rawType = searchParams.get('type');
  const type = rawType === 'renewal' ? 'renewal' : 'enroll'; // 'enroll' or 'renewal'
  const enrollmentId = searchParams.get('enrollmentId') || '';
  const months = parseFloat(searchParams.get('months') || '1');
  const days = parseInt(searchParams.get('days') || '0');

  const course = useMemo(() => {
    return courses.find((c) => String(c.id) === String(courseId));
  }, [courses, courseId]);

  const [renewalPrice, setRenewalPrice] = useState<RenewalPriceResponse | null>(null);
  const [loadingRenewal, setLoadingRenewal] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState<'vnpay' | 'stripe' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<BackendPayment | null>(null);

  useEffect(() => {
    if (!courseId) return;
    if (!course) {
      loadCourseDetail(String(courseId));
    }
  }, [courseId, course, loadCourseDetail]);

  // Load renewal price if type is renewal
  useEffect(() => {
    console.log('[Payment] Checking renewal:', { type, enrollmentId, months });
    const loadRenewalPrice = async () => {
      if (type !== 'renewal' || !enrollmentId) {
        console.log('[Payment] Skipping renewal load - not renewal or no enrollmentId');
        return;
      }
      setLoadingRenewal(true);
      try {
        console.log('[Payment] Loading renewal price for:', enrollmentId, months);
        const price = await enrollmentService.getRenewalPrice(enrollmentId, months);
        console.log('[Payment] Renewal price loaded:', price);
        setRenewalPrice(price);
      } catch (err: any) {
        console.error('[Payment] Failed to load renewal price:', err);
        toast.error(err.message || 'Không thể tải giá gia hạn');
      } finally {
        setLoadingRenewal(false);
      }
    };
    loadRenewalPrice();
  }, [type, enrollmentId, months]);

  useEffect(() => {
    const loadPending = async () => {
      if (!courseId) return;
      try {
        console.log('[Payment] Loading pending payments for courseId:', courseId);
        const history = await paymentService.listPayments({ status: 'pending', page: 1, limit: 50 });
        console.log('[Payment] API response:', history);
        console.log('[Payment] Payments array:', history.payments);
        const p = (history.payments || []).find((x) => String(x.courseId) === String(courseId)) || null;
        console.log('[Payment] Found pending payment:', p);
        setPendingPayment(p);
      } catch (e) {
        console.error('[Payment] Error loading pending:', e);
        setPendingPayment(null);
      }
    };

    loadPending();
  }, [courseId]);

  useEffect(() => {
    const checkEnrollment = async () => {
      if (!courseId || type === 'renewal') return; // Skip for renewal
      
      try {
        const enrollments = await enrollmentService.listMyEnrollments();
        const alreadyEnrolled = enrollments.some(
          (e: any) => String(e.courseId) === String(courseId) && 
                     ['active', 'enrolled'].includes(e.status)
        );
        
        if (alreadyEnrolled) {
          toast.error('Bạn đã đăng ký khóa học này rồi');
          navigate('/my-learning');
        }
      } catch (err) {
        // Ignore error
      }
    };
    
    checkEnrollment();
  }, [courseId, type]);

  const handleCheckout = async () => {
    if (!selectedPayment) {
      toast.error('Vui lòng chọn phương thức thanh toán');
      return;
    }

    if (!courseId) {
      toast.error('Thiếu thông tin khóa học');
      return;
    }

    setIsProcessing(true);
    try {
      if (type === 'renewal') {
        // For renewal, create enrollment payment with renewal flag
        // Backend will handle as renewal after payment
        const session = await paymentService.createRenewalCheckoutSession(
          courseId, 
          enrollmentId, 
          months, 
          selectedPayment,
          renewalPrice?.renewalPrice
        );
        window.location.href = session.checkoutUrl;
      } else {
        // Regular enrollment
        const session = await paymentService.createSingleCheckoutSession(courseId, selectedPayment);
        window.location.href = session.checkoutUrl;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Không thể tạo phiên thanh toán. Vui lòng thử lại.');
      setIsProcessing(false);
    }
  };

  if (!courseId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 pt-24 pb-20">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center">
            <h1 className="text-xl font-bold text-slate-800 mb-4">Thiếu thông tin khóa học</h1>
            <p className="text-sm text-slate-500 mb-6">Vui lòng quay lại trang khóa học và thử lại.</p>
            <Button onClick={() => navigate('/courses')} className="rounded-full">
              <BookOpen className="w-4 h-4 mr-2" />
              Về danh sách khóa học
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-4">
            <Breadcrumb 
              items={[
                { label: 'Danh mục khóa học', path: '/courses' },
                { label: course?.title || 'Khóa học', path: `/course/${courseId}` },
                { label: 'Thanh toán' }
              ]} 
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  {type === 'renewal' ? 'Thanh toán gia hạn' : 'Thanh toán'}
                </h1>
                {type === 'renewal' && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Gia hạn</Badge>
                )}
              </div>
              <p className="text-slate-500 mt-1">
                {type === 'renewal'
                  ? (days > 0 ? `Gia hạn ${days} ngày cho khóa học này` : `Gia hạn ${months} tháng cho khóa học này`)
                  : 'Hoàn tất thanh toán để ghi danh vào khóa học'}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Course Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8"
          >
            <Card className="overflow-hidden border-0 shadow-lg shadow-slate-200/50 rounded-[24px] bg-white/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Course Image */}
                  <div className="sm:w-48 h-48 sm:h-auto relative overflow-hidden bg-slate-200">
                    <img
                      src={course?.image || '/elearning-1.jpg'}
                      alt={course?.title || 'Khóa học'}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/elearning-1.jpg'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <Badge className="absolute top-3 left-3 bg-white/90 text-slate-700 border-0 shadow-sm">
                      {course?.level || 'N/A'}
                    </Badge>
                  </div>

                  {/* Course Info */}
                  <div className="flex-1 p-5 sm:p-6">
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800 mb-1">
                          {course?.title || 'Khóa học'}
                        </h3>
                        <div className="flex items-center text-sm text-slate-500">
                          <User className="w-4 h-4 mr-1.5" />
                          {course?.teacher || 'Giảng viên'}
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1.5" />
                            {course?.duration || 'N/A'}
                          </span>
                          <span className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-1.5" />
                            {course?.totalLessons || 0} bài học
                          </span>
                        </div>
                      </div>

                      <div className="flex items-end justify-end mt-4">
                        <div className="text-right">
                          {type === 'renewal' && renewalPrice ? (
                            <>
                              <div className="text-xs text-slate-400 line-through">
                                {renewalPrice.originalPrice.toLocaleString('vi-VN')}đ
                              </div>
                              <div className="text-2xl font-bold text-blue-600">
                                {renewalPrice.renewalPrice.toLocaleString('vi-VN')}đ
                              </div>
                              {renewalPrice.discountAmount > 0 && (
                                <Badge className="mt-1 bg-green-100 text-green-700">
                                  Giảm {renewalPrice.discountPercent}%
                                </Badge>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="text-xs text-slate-400 line-through">
                                {(course?.price || 0).toLocaleString('vi-VN')}đ
                              </div>
                              <div className="text-2xl font-bold text-blue-600">
                                {(course?.price || 0).toLocaleString('vi-VN')}đ
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-4 mt-6"
            >
              <div className="flex flex-col items-center text-center p-4 bg-white/60 rounded-2xl">
                <ShieldCheck className="w-8 h-8 text-green-500 mb-2" />
                <span className="text-xs font-medium text-slate-600">Thanh toán bảo mật</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-white/60 rounded-2xl">
                <Clock className="w-8 h-8 text-blue-500 mb-2" />
                <span className="text-xs font-medium text-slate-600">Học ngay sau khi thanh toán</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-white/60 rounded-2xl">
                <CreditCard className="w-8 h-8 text-purple-500 mb-2" />
                <span className="text-xs font-medium text-slate-600">Hoàn tiền trong 7 ngày</span>
              </div>
            </motion.div>

            {/* Pending Payment Warning */}
            {pendingPayment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-amber-50/50 border border-amber-100 rounded-2xl p-6"
              >
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Giao dịch đang chờ</p>
                <p className="text-sm font-bold text-slate-900 mt-2">Mã giao dịch: <span className="font-black">#{pendingPayment.id}</span></p>
                <p className="text-xs text-slate-600 mt-1">Trạng thái: <span className="font-black">{pendingPayment.status}</span></p>
              </motion.div>
            )}
          </motion.div>

          {/* Order Summary & Payment Methods */}
          <motion.div
            variants={slideIn}
            initial="hidden"
            animate="visible"
            className="lg:col-span-4"
          >
            <div className="sticky top-24">
              <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white/90 backdrop-blur-sm">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Tóm tắt đơn hàng
                  </h2>
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Price */}
                  <div className="space-y-3">
                    {type === 'renewal' ? (
                      loadingRenewal ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      ) : renewalPrice ? (
                        <>
                          <div className="flex justify-between text-slate-600">
                            <span>Giá gia hạn ({days > 0 ? `${days} ngày` : `${months} tháng`})</span>
                            <span className="font-medium">{renewalPrice.originalPrice.toLocaleString('vi-VN')}đ</span>
                          </div>
                          {renewalPrice.discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Giảm giá ({renewalPrice.discountPercent}%)</span>
                              <span className="font-medium">-{renewalPrice.discountAmount.toLocaleString('vi-VN')}đ</span>
                            </div>
                          )}
                          <Separator className="my-3" />
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-slate-800">Tổng cộng</span>
                            <span className="text-2xl font-bold text-blue-600">
                              {renewalPrice.renewalPrice.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-sm text-slate-500 py-2">
                          Không thể tải giá gia hạn
                        </div>
                      )
                    ) : (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>Giá khóa học</span>
                          <span className="font-medium">{(course?.price || 0).toLocaleString('vi-VN')}đ</span>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-slate-800">Tổng cộng</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {(course?.price || 0).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-700">Phương thức thanh toán</h3>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPayment('vnpay')}
                      className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                        selectedPayment === 'vnpay'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                        <span className="text-red-600 font-bold text-sm">VNPay</span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-slate-800">VNPay</div>
                        <div className="text-xs text-slate-500">Thẻ ATM, Visa, MasterCard, QR Code</div>
                      </div>
                      {selectedPayment === 'vnpay' && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPayment('stripe')}
                      className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                        selectedPayment === 'stripe'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-sm">Stripe</span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-slate-800">Stripe</div>
                        <div className="text-xs text-slate-500">Thẻ quốc tế Visa, MasterCard, Amex</div>
                      </div>
                      {selectedPayment === 'stripe' && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </motion.button>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full py-6 text-base font-semibold shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] disabled:opacity-70"
                  >
                    {isProcessing ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        Thanh toán ngay
                        <CreditCard className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-slate-400 text-center">
                    Bằng cách thanh toán, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
