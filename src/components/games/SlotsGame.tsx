import React, { useState } from 'react';
import { Sparkles, Crown, Award, Zap, AlertTriangle, ChevronRight, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '../../types';
import { sound } from '../../utils/audio';

interface SlotsGameProps {
  user: User | null;
  onUpdateUser: (user: User) => void;
  onRequireAuth: () => void;
  onBackToLobby?: () => void;
}

const SYMBOL_MAP: Record<string, { icon: string; nameFa: string; mult: number }> = {
  seven: { icon: '7️⃣', nameFa: 'هفت طلایی', mult: 150 },
  diamond: { icon: '💎', nameFa: 'الماس نئونی', mult: 80 },
  crown: { icon: '👑', nameFa: 'تاج پادشاهی', mult: 50 },
  bell: { icon: '🔔', nameFa: 'زنگوله شانس', mult: 30 },
  star: { icon: '⭐', nameFa: 'ستاره جادویی', mult: 20 },
  clover: { icon: '🍀', nameFa: 'برگ شبدر', mult: 12 },
  cherry: { icon: '🍒', nameFa: 'گیلاس سرخ', mult: 8 },
};

export const SlotsGame: React.FC<SlotsGameProps> = ({ user, onUpdateUser, onRequireAuth, onBackToLobby }) => {
  const [betAmount, setBetAmount] = useState<number>(5000);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [showBeginnerGuide, setShowBeginnerGuide] = useState<boolean>(false);
  const [reels, setReels] = useState<string[][]>([
    ['seven', 'crown', 'diamond'],
    ['bell', 'seven', 'star'],
    ['diamond', 'seven', 'clover'],
    ['crown', 'seven', 'cherry'],
    ['star', 'seven', 'bell'],
  ]);
  const [lastWin, setLastWin] = useState<{ payout: number; multiplier: number; winningLines: any[] } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSpin = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    if (user.balance < betAmount) {
      setMessage('موجودی شما کافی نیست. از دکمه شارژ تست استفاده کنید.');
      return;
    }

    setSpinning(true);
    setMessage(null);
    setLastWin(null);
    sound.chipClick();

    try {
      const res = await fetch('/api/games/slots/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aria_token')}`,
        },
        body: JSON.stringify({ betAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در اسلات');

      // Play reel sound tick
      const tickTimer = setInterval(() => {
        sound.reelTick();
      }, 100);

      // Spin animation duration: 1.5s
      setTimeout(() => {
        clearInterval(tickTimer);
        setSpinning(false);
        setReels(data.grid);
        onUpdateUser({ ...user, balance: data.balance });

        if (data.won) {
          if (data.totalMultiplier >= 30) {
            sound.jackpot();
            confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
          } else {
            sound.win();
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
          }
          setLastWin({
            payout: data.payout,
            multiplier: data.totalMultiplier,
            winningLines: data.winningLines,
          });
        }
      }, 1400);
    } catch (err: any) {
      setSpinning(false);
      setMessage(err.message || 'خطا در چرخش ریل‌ها');
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
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>اسلات ۷۷۷</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
              بسیار آسان
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
            <Sparkles className="w-4 h-4" />
            <span>چگونه در ماشین اسلات بازی کنیم؟</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-yellow-300 block mb-0.5">۱. مبلغ چرخش:</span>
              <span>مبلغ مورد نظر برای هر بار چرخش را از چیپ‌های پایین انتخاب کنید.</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-amber-400 block mb-0.5">۲. دکمه اسپین:</span>
              <span>دکمه زرد بزرگ چرخش را فشار دهید تا ۵ ریل چرخان شروع به حرکت کنند.</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-emerald-300 block mb-0.5">۳. برنده شدن:</span>
              <span>هرگاه نمادهای مشابه (مثل ۷، الماس یا زنگوله) در یک خط ردیف شوند، برنده جایزه نقدی می‌شوید!</span>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-amber-500/20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">اسلات ماشین نئونی سلطنتی ۷۷۷ (Royal Neon 777)</h3>
            <p className="text-[11px] text-slate-400">۵ ریل چرخان • ۵ خط پرداخت • ضریب جک‌پات تا ۱۵۰ برابر</p>
          </div>
        </div>

        {/* Top Symbols Paytable Quickview */}
        <div className="flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-400">جوایز:</span>
          <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-amber-300">7️⃣ 150x</span>
          <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-cyan-300">💎 80x</span>
          <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-yellow-300">👑 50x</span>
        </div>
      </div>

      {/* Slot Machine Cabinet */}
      <div className="relative max-w-4xl mx-auto rounded-2xl sm:rounded-3xl p-3 sm:p-8 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] space-y-4 sm:space-y-6">
        {/* Neon Crown Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-serif font-black text-xs sm:text-sm tracking-widest shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            MEGA JACKPOT CASINO
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>

        {/* 5 Reels Screen */}
        <div className="relative rounded-2xl p-2 sm:p-4 bg-slate-950 border-2 border-amber-500/40 shadow-inner overflow-hidden">
          {/* Glass reflection gradient */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 via-transparent to-black/40 z-10" />

          {/* Payline middle guide */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-amber-500/20 z-0 pointer-events-none" />

          <div className="grid grid-cols-5 gap-1.5 sm:gap-4 relative z-0">
            {reels.map((col, colIndex) => (
              <div
                key={colIndex}
                className="flex flex-col gap-1.5 sm:gap-2 p-1 sm:p-2 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg text-center"
              >
                {col.map((symId, rowIndex) => {
                  const sym = SYMBOL_MAP[symId] || { icon: '⭐', nameFa: 'ستاره' };
                  return (
                    <div
                      key={rowIndex}
                      className={`h-14 sm:h-24 rounded-lg flex flex-col items-center justify-center transition-transform duration-300 ${
                        spinning ? 'blur-[1.5px] scale-95 opacity-70 animate-pulse' : 'hover:scale-105'
                      } ${
                        rowIndex === 1 ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-slate-950/60'
                      }`}
                    >
                      <span className="text-2xl sm:text-4xl filter drop-shadow-md select-none">{sym.icon}</span>
                      <span className="hidden sm:block text-[10px] text-slate-400 mt-1 font-semibold">{sym.nameFa}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Win Alert Banner */}
        {lastWin && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/70 border border-emerald-500/40 text-center space-y-1 animate-in zoom-in duration-300">
            <div className="text-xs uppercase text-emerald-400 font-black tracking-wider flex items-center justify-center gap-1">
              <Award className="w-4 h-4" />
              برد باشکوه! شما برنده شدید
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-300">
              +{lastWin.payout.toLocaleString('fa-IR')} تومان
            </div>
            <div className="text-xs text-amber-300">
              مجموع ضریب: {lastWin.multiplier}x ({lastWin.winningLines.map(l => l.name).join('، ')})
            </div>
          </div>
        )}

        {/* Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-2">
          {/* Bet controls */}
          <div className="sm:col-span-7 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>مبلغ شرط هر اسپین:</span>
              <span className="text-amber-300 font-mono font-bold">
                {betAmount.toLocaleString('fa-IR')} تومان
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1000, 5000, 20000, 50000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { sound.chipClick(); setBetAmount(val); }}
                  className={`py-2 rounded-xl text-xs font-mono font-bold transition border ${
                    betAmount === val
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {(val / 1000).toLocaleString('fa-IR')}K
                </button>
              ))}
            </div>
          </div>

          {/* Spin Lever Button */}
          <div className="sm:col-span-5">
            <button
              onClick={handleSpin}
              disabled={spinning}
              className={`w-full py-4 rounded-2xl font-black text-base transition shadow-2xl flex items-center justify-center gap-2 ${
                spinning
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black shadow-amber-500/40 active:scale-98'
              }`}
            >
              {spinning ? (
                'در حال چرخش اسلات...'
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-black" />
                  <span>چرخش (SPIN)</span>
                </>
              )}
            </button>
          </div>
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
