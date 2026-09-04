import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Rocket,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  Zap,
  RotateCcw,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '../../types';
import { sound } from '../../utils/audio';
import { CasinoChipSelector } from './CasinoChipSelector';

interface CrashGameProps {
  user: User | null;
  onUpdateUser: (user: User) => void;
  onRequireAuth: () => void;
  onBackToLobby?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
}

export const CrashGame: React.FC<CrashGameProps> = ({ user, onUpdateUser, onRequireAuth, onBackToLobby }) => {
  const [betAmount, setBetAmount] = useState<number>(5000);
  const [autoCashout, setAutoCashout] = useState<string>('2.00');
  const [state, setState] = useState<'betting' | 'flying' | 'crashed'>('betting');
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [bettingCountdown, setBettingCountdown] = useState<number>(5);
  const [history, setHistory] = useState<number[]>([1.84, 3.42, 1.15, 8.2, 2.05, 1.45, 5.1]);
  const [activeBets, setActiveBets] = useState<any[]>([]);
  const [hasBet, setHasBet] = useState<boolean>(false);
  const [cashedOut, setCashedOut] = useState<boolean>(false);
  const [cashoutPayout, setCashoutPayout] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showBeginnerGuide, setShowBeginnerGuide] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const lastRoundIdRef = useRef<string | null>(null);
  const cashingOutRef = useRef<boolean>(false);
  const shakeRef = useRef<number>(0);
  const previousStateRef = useRef<'betting' | 'flying' | 'crashed'>('betting');
  const targetMultiplierRef = useRef<number>(1.00);
  const displayMultiplierRef = useRef<number>(1.00);
  const stateRef = useRef<'betting' | 'flying' | 'crashed'>('betting');

  // Ultra-Smooth, Micro-Stepping Multiplier Ticker (شمرده شمرده و بدون پرش‌های ناگهانی 0.30)
  useEffect(() => {
    let animId: number;

    const smoothStep = () => {
      const currentState = stateRef.current;
      if (currentState === 'flying') {
        const target = targetMultiplierRef.current;
        const current = displayMultiplierRef.current;

        if (target > current) {
          const diff = target - current;
          // Step calculated smoothly: counts up step-by-step with high precision (0.01-0.04 micro-increments)
          // preventing large sudden 0.30 jumps while preserving the speed and tiered acceleration
          const frameIncrement = Math.max(0.01, Math.min(0.04, diff * 0.22));
          const step = Math.min(diff, frameIncrement);
          const next = Number((current + step).toFixed(2));
          displayMultiplierRef.current = next;
          setCurrentMultiplier(next);
        }
      }
      animId = requestAnimationFrame(smoothStep);
    };

    animId = requestAnimationFrame(smoothStep);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Initialize background starfield
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 40; i++) {
      stars.push({
        x: Math.random() * 800,
        y: Math.random() * 400,
        speed: Math.random() * 1.5 + 0.5,
        size: Math.random() * 1.5 + 0.8,
      });
    }
    starsRef.current = stars;
  }, []);

  // Safe async polling loop - prevents requests stacking and UI freezes
  useEffect(() => {
    let isMounted = true;
    let timeoutId: any = null;

    const poll = async () => {
      try {
        const res = await fetch('/api/games/crash/state');
        if (res.ok && isMounted) {
          const data = await res.json();

          // Check for round transitions
          if (lastRoundIdRef.current && lastRoundIdRef.current !== data.roundId) {
            // New round arrived!
            setHasBet(false);
            setCashedOut(false);
            setCashoutPayout(0);
            cashingOutRef.current = false;
          }
          lastRoundIdRef.current = data.roundId;

          // Sound trigger on state change
          if (previousStateRef.current !== data.state) {
            if (data.state === 'flying') {
              sound.whoosh();
              displayMultiplierRef.current = 1.00;
              setCurrentMultiplier(1.00);
            } else if (data.state === 'crashed') {
              sound.rocketExplode();
              sound.explosion();
              shakeRef.current = 28; // Trigger dramatic cinematic screen shake
            }
            previousStateRef.current = data.state;
          }

          stateRef.current = data.state;
          setState(data.state);

          if (data.state === 'flying') {
            targetMultiplierRef.current = data.currentMultiplier;
            if (displayMultiplierRef.current < 1.00) {
              displayMultiplierRef.current = 1.00;
            }
            const diff = targetMultiplierRef.current - displayMultiplierRef.current;
            if (diff > 0) {
              displayMultiplierRef.current = Number((displayMultiplierRef.current + Math.min(diff, Math.max(0.02, diff * 0.45))).toFixed(2));
            } else {
              displayMultiplierRef.current = targetMultiplierRef.current;
            }
            setCurrentMultiplier(displayMultiplierRef.current);
          } else if (data.state === 'crashed') {
            targetMultiplierRef.current = data.currentMultiplier;
            displayMultiplierRef.current = data.currentMultiplier;
            setCurrentMultiplier(data.currentMultiplier);
          } else {
            // betting
            targetMultiplierRef.current = 1.00;
            displayMultiplierRef.current = 1.00;
            setCurrentMultiplier(1.00);
          }

          setBettingCountdown(data.bettingCountdown);
          if (data.history) setHistory(data.history);
          if (data.activeBets) setActiveBets(data.activeBets);

          // Auto-cashout trigger
          const effectiveMultiplier = Math.max(displayMultiplierRef.current, data.currentMultiplier);
          if (hasBet && !cashedOut && !cashingOutRef.current && data.state === 'flying') {
            const target = parseFloat(autoCashout);
            if (!isNaN(target) && target > 1.0 && effectiveMultiplier >= target) {
              cashingOutRef.current = true;
              handleCashout();
            }
          }
        }
      } catch (err) {
        // network pause
      } finally {
        if (isMounted) {
          timeoutId = setTimeout(poll, 90);
        }
      }
    };

    poll();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [hasBet, cashedOut, autoCashout]);

  // High-Performance 60fps Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      ctx.save();

      // Screen shake calculation
      if (shakeRef.current > 0) {
        const sx = (Math.random() - 0.5) * shakeRef.current;
        const sy = (Math.random() - 0.5) * shakeRef.current;
        ctx.translate(sx, sy);
        shakeRef.current *= 0.88;
        if (shakeRef.current < 0.3) shakeRef.current = 0;
      } else if (state === 'flying' && currentMultiplier > 3.0) {
        const microShake = Math.min(4, (currentMultiplier - 3.0) * 0.4);
        ctx.translate((Math.random() - 0.5) * microShake, (Math.random() - 0.5) * microShake);
      }

      // Background - deep space gradient
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#050711');
      bgGrad.addColorStop(1, '#090d1a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(-20, -20, w + 40, h + 40);

      // Starfield with warp motion
      const warpSpeed = state === 'flying' ? Math.min(8, 1 + currentMultiplier * 0.4) : 0.8;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      starsRef.current.forEach((star) => {
        star.x -= star.speed * warpSpeed;
        star.y += star.speed * warpSpeed * 0.2;
        if (star.x < 0) star.x = w;
        if (star.y > h) star.y = 0;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Speed tail
        if (state === 'flying' && currentMultiplier > 2.5) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(star.x + star.speed * warpSpeed * 3, star.y - star.speed * warpSpeed * 0.6);
          ctx.stroke();
        }
      });

      // Neon grid lines
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 45;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const paddingLeft = 60;
      const paddingBottom = 45;
      const graphW = w - paddingLeft - 50;
      const graphH = h - paddingBottom - 50;

      // Logarithmic curve progress
      const progress = Math.min(1, Math.log(Math.max(1, currentMultiplier)) / Math.log(14));
      const curX = paddingLeft + graphW * Math.min(1, progress * 1.08);
      const curY = h - paddingBottom - graphH * Math.pow(progress, 1.25);

      // Curve and Area Rendering
      if (state === 'flying' || state === 'crashed') {
        const isCrashed = state === 'crashed';
        const controlX = paddingLeft + (curX - paddingLeft) * 0.45;
        const controlY = h - paddingBottom;

        // Gradient under curve
        ctx.beginPath();
        ctx.moveTo(paddingLeft, h - paddingBottom);
        ctx.quadraticCurveTo(controlX, controlY, curX, curY);
        ctx.lineTo(curX, h - paddingBottom);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, curY, 0, h - paddingBottom);
        if (isCrashed) {
          grad.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
          grad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
        } else if (currentMultiplier >= 10.0) {
          grad.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
          grad.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
        } else if (currentMultiplier >= 3.0) {
          grad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
          grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
        } else {
          grad.addColorStop(0, 'rgba(245, 158, 11, 0.3)');
          grad.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
        }
        ctx.fillStyle = grad;
        ctx.fill();

        // Neon Glow Path
        ctx.beginPath();
        ctx.moveTo(paddingLeft, h - paddingBottom);
        ctx.quadraticCurveTo(controlX, controlY, curX, curY);
        ctx.lineWidth = isCrashed ? 5 : 4;
        ctx.strokeStyle = isCrashed
          ? '#ef4444'
          : currentMultiplier >= 10.0
          ? '#c084fc'
          : currentMultiplier >= 3.0
          ? '#10b981'
          : '#f59e0b';
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Thruster flame particles
        if (state === 'flying') {
          for (let i = 0; i < 4; i++) {
            const colors =
              currentMultiplier >= 10.0
                ? ['#c084fc', '#e879f9', '#ffffff']
                : currentMultiplier >= 3.0
                ? ['#10b981', '#34d399', '#6ee7b7']
                : ['#f59e0b', '#fbbf24', '#f97316'];
            particlesRef.current.push({
              x: curX,
              y: curY,
              vx: -Math.random() * 4 - 2,
              vy: Math.random() * 3 + 1,
              life: 1.0,
              maxLife: 1.0,
              size: Math.random() * 4 + 2,
              color: colors[Math.floor(Math.random() * colors.length)],
            });
          }
        }
      }

      // Draw & Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.035;
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Draw Sci-Fi Starship or Cinematic Shockwave Explosion
      if (state === 'flying') {
        ctx.save();
        ctx.translate(curX, curY);
        ctx.rotate(-0.45);

        // Dynamic Thruster Plasma Exhaust
        const flameLen = 22 + Math.min(35, currentMultiplier * 3);
        const flameW = 8 + Math.sin(Date.now() * 0.035) * 2.5;

        // Outer Flame Plume
        const flameGrad = ctx.createLinearGradient(0, 0, -flameLen, 0);
        flameGrad.addColorStop(
          0,
          currentMultiplier >= 10.0
            ? 'rgba(232, 121, 249, 0.95)'
            : currentMultiplier >= 3.0
            ? 'rgba(52, 211, 153, 0.95)'
            : 'rgba(245, 158, 11, 0.95)'
        );
        flameGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.6)');
        flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(-10, -flameW);
        ctx.quadraticCurveTo(-10 - flameLen * 0.55, 0, -10 - flameLen, 0);
        ctx.quadraticCurveTo(-10 - flameLen * 0.55, 0, -10, flameW);
        ctx.closePath();
        ctx.fill();

        // Inner Super-Hot Core
        const coreGrad = ctx.createLinearGradient(0, 0, -flameLen * 0.5, 0);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.moveTo(-10, -flameW * 0.45);
        ctx.quadraticCurveTo(-10 - flameLen * 0.3, 0, -10 - flameLen * 0.5, 0);
        ctx.quadraticCurveTo(-10 - flameLen * 0.3, 0, -10, flameW * 0.45);
        ctx.closePath();
        ctx.fill();

        // Starship Delta-Wing Hull
        ctx.beginPath();
        ctx.moveTo(22, 0); // Sharp nose
        ctx.lineTo(-9, -15); // Left wingtip
        ctx.lineTo(-5, -6); // Left inner notch
        ctx.lineTo(-11, -7); // Left thruster
        ctx.lineTo(-11, 7); // Right thruster
        ctx.lineTo(-5, 6); // Right inner notch
        ctx.lineTo(-9, 15); // Right wingtip
        ctx.closePath();

        const hullGrad = ctx.createLinearGradient(-10, -15, 22, 15);
        hullGrad.addColorStop(0, '#0f172a');
        hullGrad.addColorStop(0.4, '#1e293b');
        hullGrad.addColorStop(0.75, '#475569');
        hullGrad.addColorStop(1, '#f8fafc');
        ctx.fillStyle = hullGrad;
        ctx.fill();

        // Neon Edge Glow
        ctx.strokeStyle =
          currentMultiplier >= 10.0 ? '#c084fc' : currentMultiplier >= 3.0 ? '#34d399' : '#f59e0b';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Cockpit Glass Canopy
        ctx.beginPath();
        ctx.ellipse(3, 0, 7, 3.5, 0, 0, Math.PI * 2);
        const canopyGrad = ctx.createRadialGradient(4, -1, 1, 3, 0, 8);
        canopyGrad.addColorStop(0, '#67e8f9');
        canopyGrad.addColorStop(0.6, '#0284c7');
        canopyGrad.addColorStop(1, '#0369a1');
        ctx.fillStyle = canopyGrad;
        ctx.fill();
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Navigation Strobes
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(-8, -14, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(-8, 14, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (state === 'crashed') {
        ctx.save();
        ctx.translate(curX, curY);

        // Expanding Shockwave Ring
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Blast Core Fiery Burst
        const blastGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
        blastGrad.addColorStop(0, '#ffffff');
        blastGrad.addColorStop(0.3, '#fef08a');
        blastGrad.addColorStop(0.6, '#f97316');
        blastGrad.addColorStop(0.9, '#ef4444');
        blastGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = blastGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.fill();

        // Starburst Spikes
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        for (let a = 0; a < 8; a++) {
          const ang = (a * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * 10, Math.sin(ang) * 10);
          ctx.lineTo(Math.cos(ang) * 32, Math.sin(ang) * 32);
          ctx.stroke();
        }

        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [state, currentMultiplier]);

  const handlePlaceBet = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    if (user.balance < betAmount) {
      setMessage({ text: 'موجودی حساب کافی نیست. از دکمه شارژ تست استفاده کنید.', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/games/crash/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aria_token')}`,
        },
        body: JSON.stringify({ betAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ثبت شرط');

      sound.chipClick();
      setHasBet(true);
      setCashedOut(false);
      cashingOutRef.current = false;
      onUpdateUser({ ...user, balance: data.balance });
      setMessage({ text: 'شرط شما در این راند با موفقیت ثبت شد.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCashout = async () => {
    if (!user || !hasBet || cashedOut) return;
    setLoading(true);
    try {
      const res = await fetch('/api/games/crash/cashout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aria_token')}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در برداشت');

      sound.win();
      confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
      setCashedOut(true);
      setCashoutPayout(data.payout);
      onUpdateUser({ ...user, balance: data.balance });
      setMessage({ text: `تبریک! شما در ضریب ${data.multiplier}x برنده شدید!`, type: 'success' });
    } catch (err: any) {
      cashingOutRef.current = false;
      setMessage({ text: err.message, type: 'error' });
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
              <ChevronRight className="w-4 h-4 text-amber-400" />
              <span>سالن بازی‌ها</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>موشک انفجار</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
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
              ? 'bg-amber-500 text-black border-amber-400'
              : 'bg-slate-900 text-amber-300 border-amber-500/30 hover:bg-slate-850'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showBeginnerGuide ? 'بستن راهنما' : '💡 راهنمای ساده مبتدیان'}</span>
        </button>
      </div>

      {/* Beginner Quick Tutorial Box */}
      {showBeginnerGuide && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 text-xs space-y-2 animate-in fade-in duration-200 shadow-md">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Flame className="w-4 h-4" />
            <span>چگونه در موشک انفجار بازی و برنده شویم؟</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-amber-300 block mb-0.5">۱. ثبت شرط:</span>
              <span>مبلغ ورودی (حداقل ۱,۰۰۰ ت) را مشخص و دکمه زرد ثبت شرط را بزنید.</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-emerald-400 block mb-0.5">۲. پرواز موشک:</span>
              <span>با شروع پرواز، عدد روی صفحه (ضریب سود) ثانیه به ثانیه بالا می‌رود.</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-yellow-300 block mb-0.5">۳. برداشت به موقع:</span>
              <span>قبل از اینکه موشک منفجر شود، دکمه سبز «برداشت سود» را بزنید و برنده شوید!</span>
            </div>
          </div>
        </div>
      )}

      {/* History Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">تاریخچه ضرایب اخیر:</span>
        {history.map((h, i) => (
          <span
            key={i}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono tracking-wider transition ${
              h >= 10
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/30'
                : h >= 2.0
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {h.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Main Game Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 2 Cols: Canvas & Multiplier Screen */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-950 shadow-2xl h-[260px] sm:h-[360px] flex flex-col">
          {/* Multiplier Central HUD */}
          <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
            {state === 'betting' ? (
              <div className="text-center space-y-1 sm:space-y-2 animate-in zoom-in duration-200">
                <div className="text-[11px] sm:text-xs uppercase tracking-widest text-amber-400 font-bold animate-pulse">
                  شروع راند بعدی در
                </div>
                <div className="text-4xl sm:text-6xl font-black font-mono text-white tracking-wider filter drop-shadow">
                  {bettingCountdown} ثانیه
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400">فرصت ثبت شرط پیش از پرواز</div>
              </div>
            ) : state === 'flying' ? (
              <div className="text-center space-y-1 animate-in zoom-in-75 duration-100">
                <div
                  className={`text-5xl sm:text-7xl font-black font-mono tracking-tight transition-colors duration-300 ${
                    currentMultiplier >= 10.0
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-200 drop-shadow-[0_10px_25px_rgba(192,132,252,0.8)]'
                      : currentMultiplier >= 3.0
                      ? 'text-emerald-400 drop-shadow-[0_10px_20px_rgba(16,185,129,0.6)]'
                      : 'text-amber-400 drop-shadow-[0_10px_20px_rgba(245,158,11,0.5)]'
                  }`}
                >
                  {currentMultiplier.toFixed(2)}x
                </div>
                <div className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5 animate-bounce" />
                  <span>در حال اوج‌گیری موشک...</span>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-1 animate-in zoom-in duration-200">
                <div className="text-[11px] sm:text-xs uppercase tracking-widest text-rose-400 font-bold">منفجر شد در</div>
                <div className="text-5xl sm:text-7xl font-black font-mono text-rose-500 tracking-tight drop-shadow-[0_10px_20px_rgba(239,68,68,0.7)]">
                  {currentMultiplier.toFixed(2)}x
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400">راند به پایان رسید</div>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} width={800} height={400} className="w-full h-full object-cover" />
        </div>

        {/* Right Col: Bet Control Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 space-y-3.5 shadow-xl flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-xs sm:text-sm">
                <Flame className="w-4 h-4 text-amber-400" />
                کنترل پنل شرط‌بندی انفجار
              </h3>
              <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                حداقل ۱,۰۰۰ ت
              </span>
            </div>

            {/* Casino Chip Selector Component */}
            <CasinoChipSelector
              betAmount={betAmount}
              onBetChange={setBetAmount}
              disabled={hasBet && state !== 'betting'}
              userBalance={user?.balance || 500000}
              minBet={1000}
              label="مبلغ ورودی به راند پرواز"
              accentColor="amber"
            />

            {/* Auto Cashout */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">برداشت خودکار در ضریب:</label>
              <input
                type="text"
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value)}
                placeholder="مثال: 2.00"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-400 font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {message && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                }`}
              >
                {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2">
            {!user ? (
              <button
                onClick={onRequireAuth}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-sm shadow-lg shadow-amber-950/40 hover:from-amber-400 hover:to-yellow-400 transition"
              >
                ورود به حساب برای شروع بازی
              </button>
            ) : hasBet && state === 'flying' && !cashedOut ? (
              <button
                onClick={handleCashout}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm sm:text-base shadow-xl shadow-emerald-950/50 transition active:scale-95 animate-pulse flex items-center justify-center gap-2"
              >
                <span>برداشت سود:</span>
                <span className="font-mono text-base sm:text-lg font-black" dir="ltr">
                  {Math.floor(betAmount * currentMultiplier).toLocaleString('fa-IR')} ت
                </span>
                <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded">({currentMultiplier.toFixed(2)}x)</span>
              </button>
            ) : (
              <button
                onClick={handlePlaceBet}
                disabled={loading || (hasBet && state !== 'crashed') || state !== 'betting'}
                className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm transition shadow-lg flex items-center justify-center gap-2 ${
                  hasBet && state === 'betting'
                    ? 'bg-slate-800 text-amber-300 border border-amber-500/40'
                    : state === 'betting'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-amber-950/40 active:scale-98'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {hasBet && state === 'betting'
                  ? 'شرط ثبت شد (منتظر پرواز)'
                  : state === 'betting'
                  ? `ثبت شرط (${betAmount.toLocaleString('fa-IR')} ت)`
                  : 'در انتظار راند بعدی...'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Active Bets of Players (Collapsible on Mobile) */}
      <details className="p-3 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800 group" open={false}>
        <summary className="flex items-center justify-between cursor-pointer list-none select-none">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Users className="w-4 h-4 text-amber-400" />
            <span>شرط‌های بازیکنان در این راند ({activeBets.length} نفر)</span>
          </div>
          <span className="text-[11px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
        </summary>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-3">
          {activeBets.length === 0 ? (
            <div className="col-span-full text-center py-3 text-xs text-slate-500">
              هنوز شرطی در این راند ثبت نشده است.
            </div>
          ) : (
            activeBets.map((b, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                  b.cashedOut
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="font-semibold truncate max-w-[90px]">{b.username}</div>
                <div className="font-mono text-[11px] text-amber-300" dir="ltr">
                  {b.betAmount.toLocaleString('fa-IR')} ت
                </div>
                {b.cashedOut ? (
                  <span className="font-mono font-bold text-emerald-400 text-[11px]">
                    {b.cashoutMultiplier?.toFixed(2)}x
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">در بازی</span>
                )}
              </div>
            ))
          )}
        </div>
      </details>

      {/* Sticky Mobile Cashout Bar (Appears when flying with active bet) */}
      {hasBet && state === 'flying' && !cashedOut && (
        <div className="fixed bottom-[64px] left-3 right-3 z-40 sm:hidden animate-in slide-in-from-bottom-5 duration-200">
          <button
            onClick={handleCashout}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-base shadow-[0_0_35px_rgba(16,185,129,0.7)] flex items-center justify-between border-2 border-white ring-4 ring-emerald-500/40 active:scale-95 animate-pulse"
          >
            <div className="flex items-center gap-2 text-right">
              <Zap className="w-5 h-5 text-black animate-bounce" />
              <div>
                <div className="text-[11px] font-bold text-slate-950 leading-tight">برداشت فوری سود</div>
                <div className="text-xs font-mono font-black text-emerald-950">({currentMultiplier.toFixed(2)}x)</div>
              </div>
            </div>
            <div className="font-mono text-base font-black text-slate-950" dir="ltr">
              {Math.floor(betAmount * currentMultiplier).toLocaleString('fa-IR')} ت
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
