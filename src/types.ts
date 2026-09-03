export interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  role: 'user' | 'admin';
  status?: 'active' | 'banned';
  createdAt?: string;
  stats?: {
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
  details?: any;
  timestamp: string;
}

export interface GameSettings {
  crash: {
    rtp: number;
    forcedNextMultiplier: number | null;
  };
  roulette: {
    rtp: number;
    forcedNextNumber: number | null;
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
  plinko?: {
    rtp: number;
  };
  coinflip?: {
    rtp: number;
    forcedNextOutcome: 'heads' | 'tails' | null;
  };
  globalFairMode: boolean;
  admin2faRequired: boolean;
}

export type ActiveGameTab = 'lobby' | 'crash' | 'roulette' | 'slots' | 'mines' | 'dice' | 'plinko' | 'coinflip';

export type SubmissionType = 'none' | 'link' | 'image' | 'video' | 'text';

export interface StepTask {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  reward: number; // in Tomans
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
  content: string;
  fileName?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface UserTaskProgress {
  currentTask: StepTask | null;
  submission: TaskSubmission | null;
  totalActiveTasks: number;
  completedCount: number;
  allCompleted: boolean;
  userCurrentStep: number;
}
