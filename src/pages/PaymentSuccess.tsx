import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link, useSearchParams } from 'react-router-dom';
import { paymentService, type StripeSessionPaymentStatus } from '@/services/payment.service';


interface PaymentCourse {
  id: number;
  title: string;
  price: number;
}

type PaymentDetails = StripeSessionPaymentStatus & { courses?: PaymentCourse[] };

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentDetails | null>(null);

  // 🛡️ P0-2 FIX: Final fallback to stop spinner if we have payment data
  const actualLoading = loading && !payment;
  const [verifyAttempts, setVerifyAttempts] = useState(0);
  const sessionId = searchParams.get('session_id');
  const txnRef = searchParams.get('txnRef'); // VNPay uses txnRef
  const paymentId = sessionId || txnRef;
  const MAX_ATTEMPTS = 10;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const hasVerifiedRef = useRef(false);

  const fetchPaymentDetails = useCallback(async (pId: string): Promise<PaymentDetails | null> => {
    console.log('[PaymentSuccess] Fetching details for:', pId);
    try {
      let response: PaymentDetails | null = null;
      if (sessionId) {
        response = await paymentService.getStripeSessionStatus(pId);
      } else {
        const backendPaymentResponse = await paymentService.listPayments({ limit: 20 });
        const payments = (backendPaymentResponse as any).payments || (backendPaymentResponse as any);
        
        if (Array.isArray(payments)) {
          const specificPayment = payments.find((p: any) => String(p.providerTxn) === String(pId) || String(p.id) === String(pId));
          if (specificPayment) {
            response = {
              id: String(specificPayment.id),
              amount: specificPayment.amount,
              status: specificPayment.status,
              createdAt: specificPayment.createdAt || new Date().toISOString(),
              courseTitle: specificPayment.course?.title || 'Khóa học',
            } as PaymentDetails;
          }
        }
        
        if (!response) {
          try {
             const directPayment = await paymentService.getPayment(pId);
             response = {
               id: String(directPayment.id),
               amount: directPayment.amount,
               status: directPayment.status,
               createdAt: directPayment.createdAt || new Date().toISOString(),
               courseTitle: (directPayment as any).course?.title || 'Khóa học',
             } as PaymentDetails;
          } catch (e) {
            console.error('[PaymentSuccess] Direct fetch failed:', e);
          }
        }
      }

      if (isMountedRef.current && response) {
        setPayment(response);
      }
      return response;
    } catch (error) {
      console.error('[PaymentSuccess] Fetch error:', error);
      return null;
    }
  }, [sessionId]);

  const verifyPayment = useCallback(async (pId: string, attempt = 0) => {
    if (!isMountedRef.current || hasVerifiedRef.current && attempt === 0) return;
    if (attempt === 0) hasVerifiedRef.current = true;
    
    console.log(`[PaymentSuccess] Verify attempt ${attempt}/${MAX_ATTEMPTS} for:`, pId);

    try {
      if (sessionId && attempt === 0) {
        await paymentService.verifyStripeSession(pId);
      }

      const paymentData = await fetchPaymentDetails(pId);
      console.log('[PaymentSuccess] Verification step paymentData:', paymentData);
      
      if (!isMountedRef.current) return;
      
      if (paymentData) {
        setPayment(paymentData);
        if (paymentData.status !== 'pending') {
          setLoading(false);
          return;
        }
      }
      
      if (paymentData?.status === 'pending' && attempt < MAX_ATTEMPTS) {
        setVerifyAttempts(attempt + 1);
        timeoutRef.current = setTimeout(() => verifyPayment(pId, attempt + 1), 2000);
        return;
      }
      
      setLoading(false);
    } catch (error) {
      console.error(`[PaymentSuccess] Verify attempt ${attempt} failed:`, error);
      if (!isMountedRef.current) return;
      
      if (attempt < MAX_ATTEMPTS) {
        setVerifyAttempts(attempt + 1);
        timeoutRef.current = setTimeout(() => verifyPayment(pId, attempt + 1), 2000);
        return;
      }
      
      setLoading(false);
    }
  }, [sessionId, fetchPaymentDetails]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (paymentId && !hasVerifiedRef.current) {
      console.log('[PaymentSuccess] Triggering initial verifyPayment', paymentId);
      verifyPayment(paymentId);
    }

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [paymentId, verifyPayment]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Thanh toán thành công!
          </h1>
          <p className="text-slate-500">
            {payment?.courses && payment.courses.length > 1 
              ? `Cảm ơn bạn đã mua ${payment.courses.length} khóa học. Bạn có thể bắt đầu học ngay bây giờ.`
              : "Cảm ơn bạn đã mua khóa học. Bạn có thể bắt đầu học ngay bây giờ."
            }
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-[24px] bg-white/90 backdrop-blur-sm mb-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Receipt className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-800">Chi tiết giao dịch</h2>
              </div>

              {actualLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-slate-500 mt-3">Đang tải thông tin... ({verifyAttempts}/{MAX_ATTEMPTS})</p>
                </div>
              ) : payment ? (
                <div className="space-y-4">
                  {payment.status === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-yellow-700 text-sm">
                        <span className="font-medium">Đang xử lý:</span> Giao dịch đang được xác nhận ({verifyAttempts}/{MAX_ATTEMPTS})
                      </p>
                      <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full transition-all" 
                          style={{ width: `${(verifyAttempts / MAX_ATTEMPTS) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Multiple courses list */}
                  {payment.courses && payment.courses.length > 0 ? (
                    <div className="py-3 border-b border-slate-100">
                      <span className="text-slate-500 block mb-2">
                        {payment.courses.length} khóa học
                      </span>
                      <div className="space-y-2">
                        {payment.courses.map((course, idx) => (
                          <div key={course.id} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-lg">
                            <span className="font-medium text-slate-800 text-sm line-clamp-1">
                              {idx + 1}. {course.title}
                            </span>
                            <span className="text-slate-600 text-sm ml-4 shrink-0">
                              {course.price.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between py-3 border-b border-slate-100">
                      <span className="text-slate-500">Khóa học</span>
                      <span className="font-medium text-slate-800">{payment.courseTitle || 'N/A'}</span>
                    </div>
                  )}

                  {/* Show total if multiple courses */}
                  {payment.courses && payment.courses.length > 1 && (
                    <div className="flex justify-between py-3 border-b border-slate-100">
                      <span className="text-slate-500">Tổng tiền</span>
                      <span className="font-medium text-slate-800">
                        {payment.courses.reduce((sum, c) => sum + c.price, 0).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-500">Số tiền thanh toán</span>
                    <span className="font-bold text-blue-600">{payment.amount.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-500">Mã giao dịch</span>
                    <span className="font-medium text-slate-800">{payment.id}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-slate-500">Thời gian</span>
                    <span className="font-medium text-slate-800">
                      {new Date(payment.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Không tìm thấy thông tin giao dịch
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/my-learning">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-blue-500/25 transition-all hover:scale-105">
                Vào học ngay
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/payment-history">
              <Button variant="outline" className="rounded-full px-8 py-6 text-base font-medium border-slate-200 hover:bg-slate-50">
                <Receipt className="w-5 h-5 mr-2" />
                Xem lịch sử
              </Button>
            </Link>
          </div>

          <p className="text-center text-slate-400 text-sm mt-8">
            Email xác nhận đã được gửi đến hòm thư của bạn
          </p>
        </motion.div>
      </div>
    </div>
  );
}
