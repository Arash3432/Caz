import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Gift,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Coins,
  ChevronLeft,
  Award,
} from 'lucide-react';
import { StepTask, TaskSubmission, User } from '../types';
import { StepTaskModal } from './StepTaskModal';

interface StepTaskWidgetProps {
  currentUser: User | null;
  onBalanceUpdate: (newBalance?: number) => void;
  onOpenAuth: () => void;
}

export const StepTaskWidget: React.FC<StepTaskWidgetProps> = ({
  currentUser,
  onBalanceUpdate,
  onOpenAuth,
}) => {
  const [currentTask, setCurrentTask] = useState<StepTask | null>(null);
  const [submission, setSubmission] = useState<TaskSubmission | null>(null);
  const [totalActiveTasks, setTotalActiveTasks] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [allCompleted, setAllCompleted] = useState<boolean>(false);
  const [userCurrentStep, setUserCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem('aria_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/tasks/current', { headers });
      if (res.ok) {
        const data = await res.json();
        setCurrentTask(data.currentTask || null);
        setSubmission(data.submission || null);
        setTotalActiveTasks(data.totalActiveTasks || 0);
        setCompletedCount(data.completedCount || 0);
        setAllCompleted(!!data.allCompleted);
        setUserCurrentStep(data.userCurrentStep || 1);
      }
    } catch (err) {
      console.error('Error fetching step tasks progress:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [currentUser]);

  const handleTaskCompleted = (newBalance?: number) => {
    setIsModalOpen(false);
    fetchProgress();
    if (newBalance !== undefined) {
      onBalanceUpdate(newBalance);
    } else {
      onBalanceUpdate();
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/25 p-4 sm:p-5 shadow-xl transition hover:border-amber-500/40">
        {/* Subtle accent glow line */}
        <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Header & Icon */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <Gift className="w-6 h-6 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-slate-950" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-1.5">
                  <span>انجام تسک‌های مرحله‌ای و موجودی رایگان ✨</span>
                </h3>

                {totalActiveTasks > 0 && !allCompleted && (
                  <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    مرحله {userCurrentStep} از {totalActiveTasks}
                  </span>
                )}
              </div>

              {/* Status and description */}
              <div className="mt-1 text-xs text-slate-400">
                {loading ? (
                  <span>در حال دریافت اطلاعات تسک‌ها...</span>
                ) : totalActiveTasks === 0 ? (
                  <span className="text-slate-400 text-xs">
                    فعلاً تسک جدیدی تعریف نشده است. به زودی مأموریت‌های جذاب با جوایز نقدی اضافه خواهند شد.
                  </span>
                ) : allCompleted ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    تمامی مراحل تکمیل شد! منتظر تسک‌های بعدی باشید.
                  </span>
                ) : currentTask ? (
                  <div className="flex items-center gap-2 flex-wrap text-slate-300">
                    <span className="font-semibold text-slate-200">تسک جاری:</span>
                    <span className="text-white font-bold max-w-[200px] sm:max-w-xs truncate">
                      «{currentTask.title}»
                    </span>
                    <span className="text-amber-400 font-black font-mono">
                      (+ {currentTask.reward.toLocaleString('fa-IR')} تومان)
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Action button / Status badge */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto">
            {totalActiveTasks > 0 && !allCompleted && currentTask && (
              <button
                onClick={() => setIsModalOpen(true)}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 shadow-lg ${
                  submission?.status === 'pending'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : submission?.status === 'rejected'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                    : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20'
                }`}
              >
                {submission?.status === 'pending' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>در حال بررسی توسط ادمین ⏳</span>
                  </>
                ) : submission?.status === 'rejected' ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    <span>ویرایش و ارسال مجدد مدرک</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-3.5 h-3.5" />
                    <span>شروع مرحله و دریافت هدیه</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}

            {totalActiveTasks === 0 && (
              <div className="text-[11px] font-bold text-slate-500 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                در انتظار تسک جدید
              </div>
            )}

            {allCompleted && (
              <div className="text-xs font-black text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1">
                <Award className="w-4 h-4" />
                <span>پاداش‌ها دریافت شد</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <StepTaskModal
          task={currentTask}
          submission={submission}
          totalActiveTasks={totalActiveTasks}
          completedCount={completedCount}
          userCurrentStep={userCurrentStep}
          currentUser={currentUser}
          onClose={() => setIsModalOpen(false)}
          onTaskCompleted={handleTaskCompleted}
          onOpenAuth={onOpenAuth}
        />
      )}
    </>
  );
};
