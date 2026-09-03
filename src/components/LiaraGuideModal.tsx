import React, { useState } from 'react';
import { Cloud, Check, Copy, Terminal, HardDrive, ShieldCheck, Cpu, ExternalLink, X } from 'lucide-react';

interface LiaraGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiaraGuideModal: React.FC<LiaraGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: '۱. نصب ابزار خط فرمان لیارا (Liara CLI)',
      desc: 'ابزار رسمی لیارا را با استفاده از npm به سادگی به صورت سراسری در ترمینال خود نصب کنید:',
      cmd: 'npm install -g @liara/cli',
    },
    {
      title: '۲. ورود به حساب لیارا',
      desc: 'با اجرای دستور زیر، مشخصات ایمیل و رمز حساب لیارای خود را وارد کنید:',
      cmd: 'liara login',
    },
    {
      title: '۳. ایجاد برنامه در کنسول لیارا',
      desc: 'در پنل لیارا دکمه «ایجاد برنامه» را بزنید، پلتفرم را روی NodeJS قرار دهید و نام برنامه را وارد کنید (مثلاً aria-casino).',
      cmd: '',
    },
    {
      title: '۴. اتصال دیسک پایدار برای ذخیره دیتابیس (بسیار مهم)',
      desc: 'در پنل برنامه لیارا، بخش «دیسک‌ها» بروید، دیسک جدید با نام data و مسیر data بسازید تا کاربران و موجودی‌ها با ری‌استارت پاک نشوند.',
      cmd: '',
    },
    {
      title: '۵. استقرار پروژه با یک دستور',
      desc: 'در پوشه اصلی پروژه ترمینال را باز کنید و دستور دیپلوی را اجرا کنید:',
      cmd: 'liara deploy',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                راهنمای استقرار در سرور ابری لیارا (Liara)
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                  مخصوص وایب‌کدینگ
                </span>
              </h3>
              <p className="text-xs text-slate-400">آموزش گام‌به‌گام و سریع برای دیپلوی در Liara PaaS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-sm text-slate-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
            💡 این پروژه کاملاً استانداردسازی شده و فایل‌های <code>liara.json</code> و <code>.liaraignore</code> و بیلد اختصاصی فول‌استک به صورت پیش‌فرض در آن تعبیه شده‌اند.
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center">
                    {idx + 1}
                  </span>
                  {step.title}
                </h4>
                <p className="text-slate-400 text-xs">{step.desc}</p>
                {step.cmd && (
                  <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-700/60 font-mono text-xs text-amber-300">
                    <span dir="ltr">{step.cmd}</span>
                    <button
                      onClick={() => copyCode(step.cmd, idx)}
                      className="flex items-center gap-1 text-slate-400 hover:text-amber-400 text-xs transition"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">کپی شد</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>کپی</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Persistent Disk details */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
            <h5 className="font-bold text-indigo-300 flex items-center gap-2 text-sm">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              نکته طلایی دیتابیس پایدار (Persistent Storage)
            </h5>
            <p className="text-xs text-slate-300">
              دیتابیس سیستم در مسیر <code>/data/db.json</code> ذخیره می‌شود. فایل <code>liara.json</code> موجود در پروژه دارای تنظیمات زیر است:
            </p>
            <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto" dir="ltr">
{`{
  "platform": "node",
  "app": "aria-casino",
  "port": 3000,
  "disks": [
    {
      "name": "data",
      "mountTo": "data"
    }
  ]
}`}
            </pre>
            <p className="text-xs text-slate-400">
              کافیست در پنل لیارا دیسکی به نام <code>data</code> بسازید؛ دیتابیس همیشه پایدار خواهد ماند.
            </p>
          </div>

          {/* Deployment Security Best Practice */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-emerald-300">امنیت سرور و پایگاه داده در زمان استقرار:</span>
              <p className="text-slate-300 leading-relaxed">
                تمامی متغیرها و دسترسی‌های مدیریتی طبق اصول امنیتی در محیط سرور و تنظیمات پنل محافظت می‌شوند. حساب‌های کاربری جدید با موجودی اولیه صفر ایجاد شده و لاگ‌های امنیتی به صورت خودکار در دیسک پایدار ثبت می‌گردند.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950">
          <a
            href="https://docs.liara.ir/paas/nodejs/getting-started/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            مستندات رسمی پلتفرم NodeJS لیارا
          </a>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition"
          >
            متوجه شدم و بستن
          </button>
        </div>
      </div>
    </div>
  );
};
