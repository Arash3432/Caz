import React, { useState } from 'react';
import {
  LayoutGrid,
  Coins,
  Shield,
  Volume2,
  VolumeX,
  Cloud,
  LogOut,
  User as UserIcon,
  Flame,
  CircleDot,
  Dices,
  Bomb,
  Sparkles,
  KeyRound,
  Menu,
} from 'lucide-react';
import { User, ActiveGameTab } from '../types';
import { sound } from '../utils/audio';
import { MobileDrawer } from './MobileDrawer';

interface NavbarProps {
  user: User | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAuth: (mode?: 'user_login' | 'user_register' | 'admin_login') => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onOpenLiaraGuide: () => void;
  activeTab: ActiveGameTab | 'admin';
  onChangeTab: (tab: ActiveGameTab | 'admin') => void;
  onClaimFaucet: () => void;
  faucetLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  soundEnabled,
  onToggleSound,
  onOpenAuth,
  onLogout,
  onOpenAdmin,
  onOpenLiaraGuide,
  activeTab,
  onChangeTab,
  onClaimFaucet,
  faucetLoading,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const games = [
    { id: 'lobby' as ActiveGameTab, name: 'انتخاب بازی', icon: LayoutGrid, color: 'from-amber-500 to-yellow-600' },
    { id: 'crash' as ActiveGameTab, name: 'انفجار', icon: Flame, color: 'from-orange-500 to-rose-600' },
    { id: 'plinko' as ActiveGameTab, name: 'پلینکو', icon: Sparkles, color: 'from-pink-500 to-rose-600' },
    { id: 'coinflip' as ActiveGameTab, name: 'شیر یا خط', icon: Coins, color: 'from-amber-400 to-yellow-600' },
    { id: 'roulette' as ActiveGameTab, name: 'رولت', icon: CircleDot, color: 'from-emerald-500 to-teal-600' },
    { id: 'slots' as ActiveGameTab, name: 'اسلات ۷۷۷', icon: Sparkles, color: 'from-amber-400 to-yellow-600' },
    { id: 'mines' as ActiveGameTab, name: 'مین‌ها', icon: Bomb, color: 'from-blue-500 to-indigo-600' },
    { id: 'dice' as ActiveGameTab, name: 'طاس', icon: Dices, color: 'from-purple-500 to-pink-600' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        {/* Main Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => onChangeTab('lobby')}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-[1px] shadow-md shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="text-base sm:text-lg">👑</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-100 font-serif">
                  کازینو آریا
                </span>
                <span className="hidden sm:inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  VIP
                </span>
              </div>
              <p className="hidden md:block text-[10px] text-slate-400">
                پلتفرم بازی‌های آنلاین با کنترل RTP و راهنمای مبتدیان
              </p>
            </div>
          </div>

          {/* User Balance & Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Minimal Mobile & Desktop Balance Pill */}
                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/30 shadow-inner">
                  <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-extrabold text-amber-300 font-mono tracking-tight" dir="ltr">
                      {user.balance.toLocaleString('fa-IR')}{' '}
                      <span className="text-[10px] text-amber-400/80 font-normal">ت</span>
                    </div>
                  </div>
                </div>

                {/* Desktop-Only Admin Button */}
                {user.role === 'admin' && (
                  <button
                    onClick={onOpenAdmin}
                    className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      activeTab === 'admin'
                        ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-950/60'
                        : 'bg-red-950/60 hover:bg-red-900/80 text-red-300 border-red-500/40'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-red-400" />
                    <span>پنل ادمین</span>
                  </button>
                )}

                {/* Desktop User Info & Logout */}
                <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-slate-200">{user.username}</span>
                  <button
                    onClick={onLogout}
                    title="خروج از حساب"
                    className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition mr-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('user_login')}
                  className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition"
                >
                  ورود
                </button>
                <button
                  onClick={() => onOpenAuth('user_register')}
                  className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-extrabold transition shadow-md shadow-amber-950/40"
                >
                  ثبت‌نام
                </button>
                <button
                  onClick={() => onOpenAuth('admin_login')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 text-xs font-semibold transition"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>ورود ۲FA ادمین</span>
                </button>
              </>
            )}

            {/* Desktop Liara Cloud Deployment Guide */}
            <button
              onClick={onOpenLiaraGuide}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium transition"
              title="آموزش استقرار در لیارا"
            >
              <Cloud className="w-3.5 h-3.5 text-amber-400" />
              <span>راهنمای لیارا</span>
            </button>

            {/* Sound Toggle (Desktop & Mobile) */}
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'قطع صدا' : 'وصل صدا'}
              className={`p-2 rounded-xl border transition ${
                soundEnabled
                  ? 'bg-slate-900 border-amber-500/30 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            {/* Mobile Menu / Profile Trigger Button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
              title="منوی کاربری و تنظیمات"
            >
              {user ? (
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-amber-400" />
                  {user.role === 'admin' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-950" />
                  )}
                </div>
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Desktop-Only Game Tabs Navigation Bar */}
        <div className="hidden md:block border-t border-slate-850 bg-slate-950/60 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
            {games.map((g) => {
              const Icon = g.icon;
              const isActive = activeTab === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => {
                    sound.chipClick();
                    onChangeTab(g.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gradient-to-r ' + g.color + ' text-white shadow-lg shadow-black/40 scale-102 ring-1 ring-white/20'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800/90 border border-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{g.name}</span>
                </button>
              );
            })}

            {user?.role === 'admin' && (
              <button
                onClick={() => onChangeTab('admin')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all mr-auto ${
                  activeTab === 'admin'
                    ? 'bg-red-600 text-white shadow-lg ring-1 ring-white/30'
                    : 'bg-red-950/40 text-red-300 hover:bg-red-900/50 border border-red-500/30'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>پنل اختصاصی ادمین</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Slide-over Profile Drawer */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        onOpenAuth={onOpenAuth}
        onLogout={onLogout}
        onOpenAdmin={onOpenAdmin}
        onOpenLiaraGuide={onOpenLiaraGuide}
        onClaimFaucet={onClaimFaucet}
        faucetLoading={faucetLoading}
      />
    </>
  );
};
