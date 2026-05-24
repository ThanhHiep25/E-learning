import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Download, Share2, X, CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CertificateCongratulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  certificateId: string;
  onViewOnline: () => void;
  onDownload: () => void;
}

const CertificateCongratulationModal: React.FC<CertificateCongratulationModalProps> = ({
  isOpen,
  onClose,
  courseTitle,
  certificateId,
  onViewOnline,
  onDownload
}) => {
  React.useEffect(() => {
    if (isOpen) {
      // Bắn pháo hoa khi mở modal
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            {/* Top Decoration */}
            <div className="h-32 bg-gradient-to-br from-emerald-500 to-teal-600 relative overflow-hidden">
               <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
               </div>
               <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                  <div className="w-24 h-24 bg-white rounded-3xl rotate-12 flex items-center justify-center shadow-xl">
                     <Award size={48} className="text-emerald-500 -rotate-12" />
                  </div>
               </div>
               <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all"
               >
                 <X size={20} />
               </button>
            </div>

            <div className="pt-16 pb-10 px-8 text-center">
              <h2 className="text-3xl font-black text-slate-900 mb-2">Chúc mừng bạn!</h2>
              <p className="text-slate-500 font-medium mb-8">
                Bạn đã hoàn thành xuất sắc khóa học <br/>
                <span className="text-emerald-600 font-bold">"{courseTitle}"</span>
              </p>

              <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100 relative group">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mã chứng chỉ</p>
                    <p className="text-xs font-mono font-bold text-slate-700">{certificateId.slice(0, 18)}...</p>
                  </div>
                  <CheckCircle2 size={24} className="text-emerald-500" />
                </div>
                <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-emerald-500"
                   />
                </div>
                <p className="text-[10px] text-emerald-600 font-bold mt-2 uppercase tracking-tighter">Tiến độ khóa học: 100% HOÀN THÀNH</p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={onViewOnline}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                >
                  XEM CHỨNG CHỈ ONLINE <ArrowRight size={18} />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={onDownload}
                    className="bg-emerald-50 text-emerald-700 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all"
                  >
                    <Download size={16} /> Tải xuống PDF
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/verify/${certificateId}`);
                      import('react-hot-toast').then(t => t.default.success('Đã sao chép link chia sẻ!'));
                    }}
                    className="bg-blue-50 text-blue-700 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-100 transition-all"
                  >
                    <Share2 size={16} /> Chia sẻ link
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-8 py-4 border-t border-slate-100">
               <p className="text-[10px] text-slate-400 font-medium italic">
                 Thành tích của bạn đã được lưu vào hồ sơ học tập cá nhân.
               </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CertificateCongratulationModal;
