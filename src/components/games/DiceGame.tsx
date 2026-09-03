import React, { useState } from 'react';
import { Dices, TrendingUp, Sparkles, CheckCircle2, AlertTriangle, ArrowUpDown, ChevronRight, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '../../types';
import { sound } from '../../utils/audio';

interface DiceGameProps {
  user: User | null;
  onUpdateUser: (user: User) => void;
  onRequireAuth: () => void;
  onBackToLobby?: () => void;
}

export const DiceGame: React.FC<DiceGameProps> = ({ user, onUpdateUser, onRequireAuth, onBackToLobby }) => {
  const [betAmount, setBetAmount] = useState<number>(5000);
  const [target, setTarget] = useState<number>(50.0);
  const [condition, setCondition] = useState<'under' | 'over'>('under');
  const [rolling, setRolling] = useState<boolean>(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{ won: boolean; payout: number; netProfit: number } | null>(null);
  const [showBeginnerGuide, setShowBeginnerGuide] = useState<boolean>(false);
  const [history, setHistory] = useState<{ roll: number; won: boolean }[]>([
    { roll: 24.52, won: true },
    { roll: 78.14, won: false },
    { roll: 41.2, won: true },
  ]);
  const [message, setMessage] = useState<string | null>(null);

  // Multiplier calculation (90% RTP with 10% house edge)
  const winChance = condition === 'under' ? target : 100 - target;
  const multiplier = Number(((99.0 / winChance) * 0.90).toFixed(2));
  const potentialProfit = Math.floor(betAmount * multiplier) - betAmount;

  const handleRoll = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    if (user.balance < betAmount) {
      setMessage('موجودی حساب کافی نیست.');
      return;
    }

    setRolling(true);
    setMessage(null);
    setLastResult(null);
    sound.chipClick();

    try {
      const res = await fetch('/api/games/dice/roll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aria_token')}`,
        },
        body: JSON.stringify({ betAmount, target, condition }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در تاس انداختن');

      // Animate roll numbers quickly
      let ticks = 0;
      const rollInterval = setInterval(() => {
        setLastRoll(Number((Math.random() * 99.99).toFixed(2)));
        sound.rouletteTick();
        ticks++;
        if (ticks > 8) {
          clearInterval(rollInterval);
          setRolling(false);
          setLastRoll(data.roll);
          setLastResult({ won: data.won, payout: data.payout, netProfit: data.netProfit });
          setHistory(prev => [{ roll: data.roll, won: data.won }, ...prev.slice(0, 10)]);
          onUpdateUser({ ...user, balance: data.balance });

          if (data.won) {
            sound.win();
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
          }
        }
      }, 70);
    } catch (err: any) {
      setRolling(false);
      setMessage(err.message);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Top Header & Beginner Guide Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {onBackToLobby && (
            <button
              onClick={() => {
                sound.chipClick();
                onBackToLobby();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition shadow-sm"
            >
              <ChevronRight className="w-4 h-4 text-purple-400" />
              <span>سالن بازی‌ها</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Dices className="w-4 h-4 text-purple-400" />
            <span>تاس هوشمند</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              آسان
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            sound.chipClick();
            setShowBeginnerGuide(!showBeginnerGuide);
          }}
          className={`flex items-center gap-1 text-[11px] font-bold py-1 px-2.5 rounded-xl border transition ${
            showBeginnerGuide
              ? 'bg-purple-500 text-black border-purple-400'
              : 'bg-slate-900 text-purple-300 border-purple-500/30 hover:bg-slate-850'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showBeginnerGuide ? 'بستن راهنما' : '💡 راهنمای ساده مبتدیان'}</span>
        </button>
      </div>

      {/* Beginner Quick Tutorial Box */}
      {showBeginnerGuide && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-900 border border-purple-500/30 text-xs space-y-2 animate-in fade-in duration-200 shadow-md">
          <div className="flex items-center gap-1.5 text-purple-400 font-bold">
            <Dices className="w-4 h-4" />
            <span>چگونه در تاس هوشمند بازی کنیم؟</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-purple-300 block mb-0.5">۱. عدد هدف:</span>
              <span>لغزنده وسط را روی عدد دلخواه (مثلاً ۵۰) بگذارید.</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-amber-400 block mb-0.5">۲. تعیین شرط:</span>
              <span>مشخص کنید تاس باید «کمتر» از این عدد بیاید یا «بیشتر».</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-emerald-300 block mb-0.5">۳. پرتاب تاس:</span>
              <span>دکمه پرتاب تاس را بزنید؛ تاس سریع محاسبه شده و در صورت درستی حدس، پولتان ضربدر ضریب می‌شود.</span>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-amber-500/20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Dices className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">طاس کریپتویی آنلاین (Crypto Dice)</h3>
            <p className="text-[11px] text-slate-400">تنظیم دستی شانس برد از ۱٪ تا ۹۸٪ با ضرایب تصاعدی</p>
          </div>
        </div>

        {/* Recent Roll Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs text-slate-400 ml-1">تاس‌های اخیر:</span>
          {history.map((h, i) => (
            <span
              key={i}
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                h.won
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}
            >
              {h.roll.toFixed(2)}
            </span>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl space-y-4 sm:space-y-6">
        {/* Dice Result Display */}
        <div className="relative py-6 sm:py-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner flex flex-col items-center justify-center">
          <div className="text-xs text-slate-400 font-semibold mb-1">
            {condition === 'under' ? `تاس کمتر از ${target.toFixed(2)}` : `تاس بیشتر از ${target.toFixed(2)}`}
          </div>

          <div
            className={`text-5xl sm:text-7xl font-mono font-black tracking-wider transition duration-200 ${
              rolling
                ? 'text-slate-500 scale-95'
                : lastResult?.won
                ? 'text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                : lastResult && !lastResult.won
                ? 'text-rose-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.4)]'
                : 'text-amber-400'
            }`}
          >
            {lastRoll !== null ? lastRoll.toFixed(2) : '50.00'}
          </div>

          {lastResult && !rolling && (
            <div
              className={`mt-2.5 px-3.5 py-1 rounded-full text-xs font-bold border ${
                lastResult.won
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                  : 'bg-rose-950 border-rose-500 text-rose-300'
              }`}
            >
              {lastResult.won
                ? `برد! سود: +${lastResult.netProfit.toLocaleString('fa-IR')} تومان`
                : 'باخت در این دور'}
            </div>
          )}
        </div>

        {/* Target Slider */}
        <div className="space-y-3 bg-slate-900/50 p-4 sm:p-5 rounded-2xl border border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
            <span>عدد هدف: <strong className="font-mono text-amber-300 text-sm">{target.toFixed(2)}</strong></span>
            <button
              onClick={() => setCondition(condition === 'under' ? 'over' : 'under')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold transition"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>شرط: {condition === 'under' ? 'کمتر (Under)' : 'بیشتر (Over)'}</span>
            </button>
          </div>

          <input
            type="range"
            min={2}
            max={98}
            step={0.5}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1 text-center text-xs">
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px] sm:text-[11px]">ضریب برد</span>
              <span className="text-amber-400 font-mono font-bold text-xs sm:text-sm">{multiplier.toFixed(2)}x</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px] sm:text-[11px]">شانس برد</span>
              <span className="text-emerald-400 font-mono font-bold text-xs sm:text-sm">%{winChance.toFixed(1)}</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px] sm:text-[11px]">سود احتمالی</span>
              <span className="text-slate-200 font-mono font-bold text-xs sm:text-sm">
                +{potentialProfit.toLocaleString('fa-IR')} ت
              </span>
            </div>
          </div>
        </div>

        {/* Bet Amount & Roll Action */}
        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
              <span>مبلغ شرط (تومان):</span>
              <span className="text-amber-300 font-mono">{betAmount.toLocaleString('fa-IR')} تومان</span>
            </div>
            <input
              type="number"
              min={1000}
              step={1000}
              disabled={rolling}
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1000, Number(e.target.value)))}
              className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-500"
            />
            {/* Quick Chips & Multipliers */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[1000, 5000, 20000, 50000].map((val) => (
                <button
                  key={val}
                  type="button"
                  disabled={rolling}
                  onClick={() => { sound.chipClick(); setBetAmount(val); }}
                  className="py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-[11px] font-mono text-slate-300 transition text-center disabled:opacity-50"
                >
                  {(val / 1000).toLocaleString('fa-IR')}K
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                disabled={rolling}
                onClick={() => setBetAmount((prev) => Math.max(1000, Math.floor(prev / 2)))}
                className="py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition disabled:opacity-50"
              >
                ½ نصف
              </button>
              <button
                type="button"
                disabled={rolling}
                onClick={() => setBetAmount((prev) => prev * 2)}
                className="py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition disabled:opacity-50"
              >
                2X دوبرابر
              </button>
            </div>
          </div>

          <button
            onClick={handleRoll}
            disabled={rolling}
            className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-sm sm:text-base transition shadow-xl flex items-center justify-center gap-2 ${
              rolling
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-950/50 active:scale-98'
            }`}
          >
            <Dices className="w-5 h-5" />
            <span>{rolling ? 'در حال پرتاب طاس...' : `پرتاب طاس (${betAmount.toLocaleString('fa-IR')} تومان)`}</span>
          </button>
        </div>

        {message && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
};
