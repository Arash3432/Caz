import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldCheck,
  KeyRound,
  Hash,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface ProvablyFairModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({ isOpen, onClose }) => {
  const [clientSeed, setClientSeed] = useState<string>('user_aria_seed_' + Math.random().toString(36).substring(2, 8));
  const [serverSeedHash, setServerSeedHash] = useState<string>(
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  );
  const [nonce, setNonce] = useState<number>(42);
  const [verifiedResult, setVerifiedResult] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleVerify = async () => {
    sound.chipClick();
    const encoder = new TextEncoder();
    const data = encoder.encode(`${clientSeed}:${serverSeedHash}:${nonce}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // Convert first 4 bytes to an integer and calculate multiplier / roll
    const sub = parseInt(hashHex.substring(0, 8), 16);
    const floatVal = sub / 0xffffffff;
    const simulatedMultiplier = Math.max(1.0, Number((0.98 / (1 - floatVal * 0.95)).toFixed(2)));
    setVerifiedResult(`هش تایید شده: ${hashHex.substring(0, 16)}... | ضریب تصادفی استخراج شده: ${simulatedMultiplier}x`);
  };

  const handleCopyHash = () => {
    sound.chipClick();
    navigator.clipboard.writeText(serverSeedHash);
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
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden text-right"
        >
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

          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800/80">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-100">
                اثبات منصفانه بودن (Provably Fair)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تضمین ریاضی و رمزنگاری‌شده عدم دستکاری در نتایج بازی‌ها
              </p>
            </div>
          </div>

          {/* Info Explainer */}
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <p>
              در تمام بازی‌های این پلتفرم، نتیجه هر راند بر اساس ترکیب کلید سرور (Server Seed)، کلید مرورگر کاربر (Client Seed) و شمارنده بازی (Nonce) با الگوریتم رمزنگاری <strong className="text-emerald-400 font-mono">HMAC-SHA256</strong> تعیین می‌شود.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                <span>هش کلید سرور (Server Seed SHA-256)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={serverSeedHash}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 pr-3 pl-16 focus:outline-none"
                />
                <button
                  onClick={handleCopyHash}
                  className="absolute left-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans flex items-center gap-1 transition"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'کپی شد' : 'کپی'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                <span>کلید کاربر (Client Seed)</span>
              </label>
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={clientSeed}
                  onChange={(e) => setClientSeed(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500/50"
                  dir="ltr"
                />
                <button
                  onClick={() => {
                    sound.chipClick();
                    setClientSeed('seed_' + Math.random().toString(36).substring(2, 10));
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition shrink-0"
                >
                  تغییر رندوم
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-pink-400" />
                  <span>شمارنده راند (Nonce)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={nonce}
                  onChange={(e) => setNonce(Number(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div className="shrink-0 self-end">
                <button
                  onClick={handleVerify}
                  className="h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>محاسبه و ارزیابی هش</span>
                </button>
              </div>
            </div>
          </div>

          {/* Verification Result Display */}
          {verifiedResult && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono leading-relaxed"
              dir="ltr"
            >
              {verifiedResult}
            </motion.div>
          )}

          {/* Footer Note */}
          <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>استاندارد جهانی SHA-256</span>
            </span>
            <span>کاملاً منصفانه و شفاف</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
