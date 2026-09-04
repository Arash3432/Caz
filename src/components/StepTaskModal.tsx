import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Gift,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  UploadCloud,
  Image as ImageIcon,
  Video as VideoIcon,
  Link as LinkIcon,
  FileText,
  Trash2,
  Loader2,
  ShieldCheck,
  Trophy,
  ArrowLeft,
  Coins,
} from 'lucide-react';
import { StepTask, TaskSubmission, User } from '../types';
import { sound } from '../utils/audio';

interface StepTaskModalProps {
  task: StepTask | null;
  submission: TaskSubmission | null;
  totalActiveTasks: number;
  completedCount: number;
  userCurrentStep: number;
  currentUser: User | null;
  onClose: () => void;
  onTaskCompleted: (newBalance?: number) => void;
  onOpenAuth: () => void;
}

export const StepTaskModal: React.FC<StepTaskModalProps> = ({
  task,
  submission,
  totalActiveTasks,
  completedCount,
  userCurrentStep,
  currentUser,
  onClose,
  onTaskCompleted,
  onOpenAuth,
}) => {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPending = submission?.status === 'pending';
  const isApproved = submission?.status === 'approved';
  const isRejected = submission?.status === 'rejected';

  // Handle image or video file upload and conversion to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);

    // Max 25MB
    if (file.size > 25 * 1024 * 1024) {
      setError('حجم فایل انتخابی نباید بیشتر از ۲۵ مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setContent(result);
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setContent('');
    setFileName('');
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!task) return;

    if (task.submissionType !== 'none' && !content.trim()) {
      const names: Record<string, string> = {
        image: 'تصویر اسکرین‌شات',
        video: 'فایل یا لینک ویدیو',
        link: 'آدرس اینترنتی یا لینک',
        text: 'توضیحات متنی',
      };
      setError(`لطفاً ${names[task.submissionType] || 'مدرک مورد نیاز'} را وارد نمایید.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('aria_token');
      const res = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: task.id,
          content,
          fileName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ثبت مدرک تسک');
      }

      sound.win();
      setSuccessMessage(data.message);

      setTimeout(() => {
        onTaskCompleted(data.newBalance);
      }, 1800);
    } catch (err: any) {
      setError(err.message);
      sound.lose();
    } finally {
      setLoading(false);
    }
  };

  if (!task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-4">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-100">
            {completedCount > 0 && completedCount === totalActiveTasks
              ? '🎉 تمامی مأموریت‌ها با موفقیت تکمیل شدند!'
              : 'مأموریت جدیدی در دسترس نیست'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            {completedCount > 0 && completedCount === totalActiveTasks
              ? 'شما تمامی مراحل تعریف‌شده را پشت سر گذاشته و پاداش‌های مربوطه را دریافت نموده‌اید. به زودی تسک‌های جدید افزوده خواهند شد.'
              : 'در حال حاضر تسک فعالی از طرف مدیریت تعریف نشده است. لطفاً بعداً مجدداً بررسی فرمایید.'}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Decorative ambient top glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  مرحله {task.stepNumber} از {Math.max(totalActiveTasks, task.stepNumber)}
                </span>
                <span className="text-xs text-slate-400">ماموریت‌های مرحله‌ای</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-100 mt-0.5">{task.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Reward and Step Badge banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-slate-900 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-amber-400 font-bold block">پاداش این مرحله</span>
                <span className="text-base sm:text-lg font-black text-white font-mono">
                  {task.reward.toLocaleString('fa-IR')} <span className="text-xs text-amber-300 font-sans">تومان</span>
                </span>
              </div>
            </div>

            <div className="text-left text-xs">
              <span className="text-slate-400 text-[11px] block">نوع بررسی</span>
              <span
                className={`font-bold inline-flex items-center gap-1 ${
                  task.requiresAdminApproval ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {task.requiresAdminApproval ? 'بررسی توسط مدیریت' : 'شارژ آنی و خودکار'}
              </span>
            </div>
          </div>

          {/* Task Instructions */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              شرح وظایف و راهنمای تسک:
            </h4>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {task.description}
            </div>
          </div>

          {/* Action external link if available */}
          {task.actionUrl && (
            <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex items-center justify-between gap-3">
              <div className="text-xs text-blue-300">
                <span className="font-bold block">لینک مستقیم انجام مأموریت:</span>
                <span className="text-[11px] text-slate-400 truncate block max-w-xs sm:max-w-md font-mono" dir="ltr">
                  {task.actionUrl}
                </span>
              </div>
              <a
                href={task.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition shrink-0 shadow-lg shadow-blue-950/40"
              >
                <span>{task.buttonText || 'بازدید و انجام'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Current Status Box if already submitted */}
          {submission && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 ${
                isPending
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  : isApproved
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-red-950/30 border-red-500/40 text-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  {isPending && <Clock className="w-4 h-4 animate-spin text-amber-400" />}
                  {isApproved && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {isRejected && <AlertCircle className="w-4 h-4 text-red-400" />}
                  <span>
                    {isPending && 'در حال بررسی توسط مدیریت ⏳'}
                    {isApproved && 'تأیید شده و جایزه واریز گردید! ✅'}
                    {isRejected && 'مدرک ارسالی رد شد ❌'}
                  </span>
                </div>
                <span className="text-[10px] opacity-75 font-mono">
                  {new Date(submission.submittedAt).toLocaleTimeString('fa-IR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {submission.adminNote && (
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs">
                  <span className="font-bold text-[11px] block text-white/90">پیام مدیریت:</span>
                  <p className="mt-0.5">{submission.adminNote}</p>
                </div>
              )}

              {isRejected && (
                <p className="text-[11px] text-slate-300">
                  شما می‌توانید با تصحیح مدرک خود در فرم زیر، مجدداً آن را برای بازبینی مدیریت ارسال کنید.
                </p>
              )}
            </div>
          )}

          {/* Success toast inside modal */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submission Form (Only if not already approved, and not pending unless rejected) */}
          {(!isPending && !isApproved) || isRejected ? (
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              {/* If Submission is none */}
              {task.submissionType === 'none' ? (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-300">
                    این مأموریت نیازی به ارسال مدرک ندارد. پس از انجام کار، دکمه زیر را جهت دریافت پاداش نقدی بفشارید.
                  </p>
                </div>
              ) : null}

              {/* If Submission is Image */}
              {task.submissionType === 'image' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    ارسال تصویر یا اسکرین‌شات اثبات <span className="text-amber-400">*</span>
                  </label>

                  {previewUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-amber-500/40 bg-slate-950 p-2 group">
                      <img
                        src={previewUrl}
                        alt="پیش‌نمایش مدرک"
                        className="w-full max-h-56 object-contain rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="absolute top-4 left-4 p-2 rounded-xl bg-red-600/90 text-white hover:bg-red-500 transition shadow-lg"
                        title="حذف و انتخاب مجدد"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="text-[11px] text-slate-400 text-center pt-2 font-mono truncate px-2">
                        {fileName}
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-950/60 hover:bg-slate-950 space-y-2"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,.heic"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/80 text-amber-400 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-slate-200">
                        برای انتخاب یا کشیدن تصویر کلیک کنید
                      </div>
                      <p className="text-[11px] text-slate-500">تمامی پسوندها: PNG، JPG، WEBP، GIF و... (حداکثر ۲۵ مگابایت)</p>
                    </div>
                  )}
                </div>
              )}

              {/* If Submission is Video */}
              {task.submissionType === 'video' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-300">
                    ارسال ویدیو یا پیوند ویدیو <span className="text-amber-400">*</span>
                  </label>

                  {previewUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-purple-500/40 bg-slate-950 p-2 group">
                      <video
                        src={previewUrl}
                        controls
                        playsInline
                        className="w-full max-h-56 rounded-xl bg-black object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="absolute top-4 left-4 p-2 rounded-xl bg-red-600/90 text-white hover:bg-red-500 transition shadow-lg"
                        title="حذف و انتخاب مجدد"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="text-[11px] text-slate-400 text-center pt-2 font-mono truncate px-2">
                        {fileName}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <input
                          type="text"
                          placeholder="لینک ویدیو در آپارات، یوتیوب، تلگرام یا درایو..."
                          value={content.startsWith('data:') ? '' : content}
                          onChange={(e) => {
                            setContent(e.target.value);
                            setFileName('');
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                          dir="ltr"
                        />
                      </div>

                      <div className="text-center text-slate-500 text-[11px]">- یا آپلود مستقیم فایل ویدیو با هر پسوندی -</div>

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-3 text-center cursor-pointer transition bg-slate-950/60 flex items-center justify-center gap-2"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="video/*,.mp4,.webm,.mov,.avi,.mkv,.m4v,.3gp"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <VideoIcon className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-slate-300">
                          {fileName ? `فایل انتخاب شده: ${fileName}` : 'انتخاب ویدیو از دستگاه (MP4, WEBM, MOV, MKV...)'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* If Submission is Link */}
              {task.submissionType === 'link' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    آدرس یا لینک اثبات (URL) <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono text-left"
                      dir="ltr"
                    />
                    <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  </div>
                  <span className="text-[10px] text-slate-500">
                    لینک پست، کامنت، حساب کاربری یا مدرک مربوطه را وارد کنید.
                  </span>
                </div>
              )}

              {/* If Submission is Text */}
              {task.submissionType === 'text' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    توضیحات یا کد رهگیری انجام تسک <span className="text-amber-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="اطلاعات تکمیلی، نام کاربری یا توضیحات اثبات تسک..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                {currentUser ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>در حال ثبت و ارسال...</span>
                      </>
                    ) : (
                      <>
                        <Coins className="w-4 h-4" />
                        <span>
                          {task.requiresAdminApproval
                            ? 'ارسال مدرک و ثبت جهت بررسی ادمین'
                            : `ثبت و دریافت آنی ${task.reward.toLocaleString('fa-IR')} تومان`}
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="w-full py-3 px-4 rounded-xl bg-amber-500 text-slate-950 font-black text-xs sm:text-sm hover:bg-amber-400 transition flex items-center justify-center gap-2"
                  >
                    <span>برای انجام تسک و دریافت پاداش ابتدا وارد حساب شوید</span>
                  </button>
                )}
              </div>
            </form>
          ) : isPending ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400 leading-relaxed">
                مدرک شما هم‌اکنون در کارتابل مدیریت قرار دارد. به محض بررسی و تأیید، موجودی شما بلافاصله شارژ شده و مرحله بعدی باز خواهد شد.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                بستن و ادامه بازی‌ها
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
