import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, AlertCircle, CreditCard, Zap } from 'lucide-react';
import { enrollmentService, type RenewalPriceResponse } from '../services/enrollment.service';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DAY_OPTIONS = [
  { days: 7,  label: '1 tuần',   desc: 'Hoàn thành gấp' },
  { days: 14, label: '2 tuần',  desc: 'Thoải mái học' },
  { days: 30, label: '1 tháng', desc: 'Còn nhiều bài' },
];

const RenewEnrollment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: _user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [renewalPrice, setRenewalPrice] = useState<RenewalPriceResponse | null>(null);
  const [days, setDays] = useState(14);
  const [selectedOption, setSelectedOption] = useState<number>(1); // default 2 weeks
  const [customDays, setCustomDays] = useState<number | ''>('');
  const [isCustom, setIsCustom] = useState(false);

  // Smart recommendation based on remaining progress
  const recommendedDays = useMemo(() => {
    const progress = Number(enrollment?.progressPercent || 0);
    const remaining = 100 - progress; // % bài chưa hoàn thành
    if (remaining <= 0) return 7;
    if (remaining <= 15) return 7;
    if (remaining <= 40) return 14;
    if (remaining <= 70) return 30;
    return 30;
  }, [enrollment?.progressPercent]);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const enrollments = await enrollmentService.listMyEnrollments();
        const en = enrollments.find(e => String(e.courseId) === String(id));
        if (!en) {
          toast.error('Không tìm thấy ghi danh');
          navigate(`/course/${id}`);
          return;
        }
        setEnrollment(en);
        setCourse(en.Course);

        // Set default to smart recommendation
        const rec = (() => {
          const p = Number(en.progressPercent || 0);
          const r = 100 - p;
          if (r <= 15) return 7;
          if (r <= 40) return 14;
          return 30;
        })();
        setDays(rec);
        const idx = DAY_OPTIONS.findIndex(o => o.days >= rec);
        setSelectedOption(idx >= 0 ? idx : DAY_OPTIONS.length - 1);

        // Load renewal price
        const price = await enrollmentService.getRenewalPrice(en.id, rec / 30);
        setRenewalPrice(price);
      } catch (err: any) {
        toast.error(err.message || 'Không thể tải thông tin gia hạn');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, navigate]);

  // Reload price when days change
  useEffect(() => {
    const loadPrice = async () => {
      if (!enrollment) return;
      try {
        const price = await enrollmentService.getRenewalPrice(enrollment.id, days / 30);
        setRenewalPrice(price);
      } catch (err) {
        console.error('Failed to load renewal price:', err);
      }
    };
    loadPrice();
  }, [days, enrollment?.id]);

  const handleRenew = () => {
    if (!enrollment || !course) return;
    // Redirect to unified payment page with renewal params
    navigate(`/payment?courseId=${id}&type=renewal&enrollmentId=${enrollment.id}&months=${(days / 30).toFixed(2)}&days=${days}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const isExpired = enrollment?.expiresAt && new Date() > new Date(enrollment.expiresAt);
  const isGracePeriod = enrollment?.enrollmentStatus === 'grace_period';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(`/course/${id}/dashboard`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Quay lại dashboard
        </button>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Status Header */}
          <div className={`p-6 ${isExpired ? 'bg-red-50' : 'bg-amber-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isExpired ? 'bg-red-100' : 'bg-amber-100'}`}>
                <Clock size={24} className={isExpired ? 'text-red-600' : 'text-amber-600'} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isGracePeriod ? 'Thời gian ân hạn' : isExpired ? 'Khóa học đã hết hạn' : 'Gia hạn khóa học'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {course?.title}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Current Status */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hết hạn lúc:</span>
                <span className="font-medium">
                  {enrollment?.expiresAt ? new Date(enrollment.expiresAt).toLocaleDateString('vi-VN') : 'Vĩnh viễn'}
                </span>
              </div>
              {enrollment?.gracePeriodEndsAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ân hạn đến:</span>
                  <span className="font-medium text-red-600">
                    {new Date(enrollment.gracePeriodEndsAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Số lần đã gia hạn:</span>
                <span className="font-medium">{enrollment?.renewalCount || 0}</span>
              </div>
            </div>

            {/* Smart Recommendation */}
            {enrollment?.progressPercent !== undefined && (
              <div className="bg-blue-50 rounded-2xl p-4 flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                  <Zap size={18} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-blue-900">
                    Đề xuất: {recommendedDays} ngày
                  </div>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Bạn còn {Math.round(100 - Number(enrollment.progressPercent))}% bài chưa hoàn thành.
                    Gia hạn theo đúng nhu cầu, không trả tiền cho thời gian không cần.
                  </p>
                </div>
              </div>
            )}

            {/* Duration Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Thời gian gia hạn
                </label>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setIsCustom(false)}
                    className={`px-3 py-1 text-xs rounded-md transition-all ${
                      !isCustom ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    Gói có sẵn
                  </button>
                  <button
                    onClick={() => setIsCustom(true)}
                    className={`px-3 py-1 text-xs rounded-md transition-all ${
                      isCustom ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    Tùy chỉnh
                  </button>
                </div>
              </div>

              {!isCustom ? (
                <div className="grid grid-cols-3 gap-3">
                  {DAY_OPTIONS.map((opt, idx) => {
                    const isRecommended = opt.days === recommendedDays;
                    return (
                      <button
                        key={opt.days}
                        onClick={() => {
                          setSelectedOption(idx);
                          setDays(opt.days);
                        }}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                          selectedOption === idx
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {isRecommended && (
                          <span className="absolute -top-2 left-3 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Phù hợp
                          </span>
                        )}
                        <div className="font-bold text-gray-900">{opt.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 shrink-0">Số ngày cần gia hạn</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={customDays}
                      onChange={(e) => {
                        const d = parseInt(e.target.value) || '';
                        setCustomDays(d);
                        if (d) setDays(d);
                      }}
                      className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="10"
                    />
                    <span className="text-xs text-gray-400">ngày</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Ví dụ: Cần 10 ngày để hoàn thành bài cuối → nhập 10
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                {isCustom
                  ? 'Tùy chọn theo nhu cầu thực tế. Chỉ trả cho số ngày thực sự cần.'
                  : 'Chọn gói phù hợp với tiến độ học của bạn. Gói phù hợp được đề xuất tự động.'}
              </p>
            </div>

            {/* Price */}
            {renewalPrice && (
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Giá gốc:</span>
                  <span className="line-through text-gray-400">
                    {renewalPrice.originalPrice.toLocaleString()}đ
                  </span>
                </div>
                {renewalPrice.discountAmount > 0 && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-green-600">Giảm giá ({renewalPrice.discountPercent}%):</span>
                    <span className="text-green-600">-{renewalPrice.discountAmount.toLocaleString()}đ</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-amber-200">
                  <span className="font-bold text-gray-900">Tổng thanh toán:</span>
                  <span className="text-2xl font-black text-amber-600">
                    {renewalPrice.renewalPrice.toLocaleString()}đ
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Hết hạn mới: {new Date(renewalPrice.newExpiry).toLocaleDateString('vi-VN')}
                </div>
              </div>
            )}

            {/* Warning */}
            {isExpired && !isGracePeriod && (
              <div className="flex items-start gap-3 bg-red-50 p-4 rounded-xl">
                <AlertCircle size={20} className="text-red-600 mt-0.5" />
                <div className="text-sm text-red-700">
                  Khóa học đã hết hạn. Bạn cần gia hạn để tiếp tục truy cập nội dung.
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/course/${id}/dashboard`)}
                className="flex-1 py-3.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Để sau
              </button>
              <button
                onClick={handleRenew}
                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:shadow-lg hover:shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard size={20} />
                Thanh toán & Gia hạn
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenewEnrollment;
