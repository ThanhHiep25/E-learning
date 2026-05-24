import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt,
  Search,
  Download,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  FileText,
  Filter,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { paymentService, type BackendPayment } from '@/services/payment.service';

interface Payment extends BackendPayment {
  courseTitle?: string;
  teacher?: string;
  method?: string;
  transactionId?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
};

const statusConfig = {
  completed: { label: 'Thành công', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  pending:   { label: 'Đang xử lý', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  failed:    { label: 'Thất bại', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: XCircle },
} as const;

const LIMIT = 10;

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount'>('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [apiTotalSpent, setApiTotalSpent] = useState(0);

  const fetchPayments = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await paymentService.listPayments({
        page: pageNum,
        limit: LIMIT,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });

      const fetched = (res.payments || []) as Payment[];
      setPayments(prev => append ? [...prev, ...fetched] : fetched);
      setTotalCount(res.pagination?.total ?? fetched.length);
      setApiTotalSpent(res.totalSpent ?? 0);
      setHasMore((res.pagination?.page ?? 1) < (res.pagination?.totalPages ?? 1));
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      toast.error('Không thể tải lịch sử thanh toán');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setPage(1);
    fetchPayments(1, false);
  }, [statusFilter, fetchPayments]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPayments(nextPage, true);
  };

  // Client-side search + sort (server already filters by status)
  const filteredPayments = payments
    .filter(payment => {
      const title = String((payment as any).courseTitle || (payment as any).course?.title || '').toLowerCase();
      const id = String(payment.id || '').toLowerCase();
      const txn = String(payment.providerTxn || (payment as any).transactionId || '').toLowerCase();
      const q = searchQuery.toLowerCase();
      return title.includes(q) || id.includes(q) || txn.includes(q);
    })
    .sort((a, b) => {
      const dateA = new Date((a as any).createdAt || 0).getTime();
      const dateB = new Date((b as any).createdAt || 0).getTime();
      if (sortBy === 'newest') return dateB - dateA;
      if (sortBy === 'oldest') return dateA - dateB;
      if (sortBy === 'amount') return Number(b.amount || 0) - Number(a.amount || 0);
      return 0;
    });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(date);
  };

  const formatCurrency = (amount: number, currency?: string) => {
    let value = Number(amount || 0);
    const isUSD = currency?.toUpperCase() === 'USD';
    
    // Normalize USD to VND for display
    if (isUSD) {
      if (value < 1000) {
        // Real USD (e.g., $12) -> convert to VND display
        value = value * 25000;
      }
      // If value >= 1000, it's mislabeled VND, keep original number
    }
    
    return `${Math.round(value).toLocaleString('vi-VN')}đ`;
  };

  const handleDownloadInvoice = async (paymentId: string | number) => {
    try {
      toast.loading('Đang khởi tạo hóa đơn...', { id: 'invoice-download' });
      await paymentService.downloadInvoice(paymentId);
      toast.success('Tải hóa đơn thành công!', { id: 'invoice-download' });
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải hóa đơn', { id: 'invoice-download' });
    }
  };

  const completedCount = payments.filter(p => p.status === 'completed').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="mb-4">
            <Breadcrumb items={[
              { label: 'Khóa học của tôi', path: '/my-learning' },
              { label: 'Lịch sử thanh toán' }
            ]} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Receipt className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Lịch sử thanh toán</h1>
                <p className="text-slate-500 mt-1">
                  {totalCount > 0 ? `${totalCount} giao dịch` : 'Quản lý và xem lại các giao dịch của bạn'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-slate-500">Tổng chi tiêu</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(apiTotalSpent)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Giao dịch thành công', count: completedCount, icon: CheckCircle2, color: 'bg-green-100', iconColor: 'text-green-600' },
            { label: 'Đang xử lý', count: pendingCount, icon: Clock, color: 'bg-amber-100', iconColor: 'text-amber-600' },
            { label: 'Tổng giao dịch', count: totalCount, icon: CreditCard, color: 'bg-blue-100', iconColor: 'text-blue-600' },
          ].map(({ label, count, icon: Icon, color, iconColor }) => (
            <motion.div variants={itemVariants} key={label}>
              <Card className="border-0 shadow-lg shadow-slate-200/50 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{label}</p>
                      <p className="text-2xl font-bold text-slate-800">{count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên khóa học, mã giao dịch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-3 bg-slate-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="completed">Thành công</option>
                <option value="pending">Đang xử lý</option>
                <option value="failed">Thất bại</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-slate-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="amount">Giá cao nhất</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Payment List */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
              <p className="text-slate-500">Đang tải lịch sử thanh toán...</p>
            </motion.div>
          ) : filteredPayments.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                <FileText className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Không tìm thấy giao dịch</h3>
              <p className="text-slate-500">Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc</p>
            </motion.div>
          ) : (
            filteredPayments.map((payment) => {
              const statusKey = (payment.status || 'pending') as keyof typeof statusConfig;
              const status = statusConfig[statusKey] || statusConfig.pending;
              const StatusIcon = status.icon;
              const courseTitle = (payment as any).courseTitle || (payment as any).course?.title || 'Khóa học';
              const provider = payment.provider || (payment as any).method || '—';
              const createdAt = (payment as any).createdAt || (payment as any).created_at;

              return (
                <motion.div key={payment.id} variants={itemVariants} layout>
                  <Card className="border-0 shadow-lg shadow-slate-200/50 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          {/* Course Info */}
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-linear-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                                <Receipt className="w-6 h-6 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-slate-800 truncate">{courseTitle}</h3>
                                  <Badge variant="outline" className={`${status.color} border-2 font-medium`}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {status.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">Phương thức: {provider}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                  <span>Mã GD: {payment.id}</span>
                                  {payment.providerTxn && <span>• {payment.providerTxn}</span>}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Payment Info */}
                          <div className="flex items-center gap-8 lg:justify-end">
                            <div className="text-center lg:text-right">
                              <p className="text-xs text-slate-400 mb-1">Số tiền</p>
                              <p className="text-xl font-bold text-slate-800">
                                {formatCurrency(Number(payment.amount), payment.currency)}
                              </p>
                            </div>
                            <div className="text-center lg:text-right">
                              <p className="text-xs text-slate-400 mb-1">Ngày thanh toán</p>
                              <p className="text-sm font-medium text-slate-700">{formatDate(createdAt)}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {payment.status === 'completed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadInvoice(payment.id)}
                                className="rounded-full border-slate-200 hover:bg-slate-50"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Hóa đơn
                              </Button>
                            )}
                            {payment.status === 'pending' && (
                              <Button 
                                size="sm" 
                                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={async () => {
                                  try {
                                    toast.loading('Đang tạo phiên thanh toán...', { id: 'continue-payment' });
                                    const courseId = String(payment.courseId || (payment as any).course?.id);
                                    const provider = payment.provider || 'vnpay';
                                    const session = await paymentService.createSingleCheckoutSession(courseId, provider as 'vnpay' | 'stripe');
                                    toast.dismiss('continue-payment');
                                    if (session?.checkoutUrl) {
                                      window.location.href = session.checkoutUrl;
                                    } else {
                                      toast.error('Không thể tạo phiên thanh toán');
                                    }
                                  } catch (err: any) {
                                    toast.dismiss('continue-payment');
                                    toast.error(err.message || 'Lỗi khi tiếp tục thanh toán');
                                  }
                                }}
                              >
                                Tiếp tục thanh toán
                              </Button>
                            )}
                            {payment.status === 'failed' && (
                              <Button variant="outline" size="sm" className="rounded-full border-red-200 text-red-600 hover:bg-red-50">
                                Thử lại
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </motion.div>

        {/* Load More */}
        {hasMore && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-8">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="rounded-full px-8 border-slate-200 hover:bg-slate-50"
            >
              {loadingMore ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronDown className="w-4 h-4 mr-2" />}
              {loadingMore ? 'Đang tải...' : 'Xem thêm'}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
