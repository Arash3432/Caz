import React, { useState } from 'react';
import { Coins, ChevronRight, HelpCircle, Flame, Award, Zap, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '../../types';
import { sound } from '../../utils/audio';

interface CoinFlipGameProps {
  user: User | null;
  onUpdateUser: (user: User) => void;
  onRequireAuth: () => void;
  onBackToLobby?: () => void;
}

export const CoinFlipGame: React.FC<CoinFlipGameProps> = ({ user, onUpdateUser, onRequireAuth, onBackToLobby }) => {
  const [betAmount, setBetAmount] = useState<number>(5000);
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const [flipping, setFlipping] = useState<boolean>(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>('heads');
  const [streak, setStreak] = useState<number>(0);
  const [lastWin, setLastWin] = useState<{ won: boolean; payout: number; netProfit: number } | null>(null);
  const [showBeginnerGuide, setShowBeginnerGuide] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFlip = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    if (user.balance < betAmount) {
      setMessage('موجودی حساب کافی نیست.');
      return;
    }

    setFlipping(true);
    setMessage(null);
    setLastWin(null);
    sound.coinFlip();

    try {
      const res = await fetch('/api/games/coinflip/flip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aria_token')}`,
        },
        body: JSON.stringify({ betAmount, choice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در پرتاب سکه');

      // 1.4s dramatic 3D spin
      setTimeout(() => {
        setFlipping(false);
        setResult(data.result);
        onUpdateUser({ ...user, balance: data.balance });
        setLastWin({ won: data.won, payout: data.payout, netProfit: data.netProfit });

        if (data.won) {
          setStreak((s) => s + 1);
          sound.win();
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        } else {
          setStreak(0);
          sound.lose();
        }
      }, 1400);
    } catch (err: any) {
      setFlipping(false);
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
              <ChevronRight className="w-4 h-4 text-yellow-400" />
              <span>سالن بازی‌ها</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span>پرتاب سکه ۳بعدی (دوئل شیر یا خط)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
              ضریب ۱.۹۰x
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
              ? 'bg-yellow-500 text-black border-yellow-400'
              : 'bg-slate-900 text-yellow-300 border-yellow-500/30 hover:bg-slate-850'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showBeginnerGuide ? 'بستن راهنما' : '💡 راهنمای ساده مبتدیان'}</span>
        </button>
      </div>

      {/* Beginner Quick Tutorial Box */}
      {showBeginnerGuide && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-yellow-950/30 via-slate-900 to-slate-900 border border-yellow-500/30 text-xs space-y-2 animate-in fade-in duration-200 shadow-md">
          <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
            <Coins className="w-4 h-4" />
            <span>چگونه در پرتاب سکه برنده شویم؟</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-yellow-300 block mb-0.5">۱. انتخاب شیر یا خط:</span>
              <span>یکی از طرف‌های سکه (شیر طلایی 🦁 یا خط سلطنتی ☀️) را برگزینید.</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-amber-400 block mb-0.5">۲. پرتاب سکه:</span>
              <span>دکمه پرتاب را بزنید تا سکه به شکل سه‌بعدی و واقعی در هوا به چرخش درآید.</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-emerald-300 block mb-0.5">۳. برد فوری:</span>
              <span>در صورت تطابق با انتخاب شما، فوراً ۱.۹۰ برابر مبلغ شرط را دریافت می‌کنید!</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Arena */}
      <div className="max-w-xl mx-auto rounded-3xl p-4 sm:p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-yellow-500/25 shadow-2xl space-y-4 sm:space-y-6">
        {/* Streak Counter */}
        {streak > 1 && (
          <div className="flex items-center justify-center gap-2 py-1 px-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold animate-pulse w-fit mx-auto">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>توالی برد: {streak} راند متوالی!</span>
          </div>
        )}

        {/* 3D Animated Coin Stage */}
        <div className="flex flex-col items-center justify-center py-6 sm:py-8 relative perspective-1000">
          <div
            className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-yellow-400/90 shadow-[0_0_40px_rgba(234,179,8,0.35)] flex items-center justify-center bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300 text-slate-950 font-black text-center transition-all duration-700 ${
              flipping
                ? 'animate-[spin_0.35s_linear_infinite] scale-110'
                : 'hover:scale-105'
            }`}
          >
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-dashed border-amber-800/40 flex flex-col items-center justify-center shadow-inner">
              <span className="text-4xl sm:text-5xl drop-shadow select-none">
                {result === 'heads' ? '🦁' : '☀️'}
              </span>
              <span className="text-xs sm:text-sm font-extrabold tracking-wider mt-1 text-slate-900">
                {result === 'heads' ? 'شیر' : 'خط'}
              </span>
            </div>
          </div>

          <div className="mt-4 text-xs font-semibold text-slate-400 text-center">
            {flipping ? 'سکه در هوا در حال چرخش است...' : 'انتخاب فعلی شما:'}{' '}
            <span className="text-yellow-400 font-bold">
              {choice === 'heads' ? 'شیر (🦁)' : 'خط (☀️)'}
            </span>
          </div>
        </div>

        {/* Win/Loss Result Box */}
        {lastWin && (
          <div
            className={`p-3.5 rounded-2xl text-center border animate-in zoom-in-95 duration-200 ${
              lastWin.won
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="text-xs font-bold">
              {lastWin.won ? '🎉 تبریک! سکه درست نشست' : 'متأسفانه این راند ناموفق بود'}
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono mt-0.5">
              {lastWin.won
                ? `+${lastWin.payout.toLocaleString('fa-IR')} تومان سود`
                : `${betAmount.toLocaleString('fa-IR')} تومان`}
            </div>
          </div>
        )}

        {/* Choice Buttons */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            disabled={flipping}
            onClick={() => {
              sound.chipClick();
              setChoice('heads');
            }}
            className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
              choice === 'heads'
                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-yellow-400 text-yellow-300 shadow-md ring-1 ring-yellow-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
            }`}
          >
            <span className="text-2xl">🦁</span>
            <span className="text-sm font-black">انتخاب شیر</span>
            <span className="text-[10px] text-slate-400 font-mono">ضریب ۱.۹۰x</span>
          </button>

          <button
            type="button"
            disabled={flipping}
            onClick={() => {
              sound.chipClick();
              setChoice('tails');
            }}
            className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
              choice === 'tails'
                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-yellow-400 text-yellow-300 shadow-md ring-1 ring-yellow-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
            }`}
          >
            <span className="text-2xl">☀️</span>
            <span className="text-sm font-black">انتخاب خط</span>
            <span className="text-[10px] text-slate-400 font-mono">ضریب ۱.۹۰x</span>
          </button>
        </div>

        {/* Bet Input & Chips */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-semibold">مبلغ شرط (تومان):</label>
            <div className="text-xs text-yellow-400 font-mono font-bold">
              {betAmount.toLocaleString('fa-IR')} ت
            </div>
          </div>

          <input
            type="number"
            min={1000}
            step={1000}
            disabled={flipping}
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1000, Number(e.target.value)))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-yellow-500"
          />

          <div className="grid grid-cols-4 gap-1.5">
            {[1000, 5000, 20000, 50000].map((val) => (
              <button
                key={val}
                type="button"
                disabled={flipping}
                onClick={() => {
                  sound.chipClick();
                  setBetAmount(val);
                }}
                className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 transition"
              >
                {(val / 1000).toLocaleString('fa-IR')}K
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
            {message}
          </div>
        )}

        {/* Big Flip Button */}
        <button
          onClick={handleFlip}
          disabled={flipping}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 hover:from-yellow-400 hover:to-amber-300 text-black font-black text-sm sm:text-base shadow-xl shadow-yellow-950/50 transition active:scale-95 flex items-center justify-center gap-2"
        >
          <Coins className={`w-5 h-5 ${flipping ? 'animate-spin' : ''}`} />
          <span>{flipping ? 'سکه در هواست...' : 'پرتاب سکه شانس (۱.۹۰x)'}</span>
        </button>
      </div>
    </div>
  );
};
