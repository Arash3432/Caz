import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  CircleDot,
  Sparkles,
  Bomb,
  Dices,
  Coins,
  Trophy,
  History,
  Radio,
  RefreshCw,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react';
import { ActiveGameTab, User } from '../types';
import { sound } from '../utils/audio';

interface BetFeedItem {
  id: string;
  username: string;
  game: string;
  betAmount: number;
  multiplier: number;
  payout: number;
  won?: boolean;
  timestamp: string;
}

interface LiveBetsFeedProps {
  user: User | null;
  onSelectGame?: (game: ActiveGameTab) => void;
}

const GAME_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  crash: { label: 'انفجار', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/15' },
  roulette: { label: 'رولت', icon: CircleDot, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  slots: { label: 'اسلات', icon: Sparkles, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  mines: { label: 'مین‌ها', icon: Bomb, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  dice: { label: 'طاس', icon: Dices, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  plinko: { label: 'پلینکو', icon: Sparkles, color: 'text-pink-400', bg: 'bg-pink-500/15' },
  coinflip: { label: 'شیر یا خط', icon: Coins, color: 'text-amber-400', bg: 'bg-amber-500/15' },
};

export const LiveBetsFeed: React.FC<LiveBetsFeedProps> = ({ user, onSelectGame }) => {
  const [tab, setTab] = useState<'all' | 'high' | 'my'>('all');
  const [recentBets, setRecentBets] = useState<BetFeedItem[]>([]);
  const [topWins, setTopWins] = useState<BetFeedItem[]>([]);
  const [myBets, setMyBets] = useState<BetFeedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchLiveFeed = async () => {
    try {
      const res = await fetch('/api/bets/live-feed');
      if (res.ok) {
        const data = await res.json();
        setRecentBets(data.recent || []);
        setTopWins(data.topWins || []);
      }
    } catch {
      // Safe fallback
    }
  };

  const fetchMyBets = async () => {
    const token = localStorage.getItem('aria_token');
    if (!token || !user) return;
    try {
      const res = await fetch('/api/user/my-bets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyBets(data.bets || []);
      }
    } catch {
      // Safe fallback
    }
  };

  useEffect(() => {
    fetchLiveFeed();
    const interval = setInterval(fetchLiveFeed, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tab === 'my') {
      fetchMyBets();
    }
  }, [tab, user]);

  const activeList = tab === 'all' ? recentBets : tab === 'high' ? topWins : myBets;

  const formatRelativeTime = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 15) return 'هم‌اکنون';
    if (diff < 60) return `${diff} ثانیه قبل`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins} دقیقه قبل`;
    const hrs = Math.floor(mins / 60);
    return `${hrs} ساعت قبل`;
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 sm:p-5 backdrop-blur-md">
      {/* Live Win Ticker Bar */}
      {topWins.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/20 p-2 sm:p-2.5 flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500 text-black font-extrabold text-[11px] shrink-0 shadow-sm">
            <Trophy className="w-3.5 h-3.5" />
            <span>بردهای داغ</span>
          </div>
          <div className="overflow-x-auto scrollbar-none flex items-center gap-4 text-xs font-mono text-slate-300 whitespace-nowrap">
            {topWins.slice(0, 5).map((win) => {
              const cfg = GAME_CONFIG[win.game] || GAME_CONFIG.crash;
              return (
                <div key={win.id} className="flex items-center gap-1.5 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-sans">{win.username}:</span>
                  <span className={`${cfg.color} font-sans font-bold`}>{cfg.label}</span>
                  <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-extrabold">
                    {win.multiplier.toFixed(2)}x
                  </span>
                  <span className="text-emerald-400 font-bold" dir="ltr">
                    +{win.payout.toLocaleString('fa-IR')} ت
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>فید زنده فعالیت کازینو</span>
          </h3>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => {
              sound.chipClick();
              setTab('all');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              tab === 'all' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>شرط‌های زنده</span>
          </button>
          <button
            onClick={() => {
              sound.chipClick();
              setTab('high');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              tab === 'high' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>برندگان برتر</span>
          </button>
          {user && (
            <button
              onClick={() => {
                sound.chipClick();
                setTab('my');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                tab === 'my' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>شرط‌های من</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.chipClick();
              setLoading(true);
              fetchLiveFeed();
              if (tab === 'my') fetchMyBets();
              setTimeout(() => setLoading(false), 500);
            }}
            title="به‌روزرسانی"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bets Table */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800/60 pb-2">
              <th className="py-2.5 px-2 font-medium">بازی</th>
              <th className="py-2.5 px-2 font-medium">بازیکن</th>
              <th className="py-2.5 px-2 font-medium text-left">مبلغ شرط</th>
              <th className="py-2.5 px-2 font-medium text-center">ضریب</th>
              <th className="py-2.5 px-2 font-medium text-left">سود دریافتی</th>
              <th className="py-2.5 px-2 font-medium text-left hidden sm:table-cell">زمان</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 font-mono">
            {activeList.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                  {tab === 'my' ? 'هنوز شرطی توسط شما ثبت نشده است.' : 'در حال بارگذاری اطلاعات زنده...'}
                </td>
              </tr>
            ) : (
              activeList.map((bet) => {
                const cfg = GAME_CONFIG[bet.game] || GAME_CONFIG.crash;
                const Icon = cfg.icon;
                const isWin = bet.won !== undefined ? bet.won : bet.payout > 0;

                return (
                  <tr
                    key={bet.id}
                    className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    onClick={() => {
                      if (onSelectGame && bet.game) {
                        onSelectGame(bet.game as ActiveGameTab);
                      }
                    }}
                  >
                    {/* Game */}
                    <td className="py-2.5 px-2 font-sans font-medium">
                      <div className="flex items-center gap-1.5">
                        <div className={`p-1 rounded-lg ${cfg.bg} ${cfg.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-slate-200 group-hover:text-amber-300 transition">{cfg.label}</span>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="py-2.5 px-2 font-sans text-slate-400">
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3 text-slate-500" />
                        <span>{bet.username}</span>
                      </div>
                    </td>

                    {/* Bet Amount */}
                    <td className="py-2.5 px-2 text-left text-slate-300" dir="ltr">
                      {bet.betAmount.toLocaleString('fa-IR')}{' '}
                      <span className="text-[10px] text-slate-500 font-sans">ت</span>
                    </td>

                    {/* Multiplier */}
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          bet.multiplier >= 2.0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : bet.multiplier >= 1.0
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                        dir="ltr"
                      >
                        {bet.multiplier > 0 ? `${bet.multiplier.toFixed(2)}x` : '۰.۰۰x'}
                      </span>
                    </td>

                    {/* Payout */}
                    <td className="py-2.5 px-2 text-left" dir="ltr">
                      {isWin ? (
                        <span className="text-emerald-400 font-bold flex items-center justify-end gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>+{bet.payout.toLocaleString('fa-IR')}</span>
                          <span className="text-[10px] text-emerald-500/80 font-sans">ت</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 font-normal">۰ ت</span>
                      )}
                    </td>

                    {/* Time */}
                    <td className="py-2.5 px-2 text-left text-[11px] text-slate-500 font-sans hidden sm:table-cell">
                      {formatRelativeTime(bet.timestamp)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
