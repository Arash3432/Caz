import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User as UserIcon,
  Award,
  TrendingUp,
  TrendingDown,
  Percent,
  Copy,
  Check,
  Coins,
  ShieldCheck,
  LogOut,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { User } from '../types';
import { sound } from '../utils/audio';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onOpenFaucet?: () => void;
  onOpenFairModal?: () => void;
  onLogout: () => void;
}

interface VipTier {
  name: string;
  minWager: number;
  color: string;
  badgeBg: string;
  icon: string;
}

const VIP_TIERS: VipTier[] = [
  { name: 'برنزی', minWager: 0, color: 'text-amber-700', badgeBg: 'bg-amber-700/20 border-amber-700/40', icon: '🥉' },
  { name: 'نقره‌ای', minWager: 200000, color: 'text-slate-300', badgeBg: 'bg-slate-300/20 border-slate-300/40', icon: '🥈' },
  { name: 'طلایی', minWager: 1000000, color: 'text-amber-400', badgeBg: 'bg-amber-500/20 border-amber-500/40', icon: '🥇' },
  { name: 'پلاتینیوم', minWager: 5000000, color: 'text-cyan-400', badgeBg: 'bg-cyan-500/20 border-cyan-500/40', icon: '💎' },
  { name: 'الماس VIP', minWager: 15000000, color: 'text-fuchsia-400', badgeBg: 'bg-fuchsia-500/20 border-fuchsia-500/40', icon: '👑' },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenFaucet,
  onOpenFairModal,
  onLogout,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !user) return null;

  const totalBets = user.stats?.totalBets || 0;
  const totalWon = user.stats?.totalWon || 0;
  const totalLost = user.stats?.totalLost || 0;
  const netProfit = totalWon - totalLost;
  const winRate = totalBets > 0 ? Math.round((totalWon > 0 ? (totalWon / (totalWon + totalLost || 1)) * 100 : 0)) : 0;

  // Calculate current VIP Tier
  let currentTierIndex = 0;
  for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
    if (totalLost + totalWon >= VIP_TIERS[i].minWager) {
      currentTierIndex = i;
      break;
    }
  }
  const currentTier = VIP_TIERS[currentTierIndex];
  const nextTier = VIP_TIERS[currentTierIndex + 1] || null;

  const totalWagered = totalWon + totalLost;
  const currentProgress = nextTier
    ? Math.min(100, Math.round(((totalWagered - currentTier.minWager) / (nextTier.minWager - currentTier.minWager)) * 100))
    : 100;

  const handleCopyId = () => {
    sound.chipClick();
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden"
        >
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={() => {
              sound.chipClick();
              onClose();
            }}
            className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* User Header */}
          <div className="flex items-center gap-3.5 pt-1 pb-4 border-b border-slate-800/80">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xl font-black text-amber-400">
                {user.username.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-100">{user.username}</h3>
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold border flex items-center gap-1 ${currentTier.badgeBg} ${currentTier.color}`}>
                  <span>{currentTier.icon}</span>
                  <span>سطح {currentTier.name}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span className="font-mono">ID: {user.id.slice(0, 10)}...</span>
                <button
                  onClick={handleCopyId}
                  className="p-1 hover:text-amber-400 transition flex items-center gap-1 text-[11px]"
                  title="کپی شناسه"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'کپی شد' : 'کپی'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* VIP Level Progress */}
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium mb-2">
              <span className="text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>پیشرفت سطح کاربری</span>
              </span>
              <span className="text-amber-400 font-bold font-mono">
                {nextTier ? `${currentProgress}% تا ${nextTier.name}` : 'بالاترین سطح VIP'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${currentProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
              />
            </div>
            {nextTier && (
              <p className="text-[11px] text-slate-500 mt-1.5 text-left font-mono" dir="ltr">
                {totalWagered.toLocaleString('fa-IR')} / {nextTier.minWager.toLocaleString('fa-IR')} Toman
              </p>
            )}
          </div>

          {/* Balance Card */}
          <div className="mt-3.5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/5 border border-amber-500/20 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">موجودی کیف پول شما</p>
              <p className="text-xl font-black text-amber-400 mt-0.5 font-mono" dir="ltr">
                {user.balance.toLocaleString('fa-IR')} <span className="text-xs text-slate-400 font-sans">تومان</span>
              </p>
            </div>
            {onOpenFaucet && (
              <button
                onClick={() => {
                  sound.chipClick();
                  onClose();
                  onOpenFaucet();
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition shadow-md flex items-center gap-1.5"
              >
                <Coins className="w-4 h-4" />
                <span>شارژ تستی</span>
              </button>
            )}
          </div>

          {/* Lifetime Statistics Grid */}
          <div className="grid grid-cols-2 gap-2.5 mt-3.5">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>مجموع بردها</span>
              </div>
              <p className="text-sm font-bold text-emerald-400 mt-1 font-mono" dir="ltr">
                +{totalWon.toLocaleString('fa-IR')} <span className="text-[10px]">ت</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                <span>مجموع شرط‌های ثبت‌شده</span>
              </div>
              <p className="text-sm font-bold text-slate-300 mt-1 font-mono" dir="ltr">
                {totalBets.toLocaleString('fa-IR')} <span className="text-[10px]">بار</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Percent className="w-3.5 h-3.5 text-yellow-400" />
                <span>نرخ برد کل</span>
              </div>
              <p className="text-sm font-bold text-yellow-400 mt-1 font-mono" dir="ltr">
                {winRate}%
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Award className="w-3.5 h-3.5 text-blue-400" />
                <span>سود / زیان خالص</span>
              </div>
              <p
                className={`text-sm font-bold mt-1 font-mono ${
                  netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
                dir="ltr"
              >
                {netProfit >= 0 ? `+${netProfit.toLocaleString('fa-IR')}` : `${netProfit.toLocaleString('fa-IR')}`}{' '}
                <span className="text-[10px]">ت</span>
              </p>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="mt-5 flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
            {onOpenFairModal && (
              <button
                onClick={() => {
                  sound.chipClick();
                  onClose();
                  onOpenFairModal();
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>اثبات منصفانه بودن</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.chipClick();
                onLogout();
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1.5 rounded-xl hover:bg-red-500/10 transition mr-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج از حساب</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
