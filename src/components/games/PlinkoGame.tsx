import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronRight, HelpCircle, ArrowDown, Award, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '../../types';
import { sound } from '../../utils/audio';

interface PlinkoGameProps {
  user: User | null;
  onUpdateUser: (user: User) => void;
  onRequireAuth: () => void;
  onBackToLobby?: () => void;
}

const MULTIPLIERS = [16, 9, 2, 1.4, 0.4, 0.2, 0.4, 1.4, 2, 9, 16];
const MULTIPLIER_COLORS = [
  'bg-red-600 text-white',
  'bg-orange-500 text-white',
  'bg-amber-500 text-black',
  'bg-yellow-400 text-black',
  'bg-slate-700 text-slate-300',
  'bg-slate-800 text-slate-400',
  'bg-slate-700 text-slate-300',
  'bg-yellow-400 text-black',
  'bg-amber-500 text-black',
  'bg-orange-500 text-white',
  'bg-red-600 text-white',
];

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  step: number;
  path: number[];
  targetSlot: number;
  completed: boolean;
  color: string;
}

export const PlinkoGame: React.FC<PlinkoGameProps> = ({ user, onUpdateUser, onRequireAuth, onBackToLobby }) => {
  const [betAmount, setBetAmount] = useState<number>(5000);
  const [dropping, setDropping] = useState<boolean>(false);
  const [showBeginnerGuide, setShowBeginnerGuide] = useState<boolean>(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<{ payout: number; multiplier: number; won: boolean } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ballsRef = useRef<Ball[]>([]);
  const pegHitsRef = useRef<{ x: number; y: number; alpha: number }[]>([]);

  const rows = 10;

  // Render loop for Plinko Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Dark background
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, w, h);

      const startY = 40;
      const rowSpacing = (h - startY - 55) / rows;
      const baseSpacing = w / (rows + 2);

      // Draw Pegs (Pyramid)
      for (let r = 0; r <= rows; r++) {
        const count = r + 1;
        const rowY = startY + r * rowSpacing;
        const startX = w / 2 - ((count - 1) * baseSpacing) / 2;

        for (let c = 0; c < count; c++) {
          const px = startX + c * baseSpacing;
          const py = rowY;

          // Peg glow
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#f8fafc';
          ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Draw Peg Hit Rings
      for (let i = pegHitsRef.current.length - 1; i >= 0; i--) {
        const hit = pegHitsRef.current[i];
        ctx.beginPath();
        ctx.arc(hit.x, hit.y, (1 - hit.alpha) * 16 + 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245, 158, 11, ${hit.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        hit.alpha -= 0.05;
        if (hit.alpha <= 0) pegHitsRef.current.splice(i, 1);
      }

      // Update and Draw Balls
      ballsRef.current.forEach((ball) => {
        if (ball.completed) return;

        // Current target peg based on path
        const currentTargetRow = ball.step;
        if (currentTargetRow <= rows) {
          const targetRowY = startY + currentTargetRow * rowSpacing;
          let colSum = 0;
          for (let s = 0; s < currentTargetRow; s++) {
            colSum += ball.path[s];
          }
          const rowCount = currentTargetRow + 1;
          const targetStartX = w / 2 - ((rowCount - 1) * baseSpacing) / 2;
          const targetX = targetStartX + colSum * baseSpacing;

          // Move towards target peg
          const dx = targetX - ball.x;
          const dy = targetRowY - ball.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const speed = 7.5;
          if (dist < speed) {
            ball.x = targetX;
            ball.y = targetRowY;
            ball.step++;

            // Hit peg effect and audio
            pegHitsRef.current.push({ x: targetX, y: targetRowY, alpha: 1 });
            sound.pegBounce(1 + ball.step * 0.08);

            if (ball.step > rows) {
              ball.completed = true;
              setActiveSlot(ball.targetSlot);
              setTimeout(() => setActiveSlot(null), 1200);
            }
          } else {
            ball.x += (dx / dist) * speed;
            ball.y += (dy / dist) * speed;
          }
        }

        // Draw Ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.shadowColor = ball.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, []);

  const handleDrop = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    if (user.balance < betAmount) {
      setMessage('موجودی حساب کافی نیست.');
      return;
    }

    setDropping(true);
    setMessage(null);
    setLastWin(null);
    sound.chipClick();

    try {
      const res = await fetch('/api/games/plinko/drop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aria_token')}`,
        },
        body: JSON.stringify({ betAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در رهاسازی توپ');

      const canvas = canvasRef.current;
      const initialX = canvas ? canvas.width / 2 : 250;

      // Spawn ball
      const newBall: Ball = {
        x: initialX,
        y: 15,
        vx: 0,
        vy: 3,
        step: 0,
        path: data.path,
        targetSlot: data.slotIndex,
        completed: false,
        color: data.multiplier >= 2 ? '#fbbf24' : '#38bdf8',
      };
      ballsRef.current = [newBall];

      // Wait until ball reaches bottom (approx 1.8s)
      setTimeout(() => {
        setDropping(false);
        onUpdateUser({ ...user, balance: data.balance });
        setLastWin({
          payout: data.payout,
          multiplier: data.multiplier,
          won: data.won,
        });

        if (data.multiplier >= 2) {
          sound.win();
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
        } else if (data.multiplier < 1) {
          sound.lose();
        }
      }, 1900);
    } catch (err: any) {
      setDropping(false);
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
              <ChevronRight className="w-4 h-4 text-pink-400" />
              <span>سالن بازی‌ها</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>پلینکو نئونی (Neon Plinko)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20">
              هیجان فوق‌العاده
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
              ? 'bg-pink-500 text-black border-pink-400'
              : 'bg-slate-900 text-pink-300 border-pink-500/30 hover:bg-slate-850'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showBeginnerGuide ? 'بستن راهنما' : '💡 راهنمای ساده مبتدیان'}</span>
        </button>
      </div>

      {/* Beginner Quick Tutorial Box */}
      {showBeginnerGuide && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/30 via-slate-900 to-slate-900 border border-pink-500/30 text-xs space-y-2 animate-in fade-in duration-200 shadow-md">
          <div className="flex items-center gap-1.5 text-pink-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>چگونه در پلینکو بازی کنیم؟</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-pink-300 block mb-0.5">۱. تعیین مبلغ شرط:</span>
              <span>مبلغ ورودی دلخواه را انتخاب و دکمه «رهاسازی توپ» را بزنید.</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-yellow-400 block mb-0.5">۲. برخورد با میخ‌ها:</span>
              <span>توپ از بالای هرم رها شده و با برخورد به میخ‌ها به چپ یا راست منحرف می‌شود.</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-emerald-300 block mb-0.5">۳. ضرایب شگفت‌انگیز:</span>
              <span>هر چه توپ به کناره‌های هرم برود، ضریب برد شما تا ۱۶ برابر افزایش می‌یابد!</span>
            </div>
          </div>
        </div>
      )}

      {/* Plinko Board Stage */}
      <div className="max-w-2xl mx-auto rounded-3xl p-3 sm:p-5 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-pink-500/20 shadow-2xl space-y-3">
        {/* Canvas for Pyramid */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
          <canvas ref={canvasRef} width={500} height={380} className="w-full h-[320px] sm:h-[380px] object-contain mx-auto" />

          {/* Multiplier Bucket Slots at bottom */}
          <div className="absolute bottom-1 left-0 right-0 px-2 sm:px-4 flex justify-between gap-1">
            {MULTIPLIERS.map((mult, idx) => (
              <div
                key={idx}
                className={`flex-1 py-1 sm:py-1.5 rounded-lg text-center font-mono font-black text-[10px] sm:text-xs transition-all duration-200 border ${
                  activeSlot === idx
                    ? 'scale-125 -translate-y-2 shadow-lg shadow-pink-500/60 border-white ring-2 ring-pink-400'
                    : 'border-transparent opacity-90'
                } ${MULTIPLIER_COLORS[idx]}`}
              >
                {mult}x
              </div>
            ))}
          </div>
        </div>

        {/* Win / Outcome Card */}
        {lastWin && (
          <div
            className={`p-3 rounded-xl border text-center animate-in zoom-in-95 duration-200 ${
              lastWin.multiplier >= 1
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <div className="text-xs font-bold">
              {lastWin.multiplier >= 1 ? '🎉 برنده شدید!' : 'نتیجه این پرتاب:'}
            </div>
            <div className="text-xl font-mono font-black mt-0.5">
              ضریب {lastWin.multiplier}x • {lastWin.payout.toLocaleString('fa-IR')} تومان
            </div>
          </div>
        )}

        {/* Controls Card */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-semibold">مبلغ شرط (تومان):</label>
            <div className="text-xs text-pink-400 font-mono font-bold">
              {betAmount.toLocaleString('fa-IR')} ت
            </div>
          </div>

          <input
            type="number"
            min={1000}
            step={1000}
            disabled={dropping}
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1000, Number(e.target.value)))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-pink-500"
          />

          <div className="grid grid-cols-4 gap-1.5">
            {[1000, 5000, 20000, 50000].map((val) => (
              <button
                key={val}
                type="button"
                disabled={dropping}
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

          {message && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
              {message}
            </div>
          )}

          <button
            onClick={handleDrop}
            disabled={dropping}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-black font-black text-sm sm:text-base shadow-xl shadow-pink-950/50 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <ArrowDown className={`w-5 h-5 ${dropping ? 'animate-bounce' : ''}`} />
            <span>{dropping ? 'توپ در حال سقوط...' : 'رهاسازی توپ پلینکو'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
