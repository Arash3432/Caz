import React, { useState, useEffect } from 'react';
import { User, ActiveGameTab } from './types';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AuthModal } from './components/AuthModal';
import { LiaraGuideModal } from './components/LiaraGuideModal';
import { GameLobby } from './components/GameLobby';
import { CrashGame } from './components/games/CrashGame';
import { RouletteGame } from './components/games/RouletteGame';
import { SlotsGame } from './components/games/SlotsGame';
import { MinesGame } from './components/games/MinesGame';
import { DiceGame } from './components/games/DiceGame';
import { PlinkoGame } from './components/games/PlinkoGame';
import { CoinFlipGame } from './components/games/CoinFlipGame';
import { AdminPanel } from './components/AdminPanel';
import { sound } from './utils/audio';
import { ShieldCheck, Cloud, Gift } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveGameTab | 'admin'>('lobby');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'user_login' | 'user_register' | 'admin_login'>('user_login');
  const [liaraModalOpen, setLiaraModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [faucetLoading, setFaucetLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Restore session
  useEffect(() => {
    const token = localStorage.getItem('aria_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error();
        })
        .then((data) => {
          setCurrentUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('aria_token');
        });
    }
  }, []);

  const handleLoginSuccess = (user: User, token: string) => {
    localStorage.setItem('aria_token', token);
    setCurrentUser(user);
    showToast(`خوش آمدید، ${user.username}!`);
    if (user.role === 'admin') {
      setActiveTab('admin');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aria_token');
    setCurrentUser(null);
    setActiveTab('lobby');
    showToast('با موفقیت خارج شدید.');
  };

  const handleRefreshBalance = (newBalance?: number) => {
    if (newBalance !== undefined && currentUser) {
      setCurrentUser({ ...currentUser, balance: newBalance });
      return;
    }
    const token = localStorage.getItem('aria_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error();
        })
        .then((data) => {
          if (data.user) setCurrentUser(data.user);
        })
        .catch(() => {});
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleClaimFaucet = async () => {
    if (!currentUser) {
      setAuthMode('user_login');
      setAuthModalOpen(true);
      return;
    }
    setFaucetLoading(true);
    try {
      const res = await fetch('/api/user/claim-faucet', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('aria_token')}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در شارژ آزمایشی');
      setCurrentUser({ ...currentUser, balance: data.balance });
      sound.win();
      showToast(data.message);
    } catch (err: any) {
      showToast(err.message || 'امکان دریافت شارژ وجود ندارد');
    } finally {
      setFaucetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-5 md:top-auto md:bottom-5 z-50 animate-in fade-in zoom-in duration-200 w-[90%] max-w-sm pointer-events-none">
          <div className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-xs shadow-2xl flex items-center justify-between border border-amber-300">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header Navbar */}
      <Navbar
        user={currentUser}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenAuth={(mode = 'user_login') => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenAdmin={() => {
          if (currentUser?.role === 'admin') {
            setActiveTab('admin');
          } else {
            setAuthMode('admin_login');
            setAuthModalOpen(true);
          }
        }}
        onOpenLiaraGuide={() => setLiaraModalOpen(true)}
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        onClaimFaucet={handleClaimFaucet}
        faucetLoading={faucetLoading}
      />

      {/* Main Content Area (With bottom padding on mobile for BottomNav) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-4 py-3 sm:py-6 pb-24 md:pb-6">
        {activeTab === 'lobby' && (
          <GameLobby
            onSelectGame={(game) => setActiveTab(game)}
            user={currentUser}
            onRequireAuth={() => {
              setAuthMode('user_login');
              setAuthModalOpen(true);
            }}
            onBalanceUpdate={handleRefreshBalance}
          />
        )}

        {activeTab === 'crash' && (
          <CrashGame
            user={currentUser}
            onUpdateUser={setCurrentUser}
            onRequireAuth={() => {
              setAuthMode('user_login');
              setAuthModalOpen(true);
            }}
            onBackToLobby={() => setActiveTab('lobby')}
          />
        )}

        {activeTab === 'roulette' && (
          <RouletteGame
            user={currentUser}
            onUpdateUser={setCurrentUser}
            onRequireAuth={() => {
              setAuthMode('user_login');
              setAuthModalOpen(true);
            }}
            onBackToLobby={() => setActiveTab('lobby')}
          />
        )}

        {activeTab === 'slots' && (
          <SlotsGame
            user={currentUser}
            onUpdateUser={setCurrentUser}
            onRequireAuth={() => {
              setAuthMode('user_login');
              setAuthModalOpen(true);
            }}
            onBackToLobby={() => setActiveTab('lobby')}
          />
        )}

        {activeTab === 'mines' && (
          <MinesGame
            user={currentUser}
            onUpdateUser={setCurrentUser}
            onRequireAuth={() => {
              setAuthMode('user_login');
              setAuthModalOpen(true);
            }}
            onBackToLobby={() => setActiveTab('lobby')}
          />
        )}

        {activeTab === 'dice' && (
          <DiceGame
            user={currentUser}
            onUpdateUser={setCurrentUser}
            onRequireAuth={() => {
              setAuthMode('user_login');
              setAuthModalOpen(true);
            }}
            onBackToLobby={() => setActiveTab('lobby')}
          />
        )}

        {activeTab === 'plinko' && (
          <PlinkoGame
            user={currentUser}
            onUpdateUser={setCurrentUser}
            onRequireAuth={() => {
              setAuthMode('user_login');
              setAuthModalOpen(true);
            }}
            onBackToLobby={() => setActiveTab('lobby')}
          />
        )}

        {activeTab === 'coinflip' && (
          <CoinFlipGame
            user={currentUser}
            onUpdateUser={setCurrentUser}
            onRequireAuth={() => {
              setAuthMode('user_login');
              setAuthModalOpen(true);
            }}
            onBackToLobby={() => setActiveTab('lobby')}
          />
        )}

        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminPanel
            currentUser={currentUser}
            onClose={() => setActiveTab('lobby')}
          />
        )}
      </main>

      {/* Mobile-First Fixed Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        user={currentUser}
      />

      {/* Footer (Desktop & Compact) */}
      <footer className="hidden md:block border-t border-slate-900 bg-slate-950 py-5 px-4 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400">کازینو و هاب سرگرمی آریا • آماده استقرار در لیارا (Liara Cloud)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <button
              onClick={() => setLiaraModalOpen(true)}
              className="hover:text-amber-400 transition flex items-center gap-1"
            >
              <Cloud className="w-3.5 h-3.5 text-amber-400" />
              <span>دستورالعمل استقرار در لیارا</span>
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setAuthMode('admin_login');
                setAuthModalOpen(true);
              }}
              className="hover:text-red-400 transition flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
              <span>ورود ۲FA ادمین</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialMode={authMode}
      />

      <LiaraGuideModal
        isOpen={liaraModalOpen}
        onClose={() => setLiaraModalOpen(false)}
      />
    </div>
  );
}
