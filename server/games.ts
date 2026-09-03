import { getDb, saveDb, User, Bet } from './db.js';

export interface ActiveMinesGame {
  userId: string;
  betAmount: number;
  minesCount: number;
  grid: boolean[]; // true = mine, false = gem
  revealed: number[];
  currentMultiplier: number;
  status: 'active' | 'exploded' | 'cashed_out';
  startedAt: string;
}

export const activeMinesGames: Map<string, ActiveMinesGame> = new Map();

// Global Crash Game State for continuous live synchronization
export interface CrashRound {
  id: string;
  startTime: number;
  state: 'betting' | 'flying' | 'crashed';
  crashPoint: number;
  currentMultiplier: number;
  bettingCountdown: number; // in seconds
  bets: {
    userId: string;
    username: string;
    betAmount: number;
    cashedOut: boolean;
    cashoutMultiplier?: number;
    payout?: number;
  }[];
  history: number[];
}

export const crashRound: CrashRound = {
  id: `crash-${Date.now()}`,
  startTime: Date.now() + 5000,
  state: 'betting',
  crashPoint: 2.15,
  currentMultiplier: 1.00,
  bettingCountdown: 5,
  bets: [],
  history: [1.84, 3.42, 1.15, 8.20, 2.05, 1.45, 5.10, 1.02, 4.30, 2.75],
};

// Calculate crash point according to RTP and manual override
export function generateNextCrashPoint(): number {
  const db = getDb();
  if (db.settings.crash.forcedNextMultiplier !== null && db.settings.crash.forcedNextMultiplier > 0) {
    const forced = db.settings.crash.forcedNextMultiplier;
    db.settings.crash.forcedNextMultiplier = null; // consume forced override
    saveDb();
    return Number(forced.toFixed(2));
  }

  const rtp = (db.settings.crash?.rtp ?? 90) / 100; // default 0.90 = 10% house edge
  const instantCrashChance = 1 - rtp; // 10% instant crash at 1.00
  if (Math.random() < instantCrashChance) {
    return 1.00;
  }

  // Pareto-style distribution with strictly 10% house edge
  const rand = Math.random();
  let multiplier = (rtp * 0.99) / (1 - (rand * 0.90));
  multiplier = Math.max(1.01, Math.min(250.0, multiplier));
  return Number(multiplier.toFixed(2));
}

// Live Crash loop tick
setInterval(() => {
  const now = Date.now();
  if (crashRound.state === 'betting') {
    const remaining = Math.max(0, Math.ceil((crashRound.startTime - now) / 1000));
    crashRound.bettingCountdown = remaining;
    if (remaining <= 0) {
      crashRound.state = 'flying';
      crashRound.currentMultiplier = 1.00;
      crashRound.crashPoint = generateNextCrashPoint();
      crashRound.startTime = now;
    }
  } else if (crashRound.state === 'flying') {
    const elapsedSeconds = (now - crashRound.startTime) / 1000;
    // Exponential growth: 1.00 * e^(0.06 * t^1.4)
    const rawMultiplier = 1.00 + (Math.pow(elapsedSeconds, 1.35) * 0.35);
    crashRound.currentMultiplier = Number(rawMultiplier.toFixed(2));

    if (crashRound.currentMultiplier >= crashRound.crashPoint) {
      // CRASH!
      crashRound.currentMultiplier = crashRound.crashPoint;
      crashRound.state = 'crashed';
      crashRound.history.unshift(crashRound.crashPoint);
      if (crashRound.history.length > 25) crashRound.history.pop();

      // Process any uncached bets as lost
      const db = getDb();
      for (const b of crashRound.bets) {
        if (!b.cashedOut) {
          const user = db.users.find(u => u.id === b.userId);
          if (user) {
            user.stats.totalBets += 1;
            user.stats.totalLost += b.betAmount;
          }
          db.bets.unshift({
            id: `bet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            userId: b.userId,
            username: b.username,
            game: 'crash',
            betAmount: b.betAmount,
            multiplier: crashRound.crashPoint,
            payout: 0,
            won: false,
            timestamp: new Date().toISOString(),
            details: { crashPoint: crashRound.crashPoint, cashedOut: false },
          });
        }
      }
      saveDb();

      // Schedule next round in 4 seconds
      setTimeout(() => {
        crashRound.id = `crash-${Date.now()}`;
        crashRound.startTime = Date.now() + 6000;
        crashRound.state = 'betting';
        crashRound.bettingCountdown = 6;
        crashRound.bets = [];
        crashRound.currentMultiplier = 1.00;
      }, 4000);
    }
  }
}, 100);

// Helper for Roulette
export const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];
export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
export const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

export function getRouletteNumberColor(num: number): 'green' | 'red' | 'black' {
  if (num === 0) return 'green';
  return RED_NUMBERS.includes(num) ? 'red' : 'black';
}

// Slots Symbols & Paytable
export interface SlotSymbol {
  id: string;
  nameFa: string;
  icon: string;
  multiplier3: number;
  multiplier4: number;
  multiplier5: number;
  weight: number;
}

export const SLOT_SYMBOLS: SlotSymbol[] = [
  { id: 'seven', nameFa: 'هفت طلایی', icon: '7️⃣', multiplier3: 20, multiplier4: 50, multiplier5: 150, weight: 5 },
  { id: 'diamond', nameFa: 'الماس نئونی', icon: '💎', multiplier3: 15, multiplier4: 35, multiplier5: 80, weight: 8 },
  { id: 'crown', nameFa: 'تاج سلطنتی', icon: '👑', multiplier3: 10, multiplier4: 25, multiplier5: 50, weight: 12 },
  { id: 'bell', nameFa: 'زنگ طلایی', icon: '🔔', multiplier3: 6, multiplier4: 15, multiplier5: 30, weight: 18 },
  { id: 'star', nameFa: 'ستاره شانس', icon: '⭐', multiplier3: 4, multiplier4: 10, multiplier5: 20, weight: 22 },
  { id: 'clover', nameFa: 'برگ شبدر', icon: '🍀', multiplier3: 3, multiplier4: 6, multiplier5: 12, weight: 28 },
  { id: 'cherry', nameFa: 'گیلاس سرخ', icon: '🍒', multiplier3: 2, multiplier4: 4, multiplier5: 8, weight: 35 },
];
