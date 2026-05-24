import { useState, useEffect } from 'react';
import { X, Clock, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RenewalOption {
  months: number;
  label: string;
  discount: number;
  badge?: string;
  recommended?: boolean;
}

interface RenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment: {
    id: string | number;
    expiresAt?: string;
    enrollmentStatus?: string;
    Course?: {
      id: string | number;
      title: string;
      imageUrl?: string;
      price?: number;
      renewalDiscountPercent?: number;
    };
  } | null;
  onRenew: (months: number) => void;
  isProcessing?: boolean;
}

const RENEWAL_PRESETS: RenewalOption[] = [
  { months: 1, label: '1 tháng', discount: 0 },
  { months: 3, label: '3 tháng', discount: 10, badge: 'Tiết kiệm 10%' },
  { months: 6, label: '6 tháng', discount: 20, badge: 'Phổ biến nhất', recommended: true },
  { months: 12, label: '1 năm', discount: 30, badge: 'Tiết kiệm nhất' },
];

export const RenewalModal: React.FC<RenewalModalProps> = ({
  isOpen,
  onClose,
  enrollment,
  onRenew,
  isProcessing = false,
}) => {
  const [selectedMonths, setSelectedMonths] = useState(6);
  const [customMode, setCustomMode] = useState(false);
  const [customMonths, setCustomMonths] = useState(6);
  const [renewalPrice, setRenewalPrice] = useState({
    price: 0,
    originalPrice: 0,
    discount: 0,
    discountAmount: 0,
  });

  const course = enrollment?.Course;
  const basePrice = course?.price || 0;

  useEffect(() => {
    if (!isOpen) return;

    const months = customMode ? customMonths : selectedMonths;
    const option = RENEWAL_PRESETS.find(o => o.months === months);
    const discount = customMode ? 0 : (option?.discount || 0);
    const monthlyPrice = basePrice > 0 ? basePrice / 12 : 0;
    const originalPrice = Math.floor(monthlyPrice * months);
    const discountAmount = Math.floor(originalPrice * discount / 100);
    const finalPrice = originalPrice - discountAmount;

    setRenewalPrice({
      price: finalPrice,
      originalPrice,
      discount,
      discountAmount,
    });
  }, [selectedMonths, customMonths, customMode, basePrice, isOpen]);

  if (!isOpen || !enrollment) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Không xác định';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    if (!enrollment.expiresAt) return null;
    const expiry = new Date(enrollment.expiresAt);
    const now = new Date();
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = getDaysRemaining();
  const isExpired = daysRemaining !== null && daysRemaining <= 0;
  const isGracePeriod = enrollment.enrollmentStatus === 'grace_period';

  const calculateNewExpiry = () => {
    const months = customMode ? customMonths : selectedMonths;
    const startFrom = enrollment.expiresAt && new Date(enrollment.expiresAt) > new Date()
      ? new Date(enrollment.expiresAt)
      : new Date();
    const newDate = new Date(startFrom);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleRenew = () => {
    const months = customMode ? customMonths : selectedMonths;
    onRenew(months);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Gia hạn khóa học</h2>
            <p className="text-sm text-gray-500 mt-1">{course?.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Status Alert */}
          {isExpired ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">Khóa học đã hết hạn</p>
                <p className="text-sm text-red-600 mt-1">
                  Bạn cần gia hạn để tiếp tục truy cập nội dung khóa học.
                </p>
              </div>
            </div>
          ) : isGracePeriod ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800">Thời gian ân hạn</p>
                <p className="text-sm text-yellow-600 mt-1">
                  Khóa học đã hết hạn nhưng bạn vẫn có thể truy cập trong thời gian ân hạn.
                </p>
              </div>
            </div>
          ) : daysRemaining !== null && daysRemaining <= 7 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800">Sắp hết hạn</p>
                <p className="text-sm text-blue-600 mt-1">
                  Còn {daysRemaining} ngày nữa khóa học sẽ hết hạn ({formatDate(enrollment.expiresAt)})
                </p>
              </div>
            </div>
          ) : null}

          {/* Current Expiry Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Calendar className="w-4 h-4" />
              <span>Hết hạn hiện tại:</span>
              <span className="font-medium text-gray-900">
                {formatDate(enrollment.expiresAt)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Hết hạn sau gia hạn:</span>
              <span className="font-medium text-green-600">{calculateNewExpiry()}</span>
            </div>
          </div>

          {/* Duration Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Chọn thời gian gia hạn
            </label>

            {/* Preset Options */}
            <div className="grid grid-cols-2 gap-3">
              {RENEWAL_PRESETS.map((option) => (
                <button
                  key={option.months}
                  onClick={() => {
                    setSelectedMonths(option.months);
                    setCustomMode(false);
                  }}
                  className={`relative border-2 rounded-lg p-4 text-left transition-all ${
                    !customMode && selectedMonths === option.months
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={isProcessing}
                >
                  {option.recommended && (
                    <span className="absolute -top-2 left-4 px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                      Gợi ý
                    </span>
                  )}
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatPrice(Math.floor((basePrice / 12) * option.months * (100 - option.discount) / 100))}
                  </div>
                  {option.badge && (
                    <div className="text-xs text-green-600 mt-1 font-medium">
                      {option.badge}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Option Toggle */}
            <button
              onClick={() => setCustomMode(!customMode)}
              className={`mt-3 w-full py-3 border-2 rounded-lg font-medium transition-all ${
                customMode
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
              disabled={isProcessing}
            >
              {customMode ? '✓ Đang chọn tùy chỉnh' : 'Tùy chỉnh thời gian'}
            </button>

            {/* Custom Input */}
            {customMode && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm text-gray-600 mb-2">
                  Số tháng gia hạn (1-24):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={customMonths}
                    onChange={(e) => setCustomMonths(Math.min(24, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-center font-medium"
                    disabled={isProcessing}
                  />
                  <span className="text-gray-600">tháng</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * Tùy chọn không áp dụng giảm giá
                </p>
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              {renewalPrice.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Giá gốc</span>
                  <span className="line-through text-gray-400">
                    {formatPrice(renewalPrice.originalPrice)}
                  </span>
                </div>
              )}
              {renewalPrice.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Giảm giá ({renewalPrice.discount}%)</span>
                  <span className="text-green-600">
                    -{formatPrice(renewalPrice.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="font-medium text-gray-900">Tổng thanh toán</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(renewalPrice.price)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t bg-gray-50">
          <button
            onClick={handleRenew}
            disabled={isProcessing}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Gia hạn ngay
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">
            Bằng việc gia hạn, bạn đồng ý với điều khoản sử dụng và chính sách thanh toán
          </p>
        </div>
      </div>
    </div>
  );
};
