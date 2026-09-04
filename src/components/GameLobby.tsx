import React, { useState } from 'react';
import {
  Flame,
  CircleDot,
  Sparkles,
  Bomb,
  Dices,
  ChevronLeft,
  HelpCircle,
  Zap,
  TrendingUp,
  Award,
  Play,
  CheckCircle2,
  ShieldCheck,
  Coins,
  ArrowDown,
} from 'lucide-react';
import { ActiveGameTab, User } from '../types';
import { sound } from '../utils/audio';
import { StepTaskWidget } from './StepTaskWidget';
import { LiveBetsFeed } from './LiveBetsFeed';

interface GameLobbyProps {
  onSelectGame: (game: ActiveGameTab) => void;
  user: User | null;
  onRequireAuth: () => void;
  onBalanceUpdate?: (newBalance?: number) => void;
}

interface GameCardInfo {
  id: ActiveGameTab;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  difficulty: 'بسیار آسان' | 'آسان' | 'متوسط';
  description: string;
  howToPlay: string[];
  icon: any;
  gradient: string;
  accentBorder: string;
  minBet: string;
  maxMultiplier: string;
  popular?: boolean;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  onSelectGame,
  user,
  onRequireAuth,
  onBalanceUpdate,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'easy' | 'instant' | 'strategic'>('all');
  const [expandedHelp, setExpandedHelp] = useState<ActiveGameTab | null>(null);

  const games: GameCardInfo[] = [
    {
      id: 'crash',
      title: 'موشک انفجار',
      subtitle: 'سریع، هیجان‌انگیز و پرطرفدار',
      badge: 'محبوب‌ترین',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      difficulty: 'بسیار آسان',
      description: 'موشک اوج می‌گیرد و ضریب سود هر ثانیه بالا می‌رود. قبل از انفجار برداشت کنید!',
      howToPlay: [
        'مبلغ مورد نظرتان را انتخاب کنید.',
        'با شروع راند، موشک شروع به پرواز می‌کند و سود شما زیاد می‌شود.',
        'قبل از توقف موشک، دکمه «برداشت سود» را بزنید و برنده شوید!',
      ],
      icon: Flame,
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      accentBorder: 'hover:border-amber-500/50 group-hover:shadow-amber-500/10',
      minBet: '۱,۰۰۰ تومان',
      maxMultiplier: 'تا ۱۰۰ برابر',
      popular: true,
    },
    {
      id: 'roulette',
      title: 'رولت اروپایی',
      subtitle: 'میز کلاسیک با گرافیک سه‌بعدی چرخ',
      badge: 'کلاسیک شیک',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      difficulty: 'آسان',
      description: 'کافیست یک رنگ (قرمز یا مشکی) را انتخاب کنید؛ توپ داخل خانه شانس می‌افتد.',
      howToPlay: [
        'یک چیپ روی رنگ «قرمز» یا «مشکی» (یا اعداد دلخواه) بگذارید.',
        'دکمه «گردش چرخ» را بزنید تا چرخ رولت بچرخد.',
        'اگر توپ در رنگ انتخابی شما بایستد، برنده جایزه دوبرابر می‌شوید.',
      ],
      icon: CircleDot,
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      accentBorder: 'hover:border-emerald-500/50 group-hover:shadow-emerald-500/10',
      minBet: '۱,۰۰۰ تومان',
      maxMultiplier: 'تا ۳۶ برابر',
    },
    {
      id: 'mines',
      title: 'میدان مین و الماس',
      subtitle: 'بازی جذاب پیدا کردن گنجینه‌ها',
      badge: 'کنترل کامل ریسک',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      difficulty: 'بسیار آسان',
      description: 'روی خانه‌ها ضربه بزنید و الماس پیدا کنید. هر الماس سودتان را افزایش می‌دهد!',
      howToPlay: [
        'تعداد بمب‌های پنهان در زمین را مشخص کنید (پیشنهاد مبتدی: ۳ بمب).',
        'روی خانه‌ها کلیک کنید؛ با هر الماس کشف‌شده سود شما بیشتر می‌شود.',
        'هر زمان که راضی بودید دکمه «برداشت» را بزنید یا برای سود بیشتر ادامه دهید!',
      ],
      icon: Bomb,
      gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
      accentBorder: 'hover:border-blue-500/50 group-hover:shadow-blue-500/10',
      minBet: '۱,۰۰۰ تومان',
      maxMultiplier: 'تا ۲۰ برابر',
    },
    {
      id: 'slots',
      title: 'اسلات طلایی ۷۷۷',
      subtitle: 'ماشین شانس خودکار با جک‌پات',
      badge: 'جک‌پات ویژه',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      difficulty: 'بسیار آسان',
      description: 'بدون نیاز به هیچ قاعده‌ای! فقط چرخ را بچرخانید و منتظر هم‌خط شدن نمادها باشید.',
      howToPlay: [
        'مبلغ ورودی را تعیین کنید.',
        'دکمه «چرخش» را فشار دهید تا ۵ چرخ به حرکت درآیند.',
        'اگر ۳ نماد شبیه به هم در یک ردیف متوقف شوند، برنده جایزه نقدی می‌شوید.',
      ],
      icon: Sparkles,
      gradient: 'from-yellow-500/20 via-amber-500/10 to-transparent',
      accentBorder: 'hover:border-yellow-500/50 group-hover:shadow-yellow-500/10',
      minBet: '۱,۰۰۰ تومان',
      maxMultiplier: 'تا ۵۰ برابر',
    },
    {
      id: 'dice',
      title: 'تاس هوشمند',
      subtitle: 'ساده‌ترین بازی پیش‌بینی رقم',
      badge: 'شفاف و ریاضی',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      difficulty: 'آسان',
      description: 'یک خط هدف تعیین کنید و بگویید تاس بالاتر از این خط می‌آید یا پایین‌تر.',
      howToPlay: [
        'با لغزنده، عدد هدف را جابجا کنید (مثلاً ۵۰).',
        'مشخص کنید تاس باید «بیشتر» باشد یا «کمتر».',
        'دکمه پرتاب را بزنید؛ نتیجه در کسری از ثانیه مشخص می‌شود.',
      ],
      icon: Dices,
      gradient: 'from-purple-500/20 via-fuchsia-500/10 to-transparent',
      accentBorder: 'hover:border-purple-500/50 group-hover:shadow-purple-500/10',
      minBet: '۱,۰۰۰ تومان',
      maxMultiplier: 'تا ۹۵ برابر',
    },
    {
      id: 'plinko',
      title: 'پلینکو نئونی',
      subtitle: 'سقوط مهیج توپ با برخورد به میخ‌ها',
      badge: 'جدید و پرطرفدار',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      difficulty: 'بسیار آسان',
      description: 'توپ را از بالای هرم رها کنید، با کمانه زدن بین میخ‌ها ضریب سود شگفت‌انگیز کسب کنید!',
      howToPlay: [
        'مبلغ شرط را تعیین کنید.',
        'دکمه رهاسازی را بزنید تا توپ بین میخ‌ها کمانه کند.',
        'به هر خانه‌ای در کف برسد، ضریب آن خانه (تا ۱۶ برابر) به حسابتان واریز می‌شود.',
      ],
      icon: Sparkles,
      gradient: 'from-pink-500/20 via-rose-500/10 to-transparent',
      accentBorder: 'hover:border-pink-500/50 group-hover:shadow-pink-500/10',
      minBet: '۱,۰۰۰ تومان',
      maxMultiplier: 'تا ۱۶ برابر',
      popular: true,
    },
    {
      id: 'coinflip',
      title: 'پرتاب سکه ۳بعدی',
      subtitle: 'دوئل کلاسیک شیر یا خط با چرخش واقعی',
      badge: 'فوری و سریع',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      difficulty: 'بسیار آسان',
      description: 'شیر یا خط را حدس بزنید. سکه با فیزیک سه‌بعدی می‌چرخد و برنده ضریب ۱.۹۰x می‌شوید!',
      howToPlay: [
        'یکی از دو طرف سکه (شیر 🦁 یا خط ☀️) را انتخاب کنید.',
        'مبلغ شرط را مشخص کرده و دکمه پرتاب را بزنید.',
        'با تطابق سکه، سود ۱.۹۰ برابری بلافاصله واریز می‌شود.',
      ],
      icon: Coins,
      gradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
      accentBorder: 'hover:border-yellow-500/50 group-hover:shadow-yellow-500/10',
      minBet: '۱,۰۰۰ تومان',
      maxMultiplier: '۱.۹۰ برابر',
    },
  ];

  const filteredGames = games.filter((g) => {
    if (activeCategory === 'easy') return g.difficulty === 'بسیار آسان';
    if (activeCategory === 'instant') return g.id === 'crash' || g.id === 'dice' || g.id === 'coinflip';
    if (activeCategory === 'strategic') return g.id === 'mines' || g.id === 'roulette' || g.id === 'plinko';
    return true;
  });

  const handleStartGame = (gameId: ActiveGameTab) => {
    sound.chipClick();
    onSelectGame(gameId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sleek Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-slate-800 p-4 sm:p-7 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>پلتفرم استاندارد و شفاف سرگرمی آنلاین</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              سالن انتخاب بازی‌ها
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              حتی اگر تا به‌حال این بازی‌ها را تجربه نکرده‌اید، هر بازی دارای راهنمای گام‌به‌گام و ساده است.
              بازی مورد علاقه خود را انتخاب کنید و لذت ببرید.
            </p>
          </div>

          {/* Quick Beginner Tips */}
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800/80 shrink-0 text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">حداقل شروع شرط:</span>
              <span className="font-bold text-amber-300 font-mono">۱,۰۰۰ تومان</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">راهنمای هوشمند:</span>
              <span className="font-bold text-emerald-400">۳ ثانیه‌ای و واضح</span>
            </div>
          </div>
        </div>

        {/* Filter Categories */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-5 pt-4 border-t border-slate-800/80 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'همه بازی‌ها' },
            { id: 'easy', label: 'بسیار ساده (پیشنهادی تازه‌کاران)' },
            { id: 'instant', label: 'سرعتی و هیجانی' },
            { id: 'strategic', label: 'انتخاب دلخواه و تصمیم‌گیری' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sound.chipClick();
                setActiveCategory(cat.id as any);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-black shadow-md font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step Tasks & Free Balance Widget (کادر انجام تسک‌های مرحله‌ای و موجودی رایگان) */}
      <StepTaskWidget
        currentUser={user}
        onBalanceUpdate={onBalanceUpdate || (() => {})}
        onOpenAuth={onRequireAuth}
      />

      {/* Game Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredGames.map((game) => {
          const Icon = game.icon;
          const isHelpOpen = expandedHelp === game.id;

          return (
            <div
              key={game.id}
              className={`group relative rounded-2xl bg-slate-900/90 border border-slate-800/90 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-2xl ${game.accentBorder}`}
            >
              {/* Subtle Ambient Background Gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity`}
              />

              <div className="p-4 sm:p-5 relative z-10 space-y-3">
                {/* Header: Icon, Titles & Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-100 group-hover:text-white transition-colors">
                          {game.title}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{game.subtitle}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${game.badgeColor}`}
                  >
                    {game.badge}
                  </span>
                </div>

                {/* 1-Sentence Friendly Description */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {game.description}
                </p>

                {/* Game Attributes Chips */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400 font-medium">
                    سختی: <strong className="text-emerald-400 font-bold">{game.difficulty}</strong>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400 font-mono">
                    ورودی: <strong className="text-slate-200">{game.minBet}</strong>
                  </span>
                </div>

                {/* Expandable Beginner Mini-Tutorial */}
                {isHelpOpen && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800/90 text-xs space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>چطور در ۳ قدم بازی کنم؟</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-300">
                      {game.howToPlay.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Card Footer: How-To Toggle & Play Button */}
              <div className="p-3 sm:px-5 sm:py-3.5 border-t border-slate-800/60 bg-slate-950/60 relative z-10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.chipClick();
                    setExpandedHelp(isHelpOpen ? null : game.id);
                  }}
                  className="text-[11px] text-slate-400 hover:text-amber-300 transition flex items-center gap-1 py-1 px-1.5 rounded-lg hover:bg-slate-900"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{isHelpOpen ? 'بستن راهنما' : 'راهنمای ۳ قدمی'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartGame(game.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-amber-950/40 active:scale-95"
                >
                  <span>ورود به بازی</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Casino Bets & Big Wins Feed */}
      <LiveBetsFeed user={user} onSelectGame={onSelectGame} />

      {/* Informational Assurance for Beginners */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>تمام بازی‌ها دارای سیستم ریاضی استاندارد و تضمین برابری شانس برای کاربران هستند.</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span>شروع بدون نیاز به تجربه قبلی</span>
          <span>•</span>
          <span>پشتیبانی از مبالغ خرد</span>
        </div>
      </div>
    </div>
  );
};
