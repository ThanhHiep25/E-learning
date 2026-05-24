import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, ChevronRight, X } from 'lucide-react';
import { enrollmentService, type BackendEnrollment } from '../../services/enrollment.service';
import { RenewalModal } from './RenewalModal';

interface ExpiringCoursesAlertProps {
  onViewAll?: () => void;
}

export const ExpiringCoursesAlert: React.FC<ExpiringCoursesAlertProps> = ({
  onViewAll,
}) => {
  const [expiringEnrollments, setExpiringEnrollments] = useState<BackendEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<BackendEnrollment | null>(null);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadExpiringEnrollments();
  }, []);

  const loadExpiringEnrollments = async () => {
    try {
      setLoading(true);
      const enrollments = await enrollmentService.getExpiringEnrollments(7);
      setExpiringEnrollments(enrollments);
    } catch (error) {
      console.error('Failed to load expiring enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (months: number) => {
    if (!selectedEnrollment) return;

    try {
      setIsProcessing(true);
      await enrollmentService.renewEnrollment(selectedEnrollment.id, months);
      setIsRenewalModalOpen(false);
      setSelectedEnrollment(null);
      // Refresh list
      await loadExpiringEnrollments();
    } catch (error) {
      console.error('Renewal failed:', error);
      alert('Gia hạn thất bại. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openRenewalModal = (enrollment: BackendEnrollment) => {
    setSelectedEnrollment(enrollment);
    setIsRenewalModalOpen(true);
  };

  if (loading || dismissed || expiringEnrollments.length === 0) {
    return null;
  }

  // Check if there are urgent renewals (expired or grace period)
  const urgent = expiringEnrollments.filter(
    (e) => e.enrollmentStatus === 'expired' || e.enrollmentStatus === 'grace_period'
  );

  const displayCount = expiringEnrollments.length;
  const isUrgent = urgent.length > 0;

  return (
    <>
      <div className={`rounded-xl p-4 mb-6 ${isUrgent ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${isUrgent ? 'bg-red-100' : 'bg-amber-100'}`}>
            {isUrgent ? (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            ) : (
              <Clock className="w-5 h-5 text-amber-600" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className={`font-semibold ${isUrgent ? 'text-red-800' : 'text-amber-800'}`}>
                {isUrgent 
                  ? `Có ${urgent.length} khóa học cần gia hạn ngay`
                  : `Có ${displayCount} khóa học sắp hết hạn`
                }
              </h3>
              <button
                onClick={() => setDismissed(true)}
                className={`p-1 rounded hover:bg-black/5 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-sm mt-1 ${isUrgent ? 'text-red-600' : 'text-amber-700'}`}>
              {isUrgent 
                ? 'Khóa học đã hết hạn hoặc trong thời gian ân hạn. Gia hạn ngay để tiếp tục học.'
                : 'Đừng để khóa học hết hạn! Gia hạn ngay để không gián đoạn việc học.'
              }
            </p>

            {/* List of courses */}
            <div className="mt-3 space-y-2">
              {expiringEnrollments.slice(0, 3).map((enrollment) => (
                <div
                  key={enrollment.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg bg-white/60 ${isUrgent ? 'hover:bg-red-100/50' : 'hover:bg-amber-100/50'} transition-colors`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {enrollment.Course?.imageUrl ? (
                      <img
                        src={enrollment.Course.imageUrl}
                        alt={enrollment.Course.title}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm">
                        {enrollment.Course?.title || 'Khóa học'}
                      </p>
                      <p className={`text-xs ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
                        {enrollment.enrollmentStatus === 'expired' 
                          ? 'Đã hết hạn'
                          : enrollment.enrollmentStatus === 'grace_period'
                          ? 'Thời gian ân hạn'
                          : `Còn ${Math.ceil((new Date(enrollment.expiresAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} ngày`
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openRenewalModal(enrollment)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      isUrgent
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-amber-600 text-white hover:bg-amber-700'
                    }`}
                  >
                    Gia hạn
                  </button>
                </div>
              ))}
            </div>

            {displayCount > 3 && (
              <button
                onClick={onViewAll}
                className={`mt-3 flex items-center gap-1 text-sm font-medium ${isUrgent ? 'text-red-700 hover:text-red-800' : 'text-amber-700 hover:text-amber-800'}`}
              >
                Xem tất cả {displayCount} khóa học
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Renewal Modal */}
      <RenewalModal
        isOpen={isRenewalModalOpen}
        onClose={() => {
          setIsRenewalModalOpen(false);
          setSelectedEnrollment(null);
        }}
        enrollment={selectedEnrollment as any}
        onRenew={handleRenew}
        isProcessing={isProcessing}
      />
    </>
  );
};

export default ExpiringCoursesAlert;
