import React, { useEffect, useState } from 'react';
import {
  Key, Settings, Trash2, Save, Plus, XCircle, ListOrdered, Shield, Brain,
  FileText, ScrollText, ChevronLeft, ChevronRight, Loader2, AlertTriangle
} from 'lucide-react';
import { aiService, type AiSetting } from '../../services/ai.service';
import { adminService } from '../../services/admin.service';
import { toast } from 'react-hot-toast';

type TabType = 'providers' | 'policies' | 'audit';

// ==========================================
// TYPES
// ==========================================
interface AIPolicy {
  id: string | number;
  role: string;
  enabled: boolean;
  dailyLimit: number;
  maxOutputTokens: number;
  ragTopK: number;
  createdAt?: string;
  updatedAt?: string;
}

interface AIAuditLog {
  id: string | number;
  userId?: string | number;
  role?: string;
  endpoint?: string;
  provider?: string;
  model?: string;
  status?: string;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  error?: string;
  createdAt: string;
  user?: {
    name?: string;
    email?: string;
  };
}

// ==========================================
// PROVIDERS TAB COMPONENT
// ==========================================
const ProvidersTab: React.FC = () => {
  const [settings, setSettings] = useState<AiSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<AiSetting>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await aiService.getAllSettings();
      console.log('[AdminAiSettings] Final data:', data);
      setSettings(data);
    } catch (err: any) {
      console.error('[AdminAiSettings] Error:', err);
      toast.error('Lỗi khi tải cấu hình AI: ' + err.message);
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (s: AiSetting) => {
    setIsEditing(s.provider);
    setEditFormData({ ...s, apiKey: '' });
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Đang tải cấu hình AI...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-amber-500 text-gray-900 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
        >
          <Plus size={18} />
          Thêm nhà cung cấp
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settings.map((s) => (
          <div key={s.provider} className="group relative bg-white rounded-3xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 border-b-4 border-b-transparent hover:border-b-amber-500 overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-gray-50 rounded-full opacity-50 transition-transform group-hover:scale-110"></div>

            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{s.provider.replace('_', ' ')}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${s.enabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    <p className="text-[10px] font-bold text-gray-400 leading-none">
                      {s.enabled ? 'Đang hoạt động' : 'Đã tắt'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(s)}
                    className="p-2 bg-gray-50 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all cursor-pointer"
                  >
                    <Settings size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(s.provider)}
                    className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-500">Model</span>
                  </div>
                  <span className="text-xs font-medium text-gray-500">{s.model}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <ListOrdered size={14} className="text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-500">Ưu tiên</span>
                  </div>
                  <span className="text-xs font-medium text-gray-500">#{s.priority}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {settings.length === 0 && (
          <div className="lg:col-span-2 bg-white rounded-3xl p-12 border-2 border-dashed border-gray-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4">
              <Brain size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có nhà cung cấp nào</h3>
            <p className="text-gray-400 font-bold text-sm max-w-xs mx-auto mb-6">Thêm OpenAI, Gemini hoặc OpenRouter để bắt đầu.</p>
            <button
              onClick={handleAddNew}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-xs tracking-widest hover:bg-amber-500 transition-all cursor-pointer"
            >
              Thêm ngay
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/60">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="bg-slate-900 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{isEditing === 'new' ? 'Thêm mới AI' : 'Cấu hình ' + isEditing}</h2>
                <p className="text-[10px] font-bold text-amber-500 mt-1">AI Provider Management</p>
              </div>
              <button onClick={handleCancel} className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer">
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400">Nhà cung cấp</label>
                  <select
                    name="provider"
                    value={editFormData.provider}
                    onChange={handleChange}
                    disabled={isEditing !== 'new'}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all disabled:opacity-50"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI (ChatGPT)</option>
                    <option value="openrouter">OpenRouter AI</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400">Model ID</label>
                  <input
                    type="text"
                    name="model"
                    value={editFormData.model}
                    onChange={handleChange}
                    placeholder="gpt-4o, gemini-1.5-pro"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-400">API Key</label>
                  <div className="relative">
                    <input
                      type="password"
                      name="apiKey"
                      value={editFormData.apiKey}
                      onChange={handleChange}
                      placeholder={isEditing === 'new' ? "Nhập API Key" : "Nhập để cập nhật (không hiện key cũ)"}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-10 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                    />
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  <p className="text-[10px] text-gray-400">* Key sẽ được mã hóa an toàn trước khi lưu.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400">Thứ tự ưu tiên</label>
                  <input
                    type="number"
                    name="priority"
                    value={editFormData.priority}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                    min="1"
                    required
                  />
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                  <input
                    type="checkbox"
                    name="enabled"
                    id="enabled-toggle"
                    checked={editFormData.enabled}
                    onChange={handleChange}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                  <label htmlFor="enabled-toggle" className="text-sm text-gray-700 cursor-pointer select-none">Bật hoạt động</label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 text-gray-900 rounded-xl font-bold text-sm hover:bg-amber-600 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  LƯU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// POLICIES TAB COMPONENT (Role-based)
// ==========================================
const PoliciesTab: React.FC = () => {
  const [policies, setPolicies] = useState<AIPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ role: 'student', enabled: true, dailyLimit: 50, maxOutputTokens: 1024, ragTopK: 5 });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res: any = await adminService.getAIPolicies();
      // Backend returns: { data: { policies: [...] } }
      const data = res?.data?.policies || res?.policies || [];
      setPolicies(data);
    } catch (err: any) {
      toast.error('Lỗi khi tải chính sách: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createAIPolicy(formData);
      toast.success('Đã lưu chính sách!');
      setIsEditing(null);
      setFormData({ role: 'student', enabled: true, dailyLimit: 50, maxOutputTokens: 1024, ragTopK: 5 });
      fetchPolicies();
    } catch (err: any) {
      toast.error('Lỗi khi lưu: ' + err.message);
    }
  };

  const handleDelete = async (_id: string | number) => {
    if (!window.confirm('Xóa chính sách này?')) return;
    try {
      // TODO: Add delete API call here
      toast.success('Đã xóa chính sách!');
      fetchPolicies();
    } catch (err: any) {
      toast.error('Lỗi khi xóa: ' + err.message);
    }
  };

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = { student: 'Học sinh', teacher: 'Giáo viên', admin: 'Admin', support: 'Hỗ trợ' };
    return map[role] || role;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
        <p className="text-gray-500">Đang tải chính sách...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Chính sách theo vai trò</h3>
          <p className="text-sm text-gray-500">Quy định giới hạn AI cho từng loại người dùng</p>
        </div>
        <button
          onClick={() => setIsEditing('new')}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
        >
          <Plus size={16} /> Thêm chính sách
        </button>
      </div>

      {isEditing && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
              >
                <option value="student">Học sinh</option>
                <option value="teacher">Giáo viên</option>
                <option value="admin">Admin</option>
                <option value="support">Hỗ trợ</option>
              </select>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
              <input
                type="checkbox"
                id="policy-enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-5 h-5 accent-amber-500 rounded"
              />
              <label htmlFor="policy-enabled" className="text-sm text-gray-700 cursor-pointer">Cho phép sử dụng AI</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giới hạn/ngày</label>
              <input
                type="number"
                value={formData.dailyLimit}
                onChange={(e) => setFormData({ ...formData, dailyLimit: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                min={1}
                max={10000}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max tokens</label>
              <input
                type="number"
                value={formData.maxOutputTokens}
                onChange={(e) => setFormData({ ...formData, maxOutputTokens: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                min={256}
                max={8192}
                step={256}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsEditing(null)} className="px-6 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">Hủy</button>
            <button type="submit" className="px-6 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600">Lưu</button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {policies.map((policy) => (
          <div key={policy.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${policy.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{getRoleLabel(policy.role)}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${policy.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {policy.enabled ? 'Đang áp dụng' : 'Đã tắt'}
                  </span>
                </div>
              </div>
              <button onClick={() => handleDelete(policy.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-gray-500 text-xs mb-1">Giới hạn/ngày</p>
                <p className="font-semibold text-gray-900">{policy.dailyLimit} câu hỏi</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-gray-500 text-xs mb-1">Max tokens</p>
                <p className="font-semibold text-gray-900">{policy.maxOutputTokens.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-gray-500 text-xs mb-1">RAG Top-K</p>
                <p className="font-semibold text-gray-900">{policy.ragTopK} tài liệu</p>
              </div>
            </div>
          </div>
        ))}
        {policies.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Chưa có chính sách nào</p>
            <p className="text-sm mt-1">Thêm chính sách để giới hạn AI theo vai trò</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// AUDIT LOGS TAB COMPONENT (Enhanced)
// ==========================================
const AuditLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<AIAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res: any = await adminService.getAIAuditLogs({ page, limit: 20 });
      // Backend returns: { data: { logs: [...] } }
      const data = res?.data?.logs || res?.logs || [];
      setLogs(data);
      setTotalPages(res?.data?.pagination?.totalPages || res?.pagination?.totalPages || 1);
    } catch (err: any) {
      toast.error('Lỗi khi tải nhật ký: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
        <p className="text-gray-500">Đang tải nhật ký...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Nhật ký sử dụng AI</h3>
          <p className="text-sm text-gray-500">Theo dõi chi tiết mỗi lần gọi AI</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.status === 'success' ? 'bg-green-100 text-green-600' : log.status === 'error' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                  <ScrollText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{log.endpoint || 'chat'}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{log.provider || 'gemini'}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{log.model || 'default'}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="text-gray-500">User: {log.user?.name || log.user?.email || `ID:${log.userId}`}</span>
                    {log.role && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{log.role}</span>}
                  </div>
                  {(log.inputTokens || log.outputTokens) && (
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      {log.inputTokens !== undefined && (
                        <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                          Input: {log.inputTokens.toLocaleString()} tokens
                        </span>
                      )}
                      {log.outputTokens !== undefined && (
                        <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                          Output: {log.outputTokens.toLocaleString()} tokens
                        </span>
                      )}
                      {log.cost !== undefined && (
                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                          ${log.cost.toFixed(4)}
                        </span>
                      )}
                    </div>
                  )}
                  {log.error && (
                    <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">{log.error}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <ScrollText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Chưa có nhật ký nào</p>
              <p className="text-sm mt-1">Nhật ký sẽ xuất hiện khi có người dùng tương tác với AI</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-amber-600 disabled:opacity-50"
            >
              <ChevronLeft size={16} /> Trước
            </button>
            <span className="text-sm text-gray-500">Trang {page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-amber-600 disabled:opacity-50"
            >
              Sau <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const AdminAiSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('providers');

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'providers', label: 'Nhà cung cấp', icon: <Brain size={18} /> },
    { id: 'policies', label: 'Chính sách theo vai trò', icon: <FileText size={18} /> },
    { id: 'audit', label: 'Nhật ký sử dụng', icon: <ScrollText size={18} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý cấu hình AI</h1>
        <p className="text-gray-500 text-sm mt-1">Cấu hình nhà cung cấp AI, chính sách, mẫu prompt và xem nhật ký</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {activeTab === 'providers' && <ProvidersTab />}
        {activeTab === 'policies' && <PoliciesTab />}
        {activeTab === 'audit' && <AuditLogsTab />}
      </div>
    </div>
  );
};

export default AdminAiSettings;
