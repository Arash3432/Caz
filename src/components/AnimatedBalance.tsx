import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, TrendingUp, TrendingDown } from 'lucide-react';

interface AnimatedBalanceProps {
  balance: number;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedBalance: React.FC<AnimatedBalanceProps> = ({
  balance,
  className = '',
  showIcon = true,
  size = 'md',
}) => {
  const [displayBalance, setDisplayBalance] = useState<number>(balance);
  const [diff, setDiff] = useState<number | null>(null);
  const prevBalanceRef = useRef<number>(balance);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevBalanceRef.current;
    if (prev !== balance) {
      const delta = balance - prev;
      setDiff(delta);

      const timeout = setTimeout(() => {
        setDiff(null);
      }, 2500);

      // Smooth count-up or count-down animation over 500ms
      const startTime = performance.now();
      const startVal = prev;
      const targetVal = balance;
      const duration = 500;

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Ease out quad
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startVal + (targetVal - startVal) * eased);
        setDisplayBalance(current);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        } else {
          setDisplayBalance(targetVal);
        }
      };

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(tick);
      prevBalanceRef.current = balance;

      return () => {
        clearTimeout(timeout);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }
  }, [balance]);

  const sizeClasses = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base font-extrabold',
    lg: 'text-lg sm:text-2xl font-black',
  };

  const isPositive = (diff ?? 0) > 0;

  return (
    <div className={`relative inline-flex items-center gap-1.5 font-mono select-none ${className}`}>
      {showIcon && (
        <motion.div
          animate={diff !== null ? { scale: [1, 1.25, 1], rotate: isPositive ? [0, 15, 0] : [0, -15, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Coins className="w-4 h-4 text-amber-400 shrink-0 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
        </motion.div>
      )}

      <span
        dir="ltr"
        className={`tracking-tight transition-colors duration-300 ${sizeClasses[size]} ${
          diff !== null
            ? isPositive
              ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]'
              : 'text-rose-400'
            : 'text-amber-300'
        }`}
      >
        {displayBalance.toLocaleString('fa-IR')}
        <span className="text-[10px] sm:text-xs text-amber-400/80 font-normal mr-1 font-sans">تومان</span>
      </span>

      {/* Floating Delta Badge */}
      <AnimatePresence>
        {diff !== null && (
          <motion.span
            initial={{ opacity: 0, y: isPositive ? 6 : -6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isPositive ? -10 : 10, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            className={`absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-0.5 pointer-events-none z-30 shadow-lg ${
              isPositive
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                : 'bg-rose-950/90 text-rose-300 border-rose-500/50'
            }`}
          >
            {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            <span dir="ltr">
              {isPositive ? '+' : ''}
              {diff.toLocaleString('fa-IR')}
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};
