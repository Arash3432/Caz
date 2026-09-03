import React from 'react';
import { LayoutGrid, Flame, CircleDot, Sparkles, Bomb, Dices, Shield, Coins } from 'lucide-react';
import { ActiveGameTab, User } from '../types';
import { sound } from '../utils/audio';

interface BottomNavProps {
  activeTab: ActiveGameTab | 'admin';
  onChangeTab: (tab: ActiveGameTab | 'admin') => void;
  user: User | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, user }) => {
  const navItems = [
    { id: 'lobby' as ActiveGameTab, label: 'سالن بازی‌ها', icon: LayoutGrid, color: 'text-amber-400' },
    { id: 'crash' as ActiveGameTab, label: 'انفجار', icon: Flame, color: 'text-orange-400' },
    { id: 'plinko' as ActiveGameTab, label: 'پلینکو', icon: Sparkles, color: 'text-pink-400' },
    { id: 'coinflip' as ActiveGameTab, label: 'شیر یا خط', icon: Coins, color: 'text-yellow-400' },
    { id: 'roulette' as ActiveGameTab, label: 'رولت', icon: CircleDot, color: 'text-emerald-400' },
    { id: 'mines' as ActiveGameTab, label: 'مین‌ها', icon: Bomb, color: 'text-blue-400' },
    { id: 'slots' as ActiveGameTab, label: 'اسلات', icon: Sparkles, color: 'text-yellow-400' },
    { id: 'dice' as ActiveGameTab, label: 'طاس', icon: Dices, color: 'text-purple-400' },
  ];

  if (user?.role === 'admin') {
    navItems.push({
      id: 'admin' as any,
      label: 'ادمین',
      icon: Shield,
      color: 'text-red-400',
    });
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-1 py-1 shadow-[0_-8px_25px_rgba(0,0,0,0.6)]"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}
    >
      <div className="flex items-center justify-between overflow-x-auto scrollbar-none gap-1 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                sound.chipClick();
                onChangeTab(item.id);
              }}
              className={`flex flex-col items-center justify-center flex-shrink-0 min-w-[56px] py-1 rounded-xl transition-all relative ${
                isActive
                  ? 'text-amber-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Glow Pill */}
              {isActive && (
                <span className="absolute -top-1 w-6 h-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              )}

              <div
                className={`p-1 rounded-lg transition-transform ${
                  isActive
                    ? 'bg-amber-500/15 scale-110'
                    : 'hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? item.color : 'text-slate-400'}`} />
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 whitespace-nowrap ${isActive ? 'font-black text-amber-200' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
