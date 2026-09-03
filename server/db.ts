import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  balance: number; // Starts at 0 upon registration
  role: 'user' | 'admin';
  status: 'active' | 'banned';
  twoFactorSecret?: string;
  twoFactorEnabled?: boolean;
  createdAt: string;
  lastLoginAt?: string;
  stats: {
    totalBets: number;
    totalWon: number;
    totalLost: number;
  };
}

export interface AdminLog {
  id: string;
  timestamp: string;
  adminId: string;
  adminUsername: string;
  action: string;
  targetUser?: string;
  details: string;
  ip: string;
}

export interface Bet {
  id: string;
  userId: string;
  username: string;
  game: 'crash' | 'roulette' | 'slots' | 'mines' | 'dice' | 'plinko' | 'coinflip';
  betAmount: number;
  multiplier: number;
  payout: number;
  won: boolean;
  details?: Record<string, any>;
  timestamp: string;
}

export interface GameSettings {
  crash: {
    rtp: number; // 90% default (10% house edge)
    forcedNextMultiplier: number | null;
  };
  roulette: {
    rtp: number;
    forcedNextNumber: number | null; // 0-36
  };
  slots: {
    rtp: number;
    forcedNextOutcome: 'jackpot' | 'mega' | 'triple' | 'loss' | null;
  };
  mines: {
    rtp: number;
    riggedLossStep: number | null;
  };
  dice: {
    rtp: number;
    forcedNextRoll: number | null;
  };
  plinko: {
    rtp: number;
  };
  coinflip: {
    rtp: number;
    forcedNextOutcome: 'heads' | 'tails' | null;
  };
  globalFairMode: boolean;
  admin2faRequired: boolean;
}

export type SubmissionType = 'none' | 'link' | 'image' | 'video' | 'text';

export interface StepTask {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  reward: number; // Toman
  submissionType: SubmissionType;
  requiresAdminApproval: boolean;
  actionUrl?: string;
  buttonText?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  username: string;
  stepNumber: number;
  reward: number;
  submissionType: SubmissionType;
  content: string; // text, url, or base64
  fileName?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface DatabaseSchema {
  users: User[];
  adminLogs: AdminLog[];
  bets: Bet[];
  settings: GameSettings;
  tokens: Record<string, { userId: string; role: string; expiresAt: number }>;
  stepTasks: StepTask[];
  taskSubmissions: TaskSubmission[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Helper to hash password
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return computedHash === hash;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default settings (calibrated strictly with 10% secret house edge = 90% RTP)
const defaultSettings: GameSettings = {
  crash: {
    rtp: 90,
    forcedNextMultiplier: null,
  },
  roulette: {
    rtp: 90,
    forcedNextNumber: null,
  },
  slots: {
    rtp: 90,
    forcedNextOutcome: null,
  },
  mines: {
    rtp: 90,
    riggedLossStep: null,
  },
  dice: {
    rtp: 90,
    forcedNextRoll: null,
  },
  plinko: {
    rtp: 90,
  },
  coinflip: {
    rtp: 90,
    forcedNextOutcome: null,
  },
  globalFairMode: false,
  admin2faRequired: true,
};

// Seed default admin
const adminSalt = 'aria_casino_secure_salt_2026';
const adminHashed = hashPassword('admin123', adminSalt);

const defaultAdmin: User = {
  id: 'admin-1',
  username: 'admin',
  email: 'admin@ariacasino.local',
  passwordHash: adminHashed.hash,
  salt: adminHashed.salt,
  balance: 5000000, // Demo balance for admin testing
  role: 'admin',
  status: 'active',
  twoFactorSecret: '778899', // 6-digit fixed setup code or TOTP
  twoFactorEnabled: true,
  createdAt: new Date().toISOString(),
  stats: {
    totalBets: 0,
    totalWon: 0,
    totalLost: 0,
  },
};

// Seed demo user with ZERO balance (as explicitly requested: "موقع ثبت نام موجودی صفر باشه")
const userSalt = 'aria_casino_user_salt_2026';
const userHashed = hashPassword('user123', userSalt);
const demoUser: User = {
  id: 'user-demo-1',
  username: 'player1',
  email: 'player1@aria.local',
  passwordHash: userHashed.hash,
  salt: userHashed.salt,
  balance: 0, // Exactly 0 balance as required
  role: 'user',
  status: 'active',
  createdAt: new Date().toISOString(),
  stats: {
    totalBets: 0,
    totalWon: 0,
    totalLost: 0,
  },
};

let db: DatabaseSchema = {
  users: [defaultAdmin, demoUser],
  adminLogs: [
    {
      id: 'log-init-1',
      timestamp: new Date().toISOString(),
      adminId: 'admin-1',
      adminUsername: 'system',
      action: 'SYSTEM_BOOT',
      details: 'پایگاه داده کازینو آریا مقداردهی شد و سیستم امنیتی فعال گردید.',
      ip: '127.0.0.1',
    },
  ],
  bets: [],
  settings: defaultSettings,
  tokens: {},
  stepTasks: [],
  taskSubmissions: [],
};

// Load database from disk
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    db = {
      users: parsed.users || [defaultAdmin, demoUser],
      adminLogs: parsed.adminLogs || [],
      bets: parsed.bets || [],
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
      tokens: parsed.tokens || {},
      stepTasks: parsed.stepTasks || [],
      taskSubmissions: parsed.taskSubmissions || [],
    };
    // Ensure admin exists
    if (!db.users.find(u => u.role === 'admin')) {
      db.users.push(defaultAdmin);
    }
  } else {
    saveDb();
  }
} catch (err) {
  console.error('Error loading DB, using fallback in-memory state:', err);
}

export function saveDb(): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB to disk:', err);
  }
}

export function getDb(): DatabaseSchema {
  return db;
}

export function createToken(userId: string, role: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  db.tokens[token] = {
    userId,
    role,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  saveDb();
  return token;
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  if (!token) return null;
  const session = db.tokens[token];
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    delete db.tokens[token];
    saveDb();
    return null;
  }
  return { userId: session.userId, role: session.role };
}

export function logAdminAction(
  adminId: string,
  adminUsername: string,
  action: string,
  details: string,
  targetUser?: string,
  ip = '127.0.0.1'
): void {
  const log: AdminLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    adminId,
    adminUsername,
    action,
    targetUser,
    details,
    ip,
  };
  db.adminLogs.unshift(log);
  if (db.adminLogs.length > 500) {
    db.adminLogs = db.adminLogs.slice(0, 500); // keep last 500 logs
  }
  saveDb();
}
