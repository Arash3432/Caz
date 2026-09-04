import React, { useState, useRef, useEffect } from 'react';
import { CircleDot, RotateCcw, Sparkles, Coins, CheckCircle, AlertTriangle, ChevronRight, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '../../types';
import { sound } from '../../utils/audio';

interface RouletteGameProps {
  user: User | null;
  onUpdateUser: (user: User) => void;
  onRequireAuth: () => void;
  onBackToLobby?: () => void;
}

const ROULETTE_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];
const RED_NUMS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export const RouletteGame: React.FC<RouletteGameProps> = ({ user, onUpdateUser, onRequireAuth, onBackToLobby }) => {
  const [selectedChip, setSelectedChip] = useState<number>(5000);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [spinning, setSpinning] = useState<boolean>(false);
  const [mobileView, setMobileView] = useState<'table' | 'wheel'>('table');
  const [lastResult, setLastResult] = useState<{ number: number; color: string; payout: number; netProfit: number } | null>(null);
  const [showBeginnerGuide, setShowBeginnerGuide] = useState<boolean>(false);
  const [history, setHistory] = useState<{ number: number; color: string }[]>([
    { number: 17, color: 'black' },
    { number: 32, color: 'red' },
    { number: 0, color: 'green' },
    { number: 7, color: 'red' },
  ]);
  const [message, setMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelAngleRef = useRef<number>(0);
  const ballAngleRef = useRef<number>(0);

  const chips = [1000, 5000, 20000, 50000, 100000];

  // Draw initial static wheel
  useEffect(() => {
    drawWheel(wheelAngleRef.current, ballAngleRef.current, 0.85);
  }, []);

  const drawWheel = (wheelAngle: number, ballAngle: number, ballRadiusFactor = 0.85) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) - 15;

    ctx.clearRect(0, 0, w, h);

    // Outer brass / gold border
    const rimGrad = ctx.createRadialGradient(cx, cy, radius - 15, cx, cy, radius + 10);
    rimGrad.addColorStop(0, '#78350f');
    rimGrad.addColorStop(0.5, '#f59e0b');
    rimGrad.addColorStop(1, '#451a03');

    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = rimGrad;
    ctx.fill();

    // Wheel slots
    const totalSlots = ROULETTE_ORDER.length;
    const slice = (Math.PI * 2) / totalSlots;

    ROULETTE_ORDER.forEach((num, i) => {
      const startAngle = wheelAngle + i * slice;
      const endAngle = startAngle + slice;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();

      if (num === 0) {
        ctx.fillStyle = '#059669'; // Green 0
      } else if (RED_NUMS.includes(num)) {
        ctx.fillStyle = '#dc2626'; // Red
      } else {
        ctx.fillStyle = '#1e293b'; // Black / Dark Slate
      }
      ctx.fill();

      // Divider line
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Number text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + slice / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px JetBrains Mono, sans-serif';
      ctx.fillText(num.toString(), radius - 14, 4);
      ctx.restore();
    });

    // Inner hub
    const hubGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, radius * 0.45);
    hubGrad.addColorStop(0, '#fef08a');
    hubGrad.addColorStop(0.4, '#b45309');
    hubGrad.addColorStop(1, '#0f172a');

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center jewel
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    // Ball
    const ballDistance = radius * ballRadiusFactor;
    const bx = cx + Math.cos(ballAngle) * ballDistance;
    const by = cy + Math.sin(ballAngle) * ballDistance;

    ctx.beginPath();
    ctx.arc(bx, by, 7, 0, Math.PI * 2);
    const ballGrad = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, 7);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.8, '#cbd5e1');
    ballGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = ballGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  const addBet = (key: string) => {
    if (spinning) return;
    sound.chipClick();
    setBets(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + selectedChip,
    }));
  };

  const clearBets = () => {
    if (spinning) return;
    sound.chipClick();
    setBets({});
  };

  const doubleBets = () => {
    if (spinning) return;
    sound.chipClick();
    setBets(prev => {
      const next: Record<string, number> = {};
      for (const k of Object.keys(prev)) {
        next[k] = prev[k] * 2;
      }
      return next;
    });
  };

  const totalBetAmount: number = (Object.values(bets) as number[]).reduce(
    (a: number, b: number) => a + b,
    0
  );

  const handleSpin = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    if (totalBetAmount <= 0) {
      setMessage('لطفاً ابتدا شرط خود را روی میز قرار دهید.');
      return;
    }
    if (user.balance < totalBetAmount) {
      setMessage('موجودی شما کافی نیست. از شارژ تست استفاده کنید.');
      return;
    }

    setSpinning(true);
    setMobileView('wheel');
    setMessage(null);
    setLastResult(null);
    sound.rouletteSpin();

    try {
      const res = await fetch('/api/games/roulette/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aria_token')}`,
        },
        body: JSON.stringify({ bets }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ثبت رولت');

      // Animate spin to target winning number
      const targetNum = data.winningNumber;
      const targetIndex = ROULETTE_ORDER.indexOf(targetNum);
      const slice = (Math.PI * 2) / ROULETTE_ORDER.length;

      // Spin physics
      const startTime = performance.now();
      const duration = 4000; // 4 seconds spin
      const startWheel = wheelAngleRef.current;
      const startBall = ballAngleRef.current;
      const extraWheelRotations = Math.PI * 2 * 5;
      const extraBallRotations = -Math.PI * 2 * 9; // Ball spins opposite

      const finalWheel = startWheel + extraWheelRotations;
      // Ball settles precisely on slice of targetNum
      const finalBall = finalWheel + (targetIndex * slice) + slice / 2;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Ease-out cubic
        const ease = 1 - Math.pow(1 - progress, 3);

        const curWheel = startWheel + extraWheelRotations * ease;
        const curBall = startBall + (finalBall - startBall) * ease;
        const ballRadiusFactor = 0.88 - ease * 0.14; // Drops into pocket

        wheelAngleRef.current = curWheel;
        ballAngleRef.current = curBall;

        drawWheel(curWheel, curBall, ballRadiusFactor);

        if (Math.random() > 0.6) {
          sound.rouletteTick();
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Finished spin
          setSpinning(false);
          setLastResult(data);
          onUpdateUser({ ...user, balance: data.balance });
          setHistory(prev => [{ number: data.winningNumber, color: data.color }, ...prev.slice(0, 10)]);

          if (data.won) {
            sound.win();
            confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
          }
        }
      };

      requestAnimationFrame(animate);
    } catch (err: any) {
      setSpinning(false);
      setMessage(err.message || 'خطا در چرخش');
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
              <ChevronRight className="w-4 h-4 text-emerald-400" />
              <span>سالن بازی‌ها</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <CircleDot className="w-4 h-4 text-emerald-400" />
            <span>رولت اروپایی</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
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
              ? 'bg-emerald-500 text-black border-emerald-400'
              : 'bg-slate-900 text-emerald-300 border-emerald-500/30 hover:bg-slate-850'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showBeginnerGuide ? 'بستن راهنما' : '💡 راهنمای ساده مبتدیان'}</span>
        </button>
      </div>

      {/* Beginner Quick Tutorial Box */}
      {showBeginnerGuide && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 text-xs space-y-2 animate-in fade-in duration-200 shadow-md">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <CircleDot className="w-4 h-4" />
            <span>چگونه بدون دانش قبلی رولت بازی کنیم؟</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-emerald-300 block mb-0.5">۱. انتخاب ژتون:</span>
              <span>یک ژتون (مثلاً ۵ هزار تومان) از نوار پایین انتخاب کنید.</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-red-400 block mb-0.5">۲. ساده‌ترین شرط:</span>
              <span>روی مستطیل «قرمز» یا «مشکی» ضربه بزنید تا ژتون قرار گیرد (احتمال برد نزدیک ۵۰٪).</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-yellow-300 block mb-0.5">۳. چرخش چرخ:</span>
              <span>دکمه زرد «چرخش رولت» را بزنید! اگر توپ در رنگ شما بایستد، برنده ۲ برابر می‌شوید.</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner & History */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-amber-500/20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CircleDot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">رولت اروپایی سلطنتی (Royal Roulette)</h3>
            <p className="text-[11px] text-slate-400">ضریب رنگ یا زوج/فرد ۲ برابر • ضریب عدد مستقیم ۳۶ برابر</p>
          </div>
        </div>

        {/* History of last winning numbers */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs text-slate-400 ml-1">اعداد اخیر:</span>
          {history.map((h, i) => (
            <span
              key={i}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shadow-md ${
                h.number === 0
                  ? 'bg-emerald-600 text-white'
                  : h.color === 'red'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-slate-100 border border-slate-700'
              }`}
            >
              {h.number}
            </span>
          ))}
        </div>
      </div>

      {/* Mobile Tab Switcher (Wheel vs Table) */}
      <div className="lg:hidden flex items-center p-1 bg-slate-900 rounded-2xl border border-slate-800">
        <button
          onClick={() => {
            setMobileView('table');
            sound.chipClick();
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileView === 'table'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🎯 میز شرط‌بندی</span>
          {totalBetAmount > 0 && (
            <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-full font-mono">
              {(totalBetAmount / 1000).toLocaleString('fa-IR')}K
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setMobileView('wheel');
            sound.chipClick();
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileView === 'wheel'
              ? 'bg-emerald-500 text-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CircleDot className="w-3.5 h-3.5" />
          <span>چرخ رولت {spinning ? '⏳' : ''}</span>
        </button>
      </div>

      {/* Main Table Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left Col: Visual Roulette Wheel Canvas */}
        <div className={`lg:col-span-5 ${mobileView === 'wheel' ? 'flex' : 'hidden lg:flex'} flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl space-y-4`}>
          <div className="relative">
            <canvas ref={canvasRef} width={360} height={360} className="w-[260px] h-[260px] sm:w-[340px] sm:h-[340px]" />

            {/* Winning Display Modal if Spin Finished */}
            {lastResult && !spinning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-full animate-in fade-in zoom-in duration-300">
                <span className="text-xs uppercase text-amber-400 font-bold tracking-widest">عدد برنده</span>
                <span
                  className={`text-6xl font-black font-mono my-1 ${
                    lastResult.number === 0
                      ? 'text-emerald-400'
                      : lastResult.color === 'red'
                      ? 'text-red-500'
                      : 'text-slate-100'
                  }`}
                >
                  {lastResult.number}
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  {lastResult.number === 0 ? 'سبز صفر' : lastResult.color === 'red' ? 'قرمز' : 'مشکی'}
                </span>
                {lastResult.won ? (
                  <div className="mt-2 text-center text-emerald-400 font-bold text-xs bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
                    سود شما: +{lastResult.netProfit.toLocaleString('fa-IR')} تومان
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-rose-400">بدون برد در این دور</div>
                )}
                {/* Mobile back to table button */}
                <button
                  onClick={() => setMobileView('table')}
                  className="lg:hidden mt-3 px-3 py-1 rounded-full bg-amber-500 text-black text-[11px] font-bold shadow"
                >
                  ثبت شرط جدید در میز ↵
                </button>
              </div>
            )}
          </div>

          {/* Chips Selector */}
          <div className="w-full space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>انتخاب ارزش ژتون:</span>
              <span className="text-amber-300 font-mono font-bold">
                {selectedChip.toLocaleString('fa-IR')} تومان
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              {chips.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { sound.chipClick(); setSelectedChip(val); }}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full text-xs font-bold font-mono flex items-center justify-center transition shadow-lg border-2 ${
                    selectedChip === val
                      ? 'border-amber-400 scale-110 shadow-amber-500/30'
                      : 'border-slate-700 hover:border-slate-500'
                  } ${
                    val === 1000 ? 'bg-blue-600 text-white' :
                    val === 5000 ? 'bg-red-600 text-white' :
                    val === 20000 ? 'bg-emerald-600 text-white' :
                    val === 50000 ? 'bg-purple-600 text-white' : 'bg-amber-600 text-white'
                  }`}
                >
                  {(val / 1000).toLocaleString('fa-IR')}K
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: European Roulette Betting Grid */}
        <div className={`lg:col-span-7 ${mobileView === 'table' ? 'block' : 'hidden lg:block'} p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3.5`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-300">میز شرط‌بندی رولت اروپایی:</span>
            <div className="text-xs text-amber-300 font-mono font-bold">
              مجموع شرط: {totalBetAmount.toLocaleString('fa-IR')} ت
            </div>
          </div>

          {/* 0 (Zero) row */}
          <div className="grid grid-cols-1 gap-1">
            <button
              onClick={() => addBet('number_0')}
              className="py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-sm border border-emerald-500/50 transition relative"
            >
              ۰ (صفر سبز)
              {bets['number_0'] && (
                <span className="absolute left-2 top-2 bg-amber-400 text-black text-[10px] font-mono px-1.5 py-0.5 rounded-full font-black">
                  {(bets['number_0'] / 1000).toLocaleString('fa-IR')}K
                </span>
              )}
            </button>
          </div>

          {/* 36 Numbers Grid (3 rows x 12 cols) */}
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5" dir="ltr">
            {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => {
              const isRed = RED_NUMS.includes(n);
              const betVal = bets[`number_${n}`];
              return (
                <button
                  key={n}
                  onClick={() => addBet(`number_${n}`)}
                  className={`h-11 rounded-lg font-mono font-bold text-sm flex items-center justify-center transition relative border ${
                    isRed
                      ? 'bg-red-700 hover:bg-red-600 text-white border-red-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                  }`}
                >
                  {n}
                  {betVal && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-black text-[9px] font-mono font-black px-1 rounded-full shadow">
                      {(betVal / 1000).toLocaleString('fa-IR')}K
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Dozens */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'dozen_1', name: 'دوازده اول (۱-۱۲)' },
              { id: 'dozen_2', name: 'دوازده دوم (۱۳-۲۴)' },
              { id: 'dozen_3', name: 'دوازده سوم (۲۵-۳۶)' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => addBet(d.id)}
                className="py-2 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition relative"
              >
                {d.name}
                {bets[d.id] && (
                  <span className="absolute left-1 top-1 bg-amber-400 text-black text-[9px] font-mono font-black px-1 rounded-full">
                    {(bets[d.id] / 1000).toLocaleString('fa-IR')}K
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Outside Bets (Red/Black, Even/Odd, Low/High) */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <button
              onClick={() => addBet('low')}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 relative"
            >
              ۱ تا ۱۸
              {bets['low'] && (
                <span className="absolute left-1 top-1 bg-amber-400 text-black text-[9px] font-mono font-black px-1 rounded-full">
                  {(bets['low'] / 1000).toLocaleString('fa-IR')}K
                </span>
              )}
            </button>
            <button
              onClick={() => addBet('even')}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 relative"
            >
              زوج (Even)
              {bets['even'] && (
                <span className="absolute left-1 top-1 bg-amber-400 text-black text-[9px] font-mono font-black px-1 rounded-full">
                  {(bets['even'] / 1000).toLocaleString('fa-IR')}K
                </span>
              )}
            </button>
            <button
              onClick={() => addBet('red')}
              className="py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-xs font-bold text-white border border-red-500/40 relative"
            >
              قرمز (Red)
              {bets['red'] && (
                <span className="absolute left-1 top-1 bg-amber-400 text-black text-[9px] font-mono font-black px-1 rounded-full">
                  {(bets['red'] / 1000).toLocaleString('fa-IR')}K
                </span>
              )}
            </button>
            <button
              onClick={() => addBet('black')}
              className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700 relative"
            >
              مشکی (Black)
              {bets['black'] && (
                <span className="absolute left-1 top-1 bg-amber-400 text-black text-[9px] font-mono font-black px-1 rounded-full">
                  {(bets['black'] / 1000).toLocaleString('fa-IR')}K
                </span>
              )}
            </button>
            <button
              onClick={() => addBet('odd')}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 relative"
            >
              فرد (Odd)
              {bets['odd'] && (
                <span className="absolute left-1 top-1 bg-amber-400 text-black text-[9px] font-mono font-black px-1 rounded-full">
                  {(bets['odd'] / 1000).toLocaleString('fa-IR')}K
                </span>
              )}
            </button>
            <button
              onClick={() => addBet('high')}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 relative"
            >
              ۱۹ تا ۳۶
              {bets['high'] && (
                <span className="absolute left-1 top-1 bg-amber-400 text-black text-[9px] font-mono font-black px-1 rounded-full">
                  {(bets['high'] / 1000).toLocaleString('fa-IR')}K
                </span>
              )}
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={clearBets}
              disabled={spinning}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
            >
              پاک کردن ژتون‌ها
            </button>
            <button
              onClick={doubleBets}
              disabled={spinning}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
            >
              ۲X دوبرابر کردن
            </button>

            <button
              onClick={handleSpin}
              disabled={spinning || totalBetAmount <= 0}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-sm shadow-xl shadow-emerald-950/50 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {spinning ? (
                'در حال چرخش چرخ رولت...'
              ) : (
                <>
                  <CircleDot className="w-4 h-4" />
                  <span>چرخش چرخ ({totalBetAmount.toLocaleString('fa-IR')} تومان)</span>
                </>
              )}
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
    </div>
  );
};
