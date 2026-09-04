import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Trophy, Info, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export type ToastType = 'success' | 'win' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    // If a 'win' toast arrives, blast celebratory confetti
    const latestWin = toasts.find((t) => t.type === 'win');
    if (latestWin) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff'],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [toasts]);

  const getStyle = (type: ToastType) => {
    switch (type) {
      case 'win':
        return {
          bg: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black border-amber-300 shadow-amber-500/30',
          icon: <Trophy className="w-5 h-5 shrink-0 text-black drop-shadow" />,
          progress: 'bg-black/30',
        };
      case 'success':
        return {
          bg: 'bg-slate-900/95 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20',
          icon: <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />,
          progress: 'bg-emerald-500',
        };
      case 'error':
        return {
          bg: 'bg-slate-900/95 text-rose-300 border-rose-500/50 shadow-rose-500/20',
          icon: <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />,
          progress: 'bg-rose-500',
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-900/95 text-blue-300 border-blue-500/50 shadow-blue-500/20',
          icon: <Info className="w-5 h-5 shrink-0 text-blue-400" />,
          progress: 'bg-blue-500',
        };
    }
  };

  return (
    <div className="fixed top-16 sm:top-5 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-5 z-50 flex flex-col gap-2 w-[92%] sm:w-auto sm:min-w-[320px] sm:max-w-md pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = getStyle(toast.type);
          const duration = toast.duration || 4000;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl border p-3 sm:p-3.5 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 select-none ${style.bg}`}
            >
              <div className="flex items-center gap-2.5">
                {style.icon}
                <p className="text-xs sm:text-sm font-bold tracking-tight leading-snug">{toast.message}</p>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/10 transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Progress bar countdown */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${style.progress}`}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
