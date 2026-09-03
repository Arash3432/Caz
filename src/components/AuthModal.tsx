import React, { useState } from 'react';
import { User, Lock, Mail, ShieldAlert, KeyRound, ArrowRight, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType, token: string) => void;
  initialMode?: 'user_login' | 'user_register' | 'admin_login';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'user_login',
}) => {
  const [mode, setMode] = useState<'user_login' | 'user_register' | 'admin_login'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [adminStep, setAdminStep] = useState<1 | 2>(1);
  const [adminTempId, setAdminTempId] = useState('');
  const [adminHintCode, setAdminHintCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'user_register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا در ثبت نام');
        onLoginSuccess(data.user, data.token);
        onClose();
      } else if (mode === 'user_login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا در ورود');
        onLoginSuccess(data.user, data.token);
        onClose();
      } else if (mode === 'admin_login') {
        if (adminStep === 1) {
          const res = await fetch('/api/auth/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'اطلاعات ورود ادمین نادرست است');
          setAdminStep(2);
          setAdminTempId(data.adminId);
          setAdminHintCode(data.hintCode);
        } else {
          // Verify 2FA
          const res = await fetch('/api/auth/admin-verify-2fa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId: adminTempId, code: twoFactorCode }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'کد احراز هویت دو مرحله‌ای نامعتبر است');
          onLoginSuccess(data.user, data.token);
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'خطایی رخ داد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 text-xs">
          <button
            type="button"
            onClick={() => { setMode('user_login'); setError(null); }}
            className={`flex-1 py-3.5 font-bold transition text-center ${
              mode === 'user_login'
                ? 'text-amber-400 border-b-2 border-amber-500 bg-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ورود کاربر
          </button>
          <button
            type="button"
            onClick={() => { setMode('user_register'); setError(null); }}
            className={`flex-1 py-3.5 font-bold transition text-center ${
              mode === 'user_register'
                ? 'text-amber-400 border-b-2 border-amber-500 bg-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ثبت‌نام (موجودی ۰)
          </button>
          <button
            type="button"
            onClick={() => { setMode('admin_login'); setAdminStep(1); setError(null); }}
            className={`flex-1 py-3.5 font-bold transition text-center flex items-center justify-center gap-1 ${
              mode === 'admin_login'
                ? 'text-red-400 border-b-2 border-red-500 bg-slate-900'
                : 'text-slate-400 hover:text-red-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            ورود ادمین (۲FA)
          </button>
          <button onClick={onClose} className="px-3 text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'user_register' && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <strong>قانون سیستم:</strong> طبق درخواست، در بدو ثبت‌نام موجودی حساب شما دقیقاً <strong>۰ تومان</strong> خواهد بود. می‌توانید پس از ورود از دکمه شارژ تست رایگان استفاده کنید یا از ادمین اعتبار بگیرید.
              </div>
            </div>
          )}

          {mode === 'admin_login' && (
            <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                احراز هویت دو مرحله‌ای ادمین (2FA) فعال است
              </span>
              <span className="text-[11px] bg-red-900/60 px-2 py-0.5 rounded text-red-200">
                مرحله {adminStep} از ۲
              </span>
            </div>
          )}

          {/* Form fields */}
          {mode === 'admin_login' && adminStep === 2 ? (
            <div className="space-y-3 py-2">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-100">ورود کد امنیتی دو مرحله‌ای</h4>
                <p className="text-xs text-slate-400">
                  لطفاً کد ۶ رقمی امنیتی تأیید هویت ادمین را وارد نمایید:
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="کد ۶ رقمی (مثلاً 778899)"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="w-full text-center tracking-[8px] text-lg font-mono px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-amber-400 placeholder:text-slate-600 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">نام کاربری</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: player1 یا admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {mode === 'user_register' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">ایمیل (اختیاری)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                    <input
                      type="email"
                      placeholder="info@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">رمز عبور</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 ${
              mode === 'admin_login'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-950/50'
                : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-amber-950/50'
            }`}
          >
            {loading ? (
              'در حال پردازش امنیتی...'
            ) : mode === 'admin_login' ? (
              adminStep === 1 ? 'بررسی رمز و درخواست کد 2FA' : 'تأیید کد دومرحله‌ای و ورود به پنل ادمین'
            ) : mode === 'user_register' ? (
              'تکمیل ثبت‌نام (موجودی ۰)'
            ) : (
              'ورود به حساب کاربری'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
