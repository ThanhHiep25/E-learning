import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, BookOpen, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link, useSearchParams } from 'react-router-dom';

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Thanh toán chưa hoàn tất
          </h1>
          <p className="text-slate-500">
            Bạn đã hủy thanh toán hoặc có lỗi xảy ra. Đừng lo, khóa học vẫn trong giỏ hàng của bạn.
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
                <HelpCircle className="w-6 h-6 text-amber-600" />
                <h2 className="text-xl font-semibold text-slate-800">Tại sao thanh toán không thành công?</h2>
              </div>

              <div className="space-y-4 text-slate-600">
                <p>Có thể do một trong các nguyên nhân sau:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Bạn đã hủy giao dịch</li>
                  <li>Thẻ không đủ số dư hoặc bị từ chối</li>
                  <li>Lỗi kết nối với hệ thống thanh toán</li>
                  <li>Phiên thanh toán đã hết hạn</li>
                </ul>
              </div>

              {sessionId && (
                <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">
                    Mã phiên: <span className="font-mono text-slate-700">{sessionId}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/courses">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-blue-500/25 transition-all hover:scale-105">
                <BookOpen className="w-5 h-5 mr-2" />
                Khám phá khóa học
              </Button>
            </Link>
            <Link to="/payment-history">
              <Button variant="outline" className="rounded-full px-8 py-6 text-base font-medium border-slate-200 hover:bg-slate-50">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Lịch sử thanh toán
              </Button>
            </Link>
          </div>

          <p className="text-center text-slate-400 text-sm mt-8">
            Cần hỗ trợ?{' '}
            <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
              Liên hệ với chúng tôi
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
