import React, { useEffect, useState } from 'react';
import { Key, Settings, Trash2, Save, Plus, XCircle, ListOrdered, Shield, Brain } from 'lucide-react';
import { aiService, type AiSetting } from '../../services/ai.service';
import { toast } from 'react-hot-toast';

const AdminAiSettings: React.FC = () => {
  const [settings, setSettings] = useState<AiSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null); // provider being edited
  const [editFormData, setEditFormData] = useState<Partial<AiSetting>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await aiService.getAllSettings();
      setSettings(data);
    } catch (err: any) {
      toast.error('Lỗi khi tải cấu hình AI: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (s: AiSetting) => {
    setIsEditing(s.provider);
    setEditFormData({ ...s, apiKey: '' }); // Don't show masked key
  };

  const handleCancel = () => {
    setIsEditing(null);
    setEditFormData({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setEditFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await aiService.upsertSetting(editFormData);
      toast.success('Đã lưu cấu hình thành công!');
      setIsEditing(null);
      fetchSettings();
    } catch (err: any) {
      toast.error('Lỗi khi lưu cấu hình: ' + err.message);
    }
  };

  const handleDelete = async (provider: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa cấu hình cho ${provider}?`)) return;
    try {
      await aiService.deleteSetting(provider);
      toast.success('Đã xóa cấu hình!');
      fetchSettings();
    } catch (err: any) {
      toast.error('Lỗi khi xóa: ' + err.message);
    }
  };

  const handleAddNew = () => {
    setIsEditing('new');
    setEditFormData({ provider: 'openai', model: '', priority: 1, enabled: true });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/50">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý cấu hình AI</h1>
            <p className="text-gray-500 text-sm mt-1">Cấu hình API OpenAI, Gemini và OpenRouter</p>
          </div>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-amber-500 text-gray-900 px-8 py-4 rounded-3xl font-bold text-sm hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 active:scale-95 cursor-pointer"
        >
          <Plus size={18} />
          Thêm nhà cung cấp
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Đang tải cấu hình AI...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {settings.map((s) => (
            <div key={s.provider} className="group relative bg-white rounded-[40px] p-8 border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500 border-b-4 border-b-transparent hover:border-b-amber-500 overflow-hidden">
              {/* Card Pattern */}
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-gray-50 rounded-full opacity-50 transition-transform group-hover:scale-110"></div>

              <div className="relative flex flex-col h-full">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{s.provider.replace('_', ' ')}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${s.enabled && s.isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <p className="text-[10px] font-bold text-gray-400 leading-none">
                          {s.enabled ? (s.isAvailable ? 'Đang hoạt động' : 'Tạm thời không khả dụng') : 'Đã tắt'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(s)}
                      className="p-3 bg-gray-50 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-2xl transition-all cursor-pointer"
                    >
                      <Settings size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(s.provider)}
                      className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-6 flex-1">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Shield size={16} className="text-gray-400" />
                      <span className="text-[11px] font-bold text-gray-500">Model Mặc Định</span>
                    </div>
                    <span className="text-xs font-medium text-gray-500">{s.model}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <ListOrdered size={16} className="text-gray-400" />
                      <span className="text-[11px] font-bold text-gray-500">Thứ tự ưu tiên</span>
                    </div>
                    <span className="text-xs font-medium text-gray-500">#{s.priority}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Key size={16} className="text-gray-400" />
                      <span className="text-[11px] font-bold text-gray-500">API Key</span>
                    </div>
                    <span className="text-xs font-medium text-gray-500">********</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {settings.length === 0 && (
            <div className="lg:col-span-2 bg-white rounded-[40px] p-20 border-2 border-dashed border-gray-100 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6">
                <Brain size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có nhà cung cấp nào</h3>
              <p className="text-gray-400 font-bold text-sm max-w-xs mx-auto mb-8">Thêm OpenAI, Gemini hoặc OpenRouter để bắt đầu sử dụng AI Tutor.</p>
              <button
                onClick={handleAddNew}
                className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold text-xs tracking-widest hover:bg-amber-500 transition-all cursor-pointer"
              >
                Thêm ngay
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Overlay Modals */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/60 transition-all animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[50px] overflow-hidden shadow-2xl relative animate-in zoom-in slide-in-from-bottom-10 duration-500">
            {/* Modal Header */}
            <div className="bg-slate-900 p-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white leading-none">
                    {isEditing === 'new' ? 'Thêm mới AI' : 'Cấu hình ' + isEditing}
                  </h2>
                  <p className="text-[10px] font-bold text-amber-500 mt-2">AI Provider Management</p>
                </div>
              </div>
              <button onClick={handleCancel} className="p-3 text-slate-400 hover:text-white transition-colors cursor-pointer">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1 space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 ml-1">Nhà cung cấp</label>
                  <select
                    name="provider"
                    value={editFormData.provider}
                    onChange={handleChange}
                    disabled={isEditing !== 'new'}
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-6 py-4 font-bold text-sm focus:border-amber-500 transition-all outline-none appearance-none disabled:opacity-50"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI (ChatGPT)</option>
                    <option value="openrouter">OpenRouter AI</option>
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1 space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 ml-1">Model ID</label>
                  <input
                    type="text"
                    name="model"
                    value={editFormData.model}
                    onChange={handleChange}
                    placeholder="e.g. gpt-4o, gemini-1.5-pro"
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-6 py-4 font-bold text-sm focus:border-amber-500 transition-all outline-none"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 ml-1">API Key</label>
                  <div className="relative group/key">
                    <input
                      type="password"
                      name="apiKey"
                      value={editFormData.apiKey}
                      onChange={handleChange}
                      placeholder={isEditing === 'new' ? "Nhập API Key của bạn" : "Nhập để cập nhật Key mới (không hiện key cũ vì lý do bảo mật)"}
                      className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-12 py-4 font-medium text-sm focus:border-amber-500 transition-all outline-none shadow-inner"
                    />
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover/key:text-amber-500 transition-colors" size={20} />
                  </div>
                  <p className="text-[10px] text-red-400 font-medium italic ml-1">* Key sẽ được mã hóa an toàn trước khi lưu vào cơ sở dữ liệu.</p>
                </div>

                <div className="col-span-2 md:col-span-1 space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 ml-1">Thứ tự ưu tiên (Priority)</label>
                  <input
                    type="number"
                    name="priority"
                    value={editFormData.priority}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-6 py-4 font-bold text-sm focus:border-amber-500 transition-all outline-none"
                    min="1"
                    required
                  />
                  <p className="text-[9px] text-red-400 font-medium ml-1 italic">*Thứ tự thấp hơn sẽ được thử trước</p>
                </div>

                <div className="col-span-2 md:col-span-1 space-y-2 flex flex-col justify-end">
                  <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border-2 border-transparent hover:border-amber-500/20 transition-all">
                    <input
                      type="checkbox"
                      name="enabled"
                      id="enabled-toggle"
                      checked={editFormData.enabled}
                      onChange={handleChange}
                      className="w-6 h-6 accent-amber-500 rounded-lg cursor-pointer"
                    />
                    <label htmlFor="enabled-toggle" className="text-sm text-gray-700 cursor-pointer select-none">Bật hoạt động</label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-5 rounded-2xl font-bold text-sm text-gray-500 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-5 bg-amber-500 text-gray-900 rounded-2xl font-bold text-sm hover:bg-amber-600 shadow-xl shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  LƯU THAY ĐỔI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAiSettings;
