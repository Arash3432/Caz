import React, { useState } from 'react';
import { Bomb, Gem, Sparkles, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '../../types';
import { sound } from '../../utils/audio';

interface MinesGameProps {
  user: User | null;
  onUpdateUser: (user: User) => void;
  onRequireAuth: () => void;
  onBackToLobby?: () => void;
}

export const MinesGame: React.FC<MinesGameProps> = ({ user, onUpdateUser, onRequireAuth, onBackToLobby }) => {
  const [betAmount, setBetAmount] = useState<number>(5000);
  const [minesCount, setMinesCount] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
  const [explodedTile, setExplodedTile] = useState<number | null>(null);
  const [fullGrid, setFullGrid] = useState<boolean[] | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [nextMultiplier, setNextMultiplier] = useState<number>(1.12);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showBeginnerGuide, setShowBeginnerGuide] = useState<boolean>(false);

  const startGame = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    if (user.balance < betAmount) {
      setMessage('موجودی حساب کافی نیست.');
      return;
    }

    setLoading(true);
    setMessage(null);
    setRevealedTiles([]);
    setExplodedTile(null);
    setFullGrid(null);
    setCurrentMultiplier(1.0);
    sound.chipClick();

    try {
      const res = await fetch('/api/games/mines/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aria_token')}`,
        },
        body: JSON.stringify({ betAmount, minesCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در شروع بازی مین‌ها');

      setIsPlaying(true);
      onUpdateUser({ ...user, balance: data.balance });
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const revealTile = async (index: number) => {
    if (!isPlaying || revealedTiles.includes(index) || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/games/mines/reveal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aria_token')}`,
        },
        body: JSON.stringify({ tileIndex: index }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در باز کردن خانه');

      if (data.exploded) {
        sound.explosion();
        setExplodedTile(index);
        setFullGrid(data.fullGrid);
        setRevealedTiles(data.revealed);
        setIsPlaying(false);
        setMessage('متأسفانه به مین برخورد کردید!');
      } else {
        sound.gem();
        setRevealedTiles(data.revealed);
        setCurrentMultiplier(data.currentMultiplier);
        setNextMultiplier(data.nextMultiplier);
      }
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCashout = async () => {
    if (!isPlaying || revealedTiles.length === 0 || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/games/mines/cashout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aria_token')}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در تسویه حساب');

      sound.win();
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      setIsPlaying(false);
      setFullGrid(data.fullGrid);
      onUpdateUser({ ...user!, balance: data.balance });
      setMessage(`تسویه موفق! شما مبلغ ${data.payout.toLocaleString('fa-IR')} تومان دریافت کردید.`);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
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
              <ChevronRight className="w-4 h-4 text-blue-400" />
              <span>سالن بازی‌ها</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Bomb className="w-4 h-4 text-blue-400" />
            <span>میدان مین و الماس</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
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
              ? 'bg-blue-500 text-black border-blue-400'
              : 'bg-slate-900 text-blue-300 border-blue-500/30 hover:bg-slate-850'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showBeginnerGuide ? 'بستن راهنما' : '💡 راهنمای ساده مبتدیان'}</span>
        </button>
      </div>

      {/* Beginner Quick Tutorial Box */}
      {showBeginnerGuide && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/30 via-slate-900 to-slate-900 border border-blue-500/30 text-xs space-y-2 animate-in fade-in duration-200 shadow-md">
          <div className="flex items-center gap-1.5 text-blue-400 font-bold">
            <Bomb className="w-4 h-4" />
            <span>چگونه در میدان مین بازی و برنده شویم؟</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-blue-300 block mb-0.5">۱. تعداد بمب‌ها:</span>
              <span>برای برد راحت‌تر، تعداد مین را روی ۳ بمب قرار دهید و «شروع بازی» را بزنید.</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-cyan-400 block mb-0.5">۲. کشف الماس:</span>
              <span>روی هر جعبه دلخواه کلیک کنید. با هر الماس پیدا شده، سود شما فوراً بیشتر می‌شود.</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-emerald-300 block mb-0.5">۳. برداشت هر لحظه:</span>
              <span>نیازی نیست همه را باز کنید! هر زمان راضی بودید دکمه «برداشت سود» را بزنید و ریسک نکنید.</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-amber-500/20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Bomb className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">بازی مین و الماس (Cyber Mines)</h3>
            <p className="text-[11px] text-slate-400">الماس‌ها را کشف کنید، از تله‌های مین دوری نمایید و به موقع نقد کنید!</p>
          </div>
        </div>

        {isPlaying && (
          <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400">ضریب فعلی: </span>
              <span className="font-mono font-bold text-amber-300 text-sm">{currentMultiplier.toFixed(2)}x</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-400">ضریب بعدی: </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{nextMultiplier.toFixed(2)}x</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left Side: 5x5 Mines Grid */}
        <div className="lg:col-span-7 p-3.5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col items-center space-y-3">
          {/* Quick Cashout Bar for Mobile when profit is available */}
          {isPlaying && revealedTiles.length > 0 && (
            <div className="w-full lg:hidden flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40">
              <div className="text-xs text-emerald-300 font-bold">
                سود: <span className="font-mono text-sm">{Math.floor(betAmount * currentMultiplier).toLocaleString('fa-IR')} ت</span> ({currentMultiplier.toFixed(2)}x)
              </div>
              <button
                onClick={handleCashout}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow transition active:scale-95"
              >
                برداشت سریع
              </button>
            </div>
          )}

          <div className="grid grid-cols-5 gap-1.5 sm:gap-3 w-full max-w-[420px] aspect-square">
            {Array.from({ length: 25 }, (_, i) => {
              const isRevealed = revealedTiles.includes(i);
              const isExploded = explodedTile === i;
              const isHiddenMine = fullGrid && fullGrid[i] && !isRevealed;
              const isHiddenGem = fullGrid && !fullGrid[i] && !isRevealed;

              return (
                <button
                  key={i}
                  disabled={!isPlaying || isRevealed || loading}
                  onClick={() => revealTile(i)}
                  className={`rounded-xl flex items-center justify-center transition-all duration-200 border text-xl sm:text-2xl select-none ${
                    isExploded
                      ? 'bg-red-600/90 border-red-400 shadow-lg shadow-red-500/50 scale-105 animate-bounce'
                      : isRevealed
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/20'
                      : isHiddenMine
                      ? 'bg-slate-900 border-red-900/50 opacity-50'
                      : isHiddenGem
                      ? 'bg-slate-900 border-emerald-900/50 opacity-50'
                      : isPlaying
                      ? 'bg-slate-900 hover:bg-slate-800 hover:border-amber-500/60 border-slate-700/80 active:scale-95 shadow-inner'
                      : 'bg-slate-900/50 border-slate-800/80 opacity-60'
                  }`}
                >
                  {isExploded ? (
                    '💥'
                  ) : isRevealed ? (
                    <Gem className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-400 filter drop-shadow animate-in zoom-in-50" />
                  ) : isHiddenMine ? (
                    <Bomb className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 opacity-60" />
                  ) : isHiddenGem ? (
                    <Gem className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 opacity-40" />
                  ) : (
                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-slate-700/60" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Setup & Cashout Controls */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-100">تنظیمات بازی مین‌ها</h4>
          </div>

          {/* Bet Amount */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-semibold">مبلغ شرط (تومان):</label>
            <input
              type="number"
              min={1000}
              step={1000}
              disabled={isPlaying}
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1000, Number(e.target.value)))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-500"
            />
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[1000, 5000, 20000, 50000].map((val) => (
                <button
                  key={val}
                  type="button"
                  disabled={isPlaying}
                  onClick={() => { sound.chipClick(); setBetAmount(val); }}
                  className="py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 transition text-center disabled:opacity-50"
                >
                  {(val / 1000).toLocaleString('fa-IR')}K
                </button>
              ))}
            </div>
          </div>

          {/* Mines Count Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
              <span>تعداد مین‌های مخفی:</span>
              <span className="text-red-400 font-mono font-bold">{minesCount} مین</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 3, 5, 10, 15].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  disabled={isPlaying}
                  onClick={() => setMinesCount(cnt)}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    minesCount === cnt
                      ? 'bg-red-950 border-red-500 text-red-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {message && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            {!isPlaying ? (
              <button
                onClick={startGame}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-950/50 transition flex items-center justify-center gap-2"
              >
                <Bomb className="w-4 h-4" />
                <span>شروع بازی مین‌ها ({betAmount.toLocaleString('fa-IR')} ت)</span>
              </button>
            ) : (
              <button
                onClick={handleCashout}
                disabled={loading || revealedTiles.length === 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-sm shadow-xl shadow-emerald-950/50 transition flex items-center justify-center gap-2 animate-pulse disabled:opacity-50 disabled:animate-none"
              >
                <span>برداشت سود فعلی:</span>
                <span className="font-mono text-base font-black" dir="ltr">
                  {Math.floor(betAmount * currentMultiplier).toLocaleString('fa-IR')} ت
                </span>
                <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded">
                  ({currentMultiplier.toFixed(2)}x)
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
