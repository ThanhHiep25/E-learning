import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Star, MessageSquare, ListFilter } from 'lucide-react';
import { reviewService } from '../../services/review.service';
import type { Review, ReviewStatistics } from '../../services/review.service';
import ReviewItem from './ReviewItem';
import ReviewForm from './ReviewForm';
import ErrorBoundary from '../common/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import { useCourseStore } from '../../store/useCourseStore';
import toast from 'react-hot-toast';

interface CourseReviewsProps {
    courseId: string | number;
    isEnrolled: boolean;
}

const CourseReviews: React.FC<CourseReviewsProps> = ({ courseId, isEnrolled }) => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [statistics, setStatistics] = useState<ReviewStatistics | null>(null);
    const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
    const [sortBy, setSortBy] = useState('newest');

    const formRef = useRef<HTMLDivElement>(null);
    const { updateCourse } = useCourseStore();

    useEffect(() => {
        if (showReviewForm || editingReview) {
            setTimeout(() => {
                formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [showReviewForm, editingReview]);

    const fetchReviews = useCallback(async (page = 1) => {
        try {
            setIsLoading(true);
            const data = await reviewService.getCourseReviews(courseId, {
                page,
                limit: 5,
                rating: ratingFilter,
                sort: sortBy
            });
            setReviews(data.reviews);
            setStatistics(data.statistics);
            setPagination(data.pagination);

            // Cập nhật global store để header và các chỗ khác được đồng bộ
            if (data.statistics) {
                updateCourse(String(courseId), {
                    rating: Number(data.statistics.averageRating),
                    reviewCount: data.statistics.totalReviews
                });
            }
        } catch (err) {
            console.error('Lỗi khi tải đánh giá:', err);
            toast.error('Không thể tải danh sách đánh giá');
        } finally {
            setIsLoading(false);
        }
    }, [courseId, ratingFilter, sortBy]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleSubmitReview = async (data: { rating: number; comment: string }) => {
        setIsSubmitting(true);
        try {
            if (editingReview) {
                await reviewService.updateReview(editingReview.id, data);
                toast.success('Cập nhật đánh giá thành công!');
                setEditingReview(null);
            } else {
                await reviewService.createReview(courseId, data);
                toast.success('Cảm ơn bạn đã đánh giá khóa học!');
            }
            setShowReviewForm(false);
            fetchReviews(1);
        } catch (err: any) {
            console.error('Lỗi khi gửi đánh giá:', err);
            toast.error(err?.message || 'Có lỗi xảy ra khi gửi đánh giá');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReview = async (reviewId: string | number) => {
        try {
            await reviewService.deleteReview(reviewId);
            toast.success('Đã xóa đánh giá');
            fetchReviews(pagination.page);
        } catch (err) {
            console.error('Lỗi khi xóa đánh giá:', err);
            toast.error('Không thể xóa đánh giá');
        }
    };

    const hasReviewed = useMemo(() => {
        if (!user) return false;
        return reviews.some(r => r.userId == user.id || (r as any).user?.id == user.id);
    }, [reviews, user]);

    return (
        <div className="space-y-8 mt-12 animate-in slide-in-from-bottom duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        <MessageSquare className="text-amber-500" size={20} />
                        Đánh giá từ người học
                    </h2>
                    <p className="text-gray-500 font-medium text-sm">Trao đổi và nhận xét về chất lượng khóa học</p>
                </div>

                {isEnrolled && !hasReviewed && !showReviewForm && (
                    <button
                        onClick={() => setShowReviewForm(true)}
                        className="bg-gray-900 hover:bg-black text-white cursor-pointer px-6 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg shadow-gray-200"
                    >
                        Viết đánh giá mới
                    </button>
                )}
            </div>

            {/* Statistics Section */}
            {statistics && (
                <div className="grid md:grid-cols-12 gap-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="md:col-span-4 flex flex-col items-center justify-center space-y-3 py-6 md:border-r border-gray-100">
                        <div className="text-6xl font-bold text-gray-900 tabular-nums">{statistics.averageRating}</div>
                        <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={24}
                                    fill={i < Math.floor(Number(statistics.averageRating)) ? "currentColor" : "none"}
                                />
                            ))}
                        </div>
                        <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{statistics.totalReviews} đánh giá</div>
                    </div>

                    <div className="md:col-span-8 flex flex-col justify-center space-y-4">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = statistics.distribution[star] || 0;
                            const percentage = statistics.totalReviews > 0 ? (count / statistics.totalReviews) * 100 : 0;
                            return (
                                <div key={star} className="flex items-center gap-4 group cursor-pointer" onClick={() => setRatingFilter(ratingFilter === star ? undefined : star)}>
                                    <div className="flex items-center gap-1 w-10">
                                        <span className="text-sm font-bold text-gray-700">{star}</span>
                                        <Star size={14} className="text-amber-400 fill-amber-400" />
                                    </div>
                                    <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                        <div
                                            className={`h-full bg-amber-400 transition-all duration-1000 group-hover:bg-amber-500 ${ratingFilter === star ? 'ring-2 ring-amber-100 ring-offset-1' : ''}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="w-12 text-right">
                                        <span className="text-xs font-bold text-gray-400 group-hover:text-amber-600 transition-colors">{Math.round(percentage)}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Review Form */}
            {(showReviewForm || editingReview) && (
                <div ref={formRef} className="pb-4 animate-in zoom-in-95 duration-300">
                    <ReviewForm
                        initialData={editingReview ? { rating: editingReview.rating, comment: editingReview.comment } : undefined}
                        isSubmitting={isSubmitting}
                        onSubmit={handleSubmitReview}
                        onCancel={() => {
                            setShowReviewForm(false);
                            setEditingReview(null);
                        }}
                    />
                </div>
            )}

            {/* Filters & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-gray-100 px-2">
                <div className="flex items-center gap-2">
                    <ListFilter size={18} className="text-gray-400" />
                    <span className="text-sm font-bold text-gray-400 tracking-wider">Lọc bởi:</span>
                    <div className="flex gap-2">
                        {[5, 4, 3, 2, 1].map(r => (
                            <button
                                key={r}
                                onClick={() => setRatingFilter(ratingFilter === r ? undefined : r)}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest transition-all ${ratingFilter === r ? 'bg-amber-500 text-gray-900 border-amber-500' : 'bg-gray-50 text-gray-400 border-gray-100'
                                    } border`}
                            >
                                {r} SAO
                            </button>
                        ))}
                    </div>
                </div>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent border-0 text-sm font-bold text-gray-700 outline-none cursor-pointer focus:ring-0"
                >
                    <option value="newest">MỚI NHẤT</option>
                    <option value="oldest">CŨ NHẤT</option>
                    <option value="highest">ĐÁNH GIÁ CAO</option>
                    <option value="lowest">ĐÁNH GIÁ THẤP</option>
                </select>
            </div>

            {/* Reviews List */}
            <div className="space-y-2">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Đang tải đánh giá...</p>
                    </div>
                ) : reviews.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        <ErrorBoundary>
                            {reviews.map((review) => (
                                <ReviewItem
                                    key={review.id}
                                    review={review}
                                    isOwner={user?.id == (review.user?.id || review.userId)}
                                    onEdit={setEditingReview}
                                    onDelete={handleDeleteReview}
                                />
                            ))}
                        </ErrorBoundary>
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-300 shadow-sm">
                            <MessageSquare size={32} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-bold text-gray-800">Chưa có đánh giá nào</p>
                            <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto">
                                {ratingFilter ? `Không tìm thấy đánh giá ${ratingFilter} sao. Hãy thử lọc khác nhé.` : 'Khóa học này chưa được ai đánh giá. Hãy là người đầu tiên nhận xét nhé!'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-8">
                    {[...Array(pagination.totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => fetchReviews(i + 1)}
                            className={`w-10 h-10 rounded-xl font-bold transition-all ${pagination.page === i + 1
                                ? 'bg-amber-500 text-gray-900 shadow-lg shadow-amber-200'
                                : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CourseReviews;
