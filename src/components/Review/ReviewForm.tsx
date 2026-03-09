import React, { useState, useEffect } from 'react';
import { Star, Send, X, AlertCircle } from 'lucide-react';

interface ReviewFormProps {
    initialData?: { rating: number; comment: string };
    onSubmit: (data: { rating: number; comment: string }) => Promise<void>;
    onCancel?: () => void;
    isSubmitting?: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
    const [rating, setRating] = useState(initialData?.rating || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState(initialData?.comment || '');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setRating(initialData.rating);
            setComment(initialData.comment);
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (rating === 0) {
            setError('Vui lòng chọn số sao đánh giá');
            return;
        }

        if (comment.length < 10) {
            setError('Bình luận phải có ít nhất 10 ký tự');
            return;
        }

        try {
            await onSubmit({ rating, comment });
            if (!initialData) {
                setRating(0);
                setComment('');
            }
        } catch (err: any) {
            setError(err?.message || 'Có lỗi xảy ra khi gửi đánh giá');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-amber-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                    {initialData ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá của bạn'}
                </h3>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 cursor-pointer rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {/* Star Rating Selector */}
                <div className="flex flex-col items-center gap-3 py-4 bg-amber-50/30 rounded-2xl border border-dashed border-amber-200">
                    <p className="text-sm font-bold text-amber-600 uppercase tracking-wider">Chọn mức độ hài lòng</p>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="cursor-pointer transition-transform active:scale-90 hover:scale-110"
                            >
                                <Star
                                    size={30}
                                    fill={star <= (hoverRating || rating) ? "currentColor" : "none"}
                                    className={`transition-colors duration-200 ${star <= (hoverRating || rating) ? "text-amber-400" : "text-gray-200"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                    <span className="text-xs font-medium text-gray-500 italic">
                        {rating === 1 && "Rất kém"}
                        {rating === 2 && "Kém"}
                        {rating === 3 && "Bình thường"}
                        {rating === 4 && "Tốt"}
                        {rating === 5 && "Rất tốt"}
                    </span>
                </div>

                {/* Comment Input */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Bình luận của bạn</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Chia sẻ trải nghiệm của bạn về khóa học này..."
                        className="w-full h-32 p-4 rounded-2xl border-2 border-gray-100 focus:border-gray-200 focus:outline-none transition-all outline-none text-gray-700 resize-none placeholder:text-gray-300"
                    ></textarea>
                    <div className="flex justify-between items-center px-1">
                        {error && (
                            <span className="text-[10px] uppercase font-bold text-red-500 flex items-center gap-1 animate-pulse">
                                <AlertCircle size={10} /> {error}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 py-4 text-gray-500 font-bold text-md cursor-pointer border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Hủy
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-2 bg-amber-500 hover:bg-amber-600 text-gray-900 py-4 px-6 rounded-2xl font-bold text-md cursor-pointer shadow-xl shadow-amber-200/50 flex items-center justify-center gap-2 transition-all active:scale-95 group disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin"></div>
                    ) : (
                        <>
                            {initialData ? 'Cập nhật đánh giá' : 'Gửi đánh giá ngay'}
                            <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default ReviewForm;
