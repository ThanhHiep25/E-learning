import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, FileText, Layout, CheckCircle2, Loader2, X, FileQuestion, ArrowLeft, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    teacherService,
    type BackendTeacherQuestion,
    type BackendTeacherQuizDetail,
} from '../../services/teacher.service';

const QuizQuestionEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [quizDetail, setQuizDetail] = useState<BackendTeacherQuizDetail | null>(null);
    const [questionLoading, setQuestionLoading] = useState(false);

    // Delete Modal State
    const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Quiz Edit States
    const [isEditQuizModalOpen, setIsEditQuizModalOpen] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editTimeLimit, setEditTimeLimit] = useState(30);
    const [editMaxScore, setEditMaxScore] = useState(100);
    const [editPassingScore, setEditPassingScore] = useState(60);
    const [editStartTime, setEditStartTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');
    const [editShowResults, setEditShowResults] = useState(true);
    const [isUpdatingQuiz, setIsUpdatingQuiz] = useState(false);

    const [qType, setQType] = useState<BackendTeacherQuestion['type']>('multiple_choice');
    const [qText, setQText] = useState('');
    const [qImageUrl, setQImageUrl] = useState('');
    const [qAudioUrl, setQAudioUrl] = useState('');
    const [qVideoUrl, setQVideoUrl] = useState('');
    const [qPoints, setQPoints] = useState<number>(1);
    const [qExplanation, setQExplanation] = useState('');
    const [qCreating, setQCreating] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

    const [mediaUploading, setMediaUploading] = useState<'image' | 'audio' | 'video' | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewAudio, setPreviewAudio] = useState<string | null>(null);
    const [previewVideo, setPreviewVideo] = useState<string | null>(null);

    const [mcOptions, setMcOptions] = useState<string[]>(['', '', '', '']);
    const [mcCorrectIndex, setMcCorrectIndex] = useState<number>(0);
    const [tfCorrect, setTfCorrect] = useState<boolean>(true);
    const [shortCorrect, setShortCorrect] = useState<string>('');

    const buildContentWithMedia = (text: string, imageUrl?: string, audioUrl?: string, videoUrl?: string) => {
        const parts: string[] = [text.trim()];
        if (imageUrl?.trim()) parts.push(`[image]${imageUrl.trim()}[/image]`);
        if (audioUrl?.trim()) parts.push(`[audio]${audioUrl.trim()}[/audio]`);
        if (videoUrl?.trim()) parts.push(`[video]${videoUrl.trim()}[/video]`);
        return parts.filter(Boolean).join('\n\n');
    };

    const extractMedia = (content: string) => {
        const image = content.match(/\[image\](.*?)\[\/image\]/)?.[1]?.trim();
        const audio = content.match(/\[audio\](.*?)\[\/audio\]/)?.[1]?.trim();
        const video = content.match(/\[video\](.*?)\[\/video\]/)?.[1]?.trim();
        const cleaned = content
            .replace(/\n?\n?\[image\].*?\[\/image\]/g, '')
            .replace(/\n?\n?\[audio\].*?\[\/audio\]/g, '')
            .replace(/\n?\n?\[video\].*?\[\/video\]/g, '')
            .trim();
        return { cleaned, image, audio, video };
    };

    const reloadQuizDetail = useCallback(async () => {
        if (!id) return;
        try {
            setQuestionLoading(true);
            const detail = await teacherService.getQuiz(String(id));
            setQuizDetail(detail);
        } catch (err: any) {
            toast.error(err?.message || 'Không thể tải chi tiết quiz');
        } finally {
            setTimeout(() => {
                setQuestionLoading(false);
            }, 1000);
        }
    }, [id]);

    useEffect(() => {
        reloadQuizDetail();
    }, [reloadQuizDetail]);

    useEffect(() => {
        return () => {
            if (previewImage) URL.revokeObjectURL(previewImage);
            if (previewAudio) URL.revokeObjectURL(previewAudio);
            if (previewVideo) URL.revokeObjectURL(previewVideo);
        };
    }, [previewImage, previewAudio, previewVideo]);

    // Auto-suggest end time based on start time and duration
    useEffect(() => {
        if (editStartTime && editTimeLimit) {
            try {
                const startDate = new Date(editStartTime);
                if (!isNaN(startDate.getTime())) {
                    const endDate = new Date(startDate.getTime() + editTimeLimit * 60000);
                    const year = endDate.getFullYear();
                    const month = String(endDate.getMonth() + 1).padStart(2, '0');
                    const day = String(endDate.getDate()).padStart(2, '0');
                    const hours = String(endDate.getHours()).padStart(2, '0');
                    const mins = String(endDate.getMinutes()).padStart(2, '0');
                    setEditEndTime(`${year}-${month}-${day}T${hours}:${mins}`);
                }
            } catch (err) {
                console.error('Error calculating end time', err);
            }
        }
    }, [editStartTime, editTimeLimit]);

    const openEditQuiz = () => {
        if (!quizDetail) return;
        setEditTitle(quizDetail.title || '');
        setEditDescription(quizDetail.description || '');
        setEditTimeLimit(quizDetail.timeLimit || 30);
        setEditMaxScore(quizDetail.maxScore || 100);
        setEditPassingScore(quizDetail.passingScore || 60);
        setEditStartTime(quizDetail.startTime ? new Date(quizDetail.startTime).toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16) : '');
        setEditEndTime(quizDetail.endTime ? new Date(quizDetail.endTime).toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16) : '');
        setEditShowResults(quizDetail.showResults ?? true);
        setIsEditQuizModalOpen(true);
    };

    const submitUpdateQuiz = async () => {
        if (!id) return;
        try {
            setIsUpdatingQuiz(true);
            await teacherService.updateQuiz(String(id), {
                title: editTitle,
                description: editDescription,
                timeLimit: editTimeLimit,
                maxScore: editMaxScore,
                passingScore: editPassingScore,
                startTime: editStartTime || null,
                endTime: editEndTime || null,
                showResults: editShowResults,
            });
            toast.success('Cập nhật thông tin bài thi thành công');
            setIsEditQuizModalOpen(false);
            await reloadQuizDetail();
        } catch (err: any) {
            toast.error(err?.message || 'Không thể cập nhật thông tin');
        } finally {
            setIsUpdatingQuiz(false);
        }
    };

    const uploadQuestionMedia = async (kind: 'image' | 'audio' | 'video', file: File) => {
        try {
            setMediaUploading(kind);
            const url = URL.createObjectURL(file);
            if (kind === 'image') {
                if (previewImage) URL.revokeObjectURL(previewImage);
                setPreviewImage(url);
            }
            if (kind === 'audio') {
                if (previewAudio) URL.revokeObjectURL(previewAudio);
                setPreviewAudio(url);
            }
            if (kind === 'video') {
                if (previewVideo) URL.revokeObjectURL(previewVideo);
                setPreviewVideo(url);
            }

            const res = await teacherService.uploadQuizMedia(file);
            if (kind === 'image') setQImageUrl(res.url);
            if (kind === 'audio') setQAudioUrl(res.url);
            if (kind === 'video') setQVideoUrl(res.url);
            toast.success('Đã upload file');
        } catch (err: any) {
            toast.error(err?.message || 'Upload file thất bại');
        } finally {
            setMediaUploading(null);
        }
    };

    const handleEditClick = (q: BackendTeacherQuestion) => {
        const { cleaned, image, audio, video } = extractMedia(String(q.content || ''));
        setEditingQuestionId(String(q.id));
        setQType(q.type as any);
        setQText(cleaned);
        setQImageUrl(image || '');
        setQAudioUrl(audio || '');
        setQVideoUrl(video || '');
        setQPoints(Number(q.points ?? 1));
        setQExplanation(q.explanation || '');

        if (q.type === 'multiple_choice' && Array.isArray(q.options)) {
            const opts = [...q.options];
            while (opts.length < 4) opts.push('');
            setMcOptions(opts);
            const correctIdx = opts.indexOf(String(q.correctAnswer));
            setMcCorrectIndex(correctIdx !== -1 ? correctIdx : 0);
        }

        if (q.type === 'true_false') {
            setTfCorrect(String(q.correctAnswer) === 'true');
        }

        if (q.type === 'short_answer') {
            setShortCorrect(String(q.correctAnswer));
        }

        // Scroll to form
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingQuestionId(null);
        setQText('');
        setQImageUrl('');
        setQAudioUrl('');
        setQVideoUrl('');
        setQPoints(1);
        setQExplanation('');
        setMcOptions(['', '', '', '']);
        setMcCorrectIndex(0);
        setTfCorrect(true);
        setShortCorrect('');
        if (previewImage) URL.revokeObjectURL(previewImage);
        if (previewAudio) URL.revokeObjectURL(previewAudio);
        if (previewVideo) URL.revokeObjectURL(previewVideo);
        setPreviewImage(null);
        setPreviewAudio(null);
        setPreviewVideo(null);
    };

    const submitAddQuestion = async () => {
        const content = buildContentWithMedia(qText, qImageUrl, qAudioUrl, qVideoUrl);
        if (!id) {
            toast.error('Quiz không hợp lệ');
            return;
        }
        if (!content.trim()) {
            toast.error('Vui lòng nhập nội dung câu hỏi');
            return;
        }

        let options: any = undefined;
        let correctAnswer: any = undefined;

        if (qType === 'multiple_choice') {
            const cleanedOptions = mcOptions.map((s) => s.trim()).filter(Boolean);
            if (cleanedOptions.length < 2) {
                toast.error('Trắc nghiệm cần ít nhất 2 lựa chọn');
                return;
            }
            if (mcCorrectIndex < 0 || mcCorrectIndex >= cleanedOptions.length) {
                toast.error('Đáp án đúng không hợp lệ');
                return;
            }
            options = cleanedOptions;
            correctAnswer = cleanedOptions[mcCorrectIndex];
        }

        if (qType === 'true_false') {
            options = ['true', 'false'];
            correctAnswer = tfCorrect ? 'true' : 'false';
        }

        if (qType === 'short_answer') {
            if (!shortCorrect.trim()) {
                toast.error('Vui lòng nhập đáp án đúng');
                return;
            }
            correctAnswer = shortCorrect.trim();
        }

        try {
            setQCreating(true);
            if (editingQuestionId) {
                await teacherService.updateQuestion(editingQuestionId, {
                    type: qType,
                    content,
                    options,
                    correctAnswer,
                    points: qPoints,
                    explanation: qExplanation || undefined,
                });
                toast.success('Đã cập nhật câu hỏi');
            } else {
                await teacherService.addQuestion(String(id), {
                    type: qType,
                    content,
                    options,
                    correctAnswer,
                    points: qPoints,
                    explanation: qExplanation || undefined,
                });
                toast.success('Đã thêm câu hỏi');
            }
            cancelEdit();
            await reloadQuizDetail();
        } catch (err: any) {
            toast.error(err?.message || 'Thao tác thất bại');
        } finally {
            setQCreating(false);
        }
    };

    const deleteQuestion = (questionId: string) => {
        setQuestionToDelete(questionId);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!questionToDelete) return;
        try {
            setIsDeleting(true);
            await teacherService.deleteQuestion(String(questionToDelete));
            toast.success('Đã xóa câu hỏi');
            setIsDeleteModalOpen(false);
            setQuestionToDelete(null);
            await reloadQuizDetail();
        } catch (err: any) {
            toast.error(err?.message || 'Không thể xóa câu hỏi');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <div className=" mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <button
                            onClick={() => navigate('/teacher/quizzes')}
                            className="group flex items-center gap-3 text-gray-400 hover:text-amber-600 font-black uppercase tracking-widest text-[10px] transition-all cursor-pointer mb-4"
                        >
                            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-amber-50 transition-all">
                                <ArrowLeft size={14} />
                            </div>
                            Quay lại danh sách
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Soạn thảo bộ câu hỏi</h1>
                        <div className="flex items-center gap-4 mt-1">
                            <div className="text-sm font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                {quizDetail?.title || 'Đang tải...'}
                            </div>
                            {quizDetail && (
                                <button
                                    onClick={openEditQuiz}
                                    className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-sm font-bold border border-amber-100 hover:bg-amber-100 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    <Edit3 size={10} /> Sửa thông tin
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    {/* Left Side: Question List */}
                    <div className="xl:col-span-4 flex flex-col">
                        <div className="bg-white rounded-[40px] border border-gray-100 p-8 flex flex-col min-h-[500px] shadow-sm sticky top-28">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <div className="text-xl font-bold text-gray-900">Danh sách câu hỏi</div>
                                    <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                                        {questionLoading ? 'Đang tải...' : `${(quizDetail?.questions || []).length} câu hỏi`}
                                    </div>
                                </div>
                                <div className="px-4 py-2 text-xs font-bold text-amber-600 ">
                                    {quizDetail?.questions?.reduce((sum, q) => sum + Number(q.points || 0), 0) || 0}đ
                                </div>
                            </div>

                            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[600px]">
                                {(quizDetail?.questions || []).map((q, idx) => {
                                    const m = extractMedia(String(q.content || ''));
                                    return (
                                        <div key={String(q.id)} className="group bg-gray-50/50 rounded-3xl border border-gray-100 p-5 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 relative overflow-hidden">
                                            <div className="flex items-start justify-between gap-4 relative z-10">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="w-6 h-6 rounded-lg bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{q.type} · {Number(q.points ?? 1)}đ</span>
                                                    </div>
                                                    <div className="text-sm font-bold text-gray-900 leading-relaxed line-clamp-2">{m.cleaned || '(không có nội dung)'}</div>
                                                </div>
                                                <div className="flex flex-col gap-2 shrink-0">
                                                    <button
                                                        onClick={() => handleEditClick(q)}
                                                        className="w-10 h-10 rounded-xl font-bold text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm shadow-amber-100"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteQuestion(String(q.id))}
                                                        className="w-10 h-10 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm shadow-red-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(quizDetail?.questions || []).length === 0 && !questionLoading && (
                                    <div className="flex-1 flex flex-col items-center justify-center py-24 opacity-30">
                                        <FileQuestion size={64} className="mb-4 text-gray-400" />
                                        <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Chưa có câu hỏi nào</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Add Question Form */}
                    <div className="xl:col-span-8 space-y-8 pb-20">
                        <div className="bg-white rounded-[48px] border border-gray-100 p-10 shadow-xl shadow-gray-200/50">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                                <div>
                                    <div className="text-2xl font-bold text-gray-900 tracking-tight">
                                        {editingQuestionId ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi mới'}
                                    </div>
                                    <div className="text-sm text-gray-400 mt-1">
                                        {editingQuestionId ? 'Bạn đang ở chế độ chỉnh sửa câu hỏi hiện có' : 'Thiết lập chi tiết nội dung, tài nguyên và đáp án'}
                                    </div>
                                </div>

                                <div className=" p-5 rounded-[28px] flex items-center gap-6">
                                    <div className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap">Số điểm</div>
                                    <select
                                        value={qPoints}
                                        onChange={(e) => setQPoints(Number(e.target.value))}
                                        className="w-24 bg-white rounded-2xl px-5 py-3 border border-gray-200 font-bold text-gray-900 outline-none focus:ring-8 focus:ring-amber-500/5 focus:border-amber-500 transition-all text-center text-lg cursor-pointer appearance-none"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-10">
                                {/* Question Type Selection */}
                                <div className="space-y-4">
                                    <div className="text-xs font-bold text-gray-400 uppercase flex items-center gap-3 ml-2">
                                        <Layout size={16} className="text-amber-500" />
                                        Loại câu hỏi
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/50 p-3 rounded-[32px] border border-gray-100">
                                        {[
                                            { id: 'multiple_choice', label: 'Trắc nghiệm' },
                                            { id: 'true_false', label: 'Đúng / Sai' },
                                            { id: 'short_answer', label: 'Trả lời ngắn' },
                                            { id: 'essay', label: 'Tự luận' }
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setQType(t.id as any)}
                                                className={`px-6 cursor-pointer py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all duration-500 ${qType === t.id ? 'bg-gray-900 text-white shadow-2xl shadow-gray-400 scale-105' : 'bg-white text-gray-500 border border-gray-100 hover:border-amber-300 hover:text-amber-600'}`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Question Content Input */}
                                <div className="space-y-4">
                                    <div className="text-xs font-bold text-gray-400 uppercase flex items-center gap-3 ml-2">
                                        <Edit3 size={16} className="text-amber-500" />
                                        Nội dung câu hỏi
                                    </div>
                                    <textarea
                                        value={qText}
                                        onChange={(e) => setQText(e.target.value)}
                                        className="w-full cursor-text bg-gray-50/50 rounded-xl px-8 py-8 border border-gray-100 text-gray-900 outline-none min-h-[180px] focus:bg-white focus:ring-12 focus:ring-amber-500/5 focus:border-amber-500 transition-all text-lg placeholder:text-gray-300 leading-relaxed"
                                        placeholder=""
                                    />
                                </div>

                                {/* Multimedia Section */}
                                <div className="space-y-4">
                                    <div className="text-xs font-bold text-gray-400 uppercase flex items-center gap-3 ml-2">

                                        Đính kèm đa phương tiện
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Image */}
                                        <div className="bg-gray-50/50 p-6 rounded-[36px] border border-gray-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">Hình ảnh</div>
                                                {(previewImage || qImageUrl) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setQImageUrl('');
                                                            if (previewImage) URL.revokeObjectURL(previewImage);
                                                            setPreviewImage(null);
                                                        }}
                                                        className="cursor-pointer w-6 h-6 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            <label className="block w-full text-center py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:border-amber-500 hover:text-amber-600 transition-all cursor-pointer shadow-sm">
                                                {mediaUploading === 'image' ? (
                                                    <Loader2 size={16} className="animate-spin mx-auto" />
                                                ) : 'Tải lên từ máy'}
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) uploadQuestionMedia('image', f);
                                                }} />
                                            </label>
                                            <input value={qImageUrl} onChange={(e) => setQImageUrl(e.target.value)} className="mt-3 w-full bg-transparent border-b border-gray-200 outline-none py-2 text-[11px] font-bold text-gray-500 focus:border-amber-500 transition-colors" placeholder="Hoặc dán link public..." />
                                            {(previewImage || qImageUrl) && (
                                                <div className="mt-4 relative group">
                                                    <img src={previewImage || qImageUrl} alt="Preview" className="w-full h-32 object-contain rounded-2xl bg-white border border-gray-100 p-2 shadow-sm" />
                                                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Xem trước</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Audio */}
                                        <div className="bg-gray-50/50 p-6 rounded-[36px] border border-gray-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">Âm thanh</div>
                                                {(previewAudio || qAudioUrl) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setQAudioUrl('');
                                                            if (previewAudio) URL.revokeObjectURL(previewAudio);
                                                            setPreviewAudio(null);
                                                        }}
                                                        className="w-6 h-6 cursor-pointer rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            <label className="block w-full text-center py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:border-amber-500 hover:text-amber-600 transition-all cursor-pointer shadow-sm">
                                                {mediaUploading === 'audio' ? (
                                                    <Loader2 size={16} className="animate-spin mx-auto" />
                                                ) : 'Tải tệp âm thanh'}
                                                <input type="file" accept="audio/*" className="hidden" onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) uploadQuestionMedia('audio', f);
                                                }} />
                                            </label>
                                            <input value={qAudioUrl} onChange={(e) => setQAudioUrl(e.target.value)} className="mt-3 w-full bg-transparent border-b border-gray-200 outline-none py-2 text-[11px] font-bold text-gray-500 focus:border-amber-500 transition-colors" placeholder="Dán link audio..." />
                                            {(previewAudio || qAudioUrl) && <audio className="mt-4 w-full h-10" controls src={previewAudio || qAudioUrl} />}
                                        </div>

                                        {/* Video */}
                                        <div className="bg-gray-50/50 p-6 rounded-[36px] border border-gray-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">Video</div>
                                                {(previewVideo || qVideoUrl) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setQVideoUrl('');
                                                            if (previewVideo) URL.revokeObjectURL(previewVideo);
                                                            setPreviewVideo(null);
                                                        }}
                                                        className="w-6 h-6 cursor-pointer rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            <label className="block w-full text-center py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:border-amber-500 hover:text-amber-600 transition-all cursor-pointer shadow-sm">
                                                {mediaUploading === 'video' ? (
                                                    <Loader2 size={16} className="animate-spin mx-auto" />
                                                ) : 'Tải tệp video'}
                                                <input type="file" accept="video/*" className="hidden" onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) uploadQuestionMedia('video', f);
                                                }} />
                                            </label>
                                            <input value={qVideoUrl} onChange={(e) => setQVideoUrl(e.target.value)} className="mt-3 w-full bg-transparent border-b border-gray-200 outline-none py-2 text-[11px] font-bold text-gray-500 focus:border-amber-500 transition-colors" placeholder="Dán link video..." />
                                            {(previewVideo || qVideoUrl) && <video className="mt-4 w-full h-32 object-contain rounded-2xl bg-black shadow-xl" controls src={previewVideo || qVideoUrl} />}
                                        </div>
                                    </div>
                                </div>

                                {/* Answers */}
                                <div className="space-y-4">
                                    <div className="text-xs font-bold text-gray-400 uppercase flex items-center gap-3 ml-2">
                                        <CheckCircle2 size={16} className="text-amber-500" />
                                        Thiết lập đáp án chính xác
                                    </div>

                                    <div className="bg-gray-50/50 rounded-[40px] border border-gray-100">
                                        {qType === 'multiple_choice' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {mcOptions.map((opt, idx) => (
                                                    <div key={idx} className={`flex items-center gap-4 p-3 rounded-[24px] transition-all duration-300 ${mcCorrectIndex === idx ? 'bg-emerald-50 border-2 border-emerald-500 shadow-lg shadow-emerald-100' : 'bg-white border-2 border-transparent shadow-sm hover:border-gray-200'}`}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setMcCorrectIndex(idx)}
                                                            className={`w-12 h-12 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 cursor-pointer transition-all ${mcCorrectIndex === idx ? 'bg-emerald-500 text-white scale-110' : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-600'}`}
                                                        >
                                                            {String.fromCharCode(65 + idx)}
                                                        </button>
                                                        <input
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const next = mcOptions.slice();
                                                                next[idx] = e.target.value;
                                                                setMcOptions(next);
                                                            }}
                                                            className="flex-1 bg-transparent py-2 text-md font-medium outline-none placeholder:text-gray-300"
                                                            placeholder={`Nhập phương án ${String.fromCharCode(65 + idx)}...`}
                                                        />
                                                        {mcCorrectIndex === idx && <CheckCircle2 size={24} className="text-emerald-500 mr-2" />}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {qType === 'true_false' && (
                                            <div className="grid grid-cols-2 gap-6">
                                                <button type="button" onClick={() => setTfCorrect(true)} className={`py-3 rounded-[32px] font-black text-md border-2 transition-all duration-500 cursor-pointer ${tfCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-2xl shadow-emerald-200 scale-105' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}>ĐÚNG (TRUE)</button>
                                                <button type="button" onClick={() => setTfCorrect(false)} className={`py-3 rounded-[32px] font-black text-md border-2 transition-all duration-500 cursor-pointer ${!tfCorrect ? 'bg-red-50 text-red-700 border-red-500 shadow-2xl shadow-red-200 scale-105' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}>SAI (FALSE)</button>
                                            </div>
                                        )}

                                        {qType === 'short_answer' && (
                                            <input value={shortCorrect} onChange={(e) => setShortCorrect(e.target.value)} className="w-full bg-white rounded-3xl px-8 py-6 border-2 border-transparent shadow-sm focus:border-amber-500 outline-none font-medium text-md text-gray-900 transition-all placeholder:text-gray-300" placeholder="Nhập từ hoặc cụm từ đáp án chính xác..." />
                                        )}

                                        {qType === 'essay' && (
                                            <div className="text-center py-6 flex flex-col items-center justify-center gap-3">
                                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                                                    <FileText size={32} />
                                                </div>
                                                <p className="font-medium text-gray-400 text-md">Phần tự luận sẽ được Giảng viên chấm điểm sau khi nộp</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Submit Section */}
                                <div className="pt-6 flex justify-end gap-4 border-t border-gray-50">
                                    {editingQuestionId && (
                                        <button
                                            onClick={cancelEdit}
                                            className="px-8 py-5 bg-gray-50 text-gray-500 rounded-[24px] font-bold text-[12px] uppercase tracking-widest hover:bg-gray-100 transition-all duration-500"
                                        >
                                            HỦY CHỈNH SỬA
                                        </button>
                                    )}
                                    <button
                                        disabled={qCreating}
                                        onClick={submitAddQuestion}
                                        className={`px-12 py-5 rounded-[24px] cursor-pointer font-bold text-[12px] transition-all duration-500 shadow-2xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 ${editingQuestionId ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700' : 'bg-gray-900 text-white shadow-gray-400 hover:bg-amber-600'}`}
                                    >
                                        {qCreating ? (
                                            <>
                                                <Loader2 size={24} className="animate-spin" />
                                                ĐANG LƯU...
                                            </>
                                        ) : (
                                            <>
                                                {editingQuestionId ? 'CẬP NHẬT CÂU HỎI' : 'LƯU CÂU HỎI'}
                                                {editingQuestionId ? <CheckCircle2 size={24} /> : <Plus size={24} />}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden scale-in-center transition-all duration-300 relative">
                        <div className="p-10 pt-16 text-center">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 leading-tight mb-4 uppercase tracking-tight">
                                Xác nhận xóa
                            </h3>
                            <p className="text-gray-500 font-bold text-sm px-4 leading-relaxed">
                                Bạn có chắc chắn muốn xóa vĩnh viễn câu hỏi này? <br />
                                <span className="text-red-600">Thao tác này không thể hoàn tác.</span>
                            </p>
                        </div>

                        <div className="p-10 pt-0 grid grid-cols-2 gap-4">
                            <button
                                disabled={isDeleting}
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setQuestionToDelete(null);
                                }}
                                className="cursor-pointer w-full bg-gray-50 text-gray-400 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                disabled={isDeleting}
                                onClick={handleConfirmDelete}
                                className="cursor-pointer w-full bg-red-500 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        ĐANG XÓA...
                                    </>
                                ) : (
                                    <>
                                        XÁC NHẬN XÓA
                                    </>
                                )}
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                if (!isDeleting) {
                                    setIsDeleteModalOpen(false);
                                    setQuestionToDelete(null);
                                }
                            }}
                            className="absolute cursor-pointer top-8 right-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
            )}
            {/* Edit Quiz Detail Modal */}
            {isEditQuizModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-xl bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <div>
                                <div className="text-lg font-black text-gray-900">Sửa thông tin đề thi</div>
                                <div className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-tight line-clamp-1">{quizDetail?.title}</div>
                            </div>
                            <button onClick={() => setIsEditQuizModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all font-bold cursor-pointer"><X size={20} className="text-gray-400" /></button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tiêu đề</div>
                                <input
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none focus:bg-white focus:border-amber-300 transition-all"
                                />
                            </div>

                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mô tả</div>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none min-h-[100px] focus:bg-white focus:border-amber-300 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Thời gian làm bài</div>
                                    <select
                                        value={editTimeLimit}
                                        onChange={(e) => setEditTimeLimit(Number(e.target.value))}
                                        className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none cursor-pointer focus:bg-white focus:border-amber-300 transition-all"
                                    >
                                        {[10, 15, 20, 30, 45, 60, 90, 120, 180].map(m => (
                                            <option key={m} value={m}>{m} phút</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Điểm tối đa</div>
                                    <select
                                        value={editMaxScore}
                                        onChange={(e) => setEditMaxScore(Number(e.target.value))}
                                        className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none cursor-pointer focus:bg-white focus:border-amber-300 transition-all"
                                    >
                                        {[10, 20, 50, 100].map(s => (
                                            <option key={s} value={s}>{s} điểm</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Điểm đạt</div>
                                    <input
                                        type="number"
                                        value={editPassingScore}
                                        onChange={(e) => setEditPassingScore(Number(e.target.value || 0))}
                                        className="w-full bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 font-bold text-gray-800 outline-none focus:bg-white focus:border-amber-300 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Calendar size={12} className="text-amber-500" />
                                        Thời gian mở đề
                                    </div>
                                    <input
                                        type="datetime-local"
                                        value={editStartTime}
                                        onChange={(e) => setEditStartTime(e.target.value)}
                                        className="w-full bg-transparent font-bold text-gray-800 outline-none cursor-pointer"
                                    />
                                </div>
                                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Calendar size={12} className="text-amber-500" />
                                        Thời gian đóng đề
                                    </div>
                                    <input
                                        type="datetime-local"
                                        value={editEndTime}
                                        onChange={(e) => setEditEndTime(e.target.value)}
                                        className="w-full bg-transparent font-bold text-gray-800 outline-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <div className="flex-1">
                                    <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Công bộ kết quả</div>
                                    <p className="text-[10px] font-medium text-amber-500">Cho phép học viên xem đáp án sau khi nộp</p>
                                </div>
                                <button
                                    onClick={() => setEditShowResults(!editShowResults)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${editShowResults ? 'bg-amber-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editShowResults ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-50 flex items-center justify-end gap-3">
                            <button
                                disabled={isUpdatingQuiz}
                                onClick={() => setIsEditQuizModalOpen(false)}
                                className="px-4 py-2 rounded-xl font-black text-gray-600 bg-gray-50 disabled:opacity-50 cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                disabled={isUpdatingQuiz}
                                onClick={submitUpdateQuiz}
                                className="px-5 py-2 rounded-xl font-black text-white bg-gray-900 hover:bg-amber-600 disabled:opacity-50 cursor-pointer shadow-xl shadow-gray-200/50"
                            >
                                {isUpdatingQuiz ? 'Đang lưu...' : 'Lưu bài thi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizQuestionEditor;
