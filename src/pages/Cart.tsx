import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard,
  ChevronRight,
  ShieldCheck,
  Clock,
  BookOpen,
  User,
  ArrowLeft,
  ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

// Mock data - will be replaced with API data later
const mockCartItems = [
  {
    id: 1,
    courseId: 1,
    title: 'Tiếng Anh giao tiếp A1 - A2',
    teacher: 'Nguyễn Văn A',
    image: '/elearning-1.jpg',
    price: 299000,
    originalPrice: 599000,
    level: 'A1-A2',
    duration: '24 giờ',
    lessons: 48,
    quantity: 1,
  },
  {
    id: 2,
    courseId: 2,
    title: 'Tiếng Anh Business B1 - B2',
    teacher: 'Trần Thị B',
    image: '/elearning-2.jpg',
    price: 499000,
    originalPrice: 899000,
    level: 'B1-B2',
    duration: '36 giờ',
    lessons: 72,
    quantity: 1,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

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

export default function Cart() {
  const [cartItems, setCartItems] = useState(mockCartItems);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'vnpay' | 'stripe' | null>(null);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = cartItems.reduce((sum, item) => sum + (item.originalPrice - item.price) * item.quantity, 0);
  const total = subtotal;

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, Math.min(5, item.quantity + delta));
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    toast.success('Đã xóa khóa học khỏi giỏ hàng');
  };

  const handleCheckout = () => {
    if (!selectedPayment) {
      toast.error('Vui lòng chọn phương thức thanh toán');
      return;
    }
    setIsCheckingOut(true);
    // Mock checkout - will connect to API later
    setTimeout(() => {
      toast.success('Chuyển đến trang thanh toán...');
      setIsCheckingOut(false);
    }, 1000);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-[32px] flex items-center justify-center">
              <ShoppingBag className="w-16 h-16 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Giỏ hàng trống
            </h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Bạn chưa thêm khóa học nào vào giỏ hàng. Hãy khám phá các khóa học và bắt đầu hành trình học tập của bạn!
            </p>
            <Link to="/courses">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-blue-500/25 transition-all hover:scale-105">
                <BookOpen className="w-5 h-5 mr-2" />
                Khám phá khóa học
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to="/courses" className="inline-flex items-center text-slate-500 hover:text-blue-600 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Tiếp tục mua sắm</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                Giỏ hàng của bạn
              </h1>
              <p className="text-slate-500 mt-1">
                {cartItems.length} khóa học • {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart Items */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-8 space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {cartItems.map((item) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  layout
                  exit={{ opacity: 0, x: -100 }}
                >
                  <Card className="overflow-hidden border-0 shadow-lg shadow-slate-200/50 rounded-[24px] bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        {/* Course Image */}
                        <div className="sm:w-48 h-48 sm:h-auto relative overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                          <Badge className="absolute top-3 left-3 bg-white/90 text-slate-700 border-0 shadow-sm">
                            {item.level}
                          </Badge>
                        </div>

                        {/* Course Info */}
                        <div className="flex-1 p-5 sm:p-6">
                          <div className="flex flex-col h-full justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-bold text-lg text-slate-800 line-clamp-2 mb-1">
                                    {item.title}
                                  </h3>
                                  <div className="flex items-center text-sm text-slate-500">
                                    <User className="w-4 h-4 mr-1.5" />
                                    {item.teacher}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(item.id)}
                                  className="shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1.5" />
                                  {item.duration}
                                </span>
                                <span className="flex items-center">
                                  <BookOpen className="w-4 h-4 mr-1.5" />
                                  {item.lessons} bài học
                                </span>
                              </div>
                            </div>

                            <div className="flex items-end justify-between mt-4 sm:mt-0">
                              {/* Quantity */}
                              <div className="flex items-center bg-slate-100 rounded-full p-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateQuantity(item.id, -1)}
                                  disabled={item.quantity <= 1}
                                  className="w-8 h-8 rounded-full hover:bg-white hover:shadow-sm disabled:opacity-50"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-10 text-center font-semibold text-slate-700">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateQuantity(item.id, 1)}
                                  disabled={item.quantity >= 5}
                                  className="w-8 h-8 rounded-full hover:bg-white hover:shadow-sm disabled:opacity-50"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Price */}
                              <div className="text-right">
                                <div className="text-xs text-slate-400 line-through">
                                  {item.originalPrice.toLocaleString('vi-VN')}đ
                                </div>
                                <div className="text-xl font-bold text-blue-600">
                                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Trust Badges */}
            <motion.div
              variants={itemVariants}
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
          </motion.div>

          {/* Order Summary */}
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
                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-slate-600">
                      <span>Tạm tính</span>
                      <span className="font-medium">{subtotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá</span>
                      <span className="font-medium">-{discount.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-slate-800">Tổng cộng</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {total.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
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
                    disabled={isCheckingOut}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full py-6 text-base font-semibold shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] disabled:opacity-70"
                  >
                    {isCheckingOut ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        Thanh toán ngay
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-slate-400 text-center">
                    Bằng cách thanh toán, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của chúng tôi.
                  </p>
                </CardContent>
              </Card>

              {/* Coupon Code */}
              <Card className="mt-4 border-0 shadow-lg shadow-slate-200/50 rounded-[24px] bg-white/80 backdrop-blur-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-slate-700 mb-3">Mã giảm giá</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã giảm giá"
                      className="flex-1 px-4 py-2.5 bg-slate-100 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button variant="outline" className="rounded-full px-6 border-slate-200 hover:bg-slate-50">
                      Áp dụng
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
