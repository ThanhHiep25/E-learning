import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Download, Share2, Calendar, User, CheckCircle, ShieldCheck, Loader2, Home, ClipboardList } from 'lucide-react';
import { levelCertificateService } from '../services/levelCertificate.service';
import toast from 'react-hot-toast';

export default function LevelCertificateViewer() {
  const { certId } = useParams<{ certId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        setLoading(true);
        const cert = await levelCertificateService.verifyCertificate(certId!);
        setCertData(cert);
      } catch (error) {
        console.error('Error fetching level certificate:', error);
        toast.error('Không tìm thấy chứng chỉ');
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
      toast.loading('Đang tải chứng chỉ...', { id: 'cert-download' });
      await levelCertificateService.downloadCertificate(certData.level);
      toast.success('Tải chứng chỉ thành công!', { id: 'cert-download' });
    } catch (error: any) {
      toast.error(error.message || 'Lỗi tải chứng chỉ', { id: 'cert-download' });
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
          <Loader2 className="w-12 h-12 mx-auto text-violet-500 animate-spin" />
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
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">Xác minh chứng chỉ</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Course Path Completion Certificate</p>
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
              className="flex-1 sm:flex-none px-6 py-3 bg-violet-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-violet-600 transition-all shadow-lg shadow-violet-500/20"
            >
              {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
              Tải PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 bg-white p-4 sm:p-8 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden"
          >
             <div className="border-4 border-violet-600 p-2 rounded-[28px]">
               <div className="border border-amber-400/50 p-6 sm:p-12 rounded-[22px] bg-white relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-[-25deg] pointer-events-none">
                    <Award size={400} />
                  </div>

                  <div className="relative z-10 text-center space-y-8">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center text-amber-400">
                        <Award size={32} />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">CERTIFICATE</h2>
                      <p className="text-sm sm:text-lg font-bold text-violet-600 tracking-[0.3em] uppercase">Of Course Path Completion</p>
                    </div>

                    <div className="py-8">
                      <p className="text-slate-500 font-medium italic mb-4">This is to certify that</p>
                      <h3 className="text-3xl sm:text-4xl font-black text-slate-900 border-b-2 border-slate-100 pb-2 inline-block px-8 uppercase tracking-wide">
                        {certData.studentName || 'Học viên'}
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <p className="text-slate-500 font-medium">has successfully completed the course path level</p>
                      <h4 className="text-5xl sm:text-6xl font-black text-violet-600">
                        {certData.level}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-400 font-medium">(Internal platform curriculum - not an official language proficiency certificate)</p>
                    </div>

                    <div className="grid grid-cols-2 pt-12 gap-8">
                      <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Issued</p>
                        <p className="text-sm font-bold text-slate-900">
                          {new Date(certData.issuedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Director</p>
                        <p className="text-sm font-bold text-slate-900 font-serif italic">E-Learning Platform</p>
                      </div>
                    </div>

                    <div className="pt-8 flex justify-center">
                       <div className="w-20 h-20 rounded-full border-4 border-violet-100 flex items-center justify-center relative">
                          <div className="w-16 h-16 rounded-full border border-violet-200 flex items-center justify-center text-[8px] font-black text-violet-600 text-center leading-tight">
                            OFFICIAL<br/>VERIFIED
                          </div>
                          <div className="absolute inset-0 border-2 border-violet-400/20 rounded-full animate-pulse" />
                       </div>
                    </div>
                  </div>
               </div>
             </div>
          </motion.div>

          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100"
            >
              <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2">
                <ShieldCheck size={20} className="text-violet-500" />
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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày cấp</p>
                    <p className="text-sm font-bold text-slate-900">{new Date(certData.issuedAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-violet-50 rounded-2xl border border-violet-100">
                <div className="flex items-center gap-2 text-violet-700 font-bold text-xs mb-2">
                  <CheckCircle size={14} /> Trạng thái: Hợp lệ
                </div>
                <p className="text-[10px] text-violet-600/80 leading-relaxed font-medium">
                  Chứng chỉ này được cấp bởi E-Learning Platform sau khi học viên hoàn thành đầy đủ các khóa học của trình độ {certData.level}.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900 p-6 rounded-[32px] text-white overflow-hidden relative"
            >
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-violet-500/20 rounded-full blur-2xl" />
              <div className="relative z-10 space-y-3">
                <h4 className="font-bold text-lg mb-2">Trình độ {certData.level}</h4>
                <p className="text-sm text-slate-300 mb-4">
                  Theo khung tham chiếu trình độ ngôn ngữ chung châu Âu (CEFR)
                </p>
                <button 
                  onClick={() => {
                    if (certData.attemptId && certData.quizId) {
                      navigate(`/take-quiz/${certData.quizId}?attemptId=${certData.attemptId}`);
                    } else {
                      navigate('/my-tests');
                    }
                  }}
                  className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-400 transition-all"
                >
                  <ClipboardList size={16} /> Xem kết quả bài kiểm tra
                </button>
                <button 
                  onClick={() => navigate('/my-path')}
                  className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-violet-50 transition-all"
                >
                  Xem lộ trình học tập
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
