import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

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

function resolveDataDirectory(): string {
  // If DATA_DIR is explicitly passed via environment variable
  const candidates = [
    process.env.DATA_DIR,
    path.join(process.cwd(), 'data'),
    path.join(os.tmpdir(), 'aria_casino_data'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      // Check if candidate exists or is a broken symlink (e.g. unattached Liara disk)
      try {
        const lstat = fs.lstatSync(candidate);
        if (lstat.isSymbolicLink()) {
          try {
            fs.statSync(candidate);
          } catch {
            // Broken dangling symlink - unlink it so we can create a real directory
            console.warn(`[Storage] Detected and unlinked broken symlink at: ${candidate}`);
            fs.unlinkSync(candidate);
          }
        }
      } catch {
        // Path does not exist yet
      }

      // Ensure directory exists
      if (!fs.existsSync(candidate)) {
        fs.mkdirSync(candidate, { recursive: true });
      }

      // Test write permissions
      const probeFile = path.join(candidate, `.probe_${Date.now()}`);
      fs.writeFileSync(probeFile, 'ok', 'utf-8');
      fs.unlinkSync(probeFile);

      console.log(`[Storage] Active database storage directory: ${candidate}`);
      return candidate;
    } catch (err: any) {
      console.warn(`[Storage] Directory candidate "${candidate}" unusable: ${err?.message}`);
    }
  }

  // Fallback to system temp directory
  const fallback = path.join(os.tmpdir(), 'aria_fallback_data');
  try {
    if (!fs.existsSync(fallback)) {
      fs.mkdirSync(fallback, { recursive: true });
    }
    return fallback;
  } catch {
    return os.tmpdir();
  }
}

const DATA_DIR = resolveDataDirectory();
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
    // Seed initial lively bets if empty
    if (!db.bets || db.bets.length === 0) {
      db.bets = [
        { id: 'b-seed-1', userId: 'seed-1', username: 'amir_teh', game: 'crash', betAmount: 50000, multiplier: 4.85, payout: 242500, won: true, timestamp: new Date(Date.now() - 40000).toISOString() },
        { id: 'b-seed-2', userId: 'seed-2', username: 'sara_vip', game: 'roulette', betAmount: 20000, multiplier: 2.0, payout: 40000, won: true, timestamp: new Date(Date.now() - 110000).toISOString() },
        { id: 'b-seed-3', userId: 'seed-3', username: 'reza_k', game: 'plinko', betAmount: 15000, multiplier: 9.0, payout: 135000, won: true, timestamp: new Date(Date.now() - 170000).toISOString() },
        { id: 'b-seed-4', userId: 'seed-4', username: 'mehdi_7', game: 'mines', betAmount: 25000, multiplier: 3.48, payout: 87000, won: true, timestamp: new Date(Date.now() - 250000).toISOString() },
        { id: 'b-seed-5', userId: 'seed-5', username: 'omid_99', game: 'slots', betAmount: 10000, multiplier: 12.0, payout: 120000, won: true, timestamp: new Date(Date.now() - 320000).toISOString() },
        { id: 'b-seed-6', userId: 'seed-6', username: 'shayan_x', game: 'coinflip', betAmount: 100000, multiplier: 1.90, payout: 190000, won: true, timestamp: new Date(Date.now() - 410000).toISOString() },
        { id: 'b-seed-7', userId: 'seed-7', username: 'alireza', game: 'crash', betAmount: 30000, multiplier: 8.20, payout: 246000, won: true, timestamp: new Date(Date.now() - 530000).toISOString() },
        { id: 'b-seed-8', userId: 'seed-8', username: 'parham_t', game: 'dice', betAmount: 40000, multiplier: 1.95, payout: 78000, won: true, timestamp: new Date(Date.now() - 670000).toISOString() },
      ];
    }
  } else {
    db.bets = [
      { id: 'b-seed-1', userId: 'seed-1', username: 'amir_teh', game: 'crash', betAmount: 50000, multiplier: 4.85, payout: 242500, won: true, timestamp: new Date(Date.now() - 40000).toISOString() },
      { id: 'b-seed-2', userId: 'seed-2', username: 'sara_vip', game: 'roulette', betAmount: 20000, multiplier: 2.0, payout: 40000, won: true, timestamp: new Date(Date.now() - 110000).toISOString() },
      { id: 'b-seed-3', userId: 'seed-3', username: 'reza_k', game: 'plinko', betAmount: 15000, multiplier: 9.0, payout: 135000, won: true, timestamp: new Date(Date.now() - 170000).toISOString() },
      { id: 'b-seed-4', userId: 'seed-4', username: 'mehdi_7', game: 'mines', betAmount: 25000, multiplier: 3.48, payout: 87000, won: true, timestamp: new Date(Date.now() - 250000).toISOString() },
      { id: 'b-seed-5', userId: 'seed-5', username: 'omid_99', game: 'slots', betAmount: 10000, multiplier: 12.0, payout: 120000, won: true, timestamp: new Date(Date.now() - 320000).toISOString() },
      { id: 'b-seed-6', userId: 'seed-6', username: 'shayan_x', game: 'coinflip', betAmount: 100000, multiplier: 1.90, payout: 190000, won: true, timestamp: new Date(Date.now() - 410000).toISOString() },
      { id: 'b-seed-7', userId: 'seed-7', username: 'alireza', game: 'crash', betAmount: 30000, multiplier: 8.20, payout: 246000, won: true, timestamp: new Date(Date.now() - 530000).toISOString() },
      { id: 'b-seed-8', userId: 'seed-8', username: 'parham_t', game: 'dice', betAmount: 40000, multiplier: 1.95, payout: 78000, won: true, timestamp: new Date(Date.now() - 670000).toISOString() },
    ];
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
