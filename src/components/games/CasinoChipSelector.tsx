import React from 'react';
import { sound } from '../../utils/audio';

interface CasinoChipSelectorProps {
  betAmount: number;
  onBetChange: (amount: number) => void;
  disabled?: boolean;
  userBalance?: number;
  minBet?: number;
  label?: string;
  accentColor?: 'amber' | 'emerald' | 'purple' | 'pink' | 'yellow' | 'blue';
}

const CHIP_VALUES = [
  { value: 1000, label: '۱K', bg: 'from-blue-600 to-indigo-700', border: 'border-blue-400', glow: 'shadow-blue-500/30' },
  { value: 5000, label: '۵K', bg: 'from-red-600 to-rose-700', border: 'border-red-400', glow: 'shadow-red-500/30' },
  { value: 20000, label: '۲۰K', bg: 'from-emerald-600 to-teal-700', border: 'border-emerald-400', glow: 'shadow-emerald-500/30' },
  { value: 50000, label: '۵۰K', bg: 'from-purple-600 to-violet-700', border: 'border-purple-400', glow: 'shadow-purple-500/30' },
  { value: 100000, label: '۱۰۰K', bg: 'from-amber-600 to-yellow-600', border: 'border-amber-400', glow: 'shadow-amber-500/30' },
  { value: 500000, label: '۵۰۰K', bg: 'from-slate-800 to-slate-950', border: 'border-amber-400/80', glow: 'shadow-amber-500/20' },
];

export const CasinoChipSelector: React.FC<CasinoChipSelectorProps> = ({
  betAmount,
  onBetChange,
  disabled = false,
  userBalance = 1000000,
  minBet = 1000,
  label = 'مبلغ شرط‌بندی',
  accentColor = 'amber',
}) => {
  const handleHalf = () => {
    sound.chipClick();
    onBetChange(Math.max(minBet, Math.floor(betAmount / 2 / 1000) * 1000));
  };

  const handleDouble = () => {
    sound.chipClick();
    const doubled = betAmount * 2;
    onBetChange(Math.min(userBalance || doubled, doubled));
  };

  const handleMax = () => {
    sound.chipClick();
    if (userBalance && userBalance >= minBet) {
      onBetChange(userBalance);
    }
  };

  const accentBorderMap = {
    amber: 'focus:border-amber-400 focus:ring-amber-500/20',
    emerald: 'focus:border-emerald-400 focus:ring-emerald-500/20',
    purple: 'focus:border-purple-400 focus:ring-purple-500/20',
    pink: 'focus:border-pink-400 focus:ring-pink-500/20',
    yellow: 'focus:border-yellow-400 focus:ring-yellow-500/20',
    blue: 'focus:border-blue-400 focus:ring-blue-500/20',
  };

  return (
    <div className="space-y-2 sm:space-y-2.5">
      {/* Label and Formatted Amount */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <span>{label}</span>
          <span className="text-[10px] text-slate-500 font-normal">(حداقل {minBet.toLocaleString('fa-IR')} ت)</span>
        </label>
        <div className="flex items-center gap-1">
          <span className="text-xs sm:text-sm font-black font-mono text-amber-300" dir="ltr">
            {betAmount.toLocaleString('fa-IR')}
          </span>
          <span className="text-[11px] text-slate-400">تومان</span>
        </div>
      </div>

      {/* Main Input Field */}
      <div className="relative">
        <input
          type="number"
          min={minBet}
          step={1000}
          disabled={disabled}
          value={betAmount}
          onChange={(e) => onBetChange(Math.max(minBet, Number(e.target.value)))}
          className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-slate-100 font-mono text-sm sm:text-base font-bold transition focus:outline-none focus:ring-2 disabled:opacity-50 ${accentBorderMap[accentColor]}`}
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-500 pointer-events-none font-mono">
          TOMAN
        </span>
      </div>

      {/* Casino Chips Carousel / Grid */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
        {CHIP_VALUES.map((chip) => {
          const isSelected = betAmount === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              disabled={disabled}
              onClick={() => {
                sound.chipClick();
                onBetChange(chip.value);
              }}
              className={`flex-shrink-0 h-9 sm:h-10 px-2.5 rounded-xl flex items-center justify-center gap-1 font-mono font-black text-xs transition-all active:scale-95 border-2 shadow-md ${
                chip.bg
              } ${chip.border} ${chip.glow} text-white disabled:opacity-40 ${
                isSelected
                  ? 'scale-105 ring-2 ring-white shadow-lg'
                  : 'opacity-85 hover:opacity-100 hover:scale-100'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full border border-dashed border-white/60" />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Math Modifiers (½, 2×, MAX) */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={handleHalf}
          className="py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-xs font-bold font-mono text-slate-300 transition text-center active:scale-95 disabled:opacity-40"
        >
          ½ نصف
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={handleDouble}
          className="py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-xs font-bold font-mono text-amber-300 transition text-center active:scale-95 disabled:opacity-40"
        >
          ۲× دوبرابر
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={handleMax}
          className="py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-xs font-black font-mono text-amber-300 transition text-center active:scale-95 disabled:opacity-40"
        >
          MAX کل موجودی
        </button>
      </div>
    </div>
  );
};
