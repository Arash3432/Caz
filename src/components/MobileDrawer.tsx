import React from 'react';
import {
  X,
  User as UserIcon,
  Coins,
  Gift,
  Shield,
  Cloud,
  Volume2,
  VolumeX,
  LogOut,
  KeyRound,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { User } from '../types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAuth: (mode?: 'user_login' | 'user_register' | 'admin_login') => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onOpenLiaraGuide: () => void;
  onClaimFaucet: () => void;
  faucetLoading: boolean;
  onOpenProfile?: () => void;
  onOpenFairModal?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  user,
  soundEnabled,
  onToggleSound,
  onOpenAuth,
  onLogout,
  onOpenAdmin,
  onOpenLiaraGuide,
  onClaimFaucet,
  faucetLoading,
  onOpenProfile,
  onOpenFairModal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over Menu Panel (RTL, right-to-left) */}
      <div className="fixed inset-y-0 right-0 max-w-[320px] w-full bg-slate-950 border-l border-slate-800 shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-right duration-250">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 p-[1px] shadow">
                <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center text-sm">
                  👑
                </div>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-100 font-serif">کازینو آریا</h3>
                <span className="text-[10px] text-amber-400/80 font-mono">Mobile VIP Edition</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Section */}
          {user ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-amber-500/20 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-black">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm truncate">{user.username}</span>
                      {user.role === 'admin' && (
                        <span className="text-[10px] bg-red-600 text-white font-mono px-1.5 py-0.2 rounded font-bold">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 truncate block">{user.email}</span>
                  </div>
                </div>

                {/* Balance Display */}
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">موجودی کیف پول:</span>
                    <span className="text-base font-black font-mono text-amber-300" dir="ltr">
                      {user.balance.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
                    </span>
                  </div>
                  {onOpenProfile && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenProfile();
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 transition"
                    >
                      سطح VIP و آمار
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Faucet Claim */}
              <button
                onClick={() => {
                  onClose();
                  onClaimFaucet();
                }}
                disabled={faucetLoading}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition"
              >
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>دریافت شارژ تستی رایگان</span>
                </div>
                <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full text-amber-300 font-mono">
                  +۵۰,۰۰۰ ت
                </span>
              </button>

              {/* Admin Button */}
              {user.role === 'admin' && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 text-xs font-bold transition"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    <span>پنل مدیریت ادمین (۲FA)</span>
                  </div>
                  <span className="text-[10px] bg-red-900 px-1.5 py-0.5 rounded text-red-200">کنترل RTP</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 text-center">
              <span className="text-xs text-slate-400 block">برای ثبت شرط و شرکت در بازی‌ها وارد شوید:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth('user_login');
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
                >
                  ورود
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth('user_register');
                  }}
                  className="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black transition shadow"
                >
                  ثبت‌نام (رایگان)
                </button>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth('admin_login');
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-[11px] font-semibold transition mt-2"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>ورود مدیریت ادمین با ۲FA</span>
              </button>
            </div>
          )}

          {/* Quick Settings & Tools */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block px-1">
              تنظیمات و راهنما
            </span>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-slate-300 border border-slate-800/80 text-xs font-medium transition"
            >
              <div className="flex items-center gap-2.5">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-amber-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <span>صدا و جلوه‌های صوتی بازی‌ها</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${soundEnabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                {soundEnabled ? 'روشن' : 'خاموش'}
              </span>
            </button>

            {/* Provably Fair Modal Trigger */}
            {onOpenFairModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFairModal();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-emerald-300 border border-emerald-500/20 text-xs font-medium transition"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>اثبات منصفانه بودن (Provably Fair)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 font-mono">
                  SHA-256
                </span>
              </button>
            )}

            {/* Liara Cloud Deployment Guide */}
            <button
              onClick={() => {
                onClose();
                onOpenLiaraGuide();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-amber-300 border border-amber-500/20 text-xs font-medium transition"
            >
              <div className="flex items-center gap-2.5">
                <Cloud className="w-4 h-4 text-amber-400" />
                <span>راهنمای استقرار در سرور ابری لیارا</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-amber-400/70" />
            </button>
          </div>
        </div>

        {/* Footer Logout */}
        {user && (
          <div className="pt-4 border-t border-slate-800 mt-4">
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 text-rose-300 border border-rose-500/30 text-xs font-bold transition"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج از حساب کاربری</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
