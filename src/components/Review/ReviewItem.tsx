import React, { useState } from 'react';
import { Star, MoreVertical, Trash2, Edit2, X } from 'lucide-react';
import type { Review } from '../../services/review.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ReviewItemProps {
    review: Review;
    isOwner?: boolean;
    onEdit?: (review: Review) => void;
    onDelete?: (reviewId: string | number) => void;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ review, isOwner, onEdit, onDelete }) => {
    const [showMenu, setShowMenu] = React.useState(false);
    const [isModalRemove, setIsModalRemove] = useState(false)


    return (
        <div className="py-6 border-b border-gray-100 last:border-0 group animate-in fade-in duration-500">
            <div className="flex gap-4">
                {/* Avatar */}
                <div className="shrink-0">
                    <img
                        src={review.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user?.name || 'User')}&background=random`}
                        alt={review.user?.name}
                        className="w-12 h-12 rounded-full border border-gray-100 object-cover"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-gray-900">{review.user?.name || 'Học viên'}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex text-amber-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={14}
                                            fill={i < review.rating ? "currentColor" : "none"}
                                            className={i < review.rating ? "text-amber-400" : "text-gray-200"}
                                        />
                                    ))}
                                </div>
                                <span className="text-xs text-gray-400 font-medium">
                                    {(() => {
                                        try {
                                            if (!review.createdAt) return 'Vừa xong';
                                            const d = new Date(review.createdAt);
                                            return isNaN(d.getTime()) ? 'Vừa xong' : format(d, 'dd MMMM, yyyy', { locale: vi });
                                        } catch (e) {
                                            return 'Vừa xong';
                                        }
                                    })()}
                                </span>
                            </div>
                        </div>

                        {isOwner && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1.5 hover:bg-gray-100 cursor-pointer rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                >
                                    <MoreVertical size={16} className="text-gray-500" />
                                </button>

                                {showMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowMenu(false)}
                                        ></div>
                                        <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
                                            <button
                                                onClick={() => {
                                                    onEdit?.(review);
                                                    setShowMenu(false);
                                                }}
                                                className="w-full cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                            >
                                                <Edit2 size={14} /> Chỉnh sửa
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowMenu(false);
                                                    setIsModalRemove(true)
                                                }}
                                                className="w-full cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 size={14} /> Xóa đánh giá
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed">
                        {review.comment}
                    </p>
                </div>
            </div>

            {/* Modal pop-up xác nhận delete đánh giá */}

            {
                isModalRemove && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                        <div className="w-full max-w-lg bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden scale-in-center transition-all duration-300 relative">
                            <div className="p-10 mt-12 text-center">
                                <p className="text-gray-500 font-medium mt-3 leading-relaxed">
                                    Bạn có chắc chắn muốn xóa khóa học <span className="text-red-600 font-bold">"{review.comment}"</span>?
                                </p>
                                <div className="mt-4 p-4 rounded-2xl ">
                                    <p className="text-xs text-red-600 font-medium">Hành động này không thể hoàn tác và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.</p>
                                </div>
                            </div>

                            <div className="px-10 pb-10 grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setIsModalRemove(false)
                                    }}
                                    className="px-8 py-4 cursor-pointer rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all border border-gray-100 active:scale-95 disabled:opacity-50"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete?.(review.id);
                                        setIsModalRemove(false)
                                    }}
                                    className="px-8 py-4 cursor-pointer bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    Xác nhận xóa
                                </button>
                            </div>

                            <button

                                className="absolute cursor-pointer top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-50 rounded-xl"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default ReviewItem;
