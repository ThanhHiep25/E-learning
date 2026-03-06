import React, { useState, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, Hash,
    Search, AlertCircle,
    Loader2, X
} from 'lucide-react';
import { categoryService, type BECategory } from '../../api/categoryService';
import toast from 'react-hot-toast';

const CategoryManagement: React.FC = () => {
    const [categories, setCategories] = useState<BECategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<BECategory | null>(null);
    const [formData, setFormData] = useState({ name: '', menuSection: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const response = await categoryService.getAdminCategories();
            if (response.success && response.data) {
                setCategories(response.data.categories);
            }
        } catch (error) {
            toast.error('Không thể tải danh sách danh mục');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (category?: BECategory) => {
        if (category) {
            setEditingCategory(category);
            setFormData({ name: category.name, menuSection: category.menuSection });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', menuSection: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.menuSection) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingCategory) {
                const response = await categoryService.updateCategory(editingCategory.id, formData);
                if (response.success) {
                    toast.success('Cập nhật thành công');
                    fetchCategories();
                    setIsModalOpen(false);
                }
            } else {
                const response = await categoryService.createCategory(formData);
                if (response.success) {
                    toast.success('Thêm mới thành công');
                    fetchCategories();
                    setIsModalOpen(false);
                }
            }
        } catch (error: any) {
            toast.error(error.message || 'Thao tác thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
        try {
            const response = await categoryService.deleteCategory(id);
            if (response.success) {
                toast.success('Đã xóa danh mục');
                setCategories(categories.filter(c => c.id !== id));
            } else {
                toast.error(response.message || 'Không thể xóa');
            }
        } catch (error) {
            toast.error('Lỗi khi xóa danh mục');
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.menuSection.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4 pt-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                        Quản lý <span className="text-amber-600">Danh mục.</span>
                    </h1>
                    <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-[11px]">Cơ cấu hệ thống & Phân loại khóa học</p>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl active:scale-95 cursor-pointer"
                >
                    <Plus size={20} strokeWidth={3} />
                    THÊM DANH MỤC
                </button>
            </div>

            {/* Stats Overview Sidebar (inline for admin feel) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-10">
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                    <p className="text-[14px] font-bold text-gray-400  mb-1">Tổng danh mục</p>
                    <h3 className="text-4xl font-bold text-gray-900">{categories.length}</h3>
                </div>
                <div className="lg:col-span-3 bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm flex items-center px-8 relative overflow-hidden group">
                    <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-amber-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm danh mục theo tên hoặc nhóm thực đơn..."
                        className="w-full bg-transparent border-none outline-none pl-10 pr-4 py-4 font-bold text-gray-700 text-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-[48px] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-10 py-8 text-[12px] font-bold text-gray-400 ">Thông tin danh mục</th>
                            <th className="px-10 py-8 text-[12px] font-bold text-gray-400 ">Nhóm thực đơn</th>
                            <th className="px-10 py-8 text-[12px] font-bold text-gray-400 ">Ngày tạo</th>
                            <th className="px-10 py-8 text-[12px] font-bold text-gray-400 ">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="animate-spin text-amber-500" size={40} />
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredCategories.length > 0 ? (
                            filteredCategories.map((cat) => (
                                <tr key={cat.id} className="hover:bg-amber-50/30 transition-all group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-amber-100 group-hover:text-amber-600 transition-all">
                                                <Hash size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors uppercase tracking-tight">{cat.name}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">ID: #{cat.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-[11px] font-bold uppercase tracking-wider group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100">
                                            {cat.menuSection}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <span className="text-sm font-bold text-gray-400">
                                            {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString('vi-VN') : '---'}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => handleOpenModal(cat)}
                                                className="p-3 bg-white text-blue-500 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:scale-110 transition-all cursor-pointer"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.id)}
                                                className="p-3 bg-white text-red-500 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:scale-110 transition-all cursor-pointer"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="py-20 text-center">
                                    <AlertCircle className="mx-auto text-gray-200 mb-4" size={48} />
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Không tìm thấy danh mục nào</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Simple Modal for Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-[48px] w-full max-w-xl relative z-10 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {editingCategory ? 'Chỉnh sửa' : 'Thêm'} <span className="text-amber-600">Danh mục</span>
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 space-y-6">
                            <div className="space-y-4">
                                <label className="text-[14px] font-bold text-gray-400 ml-1">Tên danh mục</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 font-bold text-gray-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all shadow-inner"
                                    placeholder="Ví dụ: Lập trình Web"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[14px] font-bold text-gray-400 ml-1">Nhóm thực đơn</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 font-bold text-gray-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all shadow-inner"
                                    placeholder="Ví dụ: Công nghệ thông tin"
                                    value={formData.menuSection}
                                    onChange={e => setFormData({ ...formData, menuSection: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-gray-900 text-white py-5 rounded-3xl font-bold text-sm uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : (editingCategory ? 'CẬP NHẬT' : 'XÁC NHẬN THÊM')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-10 bg-gray-50 text-gray-400 py-5 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all"
                                >
                                    HỦY
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManagement;
