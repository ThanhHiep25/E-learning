import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

const VirtualBot: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [showBubble, setShowBubble] = useState(false);
    const [isAutoShowDisabled, setIsAutoShowDisabled] = useState(false);
    const [messageIndex, setMessageIndex] = useState(0);

    const messages = [
        "Hi fen! Có khóa học gì mới chưa người đẹp",
        "Đừng bỏ lỡ bài kiếm tra chỉ còn trong hôm nay nhé!",
        "Check khóa học hiện tại xem nào",
        "Cần cố vấn gì về khóa học hiện tại không nào",
    ];

    useEffect(() => {
        // Mascot entry delay
        const entryTimer = setTimeout(() => {
            setIsVisible(true);

            // Initial bubble auto-show if not disabled
            if (!isAutoShowDisabled) {
                const bubbleTimer = setTimeout(() => setShowBubble(true), 1500);
                return () => clearTimeout(bubbleTimer);
            }
        }, 2000);

        // Rotate messages only if auto-show is NOT disabled
        const messageTimer = setInterval(() => {
            if (!isAutoShowDisabled) {
                setShowBubble(false);
                setTimeout(() => {
                    setMessageIndex((prev) => (prev + 1) % messages.length);
                    setShowBubble(true);
                }, 600);
            }
        }, 100000);

        return () => {
            clearTimeout(entryTimer);
            clearInterval(messageTimer);
        };
    }, [isAutoShowDisabled]);

    const handleHideBubble = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering mascot click
        setShowBubble(false);
        setIsAutoShowDisabled(true); // Stop auto-showing for this session
    };

    const toggleBubble = () => {
        setShowBubble(!showBubble);
        // If user manually interacts, we stop the auto-rotation/auto-show to respect their control
        setIsAutoShowDisabled(true);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-70 right-6 z-30 flex flex-col items-end gap-3 pointer-events-none">
            {/* Speech Bubble */}
            <div className={`transition-all duration-700 transform ${showBubble ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'} pointer-events-auto`}>
                <div className="bg-white/95 backdrop-blur-xl border border-amber-200 p-4 rounded-2xl shadow-2xl max-w-[260px] relative">
                    {/* Close button - only hides the bubble and stops auto-show */}
                    <button
                        onClick={handleHideBubble}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm cursor-pointer hover:scale-110 transition-all active:scale-90"
                        title="Tắt thông báo tự động"
                    >
                        <X size={12} />
                    </button>

                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                            <img src="/logoStill/language.png" alt="" className="object-cover animate-ring" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 leading-relaxed">
                            {messages[messageIndex]}
                        </p>
                    </div>

                    {/* Triangle pointer */}
                    <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white/95 border-r border-b border-amber-200 rotate-45 transform"></div>
                </div>
            </div>

            {/* Bot Mascot Avatar */}
            <div
                className="pointer-events-auto group cursor-pointer relative"
                onClick={toggleBubble}
            >
                {/* Pulse rings */}
                <div className="absolute inset-0 bg-orange-400/20 rounded-full animate-ping group-hover:animate-none scale-150 opacity-50"></div>
                <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-pulse group-hover:animate-none scale-125"></div>

                <div className={`relative w-16 h-16 bg-white rounded-full p-2 border-2 shadow-2xl overflow-hidden transition-all duration-300 group-hover:scale-110 border-b-4 ${showBubble ? 'border-amber-500' : 'border-amber-200'}`}>
                    <img
                        src="/idea-bulb.png"
                        alt="Virtual Bot"
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* Status Dot */}
                <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
            </div>
        </div>
    );
};

export default VirtualBot;
