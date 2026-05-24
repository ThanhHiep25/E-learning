import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ExpirationBadgeProps {
  expiresAt?: string | null;
  enrollmentStatus?: 'active' | 'expired' | 'grace_period';
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ExpirationBadge: React.FC<ExpirationBadgeProps> = ({
  expiresAt,
  enrollmentStatus = 'active',
  showDetails = true,
  size = 'md',
}) => {
  if (!expiresAt) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
        <CheckCircle2 className="w-3 h-3" />
        Vĩnh viễn
      </span>
    );
  }

  const expiry = new Date(expiresAt);
  const now = new Date();
  const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  // Expired
  if (daysRemaining <= 0 || enrollmentStatus === 'expired') {
    return (
      <span className={`inline-flex items-center gap-1.5 bg-red-100 text-red-700 rounded-full font-medium ${sizeClasses[size]}`}>
        <AlertCircle className={iconSizes[size]} />
        {showDetails ? 'Đã hết hạn' : 'Hết hạn'}
      </span>
    );
  }

  // Grace period
  if (enrollmentStatus === 'grace_period') {
    return (
      <span className={`inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-700 rounded-full font-medium ${sizeClasses[size]}`}>
        <Clock className={iconSizes[size]} />
        {showDetails ? 'Thời gian ân hạn' : 'Ân hạn'}
      </span>
    );
  }

  // Expiring soon (7 days or less)
  if (daysRemaining <= 7) {
    return (
      <span className={`inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 rounded-full font-medium ${sizeClasses[size]}`}>
        <Clock className={iconSizes[size]} />
        {showDetails ? `Còn ${daysRemaining} ngày` : `${daysRemaining} ngày`}
      </span>
    );
  }

  // More than 7 days
  if (daysRemaining <= 30) {
    return (
      <span className={`inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 rounded-full font-medium ${sizeClasses[size]}`}>
        <Clock className={iconSizes[size]} />
        {showDetails ? `Còn ${daysRemaining} ngày` : `${daysRemaining} ngày`}
      </span>
    );
  }

  // More than 30 days - show months
  const monthsRemaining = Math.floor(daysRemaining / 30);
  return (
    <span className={`inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 rounded-full font-medium ${sizeClasses[size]}`}>
      <Clock className={iconSizes[size]} />
      {showDetails ? `Còn ${monthsRemaining} tháng` : `${monthsRemaining} tháng`}
    </span>
  );
};

export default ExpirationBadge;
