import React, { useEffect, useState } from 'react';
import { Send, Bell, Calendar, Users, BookOpen, RefreshCw, Loader2, CheckCircle, Clock, Repeat, Plus, X } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { courseService } from '../../services/course.service';
import toast from 'react-hot-toast';

const notificationTypes = [
  { value: 'system', label: 'Hệ thống', color: 'bg-blue-100 text-blue-700' },
  { value: 'course', label: 'Khóa học', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'payment', label: 'Thanh toán', color: 'bg-amber-100 text-amber-700' },
  { value: 'announcement', label: 'Thông báo', color: 'bg-purple-100 text-purple-700' },
];

const recurringOptions = [
  { value: 'none', label: 'Không lặp lại' },
  { value: 'daily', label: 'Hàng ngày' },
  { value: 'weekly', label: 'Hàng tuần' },
  { value: 'monthly', label: 'Hàng tháng' },
];

const AdminNotifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'send' | 'scheduled' | 'history'>('send');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulerEnabled, setSchedulerEnabled] = useState(() => {
    const saved = localStorage.getItem('adminSchedulerEnabled');
    return saved !== 'false'; // Default: enabled
  });
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'system' as 'system' | 'course' | 'payment' | 'announcement',
    targetType: 'all' as 'all' | 'user' | 'course',
    userId: '',
    courseId: '',
  });

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    message: '',
    type: 'system' as 'system' | 'course' | 'payment' | 'announcement',
    targetType: 'all' as 'all' | 'user' | 'course',
    userId: '',
    courseId: '',
    scheduledDate: '',
    scheduledTime: '',
    recurring: 'none' as 'none' | 'daily' | 'weekly' | 'monthly',
  });

  // History state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('adminScheduledNotifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Save scheduled notifications to localStorage
  useEffect(() => {
    localStorage.setItem('adminScheduledNotifications', JSON.stringify(scheduledNotifications));
  }, [scheduledNotifications]);

  // Save scheduler enabled setting
  useEffect(() => {
    localStorage.setItem('adminSchedulerEnabled', String(schedulerEnabled));
  }, [schedulerEnabled]);

  // Real scheduler - check every minute for due notifications
  const scheduledRef = React.useRef(scheduledNotifications);
  scheduledRef.current = scheduledNotifications;
  
  useEffect(() => {
    if (!schedulerEnabled) return; // Don't run if disabled

    const checkScheduledNotifications = async () => {
      const now = new Date();
      const currentScheduled = scheduledRef.current;
      const dueNotifications = currentScheduled.filter(
        n => n.status === 'pending' && new Date(n.scheduledAt) <= now
      );

      if (dueNotifications.length > 0) {
        console.log(`[Scheduler] Found ${dueNotifications.length} due notifications`);
        
        for (const notif of dueNotifications) {
          try {
            // Send the notification
            const payload: any = {
              title: notif.title,
              message: notif.message,
              type: notif.type,
              userIds: notif.userIds,
            };
            if (notif.courseId) {
              payload.courseId = notif.courseId;
            }

            await adminService.sendNotification(payload);
            console.log(`[Scheduler] Sent notification: ${notif.title}`);
            toast.success(`[Auto] Đã gửi: ${notif.title}`);
            
            // Update status to sent
            setScheduledNotifications(prev => 
              prev.map(n => n.id === notif.id ? { ...n, status: 'sent', sentAt: new Date().toISOString() } : n)
            );
          } catch (err) {
            console.error(`[Scheduler] Failed to send notification: ${notif.title}`, err);
            setScheduledNotifications(prev =>
              prev.map(n => n.id === notif.id ? { ...n, status: 'failed', error: String(err) } : n)
            );
          }
        }
      }
    };

    const interval = setInterval(checkScheduledNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [schedulerEnabled]);

  const fetchHistory = async (p = 1) => {
    setHistoryLoading(true);
    try {
      const res = await adminService.getAllNotifications({ page: p, limit: 10 });
      setNotifications(res.notifications || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: any) {
      toast.error('Không thể tải lịch sử thông báo');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory(page);
    }
  }, [activeTab, page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung');
      return;
    }

    // Validation cho từng loại target
    if (formData.targetType === 'user' && !selectedUser) {
      toast.error('Vui lòng chọn người dùng từ danh sách tìm kiếm');
      return;
    }
    if (formData.targetType === 'course' && !selectedCourse) {
      toast.error('Vui lòng chọn khóa học từ danh sách tìm kiếm');
      return;
    }

    setLoading(true);
    try {
      // Backend yêu cầu userIds là array (bắt buộc)
      let userIds: number[] = [];
      
      if (formData.targetType === 'user' && selectedUser) {
        userIds = [parseInt(String(selectedUser.id))];
      } else if (formData.targetType === 'all') {
        // Lấy tất cả users từ API
        toast.loading('Đang lấy danh sách người dùng...', { id: 'loading-users' });
        const allUsers = await adminService.listUsers();
        userIds = allUsers.map(u => typeof u.id === 'string' ? parseInt(u.id) : u.id).filter(id => id > 0);
        toast.dismiss('loading-users');
        
        if (userIds.length === 0) {
          toast.error('Không tìm thấy người dùng nào');
          setLoading(false);
          return;
        }
        
        console.log(`[Notification] Sending to ${userIds.length} users`);
      }
      
      const payload: any = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        userIds, // Bắt buộc phải có
      };

      if (formData.targetType === 'course' && formData.courseId) {
        payload.courseId = parseInt(formData.courseId);
      }

      await adminService.sendNotification(payload);
      
      // Hiển thị thông báo thành công với số lượng
      if (formData.targetType === 'all') {
        toast.success(`Đã gửi thông báo đến ${userIds.length} người dùng!`);
      } else {
        toast.success('Đã gửi thông báo thành công!');
      }
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'system',
        targetType: 'all',
        userId: '',
        courseId: '',
      });
      handleClearUser(); // Reset user search
      handleClearCourse(); // Reset course search
    } catch (err: any) {
      toast.error(err?.message || 'Không thể gửi thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScheduled = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.title.trim() || !scheduleForm.message.trim() || !scheduleForm.scheduledDate || !scheduleForm.scheduledTime) {
      toast.error('Vui lòng nhập đầy đủ thông tin và chọn thời gian');
      return;
    }

    // Validation
    if (scheduleForm.targetType === 'user' && !scheduleSelectedUser) {
      toast.error('Vui lòng chọn người dùng từ danh sách tìm kiếm');
      return;
    }
    if (scheduleForm.targetType === 'course' && !scheduleSelectedCourse) {
      toast.error('Vui lòng chọn khóa học từ danh sách tìm kiếm');
      return;
    }

    setScheduling(true);
    try {
      const scheduledAt = new Date(`${scheduleForm.scheduledDate}T${scheduleForm.scheduledTime}`).toISOString();
      
      // Backend yêu cầu userIds là array (bắt buộc)
      let userIds: number[] = [];
      
      if (scheduleForm.targetType === 'all') {
        // Lấy tất cả users
        toast.loading('Đang lấy danh sách người dùng...', { id: 'loading-schedule-users' });
        const allUsers = await adminService.listUsers();
        userIds = allUsers.map(u => typeof u.id === 'string' ? parseInt(u.id) : u.id).filter(id => id > 0);
        toast.dismiss('loading-schedule-users');
      } else if (scheduleForm.targetType === 'user' && scheduleSelectedUser) {
        userIds = [parseInt(String(scheduleSelectedUser.id))];
      }
      
      if (userIds.length === 0 && scheduleForm.targetType !== 'course') {
        toast.error('Không tìm thấy người dùng nào');
        setScheduling(false);
        return;
      }
      
      const payload: any = {
        title: scheduleForm.title,
        message: scheduleForm.message,
        type: scheduleForm.type,
        userIds, // Bắt buộc phải có
        scheduledAt,
        recurring: scheduleForm.recurring !== 'none' ? scheduleForm.recurring : undefined,
      };

      if (scheduleForm.targetType === 'course' && scheduleForm.courseId) {
        payload.courseId = parseInt(scheduleForm.courseId);
      }

      // Giả lập API call - sau này thay bằng API thật
      // await adminService.createScheduledNotification(payload);
      
      // Thêm vào danh sách local
      const newScheduled = {
        id: Date.now(),
        ...payload,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      setScheduledNotifications(prev => [newScheduled, ...prev]);
      toast.success('Đã lập lịch thông báo thành công!');
      
      // Reset form và đóng modal
      setScheduleForm({
        title: '',
        message: '',
        type: 'system',
        targetType: 'all',
        userId: '',
        courseId: '',
        scheduledDate: '',
        scheduledTime: '',
        recurring: 'none',
      });
      handleScheduleClearUser(); // Reset user search
      handleScheduleClearCourse(); // Reset course search
      setShowScheduleModal(false);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể lập lịch');
    } finally {
      setScheduling(false);
    }
  };

  const sendNow = async (id: number) => {
    const notif = scheduledNotifications.find(n => n.id === id);
    if (!notif) return;
    
    try {
      const payload: any = {
        title: notif.title,
        message: notif.message,
        type: notif.type,
        userIds: notif.userIds,
      };
      if (notif.courseId) {
        payload.courseId = notif.courseId;
      }

      await adminService.sendNotification(payload);
      toast.success(`Đã gửi: ${notif.title}`);
      
      // Update status to sent
      setScheduledNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, status: 'sent', sentAt: new Date().toISOString() } : n)
      );
    } catch (err) {
      toast.error('Gửi thất bại');
      console.error(err);
    }
  };

  const cancelScheduled = (id: number) => {
    setScheduledNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('Đã hủy thông báo lập lịch');
  };

  const getTypeStyle = (type: string) => {
    return notificationTypes.find(t => t.value === type)?.color || 'bg-gray-100 text-gray-700';
  };

  const getTypeLabel = (type: string) => {
    return notificationTypes.find(t => t.value === type)?.label || type;
  };

  // ===== USER SEARCH =====
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  // ===== USER SEARCH FOR MAIN FORM =====
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const userSearchRef = React.useRef<HTMLDivElement>(null);

  // Load users when needed
  const loadUsers = async () => {
    if (allUsers.length > 0) return; // Already loaded
    setLoadingUsers(true);
    try {
      const users = await adminService.listUsers();
      console.log('[AdminNotifications] Loaded users:', users);
      console.log('[AdminNotifications] First user sample:', users[0]);
      setAllUsers(users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filter users based on search
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setFilteredUsers([]);
      return;
    }
    const query = userSearchQuery.toLowerCase();
    const filtered = allUsers.filter(u => {
      const displayName = u.fullName || u.name || u.username || u.displayName || '';
      const email = u.email || '';
      return displayName.toLowerCase().includes(query) || 
             email.toLowerCase().includes(query) ||
             String(u.id).includes(query);
    }).slice(0, 10); // Limit to 10 results
    setFilteredUsers(filtered);
  }, [userSearchQuery, allUsers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset user search when targetType changes to non-user
  useEffect(() => {
    if (formData.targetType !== 'user') {
      setSelectedUser(null);
      setUserSearchQuery('');
    }
  }, [formData.targetType]);

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setFormData({ ...formData, userId: String(user.id) });
    const displayName = user.fullName || user.name || user.username || user.displayName || 'Không tên';
    const email = user.email || '';
    setUserSearchQuery(displayName + (email ? ` (${email})` : ''));
    setShowUserDropdown(false);
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setFormData({ ...formData, userId: '' });
    setUserSearchQuery('');
  };

  // ===== USER SEARCH FOR MODAL =====
  const [scheduleUserSearchQuery, setScheduleUserSearchQuery] = useState('');
  const [scheduleFilteredUsers, setScheduleFilteredUsers] = useState<any[]>([]);
  const [showScheduleUserDropdown, setShowScheduleUserDropdown] = useState(false);
  const [scheduleSelectedUser, setScheduleSelectedUser] = useState<any>(null);
  const scheduleUserSearchRef = React.useRef<HTMLDivElement>(null);

  // Filter users for modal
  useEffect(() => {
    if (!scheduleUserSearchQuery.trim()) {
      setScheduleFilteredUsers([]);
      return;
    }
    const query = scheduleUserSearchQuery.toLowerCase();
    const filtered = allUsers.filter(u => {
      const displayName = u.fullName || u.name || u.username || u.displayName || '';
      const email = u.email || '';
      return displayName.toLowerCase().includes(query) || 
             email.toLowerCase().includes(query) ||
             String(u.id).includes(query);
    }).slice(0, 10);
    setScheduleFilteredUsers(filtered);
  }, [scheduleUserSearchQuery, allUsers]);

  // Close modal dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (scheduleUserSearchRef.current && !scheduleUserSearchRef.current.contains(event.target as Node)) {
        setShowScheduleUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset modal user search when targetType changes to non-user
  useEffect(() => {
    if (scheduleForm.targetType !== 'user') {
      setScheduleSelectedUser(null);
      setScheduleUserSearchQuery('');
    }
  }, [scheduleForm.targetType]);

  const handleScheduleSelectUser = (user: any) => {
    setScheduleSelectedUser(user);
    setScheduleForm({ ...scheduleForm, userId: String(user.id) });
    const displayName = user.fullName || user.name || user.username || user.displayName || 'Không tên';
    const email = user.email || '';
    setScheduleUserSearchQuery(displayName + (email ? ` (${email})` : ''));
    setShowScheduleUserDropdown(false);
  };

  const handleScheduleClearUser = () => {
    setScheduleSelectedUser(null);
    setScheduleForm({ ...scheduleForm, userId: '' });
    setScheduleUserSearchQuery('');
  };

  // ===== COURSE SEARCH STATES =====
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const courseSearchRef = React.useRef<HTMLDivElement>(null);

  // Load courses when needed
  const loadCourses = async () => {
    if (allCourses.length > 0) return;
    setLoadingCourses(true);
    try {
      const courses = await courseService.listCourses();
      console.log('[AdminNotifications] Loaded courses:', courses);
      setAllCourses(courses);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Filter courses based on search
  useEffect(() => {
    if (!courseSearchQuery.trim()) {
      setFilteredCourses([]);
      return;
    }
    const query = courseSearchQuery.toLowerCase();
    const filtered = allCourses.filter(c => {
      const title = c.title || c.name || '';
      const desc = c.description || '';
      return title.toLowerCase().includes(query) ||
             desc.toLowerCase().includes(query) ||
             String(c.id).includes(query);
    }).slice(0, 10);
    setFilteredCourses(filtered);
  }, [courseSearchQuery, allCourses]);

  // Close course dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courseSearchRef.current && !courseSearchRef.current.contains(event.target as Node)) {
        setShowCourseDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset course search when targetType changes to non-course
  useEffect(() => {
    if (formData.targetType !== 'course') {
      setSelectedCourse(null);
      setCourseSearchQuery('');
    }
  }, [formData.targetType]);

  const handleSelectCourse = (course: any) => {
    setSelectedCourse(course);
    setFormData({ ...formData, courseId: String(course.id) });
    const title = course.title || course.name || `Khóa học #${course.id}`;
    setCourseSearchQuery(title);
    setShowCourseDropdown(false);
  };

  const handleClearCourse = () => {
    setSelectedCourse(null);
    setFormData({ ...formData, courseId: '' });
    setCourseSearchQuery('');
  };

  // ===== COURSE SEARCH FOR MODAL =====
  const [scheduleCourseSearchQuery, setScheduleCourseSearchQuery] = useState('');
  const [scheduleFilteredCourses, setScheduleFilteredCourses] = useState<any[]>([]);
  const [showScheduleCourseDropdown, setShowScheduleCourseDropdown] = useState(false);
  const [scheduleSelectedCourse, setScheduleSelectedCourse] = useState<any>(null);
  const scheduleCourseSearchRef = React.useRef<HTMLDivElement>(null);

  // Filter courses for modal
  useEffect(() => {
    if (!scheduleCourseSearchQuery.trim()) {
      setScheduleFilteredCourses([]);
      return;
    }
    const query = scheduleCourseSearchQuery.toLowerCase();
    const filtered = allCourses.filter(c => {
      const title = c.title || c.name || '';
      const desc = c.description || '';
      return title.toLowerCase().includes(query) ||
             desc.toLowerCase().includes(query) ||
             String(c.id).includes(query);
    }).slice(0, 10);
    setScheduleFilteredCourses(filtered);
  }, [scheduleCourseSearchQuery, allCourses]);

  // Close modal course dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (scheduleCourseSearchRef.current && !scheduleCourseSearchRef.current.contains(event.target as Node)) {
        setShowScheduleCourseDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset modal course search when targetType changes to non-course
  useEffect(() => {
    if (scheduleForm.targetType !== 'course') {
      setScheduleSelectedCourse(null);
      setScheduleCourseSearchQuery('');
    }
  }, [scheduleForm.targetType]);

  const handleScheduleSelectCourse = (course: any) => {
    setScheduleSelectedCourse(course);
    setScheduleForm({ ...scheduleForm, courseId: String(course.id) });
    const title = course.title || course.name || `Khóa học #${course.id}`;
    setScheduleCourseSearchQuery(title);
    setShowScheduleCourseDropdown(false);
  };

  const handleScheduleClearCourse = () => {
    setScheduleSelectedCourse(null);
    setScheduleForm({ ...scheduleForm, courseId: '' });
    setScheduleCourseSearchQuery('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="w-7 h-7 text-amber-500" />
            Quản lý Thông báo
          </h1>
          <p className="text-gray-500 mt-1">Gửi và quản lý thông báo đến người dùng</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo lịch mới
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm">
            <CheckCircle className="w-4 h-4" />
            Scheduler tự động (mỗi phút)
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 items-center">
        <button
          onClick={() => setActiveTab('send')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'send'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Send className="w-4 h-4 inline mr-2" />
          Gửi ngay
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'scheduled'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Đã lập lịch
          {scheduledNotifications.filter(n => n.status === 'pending').length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {scheduledNotifications.filter(n => n.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          Lịch sử gửi
        </button>

        {/* Scheduler Toggle */}
        <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
          <RefreshCw className={`w-4 h-4 ${schedulerEnabled ? 'text-emerald-500' : 'text-gray-400'}`} />
          <span className="text-sm font-medium text-gray-600">Auto-send:</span>
          <button
            onClick={() => setSchedulerEnabled(!schedulerEnabled)}
            className={`w-12 h-6 rounded-full transition-colors ${schedulerEnabled ? 'bg-emerald-500' : 'bg-gray-300'} relative`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${schedulerEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'send' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Soạn thông báo mới</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Loại thông báo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại thông báo</label>
              <div className="flex flex-wrap gap-2">
                {notificationTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value as any })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.type === type.value
                        ? type.color + ' ring-2 ring-offset-1 ring-gray-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Đối tượng gửi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gửi đến</label>
              <div className="flex gap-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    value="all"
                    checked={formData.targetType === 'all'}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value as any })}
                    className="w-4 h-4 text-amber-500"
                  />
                  <span className="text-gray-700">Tất cả người dùng</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    value="user"
                    checked={formData.targetType === 'user'}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value as any })}
                    className="w-4 h-4 text-amber-500"
                  />
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">Người dùng cụ thể</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    value="course"
                    checked={formData.targetType === 'course'}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value as any })}
                    className="w-4 h-4 text-amber-500"
                  />
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">Học viên khóa học</span>
                </label>
              </div>
              {formData.targetType === 'all' && (
                <p className="text-xs text-blue-600 mt-2">ℹ️ Sẽ gửi đến tất cả người dùng trong hệ thống</p>
              )}
            </div>

            {/* User Search */}
            {formData.targetType === 'user' && (
              <div ref={userSearchRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn người dùng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      setShowUserDropdown(true);
                      loadUsers(); // Load users on first type
                    }}
                    onFocus={() => {
                      setShowUserDropdown(true);
                      loadUsers();
                    }}
                    placeholder="Nhập tên, email hoặc ID để tìm..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                  />
                  {selectedUser && (
                    <button
                      type="button"
                      onClick={handleClearUser}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {loadingUsers && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
                
                {/* Dropdown results */}
                {showUserDropdown && filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {filteredUsers.map((user) => {
                      // Hỗ trợ nhiều trường tên khác nhau từ API
                      const displayName = user.fullName || user.name || user.username || user.displayName || 'Không tên';
                      const email = user.email || 'Không có email';
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleSelectUser(user)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-medium text-sm">
                            {(displayName[0] || email[0] || '?').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{displayName}</p>
                            <p className="text-sm text-gray-500 truncate">{email} • ID: {user.id}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {showUserDropdown && userSearchQuery && filteredUsers.length === 0 && !loadingUsers && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
                    Không tìm thấy người dùng
                  </div>
                )}
                
                {/* Hidden input để giữ userId */}
                <input type="hidden" value={formData.userId} />
              </div>
            )}

            {/* Course Search */}
            {formData.targetType === 'course' && (
              <div ref={courseSearchRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn khóa học <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={courseSearchQuery}
                    onChange={(e) => {
                      setCourseSearchQuery(e.target.value);
                      setShowCourseDropdown(true);
                      loadCourses();
                    }}
                    onFocus={() => {
                      setShowCourseDropdown(true);
                      loadCourses();
                    }}
                    placeholder="Nhập tên khóa học hoặc ID để tìm..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                  />
                  {selectedCourse && (
                    <button
                      type="button"
                      onClick={handleClearCourse}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {loadingCourses && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
                
                {/* Dropdown results */}
                {showCourseDropdown && filteredCourses.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {filteredCourses.map((course) => {
                      const title = course.title || course.name || 'Không tên';
                      return (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => handleSelectCourse(course)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium text-sm">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{title}</p>
                            <p className="text-sm text-gray-500 truncate">ID: {course.id}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {showCourseDropdown && courseSearchQuery && filteredCourses.length === 0 && !loadingCourses && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
                    Không tìm thấy khóa học
                  </div>
                )}
                
                <input type="hidden" value={formData.courseId} />
              </div>
            )}

            {/* Tiêu đề */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nhập tiêu đề thông báo..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
              />
            </div>

            {/* Nội dung */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Nhập nội dung thông báo..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Gửi thông báo
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    title: '',
                    message: '',
                    type: 'system',
                    targetType: 'all',
                    userId: '',
                    courseId: '',
                  });
                  handleClearUser(); // Reset user search
                  handleClearCourse(); // Reset course search
                }}
                className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Xóa
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Scheduled */}
      {activeTab === 'scheduled' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Thông báo đã lập lịch</h2>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tạo lịch mới
            </button>
          </div>

          {scheduledNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">Chưa có thông báo nào được lập lịch</p>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                Tạo lịch mới →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {scheduledNotifications.map((notif) => (
                <div key={notif.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeStyle(notif.type)}`}>
                      {getTypeLabel(notif.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{notif.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{notif.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Gửi lúc: {new Date(notif.scheduledAt).toLocaleString('vi-VN')}
                        </span>
                        {notif.recurring && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Repeat className="w-3 h-3" />
                            Lặp lại: {recurringOptions.find(r => r.value === notif.recurring)?.label}
                          </span>
                        )}
                        <span>•</span>
                        <span>
                          Gửi đến: {' '}
                          {notif.userIds?.length === 1 ? `User #${notif.userIds[0]}` : 
                           notif.userIds?.length > 1 ? `${notif.userIds.length} người dùng` : 
                           notif.courseId ? `Khóa học #${notif.courseId}` : 'Tất cả'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {notif.status === 'pending' && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                          Chờ gửi
                        </span>
                      )}
                      {notif.status === 'sent' && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                          ✓ Đã gửi {notif.sentAt && new Date(notif.sentAt).toLocaleTimeString('vi-VN')}
                        </span>
                      )}
                      {notif.status === 'failed' && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          ✗ Thất bại
                        </span>
                      )}
                      {notif.status === 'pending' && (
                        <>
                          <button
                            onClick={() => sendNow(notif.id)}
                            className="p-2 text-emerald-500 hover:text-emerald-600 transition-colors"
                            title="Gửi ngay"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => cancelScheduled(notif.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Hủy lịch"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Lịch sử thông báo đã gửi</h2>
            <button
              onClick={() => fetchHistory(page)}
              disabled={historyLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-amber-600 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>

          {historyLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
              <p className="text-gray-500">Đang tải...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Chưa có thông báo nào</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {notifications.map((notif, index) => (
                  <div key={notif.id || index} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeStyle(notif.type)}`}>
                        {getTypeLabel(notif.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{notif.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{notif.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Gửi đến: {notif.userId ? `User #${notif.userId}` : notif.courseId ? `Khóa học #${notif.courseId}` : 'Tất cả'}</span>
                          <span>•</span>
                          <span>{new Date(notif.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-amber-600 disabled:opacity-50"
                  >
                    ← Trang trước
                  </button>
                  <span className="text-sm text-gray-500">
                    Trang {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-amber-600 disabled:opacity-50"
                  >
                    Trang sau →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                Lập lịch thông báo
              </h2>
              <button
                onClick={() => {
                  handleScheduleClearUser();
                  handleScheduleClearCourse();
                  setShowScheduleModal(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreateScheduled} className="p-6 space-y-6">
              {/* Loại thông báo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại thông báo</label>
                <div className="flex flex-wrap gap-2">
                  {notificationTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setScheduleForm({ ...scheduleForm, type: type.value as any })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        scheduleForm.type === type.value
                          ? type.color + ' ring-2 ring-offset-1 ring-gray-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Đối tượng gửi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gửi đến</label>
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleTargetType"
                      value="all"
                      checked={scheduleForm.targetType === 'all'}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, targetType: e.target.value as any })}
                      className="w-4 h-4 text-amber-500"
                    />
                    <span className="text-gray-700">Tất cả người dùng</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleTargetType"
                      value="user"
                      checked={scheduleForm.targetType === 'user'}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, targetType: e.target.value as any })}
                      className="w-4 h-4 text-amber-500"
                    />
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">Người dùng cụ thể</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleTargetType"
                      value="course"
                      checked={scheduleForm.targetType === 'course'}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, targetType: e.target.value as any })}
                      className="w-4 h-4 text-amber-500"
                    />
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">Học viên khóa học</span>
                  </label>
                </div>
                {scheduleForm.targetType === 'all' && (
                  <p className="text-xs text-blue-600 mt-2">ℹ️ Sẽ gửi đến tất cả người dùng trong hệ thống</p>
                )}
              </div>

              {/* User Search for Modal */}
              {scheduleForm.targetType === 'user' && (
                <div ref={scheduleUserSearchRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn người dùng <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={scheduleUserSearchQuery}
                      onChange={(e) => {
                        setScheduleUserSearchQuery(e.target.value);
                        setShowScheduleUserDropdown(true);
                        loadUsers();
                      }}
                      onFocus={() => {
                        setShowScheduleUserDropdown(true);
                        loadUsers();
                      }}
                      placeholder="Nhập tên, email hoặc ID để tìm..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                    />
                    {scheduleSelectedUser && (
                      <button
                        type="button"
                        onClick={handleScheduleClearUser}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {loadingUsers && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                    )}
                  </div>
                  
                  {/* Dropdown results */}
                  {showScheduleUserDropdown && scheduleFilteredUsers.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                      {scheduleFilteredUsers.map((user) => {
                        const displayName = user.fullName || user.name || user.username || user.displayName || 'Không tên';
                        const email = user.email || 'Không có email';
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleScheduleSelectUser(user)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-medium text-sm">
                              {(displayName[0] || email[0] || '?').toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{displayName}</p>
                              <p className="text-sm text-gray-500 truncate">{email} • ID: {user.id}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {showScheduleUserDropdown && scheduleUserSearchQuery && scheduleFilteredUsers.length === 0 && !loadingUsers && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
                      Không tìm thấy người dùng
                    </div>
                  )}
                  
                  <input type="hidden" value={scheduleForm.userId} />
                </div>
              )}
              {/* Course Search for Modal */}
              {scheduleForm.targetType === 'course' && (
                <div ref={scheduleCourseSearchRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn khóa học <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={scheduleCourseSearchQuery}
                      onChange={(e) => {
                        setScheduleCourseSearchQuery(e.target.value);
                        setShowScheduleCourseDropdown(true);
                        loadCourses();
                      }}
                      onFocus={() => {
                        setShowScheduleCourseDropdown(true);
                        loadCourses();
                      }}
                      placeholder="Nhập tên khóa học hoặc ID để tìm..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                    />
                    {scheduleSelectedCourse && (
                      <button
                        type="button"
                        onClick={handleScheduleClearCourse}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {loadingCourses && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                    )}
                  </div>
                  
                  {/* Dropdown results */}
                  {showScheduleCourseDropdown && scheduleFilteredCourses.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                      {scheduleFilteredCourses.map((course) => {
                        const title = course.title || course.name || 'Không tên';
                        return (
                          <button
                            key={course.id}
                            type="button"
                            onClick={() => handleScheduleSelectCourse(course)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium text-sm">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{title}</p>
                              <p className="text-sm text-gray-500 truncate">ID: {course.id}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {showScheduleCourseDropdown && scheduleCourseSearchQuery && scheduleFilteredCourses.length === 0 && !loadingCourses && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
                      Không tìm thấy khóa học
                    </div>
                  )}
                  
                  <input type="hidden" value={scheduleForm.courseId} />
                </div>
              )}

              {/* Tiêu đề */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                  placeholder="Nhập tiêu đề thông báo..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                />
              </div>

              {/* Nội dung */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={scheduleForm.message}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, message: e.target.value })}
                  placeholder="Nhập nội dung thông báo..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all resize-none"
                />
              </div>

              {/* Thời gian */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Ngày gửi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.scheduledDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Giờ gửi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.scheduledTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Lặp lại */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Repeat className="w-4 h-4 inline mr-1" />
                  Lặp lại
                </label>
                <select
                  value={scheduleForm.recurring}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, recurring: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all bg-white"
                >
                  {recurringOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                <button
                  type="submit"
                  disabled={scheduling}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {scheduling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
                  Lập lịch gửi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleScheduleClearUser();
                    handleScheduleClearCourse();
                    setShowScheduleModal(false);
                  }}
                  className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
