import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trash2, ShoppingBag, ArrowLeft,
    CreditCard, ShieldCheck, Truck,
    ShoppingCart
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

const Cart: React.FC = () => {
    const navigate = useNavigate();
    const { items, removeItem, totalPrice, clearCart } = useCartStore();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);


    if (items.length === 0) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag size={48} className="text-gray-300" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">Giỏ hàng trống</h2>
                <p className="text-gray-500 mb-8 max-w-md text-center">
                    Bạn chưa thêm khóa học nào vào giỏ hàng. Hãy khám phá hàng ngàn khóa học hấp dẫn ngay nhé!
                </p>
                <button
                    onClick={() => navigate('/courses')}
                    className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-black px-8 py-4 rounded-2xl shadow-xl shadow-amber-100 transition-all active:scale-95 cursor-pointer"
                >
                    KHÁM PHÁ KHÓA HỌC
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pt-20 pb-20">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                            <ShoppingCart size={32} className="text-amber-500" />
                            Giỏ hàng của bạn
                        </h1>
                        <p className="text-gray-500 font-medium mt-1">Đang có {items.length} khóa học được chọn</p>
                    </div>
                    <button
                        onClick={() => navigate('/courses')}
                        className="flex items-center gap-2 text-gray-500 hover:text-amber-600 font-bold transition-colors group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Tiếp tục chọn khóa học
                    </button>
                </div>

                <div className="grid lg:grid-cols-12 gap-10">
                    {/* Items List */}
                    <div className="lg:col-span-8">
                        <div className="space-y-4 max-h-[720px] overflow-y-auto pr-2 custom-scrollbar">
                            {items.map((item) => (
                                <div key={item.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 hover:shadow-md transition-shadow group">
                                    <div className="w-full sm:w-48 h-32 rounded-2xl overflow-hidden shrink-0 bg-gray-100">
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex justify-between items-start gap-4">
                                                <h3 className="text-lg font-bold text-gray-900 line-clamp-2 hover:text-amber-600 cursor-pointer transition-colors leading-snug" onClick={() => navigate(`/course/${item.id}`)}>
                                                    {item.title}
                                                </h3>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-gray-300 hover:text-red-500 p-2 transition-colors cursor-pointer"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                            <p className="text-gray-500 text-xs font-semibold mt-1">Giảng viên: <span className="text-gray-700">{item.teacher}</span></p>
                                        </div>
                                        <div className="flex items-end justify-between mt-4">
                                            <div className="flex items-center gap-3">
                                                <span className="bg-amber-100 text-amber-600 text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                                                    {item.category}
                                                </span>
                                                <span className="text-gray-400 text-[11px] font-semibold">{item.level}</span>
                                            </div>
                                            <div className="text-right">
                                                {item.originalPrice && (
                                                    <p className="text-xs text-gray-400 line-through leading-none mb-1 font-medium">{item.originalPrice}</p>
                                                )}
                                                <p className="text-xl font-bold text-red-600 tracking-tight">{item.price}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={clearCart}
                            className="text-gray-400 hover:text-red-500 text-sm font-bold flex items-center gap-2 mt-6 ml-4 transition-colors"
                        >
                            <Trash2 size={16} />
                            Xóa tất cả giỏ hàng
                        </button>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl p-8 sticky top-30 space-y-8">
                            <h2 className="text-2xl font-black text-gray-900 border-b border-gray-50 pb-6 uppercase tracking-wider text-center">
                                Tổng thanh toán
                            </h2>

                            <div className="space-y-4">
                                <div className="flex justify-between text-gray-500 font-bold">
                                    <span>Tạm tính ({items.length} món)</span>
                                    <span>{totalPrice().toLocaleString()}đ</span>
                                </div>
                                <div className="flex justify-between text-gray-500 font-bold">
                                    <span>Giảm giá</span>
                                    <span className="text-emerald-500">-0đ</span>
                                </div>
                                <div className="h-px bg-gray-100 my-2"></div>
                                <div className="flex justify-between items-end">
                                    <span className="text-base font-bold text-gray-900">Tổng cộng</span>
                                    <span className="text-3xl font-extrabold text-red-600 tracking-tighter">
                                        {totalPrice().toLocaleString()}đ
                                    </span>
                                </div>
                            </div>

                            <button className="w-full py-5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 cursor-pointer text-lg flex items-center justify-center gap-3">
                                THANH TOÁN NGAY
                                <CreditCard size={20} />
                            </button>

                            <div className="space-y-4 pt-4">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest text-center mb-6">Cam kết của chúng tôi</p>
                                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500 shrink-0">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-600 leading-tight">Bảo mật thông tin & Thanh toán an toàn 100%</span>
                                </div>
                                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 shrink-0">
                                        <Truck size={20} />
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-600 leading-tight">Quyền truy cập khóa học ngay sau khi thanh toán</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
