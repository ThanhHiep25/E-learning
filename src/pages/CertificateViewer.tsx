import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Download, Share2, Calendar, User, BookOpen, CheckCircle, ShieldCheck, ExternalLink, Loader2, Home } from 'lucide-react';
import { progressService } from '../services/progress.service';
import toast from 'react-hot-toast';

export default function CertificateViewer() {
  const { certId } = useParams<{ certId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        setLoading(true);
        const certificates = await progressService.getMyCertificates();
        const found = certificates.find((c: any) => c.certificateId === certId);
        
        if (found) {
          setCertData(found);
        } else {
          toast.error('Không tìm thấy thông tin chứng chỉ');
        }
      } catch (error) {
        console.error('Error fetching certificate:', error);
        toast.error('Lỗi khi tải dữ liệu chứng chỉ');
      } finally {
        setLoading(false);
      }
    };

    if (certId) fetchCert();
  }, [certId]);

  const handleDownload = async () => {
    if (!certData) return;
    try {
      setDownloading(true);
      toast.loading('Đang khởi tạo PDF...', { id: 'download' });
      await progressService.downloadCertificate(certData.courseId);
      toast.success('Tải chứng chỉ thành công!', { id: 'download' });
    } catch (error) {
      toast.error('Lỗi khi tải chứng chỉ', { id: 'download' });
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Đã sao chép liên kết chứng chỉ!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto text-emerald-500 animate-spin" />
          <p className="text-slate-500 font-medium italic">Đang xác thực chứng chỉ...</p>
        </div>
      </div>
    );
  }

  if (!certData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-md bg-white p-8 rounded-[32px] shadow-xl border border-slate-100">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Chứng chỉ không tồn tại</h2>
          <p className="text-slate-500 mb-8">Liên kết này có thể đã hết hạn hoặc mã chứng chỉ không chính xác.</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
          >
            <Home size={18} /> Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Navigation / Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">Xác minh chứng chỉ</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">E-Learning Verified Achievement</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={handleShare}
              className="flex-1 sm:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Share2 size={16} /> Chia sẻ
            </button>
            <button 
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 sm:flex-none px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
            >
              {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
              Tải PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Certificate Main Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 bg-white p-4 sm:p-8 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden"
          >
             {/* Certificate Border Design (Simplified Web Version) */}
             <div className="border-4 border-slate-900 p-2 rounded-[28px]">
               <div className="border border-amber-400/50 p-6 sm:p-12 rounded-[22px] bg-white relative">
                  {/* Watermark Logo */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-[-25deg] pointer-events-none">
                    <Award size={400} />
                  </div>

                  <div className="relative z-10 text-center space-y-8">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-400">
                        <Award size={32} />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">CERTIFICATE</h2>
                      <p className="text-sm sm:text-lg font-bold text-amber-500 tracking-[0.3em] uppercase">Of Completion</p>
                    </div>

                    <div className="py-8">
                      <p className="text-slate-500 font-medium italic mb-4">This is to certify that</p>
                      <h3 className="text-3xl sm:text-4xl font-black text-slate-900 border-b-2 border-slate-100 pb-2 inline-block px-8 uppercase tracking-wide">
                        {certData.studentName || 'Học viên'}
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <p className="text-slate-500 font-medium">has successfully completed the online course</p>
                      <h4 className="text-xl sm:text-2xl font-black text-slate-900 max-w-lg mx-auto leading-tight italic">
                        "{certData.courseTitle}"
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 pt-12 gap-8">
                      <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Issued</p>
                        <p className="text-sm font-bold text-slate-900">
                          {new Date(certData.completedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Director</p>
                        <p className="text-sm font-bold text-slate-900 font-serif italic italic">E-Learning Platform</p>
                      </div>
                    </div>

                    <div className="pt-8 flex justify-center">
                       <div className="w-20 h-20 rounded-full border-4 border-amber-100 flex items-center justify-center relative">
                          <div className="w-16 h-16 rounded-full border border-amber-200 flex items-center justify-center text-[8px] font-black text-amber-400 text-center leading-tight">
                            OFFICIAL<br/>VERIFIED
                          </div>
                          <div className="absolute inset-0 border-2 border-amber-400/20 rounded-full animate-pulse" />
                       </div>
                    </div>
                  </div>
               </div>
             </div>
          </motion.div>

          {/* Details Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100"
            >
              <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-500" />
                Thông tin xác thực
              </h3>
              
              <div className="space-y-5">
                <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                    <Award size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã chứng chỉ</p>
                    <p className="text-xs font-mono font-bold text-slate-900 break-all">{certData.certificateId}</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Học viên</p>
                    <p className="text-sm font-bold text-slate-900">{certData.studentName || 'Đã xác thực'}</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày hoàn thành</p>
                    <p className="text-sm font-bold text-slate-900">{new Date(certData.completedAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-2">
                  <CheckCircle size={14} /> Trạng thái: Hợp lệ
                </div>
                <p className="text-[10px] text-emerald-600/80 leading-relaxed font-medium">
                  Chứng chỉ này được cấp bởi E-Learning Platform sau khi học viên hoàn thành đầy đủ các yêu cầu của khóa học.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900 p-6 rounded-[32px] text-white overflow-hidden relative"
            >
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl" />
              <div className="relative z-10">
                <h4 className="font-bold text-lg mb-2">Khóa học liên quan</h4>
                <div className="flex items-start gap-4 mb-6">
                   <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen size={20} className="text-emerald-400" />
                   </div>
                   <p className="text-sm font-medium text-slate-300 line-clamp-2">
                     {certData.courseTitle}
                   </p>
                </div>
                <button 
                  onClick={() => navigate(`/course/${certData.courseId}`)}
                  className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all"
                >
                  Xem chi tiết <ExternalLink size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
