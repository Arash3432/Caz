import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  getDb,
  saveDb,
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  logAdminAction,
  User,
  Bet,
  StepTask,
  TaskSubmission,
  SubmissionType,
} from './server/db.js';
import {
  crashRound,
  ROULETTE_NUMBERS,
  RED_NUMBERS,
  BLACK_NUMBERS,
  getRouletteNumberColor,
  SLOT_SYMBOLS,
  activeMinesGames,
  ActiveMinesGame,
} from './server/games.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // Helper middleware for auth
  const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'احراز هویت انجام نشده است.' });
    }
    const token = authHeader.split(' ')[1];
    const session = verifyToken(token);
    if (!session) {
      return res.status(401).json({ error: 'نشست کاربری نامعتبر یا منقضی شده است.' });
    }
    const db = getDb();
    const user = db.users.find(u => u.id === session.userId);
    if (!user) {
      return res.status(401).json({ error: 'کاربر یافت نشد.' });
    }
    if (user.status === 'banned') {
      return res.status(403).json({ error: 'حساب کاربری شما توسط مدیریت مسدود شده است.' });
    }
    (req as any).user = user;
    (req as any).token = token;
    next();
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    authenticate(req, res, () => {
      const user = (req as any).user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'دسترسی فقط مخصوص مدیران ارشد سیستم است.' });
      }
      next();
    });
  };

  // ----------------------------------------------------
  // SECURITY & PROTECTION MIDDLEWARES
  // ----------------------------------------------------

  // In-memory rate limiting map
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  const createRateLimiter = (maxRequests: number, windowMs: number, actionName: string) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const clientIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.ip ||
        req.socket.remoteAddress ||
        'unknown';
      const key = `${actionName}:${clientIp}`;
      const now = Date.now();
      const record = rateLimitMap.get(key);

      if (!record || now > record.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
        return next();
      }

      record.count++;
      if (record.count > maxRequests) {
        const remainingSeconds = Math.ceil((record.resetTime - now) / 1000);
        res.setHeader('Retry-After', remainingSeconds);
        return res.status(429).json({
          error: `تعداد درخواست‌های مکرر شما بیش از حد مجاز است. لطفاً ${remainingSeconds} ثانیه دیگر مجدداً تلاش کنید.`,
          retryAfter: remainingSeconds,
        });
      }

      next();
    };
  };

  // Clean and sanitize text to prevent stored XSS or injection
  const sanitizeText = (input: any, maxLength = 3000): string => {
    if (typeof input !== 'string') return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, maxLength);
  };

  // Safe bet amount validator (blocks negative, NaN, floating decimals, or amounts above balance)
  const validateBet = (
    amountRaw: any,
    userBalance: number,
    min = 1000,
    max = 100_000_000
  ): { valid: boolean; error?: string; amount: number } => {
    const num = Number(amountRaw);
    if (!Number.isFinite(num) || isNaN(num)) {
      return { valid: false, error: 'مبلغ شرط نامعتبر است.', amount: 0 };
    }
    const amount = Math.floor(num);
    if (amount < min) {
      return {
        valid: false,
        error: `حداقل مبلغ شرط ${min.toLocaleString('fa-IR')} تومان می‌باشد.`,
        amount: 0,
      };
    }
    if (amount > max) {
      return {
        valid: false,
        error: `حداکثر مبلغ شرط در هر راند ${max.toLocaleString('fa-IR')} تومان است.`,
        amount: 0,
      };
    }
    if (userBalance < amount) {
      return { valid: false, error: 'موجودی حساب شما کافی نیست.', amount };
    }
    return { valid: true, amount };
  };

  const authRateLimiter = createRateLimiter(20, 60 * 1000, 'auth');
  const faucetRateLimiter = createRateLimiter(6, 60 * 1000, 'faucet');

  // ----------------------------------------------------
  // AUTH ROUTES
  // ----------------------------------------------------

  // Register - strictly ZERO balance upon registration as requested
  app.post('/api/auth/register', authRateLimiter, (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی است.' });
    }
    const db = getDb();
    const cleanUsername = username.trim().toLowerCase();
    if (db.users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return res.status(400).json({ error: 'این نام کاربری قبلاً ثبت شده است.' });
    }

    const { hash, salt } = hashPassword(password);
    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUsername,
      email: email?.trim() || `${cleanUsername}@player.aria`,
      passwordHash: hash,
      salt,
      balance: 0, // Explicit requirement: 0 initial balance
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      stats: { totalBets: 0, totalWon: 0, totalLost: 0 },
    };

    db.users.push(newUser);
    saveDb();

    const token = createToken(newUser.id, newUser.role);
    res.json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        balance: newUser.balance,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  });

  // Login
  app.post('/api/auth/login', authRateLimiter, (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'نام کاربری و کلمه عبور الزامی است.' });
    }
    const db = getDb();
    const user = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است.' });
    }
    if (user.status === 'banned') {
      return res.status(403).json({ error: 'حساب شما مسدود است. با پشتیبانی ادمین تماس بگیرید.' });
    }

    if (!verifyPassword(password, user.passwordHash, user.salt)) {
      return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است.' });
    }

    user.lastLoginAt = new Date().toISOString();
    saveDb();

    const token = createToken(user.id, user.role);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        role: user.role,
        createdAt: user.createdAt,
        stats: user.stats,
      },
    });
  });

  // Admin 2FA - Step 1
  app.post('/api/auth/admin-login', authRateLimiter, (req, res) => {
    const { username, password } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.username.toLowerCase() === username?.trim().toLowerCase() && u.role === 'admin');

    if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
      logAdminAction(
        'unknown',
        username || 'guest',
        'ADMIN_LOGIN_FAILED',
        'تلاش ناموفق برای ورود به پنل ادمین (رمز نادرست)',
        undefined,
        req.ip || '127.0.0.1'
      );
      return res.status(401).json({ error: 'مشخصات ورود ادمین نادرست است.' });
    }

    // Two-factor authentication required for admin
    res.json({
      success: true,
      require2FA: true,
      adminId: user.id,
      message: 'رمز عبور تأیید شد. لطفاً کد اعتبارسنجی دو مرحله‌ای (2FA) را وارد نمایید.',
      hintCode: user.twoFactorSecret || '778899', // Provided for ease in demo/inspection
    });
  });

  // Admin 2FA - Step 2 (Verification)
  app.post('/api/auth/admin-verify-2fa', authRateLimiter, (req, res) => {
    const { adminId, code } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.id === adminId && u.role === 'admin');

    if (!user) {
      return res.status(401).json({ error: 'ادمین یافت نشد.' });
    }

    const expectedCode = user.twoFactorSecret || '778899';
    if (!code || code.trim() !== expectedCode) {
      logAdminAction(
        user.id,
        user.username,
        'ADMIN_2FA_FAILED',
        `کد دومرحله‌ای اشتباه وارد شد: ${code}`,
        undefined,
        req.ip || '127.0.0.1'
      );
      return res.status(400).json({ error: 'کد احراز هویت دو مرحله‌ای نادرست است.' });
    }

    logAdminAction(
      user.id,
      user.username,
      'ADMIN_LOGIN_SUCCESS',
      'ورود موفقیت‌آمیز به پنل ادمین با تایید دو مرحله‌ای (2FA)',
      undefined,
      req.ip || '127.0.0.1'
    );

    user.lastLoginAt = new Date().toISOString();
    saveDb();

    const token = createToken(user.id, user.role);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        role: user.role,
        twoFactorEnabled: true,
      },
    });
  });

  // Get current user profile
  app.get('/api/auth/me', authenticate, (req, res) => {
    const user = (req as any).user as User;
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        role: user.role,
        createdAt: user.createdAt,
        stats: user.stats,
      },
    });
  });

  // Faucet / Free demo credit request (for testing without real payment gateway)
  app.post('/api/user/claim-faucet', authenticate, faucetRateLimiter, (req, res) => {
    const user = (req as any).user as User;
    const db = getDb();
    const dbUser = db.users.find(u => u.id === user.id);
    if (!dbUser) return res.status(404).json({ error: 'کاربر یافت نشد.' });

    // Allow claim if balance is low (< 5000)
    if (dbUser.balance >= 50000) {
      return res.status(400).json({ error: 'موجودی شما کافی است. این هدیه مخصوص تست برای موجودی اندک است.' });
    }

    const faucetAmount = 50000;
    dbUser.balance += faucetAmount;
    saveDb();

    res.json({
      success: true,
      addedAmount: faucetAmount,
      balance: dbUser.balance,
      message: `مبلغ ${faucetAmount.toLocaleString('fa-IR')} تومان اعتبار تستی با موفقیت به حساب شما اضافه شد.`,
    });
  });

  // ----------------------------------------------------
  // GAME ENDPOINTS
  // ----------------------------------------------------

  // CRASH: Get State
  app.get('/api/games/crash/state', (req, res) => {
    res.json({
      roundId: crashRound.id,
      state: crashRound.state,
      currentMultiplier: crashRound.currentMultiplier,
      crashPoint: crashRound.state === 'crashed' ? crashRound.crashPoint : undefined,
      bettingCountdown: crashRound.bettingCountdown,
      startTime: crashRound.startTime,
      serverTime: Date.now(),
      betsCount: crashRound.bets.length,
      history: crashRound.history.slice(0, 15),
      activeBets: crashRound.bets.map(b => ({
        username: b.username,
        betAmount: b.betAmount,
        cashedOut: b.cashedOut,
        cashoutMultiplier: b.cashoutMultiplier,
      })),
    });
  });

  // CRASH: Place Bet
  app.post('/api/games/crash/bet', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const { betAmount } = req.body;
    const db = getDb();
    const dbUser = db.users.find(u => u.id === user.id);
    if (!dbUser) return res.status(401).json({ error: 'کاربر یافت نشد.' });

    const check = validateBet(betAmount, dbUser.balance, 1000);
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }
    const amount = check.amount;

    if (crashRound.state !== 'betting') {
      return res.status(400).json({ error: 'دوره شرط‌بندی بسته شده است. لطفاً منتظر راند بعدی باشید.' });
    }

    if (crashRound.bets.some(b => b.userId === user.id)) {
      return res.status(400).json({ error: 'شما قبلاً در این راند ثبت شرط کرده‌اید.' });
    }

    dbUser.balance -= amount;
    saveDb();

    crashRound.bets.push({
      userId: user.id,
      username: user.username,
      betAmount: amount,
      cashedOut: false,
    });

    res.json({
      success: true,
      balance: dbUser.balance,
      message: 'شرط شما در بازی انفجار ثبت گردید.',
    });
  });

  // CRASH: Cashout
  app.post('/api/games/crash/cashout', authenticate, (req, res) => {
    const user = (req as any).user as User;
    if (crashRound.state !== 'flying') {
      return res.status(400).json({ error: 'در حال حاضر امکان برداشت وجود ندارد.' });
    }

    const bet = crashRound.bets.find(b => b.userId === user.id);
    if (!bet) {
      return res.status(400).json({ error: 'شما در این راند شرط فعالی ندارید.' });
    }
    if (bet.cashedOut) {
      return res.status(400).json({ error: 'قبلاً برداشت انجام شده است.' });
    }

    const currentMultiplier = crashRound.currentMultiplier;
    const payout = Math.floor(bet.betAmount * currentMultiplier);

    bet.cashedOut = true;
    bet.cashoutMultiplier = currentMultiplier;
    bet.payout = payout;

    const db = getDb();
    const dbUser = db.users.find(u => u.id === user.id);
    if (dbUser) {
      dbUser.balance += payout;
      dbUser.stats.totalBets += 1;
      dbUser.stats.totalWon += payout - bet.betAmount;
    }

    db.bets.unshift({
      id: `bet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      username: user.username,
      game: 'crash',
      betAmount: bet.betAmount,
      multiplier: currentMultiplier,
      payout,
      won: true,
      timestamp: new Date().toISOString(),
      details: { cashoutMultiplier: currentMultiplier },
    });
    saveDb();

    res.json({
      success: true,
      multiplier: currentMultiplier,
      payout,
      balance: dbUser?.balance || 0,
      message: `تبریک! در ضریب ${currentMultiplier}x با موفقیت برداشت کردید.`,
    });
  });

  // ROULETTE: Spin
  app.post('/api/games/roulette/spin', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const { bets } = req.body; // { red: 5000, black: 0, straight_17: 2000, even: 1000, etc. }
    if (!bets || typeof bets !== 'object') {
      return res.status(400).json({ error: 'شرط‌های رولت نامعتبر است.' });
    }

    let totalBet = 0;
    const sanitizedBets: Record<string, number> = {};
    for (const key of Object.keys(bets)) {
      const val = Math.floor(Number(bets[key]));
      if (val < 0 || isNaN(val) || !Number.isFinite(val)) {
        return res.status(400).json({ error: 'مبلغ شرط نامعتبر است.' });
      }
      if (val > 0) {
        totalBet += val;
        sanitizedBets[key] = val;
      }
    }

    const db = getDb();
    const dbUser = db.users.find(u => u.id === user.id);
    if (!dbUser) return res.status(401).json({ error: 'کاربر یافت نشد.' });

    const check = validateBet(totalBet, dbUser.balance, 1000);
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }

    dbUser.balance -= totalBet;

    // Determine winning number
    let winningNumber: number;
    if (db.settings.roulette.forcedNextNumber !== null) {
      winningNumber = db.settings.roulette.forcedNextNumber;
      db.settings.roulette.forcedNextNumber = null; // consume forced result
    } else {
      winningNumber = Math.floor(Math.random() * 37); // 0 to 36
    }

    const color = getRouletteNumberColor(winningNumber);
    let totalPayout = 0;

    // Evaluate bets
    for (const [betKey, amountRaw] of Object.entries(bets)) {
      const amount = Number(amountRaw);
      if (amount <= 0) continue;

      if (betKey === 'red' && color === 'red') totalPayout += amount * 2;
      else if (betKey === 'black' && color === 'black') totalPayout += amount * 2;
      else if (betKey === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) totalPayout += amount * 2;
      else if (betKey === 'odd' && winningNumber % 2 !== 0) totalPayout += amount * 2;
      else if (betKey === 'low' && winningNumber >= 1 && winningNumber <= 18) totalPayout += amount * 2;
      else if (betKey === 'high' && winningNumber >= 19 && winningNumber <= 36) totalPayout += amount * 2;
      else if (betKey === 'dozen_1' && winningNumber >= 1 && winningNumber <= 12) totalPayout += amount * 3;
      else if (betKey === 'dozen_2' && winningNumber >= 13 && winningNumber <= 24) totalPayout += amount * 3;
      else if (betKey === 'dozen_3' && winningNumber >= 25 && winningNumber <= 36) totalPayout += amount * 3;
      else if (betKey === 'col_1' && winningNumber > 0 && (winningNumber - 1) % 3 === 0) totalPayout += amount * 3;
      else if (betKey === 'col_2' && winningNumber > 0 && (winningNumber - 2) % 3 === 0) totalPayout += amount * 3;
      else if (betKey === 'col_3' && winningNumber > 0 && winningNumber % 3 === 0) totalPayout += amount * 3;
      else if (betKey.startsWith('number_')) {
        const targetNum = Number(betKey.replace('number_', ''));
        if (targetNum === winningNumber) {
          totalPayout += amount * 36;
        }
      }
    }

    dbUser.balance += totalPayout;
    dbUser.stats.totalBets += 1;
    if (totalPayout > totalBet) {
      dbUser.stats.totalWon += (totalPayout - totalBet);
    } else {
      dbUser.stats.totalLost += (totalBet - totalPayout);
    }

    db.bets.unshift({
      id: `bet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      username: user.username,
      game: 'roulette',
      betAmount: totalBet,
      multiplier: totalBet > 0 ? Number((totalPayout / totalBet).toFixed(2)) : 0,
      payout: totalPayout,
      won: totalPayout > 0,
      timestamp: new Date().toISOString(),
      details: { winningNumber, color, totalBet, bets },
    });
    saveDb();

    res.json({
      winningNumber,
      color,
      totalBet,
      totalPayout,
      netProfit: totalPayout - totalBet,
      won: totalPayout > totalBet,
      balance: dbUser.balance,
    });
  });

  // SLOTS: Spin
  app.post('/api/games/slots/spin', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const { betAmount } = req.body;
    const db = getDb();
    const dbUser = db.users.find(u => u.id === user.id);
    if (!dbUser) return res.status(401).json({ error: 'کاربر یافت نشد.' });

    const check = validateBet(betAmount, dbUser.balance, 500);
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }
    const amount = check.amount;

    dbUser.balance -= amount;

    // 5 reels x 3 rows grid
    let grid: string[][] = [];
    const forced = db.settings.slots.forcedNextOutcome;

    if (forced === 'jackpot') {
      // 5 seven icons on middle line
      grid = [
        ['crown', 'seven', 'star'],
        ['bell', 'seven', 'cherry'],
        ['seven', 'seven', 'seven'],
        ['diamond', 'seven', 'clover'],
        ['star', 'seven', 'bell'],
      ];
      db.settings.slots.forcedNextOutcome = null;
    } else if (forced === 'mega') {
      grid = [
        ['seven', 'diamond', 'bell'],
        ['cherry', 'diamond', 'star'],
        ['star', 'diamond', 'crown'],
        ['crown', 'diamond', 'clover'],
        ['bell', 'diamond', 'seven'],
      ];
      db.settings.slots.forcedNextOutcome = null;
    } else if (forced === 'loss') {
      grid = [
        ['cherry', 'bell', 'star'],
        ['star', 'crown', 'diamond'],
        ['clover', 'seven', 'cherry'],
        ['diamond', 'star', 'bell'],
        ['seven', 'clover', 'crown'],
      ];
      db.settings.slots.forcedNextOutcome = null;
    } else {
      // Weighted generation according to RTP
      const rtp = db.settings.slots.rtp / 100;
      const symbolsPool: string[] = [];
      SLOT_SYMBOLS.forEach(sym => {
        for (let i = 0; i < sym.weight; i++) {
          symbolsPool.push(sym.id);
        }
      });

      for (let r = 0; r < 5; r++) {
        const col: string[] = [];
        for (let row = 0; row < 3; row++) {
          col.push(symbolsPool[Math.floor(Math.random() * symbolsPool.length)]);
        }
        grid.push(col);
      }
    }

    // Evaluate lines (Top row, Middle row, Bottom row, V-shape, Inverted V)
    // Row 0, 1, 2 across 5 reels
    const lines = [
      { name: 'خط میانی', indices: [grid[0][1], grid[1][1], grid[2][1], grid[3][1], grid[4][1]] },
      { name: 'خط بالا', indices: [grid[0][0], grid[1][0], grid[2][0], grid[3][0], grid[4][0]] },
      { name: 'خط پایین', indices: [grid[0][2], grid[1][2], grid[2][2], grid[3][2], grid[4][2]] },
      { name: 'خط مورب V', indices: [grid[0][0], grid[1][1], grid[2][2], grid[3][1], grid[4][0]] },
      { name: 'خط هشتی ^', indices: [grid[0][2], grid[1][1], grid[2][0], grid[3][1], grid[4][2]] },
    ];

    let totalMultiplier = 0;
    const winningLines: any[] = [];

    for (const line of lines) {
      const first = line.indices[0];
      let matchCount = 1;
      for (let i = 1; i < line.indices.length; i++) {
        if (line.indices[i] === first) matchCount++;
        else break;
      }
      if (matchCount >= 3) {
        const symbolDef = SLOT_SYMBOLS.find(s => s.id === first);
        if (symbolDef) {
          let lineMult = 0;
          if (matchCount === 5) lineMult = symbolDef.multiplier5;
          else if (matchCount === 4) lineMult = symbolDef.multiplier4;
          else if (matchCount === 3) lineMult = symbolDef.multiplier3;

          totalMultiplier += lineMult;
          winningLines.push({
            name: line.name,
            symbol: symbolDef.nameFa,
            icon: symbolDef.icon,
            matchCount,
            multiplier: lineMult,
          });
        }
      }
    }

    const payout = Math.floor(amount * totalMultiplier);
    dbUser.balance += payout;
    dbUser.stats.totalBets += 1;
    if (payout > amount) dbUser.stats.totalWon += (payout - amount);
    else dbUser.stats.totalLost += (amount - payout);

    db.bets.unshift({
      id: `bet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      username: user.username,
      game: 'slots',
      betAmount: amount,
      multiplier: totalMultiplier,
      payout,
      won: payout > 0,
      timestamp: new Date().toISOString(),
      details: { totalMultiplier, winningLines },
    });
    saveDb();

    res.json({
      grid,
      winningLines,
      totalMultiplier,
      payout,
      balance: dbUser.balance,
      won: payout > 0,
    });
  });

  // MINES: Start
  app.post('/api/games/mines/start', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const { betAmount, minesCount } = req.body;
    const mines = Math.max(1, Math.min(24, Math.floor(Number(minesCount)) || 3));

    const db = getDb();
    const dbUser = db.users.find(u => u.id === user.id);
    if (!dbUser) return res.status(401).json({ error: 'کاربر یافت نشد.' });

    const check = validateBet(betAmount, dbUser.balance, 1000);
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }
    const amount = check.amount;

    // Place mines
    const grid: boolean[] = new Array(25).fill(false);
    let placed = 0;
    while (placed < mines) {
      const idx = Math.floor(Math.random() * 25);
      if (!grid[idx]) {
        grid[idx] = true;
        placed++;
      }
    }

    dbUser.balance -= amount;
    saveDb();

    const game: ActiveMinesGame = {
      userId: user.id,
      betAmount: amount,
      minesCount: mines,
      grid,
      revealed: [],
      currentMultiplier: 1.0,
      status: 'active',
      startedAt: new Date().toISOString(),
    };
    activeMinesGames.set(user.id, game);

    res.json({
      success: true,
      minesCount: mines,
      betAmount: amount,
      currentMultiplier: 1.0,
      revealed: [],
      balance: dbUser.balance,
    });
  });

  // MINES: Reveal Tile
  app.post('/api/games/mines/reveal', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const { tileIndex } = req.body;
    const idx = Number(tileIndex);

    if (idx < 0 || idx > 24) {
      return res.status(400).json({ error: 'مختصات خانه نامعتبر است.' });
    }

    const game = activeMinesGames.get(user.id);
    if (!game || game.status !== 'active') {
      return res.status(400).json({ error: 'هیچ بازی فعال مین‌ها یافت نشد.' });
    }

    if (game.revealed.includes(idx)) {
      return res.status(400).json({ error: 'این خانه قبلاً باز شده است.' });
    }

    const db = getDb();
    // Check if admin rigged loss step is reached
    const riggedStep = db.settings.mines.riggedLossStep;
    if (riggedStep && game.revealed.length + 1 >= riggedStep) {
      game.grid[idx] = true; // force mine
    }

    const isMine = game.grid[idx];
    if (isMine) {
      // BOOM!
      game.status = 'exploded';
      game.revealed.push(idx);

      const dbUser = db.users.find(u => u.id === user.id);
      if (dbUser) {
        dbUser.stats.totalBets += 1;
        dbUser.stats.totalLost += game.betAmount;
      }

      db.bets.unshift({
        id: `bet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: user.id,
        username: user.username,
        game: 'mines',
        betAmount: game.betAmount,
        multiplier: 0,
        payout: 0,
        won: false,
        timestamp: new Date().toISOString(),
        details: { tilesRevealed: game.revealed.length, minesCount: game.minesCount },
      });
      saveDb();

      return res.json({
        exploded: true,
        tileIndex: idx,
        fullGrid: game.grid,
        revealed: game.revealed,
        payout: 0,
      });
    }

    // Success Gem!
    game.revealed.push(idx);
    const safeTilesTotal = 25 - game.minesCount;
    const k = game.revealed.length;

    // Standard Mines multiplier formula with strict 10% house edge (90% RTP)
    const minesRtp = (db.settings.mines?.rtp ?? 90) / 100;
    let mult = minesRtp;
    for (let i = 0; i < k; i++) {
      mult *= (25 - i) / (safeTilesTotal - i);
    }
    game.currentMultiplier = Number(mult.toFixed(2));

    const nextMultPreview = Number((mult * ((25 - k) / (safeTilesTotal - k))).toFixed(2));

    res.json({
      exploded: false,
      tileIndex: idx,
      currentMultiplier: game.currentMultiplier,
      nextMultiplier: nextMultPreview,
      revealed: game.revealed,
      currentProfit: Math.floor(game.betAmount * game.currentMultiplier),
      canCashout: true,
    });
  });

  // MINES: Cashout
  app.post('/api/games/mines/cashout', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const game = activeMinesGames.get(user.id);
    if (!game || game.status !== 'active') {
      return res.status(400).json({ error: 'بازی فعالی برای تسویه حساب وجود ندارد.' });
    }
    if (game.revealed.length === 0) {
      return res.status(400).json({ error: 'حداقل باید یک الماس را کشف کنید.' });
    }

    game.status = 'cashed_out';
    const payout = Math.floor(game.betAmount * game.currentMultiplier);

    const db = getDb();
    const dbUser = db.users.find(u => u.id === user.id);
    if (dbUser) {
      dbUser.balance += payout;
      dbUser.stats.totalBets += 1;
      dbUser.stats.totalWon += (payout - game.betAmount);
    }

    db.bets.unshift({
      id: `bet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      username: user.username,
      game: 'mines',
      betAmount: game.betAmount,
      multiplier: game.currentMultiplier,
      payout,
      won: true,
      timestamp: new Date().toISOString(),
      details: { tilesRevealed: game.revealed.length, minesCount: game.minesCount },
    });
    saveDb();

    res.json({
      success: true,
      payout,
      multiplier: game.currentMultiplier,
      fullGrid: game.grid,
      balance: dbUser?.balance || 0,
      message: `تسویه حساب با ضریب ${game.currentMultiplier}x انجام شد.`,
    });
  });

  // DICE: Roll
  app.post('/api/games/dice/roll', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const { betAmount, target, condition } = req.body;
    const targetVal = Number(target);

    if (isNaN(targetVal) || targetVal < 2 || targetVal > 98) {
      return res.status(400).json({ error: 'هدف طاس باید بین ۲ تا ۹۸ باشد.' });
    }

    const db = getDb();
    const dbUser = db.users.find(u => u.id === user.id);
    if (!dbUser) return res.status(401).json({ error: 'کاربر یافت نشد.' });

    const check = validateBet(betAmount, dbUser.balance, 1000);
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }
    const amount = check.amount;

    dbUser.balance -= amount;

    // Roll number (0.00 to 99.99)
    let roll: number;
    if (db.settings.dice.forcedNextRoll !== null) {
      roll = db.settings.dice.forcedNextRoll;
      db.settings.dice.forcedNextRoll = null; // consume forced roll
    } else {
      roll = Number((Math.random() * 99.99).toFixed(2));
    }

    const winChance = condition === 'under' ? targetVal : 100 - targetVal;
    const multiplier = Number(((99.0 / winChance) * (db.settings.dice.rtp / 100)).toFixed(2));

    const won = condition === 'under' ? roll < targetVal : roll > targetVal;
    const payout = won ? Math.floor(amount * multiplier) : 0;

    dbUser.balance += payout;
    dbUser.stats.totalBets += 1;
    if (won) dbUser.stats.totalWon += (payout - amount);
    else dbUser.stats.totalLost += amount;

    db.bets.unshift({
      id: `bet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      username: user.username,
      game: 'dice',
      betAmount: amount,
      multiplier: won ? multiplier : 0,
      payout,
      won,
      timestamp: new Date().toISOString(),
      details: { roll, target: targetVal, condition, winChance },
    });
    saveDb();

    res.json({
      roll,
      target: targetVal,
      condition,
      won,
      multiplier,
      payout,
      netProfit: payout - amount,
      balance: dbUser.balance,
    });
  });

  // ----------------------------------------------------
  // PLINKO: Drop Ball (10 rows, 11 slots, calibrated 90% RTP)
  // ----------------------------------------------------
  const PLINKO_SLOT_MULTIPLIERS = [16, 9, 2, 1.4, 0.4, 0.2, 0.4, 1.4, 2, 9, 16];

  app.post('/api/games/plinko/drop', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const { betAmount } = req.body;

    const db = getDb();
    const dbUser = db.users.find(u => u.id === user.id);
    if (!dbUser) return res.status(401).json({ error: 'کاربر یافت نشد.' });

    const check = validateBet(betAmount, dbUser.balance, 1000);
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }
    const amount = check.amount;

    dbUser.balance -= amount;

    // 10 bounces down the peg pyramid
    // 0 = bounce left, 1 = bounce right
    const path: number[] = [];
    let slotIndex = 0;
    for (let r = 0; r < 10; r++) {
      const step = Math.random() < 0.5 ? 1 : 0;
      path.push(step);
      slotIndex += step;
    }

    const multiplier = PLINKO_SLOT_MULTIPLIERS[slotIndex];
    const payout = Math.floor(amount * multiplier);

    dbUser.balance += payout;
    dbUser.stats.totalBets += 1;
    if (payout > amount) {
      dbUser.stats.totalWon += (payout - amount);
    } else {
      dbUser.stats.totalLost += (amount - payout);
    }

    db.bets.unshift({
      id: `bet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      username: user.username,
      game: 'plinko',
      betAmount: amount,
      multiplier,
      payout,
      won: multiplier >= 1.0,
      timestamp: new Date().toISOString(),
      details: { path, slotIndex, multiplier },
    });
    saveDb();

    res.json({
      path,
      slotIndex,
      multiplier,
      payout,
      netProfit: payout - amount,
      balance: dbUser.balance,
      won: multiplier >= 1.0,
    });
  });

  // ----------------------------------------------------
  // COINFLIP: 3D Dual Coin (Heads or Tails, 10% House Edge -> 1.90x)
  // ----------------------------------------------------
  app.post('/api/games/coinflip/flip', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const { betAmount, choice } = req.body; // choice: 'heads' | 'tails'

    if (choice !== 'heads' && choice !== 'tails') {
      return res.status(400).json({ error: 'انتخاب باید شیر یا خط باشد.' });
    }

    const db = getDb();
    const dbUser = db.users.find(u => u.id === user.id);
    if (!dbUser) return res.status(401).json({ error: 'کاربر یافت نشد.' });

    const check = validateBet(betAmount, dbUser.balance, 1000);
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }
    const amount = check.amount;

    dbUser.balance -= amount;

    let result: 'heads' | 'tails';
    const forced = db.settings.coinflip?.forcedNextOutcome;
    if (forced) {
      result = forced;
      if (db.settings.coinflip) db.settings.coinflip.forcedNextOutcome = null;
    } else {
      result = Math.random() < 0.5 ? 'heads' : 'tails';
    }

    const won = choice === result;
    // 10% house edge -> 1.90x multiplier (90% RTP)
    const multiplier = won ? 1.90 : 0;
    const payout = won ? Math.floor(amount * multiplier) : 0;

    dbUser.balance += payout;
    dbUser.stats.totalBets += 1;
    if (won) {
      dbUser.stats.totalWon += (payout - amount);
    } else {
      dbUser.stats.totalLost += amount;
    }

    db.bets.unshift({
      id: `bet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      username: user.username,
      game: 'coinflip',
      betAmount: amount,
      multiplier: won ? multiplier : 0,
      payout,
      won,
      timestamp: new Date().toISOString(),
      details: { choice, result },
    });
    saveDb();

    res.json({
      result,
      won,
      multiplier,
      payout,
      netProfit: payout - amount,
      balance: dbUser.balance,
    });
  });

  // ----------------------------------------------------
  // PUBLIC LIVE BETS FEED & BIG WINS
  // ----------------------------------------------------
  app.get('/api/bets/live-feed', (req, res) => {
    const db = getDb();
    const mask = (name: string) => {
      if (!name) return 'کاربر***';
      if (name.length <= 3) return name + '***';
      return name.slice(0, 2) + '***' + name.slice(-1);
    };

    const recent = (db.bets || []).slice(0, 25).map(b => ({
      id: b.id,
      username: mask(b.username),
      game: b.game,
      betAmount: b.betAmount,
      multiplier: b.multiplier,
      payout: b.payout,
      won: b.won,
      timestamp: b.timestamp,
    }));

    const topWins = [...(db.bets || [])]
      .filter(b => b.won && b.payout >= 10000)
      .sort((a, b) => b.payout - a.payout)
      .slice(0, 10)
      .map(b => ({
        id: b.id,
        username: mask(b.username),
        game: b.game,
        betAmount: b.betAmount,
        multiplier: b.multiplier,
        payout: b.payout,
        timestamp: b.timestamp,
      }));

    res.json({
      recent,
      topWins,
    });
  });

  // User's own bet history
  app.get('/api/user/my-bets', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const db = getDb();
    const myBets = (db.bets || []).filter(b => b.userId === user.id).slice(0, 40);
    res.json({ bets: myBets });
  });

  // ----------------------------------------------------
  // ADMIN PANEL ENDPOINTS
  // ----------------------------------------------------

  // Admin Overview Stats
  app.get('/api/admin/overview', requireAdmin, (req, res) => {
    const db = getDb();
    const totalUsers = db.users.filter(u => u.role !== 'admin').length;
    const activeUsers = db.users.filter(u => u.status === 'active' && u.role !== 'admin').length;
    const totalWagered = db.bets.reduce((acc, b) => acc + b.betAmount, 0);
    const totalPayouts = db.bets.reduce((acc, b) => acc + b.payout, 0);
    const casinoProfit = totalWagered - totalPayouts;

    res.json({
      totalUsers,
      activeUsers,
      totalWagered,
      totalPayouts,
      casinoProfit,
      totalBetsCount: db.bets.length,
      settings: db.settings,
    });
  });

  // Admin Users List
  app.get('/api/admin/users', requireAdmin, (req, res) => {
    const db = getDb();
    const q = (req.query.q as string || '').toLowerCase();
    let users = db.users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      balance: u.balance,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      stats: u.stats,
    }));

    if (q) {
      users = users.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    res.json({ users });
  });

  // Admin Modify User Balance (+ or -)
  app.post('/api/admin/users/:id/balance', requireAdmin, (req, res) => {
    const admin = (req as any).user as User;
    const { id } = req.params;
    const { amount, action, reason } = req.body; // action: 'add' | 'subtract' | 'set'
    const val = Number(amount);

    if (isNaN(val) || val < 0) {
      return res.status(400).json({ error: 'مبلغ نامعتبر است.' });
    }

    const db = getDb();
    const targetUser = db.users.find(u => u.id === id);
    if (!targetUser) {
      return res.status(404).json({ error: 'کاربر مورد نظر یافت نشد.' });
    }

    const oldBalance = targetUser.balance;
    if (action === 'add') {
      targetUser.balance += val;
    } else if (action === 'subtract') {
      targetUser.balance = Math.max(0, targetUser.balance - val);
    } else if (action === 'set') {
      targetUser.balance = val;
    }

    logAdminAction(
      admin.id,
      admin.username,
      'USER_BALANCE_CHANGED',
      `تغییر موجودی کاربر ${targetUser.username}: از ${oldBalance.toLocaleString('fa-IR')} به ${targetUser.balance.toLocaleString('fa-IR')} تومان (${action} - ${reason || 'دستی ادمین'})`,
      targetUser.username,
      req.ip || '127.0.0.1'
    );

    saveDb();
    res.json({
      success: true,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        balance: targetUser.balance,
      },
    });
  });

  // Admin Ban / Unban User
  app.post('/api/admin/users/:id/status', requireAdmin, (req, res) => {
    const admin = (req as any).user as User;
    const { id } = req.params;
    const { status, reason } = req.body; // 'active' | 'banned'

    if (status !== 'active' && status !== 'banned') {
      return res.status(400).json({ error: 'وضعیت نامعتبر است.' });
    }

    const db = getDb();
    const targetUser = db.users.find(u => u.id === id);
    if (!targetUser) {
      return res.status(404).json({ error: 'کاربر یافت نشد.' });
    }

    targetUser.status = status;
    logAdminAction(
      admin.id,
      admin.username,
      status === 'banned' ? 'USER_BANNED' : 'USER_UNBANNED',
      `وضعیت کاربر ${targetUser.username} به ${status === 'banned' ? 'مسدود شده' : 'فعال'} تغییر یافت. دلیل: ${reason || 'تصمیم ادمین'}`,
      targetUser.username,
      req.ip || '127.0.0.1'
    );

    saveDb();
    res.json({ success: true, user: targetUser });
  });

  // Admin Settings & RTPs
  app.get('/api/admin/settings', requireAdmin, (req, res) => {
    const db = getDb();
    res.json({ settings: db.settings });
  });

  app.post('/api/admin/settings', requireAdmin, (req, res) => {
    const admin = (req as any).user as User;
    const { crashRtp, rouletteRtp, slotsRtp, minesRtp, diceRtp, globalFairMode } = req.body;
    const db = getDb();

    const oldCrashRtp = db.settings.crash.rtp;
    if (crashRtp !== undefined) db.settings.crash.rtp = Math.min(100, Math.max(10, Number(crashRtp)));
    if (rouletteRtp !== undefined) db.settings.roulette.rtp = Math.min(100, Math.max(10, Number(rouletteRtp)));
    if (slotsRtp !== undefined) db.settings.slots.rtp = Math.min(100, Math.max(10, Number(slotsRtp)));
    if (minesRtp !== undefined) db.settings.mines.rtp = Math.min(100, Math.max(10, Number(minesRtp)));
    if (diceRtp !== undefined) db.settings.dice.rtp = Math.min(100, Math.max(10, Number(diceRtp)));
    if (globalFairMode !== undefined) db.settings.globalFairMode = Boolean(globalFairMode);

    logAdminAction(
      admin.id,
      admin.username,
      'GAME_SETTINGS_UPDATED',
      `بروزرسانی نرخ‌های برد (RTP): انفجار=${db.settings.crash.rtp}%، رولت=${db.settings.roulette.rtp}%، اسلات=${db.settings.slots.rtp}%، حالت بازی منصفانه=${db.settings.globalFairMode}`,
      undefined,
      req.ip || '127.0.0.1'
    );

    saveDb();
    res.json({ success: true, settings: db.settings });
  });

  // Admin Security: Change Password & 2FA Secret Key
  app.post('/api/admin/security/update-credentials', requireAdmin, (req, res) => {
    const admin = (req as any).user as User;
    const { currentPassword, newPassword, new2faSecret } = req.body;
    const db = getDb();
    const adminUser = db.users.find(u => u.id === admin.id && u.role === 'admin');

    if (!adminUser) {
      return res.status(404).json({ error: 'حساب ادمین یافت نشد.' });
    }

    if (!verifyPassword(currentPassword, adminUser.passwordHash, adminUser.salt)) {
      return res.status(400).json({ error: 'رمز عبور فعلی نادرست است.' });
    }

    if (newPassword && newPassword.length >= 6) {
      const { hash, salt } = hashPassword(newPassword);
      adminUser.passwordHash = hash;
      adminUser.salt = salt;
    }

    if (new2faSecret && new2faSecret.trim().length === 6) {
      adminUser.twoFactorSecret = new2faSecret.trim();
    }

    logAdminAction(
      adminUser.id,
      adminUser.username,
      'ADMIN_CREDENTIALS_UPDATED',
      'تغییر رمز عبور و کد امنیتی احراز هویت دومرحله‌ای ادمین در تنظیمات',
      adminUser.username,
      req.ip || '127.0.0.1'
    );

    saveDb();
    res.json({ success: true, message: 'اطلاعات امنیتی و رمز عبور ادمین با موفقیت بروزرسانی شد.' });
  });

  // Admin Manual Result Override (امکان مدیریت دستی نتایج بازیها)
  app.post('/api/admin/force-result', requireAdmin, (req, res) => {
    const admin = (req as any).user as User;
    const { game, value } = req.body;
    const db = getDb();

    if (game === 'crash') {
      const forcedMult = value === null ? null : Number(value);
      db.settings.crash.forcedNextMultiplier = forcedMult;
      logAdminAction(
        admin.id,
        admin.username,
        'MANUAL_RESULT_OVERRIDE',
        `تنظیم دستی نتیجه بعدی بازی انفجار: ${forcedMult !== null ? forcedMult + 'x' : 'حالت خودکار'}`,
        undefined,
        req.ip || '127.0.0.1'
      );
    } else if (game === 'roulette') {
      const forcedNum = value === null ? null : Number(value);
      db.settings.roulette.forcedNextNumber = forcedNum;
      logAdminAction(
        admin.id,
        admin.username,
        'MANUAL_RESULT_OVERRIDE',
        `تنظیم دستی نتیجه بعدی رولت: ${forcedNum !== null ? 'عدد ' + forcedNum : 'حالت خودکار'}`,
        undefined,
        req.ip || '127.0.0.1'
      );
    } else if (game === 'slots') {
      db.settings.slots.forcedNextOutcome = value;
      logAdminAction(
        admin.id,
        admin.username,
        'MANUAL_RESULT_OVERRIDE',
        `تنظیم دستی نتیجه بعدی اسلات: ${value || 'حالت خودکار'}`,
        undefined,
        req.ip || '127.0.0.1'
      );
    } else if (game === 'mines') {
      const step = value === null ? null : Number(value);
      db.settings.mines.riggedLossStep = step;
      logAdminAction(
        admin.id,
        admin.username,
        'MANUAL_RESULT_OVERRIDE',
        `تنظیم انفجار اجباری مین‌ها در خانه شماره: ${step !== null ? step : 'غیرفعال'}`,
        undefined,
        req.ip || '127.0.0.1'
      );
    } else if (game === 'dice') {
      const roll = value === null ? null : Number(value);
      db.settings.dice.forcedNextRoll = roll;
      logAdminAction(
        admin.id,
        admin.username,
        'MANUAL_RESULT_OVERRIDE',
        `تنظیم تاس اجباری بعدی: ${roll !== null ? roll : 'حالت خودکار'}`,
        undefined,
        req.ip || '127.0.0.1'
      );
    }

    saveDb();
    res.json({ success: true, settings: db.settings });
  });

  // Admin Logs (تمامی لاگهای فعالیت ادمینها در دیتابیس ثبت شود)
  app.get('/api/admin/logs', requireAdmin, (req, res) => {
    const db = getDb();
    const action = req.query.action as string;
    let logs = db.adminLogs;
    if (action) {
      logs = logs.filter(l => l.action.toLowerCase().includes(action.toLowerCase()));
    }
    res.json({ logs: logs.slice(0, 200) });
  });

  // Admin Live Bets Table
  app.get('/api/admin/bets', requireAdmin, (req, res) => {
    const db = getDb();
    res.json({ bets: db.bets.slice(0, 100) });
  });

  // ----------------------------------------------------
  // STEP TASKS & FREE BALANCE REWARDS (تسک‌های مرحله‌ای و جوایز)
  // ----------------------------------------------------

  // User: Get current step task & user progress
  app.get('/api/tasks/current', (req, res) => {
    const db = getDb();
    const activeTasks = (db.stepTasks || []).filter(t => t.isActive).sort((a, b) => a.stepNumber - b.stepNumber);

    const authHeader = req.headers.authorization;
    let user: User | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const session = verifyToken(token);
      if (session) {
        user = db.users.find(u => u.id === session.userId) || null;
      }
    }

    if (!user) {
      return res.json({
        currentTask: activeTasks[0] || null,
        submission: null,
        totalActiveTasks: activeTasks.length,
        completedCount: 0,
        allCompleted: false,
        userCurrentStep: 1,
        isLoggedIn: false,
      });
    }

    const userSubmissions = (db.taskSubmissions || []).filter(s => s.userId === user!.id);
    const approvedSubmissions = userSubmissions.filter(s => s.status === 'approved');
    const approvedTaskIds = new Set(approvedSubmissions.map(s => s.taskId));

    // Find the first active task not yet approved
    const currentTask = activeTasks.find(t => !approvedTaskIds.has(t.id)) || null;
    const currentSubmission = currentTask
      ? (userSubmissions.slice().reverse().find(s => s.taskId === currentTask.id) || null)
      : null;

    const allCompleted = activeTasks.length > 0 && activeTasks.every(t => approvedTaskIds.has(t.id));
    const userCurrentStep = currentTask
      ? currentTask.stepNumber
      : (activeTasks.length > 0 ? activeTasks[activeTasks.length - 1].stepNumber + 1 : 1);

    res.json({
      currentTask,
      submission: currentSubmission,
      totalActiveTasks: activeTasks.length,
      completedCount: approvedTaskIds.size,
      allCompleted,
      userCurrentStep,
      isLoggedIn: true,
    });
  });

  // User: Submit proof for current task
  app.post('/api/tasks/submit', authenticate, (req, res) => {
    const user = (req as any).user as User;
    const { taskId, content, fileName } = req.body;
    const db = getDb();

    if (!taskId) {
      return res.status(400).json({ error: 'شناسه تسک الزامی است.' });
    }

    const task = (db.stepTasks || []).find(t => t.id === taskId && t.isActive);
    if (!task) {
      return res.status(404).json({ error: 'تسک مورد نظر یافت نشد یا در حال حاضر غیرفعال است.' });
    }

    // Check sequential eligibility (User cannot skip steps)
    const userSubmissions = (db.taskSubmissions || []).filter(s => s.userId === user.id);
    const approvedTaskIds = new Set(userSubmissions.filter(s => s.status === 'approved').map(s => s.taskId));
    const priorTasks = (db.stepTasks || []).filter(t => t.isActive && t.stepNumber < task.stepNumber);
    const hasUnfinishedPrior = priorTasks.some(t => !approvedTaskIds.has(t.id));

    if (hasUnfinishedPrior) {
      return res.status(400).json({
        error: 'برای انجام این تسک، ابتدا باید مراحل قبلی را با موفقیت به پایان برسانید.',
      });
    }

    if (approvedTaskIds.has(task.id)) {
      return res.status(400).json({ error: 'این تسک قبلاً با موفقیت توسط شما تکمیل شده است.' });
    }

    // Check if there is already a pending submission
    const existingPending = userSubmissions.find(s => s.taskId === task.id && s.status === 'pending');
    if (existingPending) {
      return res.status(400).json({
        error: 'مدرک ارسالی این تسک قبلاً ثبت شده و در انتظار بررسی و تأیید مدیریت است.',
      });
    }

    // Validate submission type
    if (task.submissionType !== 'none' && (!content || !content.trim())) {
      const typeNames: Record<string, string> = {
        image: 'تصویر یا اسکرین‌شات',
        video: 'ویدیو یا پیوند ویدیو',
        link: 'لینک یا نشانی اینترنتی',
        text: 'توضیحات متنی',
      };
      return res.status(400).json({
        error: `ارسال ${typeNames[task.submissionType] || 'مدرک اثبات'} برای این تسک الزامی است.`,
      });
    }

    if (task.requiresAdminApproval) {
      const cleanFileName = sanitizeText(fileName, 120);
      const isDataUri = typeof content === 'string' && content.startsWith('data:');
      const cleanContent = isDataUri ? content : sanitizeText(content, 10000);

      const newSub: TaskSubmission = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        taskId: task.id,
        taskTitle: task.title,
        userId: user.id,
        username: user.username,
        stepNumber: task.stepNumber,
        reward: task.reward,
        submissionType: task.submissionType,
        content: cleanContent,
        fileName: cleanFileName,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };
      db.taskSubmissions.push(newSub);
      saveDb();

      return res.json({
        success: true,
        status: 'pending',
        submission: newSub,
        message: 'مدرک شما با موفقیت ثبت شد و در صف بررسی و تأیید مدیریت قرار گرفت.',
      });
    } else {
      // Instant automated reward
      const targetUser = db.users.find(u => u.id === user.id);
      if (targetUser) {
        targetUser.balance += task.reward;
      }
      const newSub: TaskSubmission = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        taskId: task.id,
        taskTitle: task.title,
        userId: user.id,
        username: user.username,
        stepNumber: task.stepNumber,
        reward: task.reward,
        submissionType: task.submissionType,
        content: content?.trim() || '',
        fileName: fileName || '',
        status: 'approved',
        submittedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'سیستم هوشمند آریا',
        adminNote: 'تأیید خودکار بدون نیاز به بررسی دستی مدیر',
      };
      db.taskSubmissions.push(newSub);
      saveDb();

      return res.json({
        success: true,
        status: 'approved',
        submission: newSub,
        reward: task.reward,
        newBalance: targetUser ? targetUser.balance : user.balance,
        message: `🎉 تبریک! تسک با موفقیت تکمیل شد و مبلغ ${task.reward.toLocaleString('fa-IR')} تومان به موجودی شما افزوده گردید!`,
      });
    }
  });

  // Admin: Get all tasks and submissions
  app.get('/api/admin/tasks', requireAdmin, (req, res) => {
    const db = getDb();
    res.json({
      tasks: (db.stepTasks || []).sort((a, b) => a.stepNumber - b.stepNumber),
      submissions: (db.taskSubmissions || []).slice().reverse(),
    });
  });

  // Admin: Create new task
  app.post('/api/admin/tasks', requireAdmin, (req, res) => {
    const admin = (req as any).user as User;
    const {
      stepNumber,
      title,
      description,
      reward,
      submissionType,
      requiresAdminApproval,
      actionUrl,
      buttonText,
      isActive,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'عنوان و توضیحات تسک الزامی است.' });
    }

    const db = getDb();
    if (!db.stepTasks) db.stepTasks = [];

    const parsedStep = Number(stepNumber) || (db.stepTasks.length + 1);
    const parsedReward = Math.max(0, Number(reward) || 0);

    const newTask: StepTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      stepNumber: parsedStep,
      title: title.trim(),
      description: description.trim(),
      reward: parsedReward,
      submissionType: submissionType || 'none',
      requiresAdminApproval: !!requiresAdminApproval,
      actionUrl: actionUrl?.trim() || undefined,
      buttonText: buttonText?.trim() || undefined,
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
    };

    db.stepTasks.push(newTask);
    logAdminAction(
      admin.id,
      admin.username,
      'TASK_CREATED',
      `ایجاد تسک مرحله ${newTask.stepNumber}: «${newTask.title}» با پاداش ${newTask.reward.toLocaleString('fa-IR')} تومان`,
      undefined,
      req.ip || '127.0.0.1'
    );

    saveDb();
    res.json({ success: true, task: newTask, message: 'تسک جدید با موفقیت ایجاد شد.' });
  });

  // Admin: Update task
  app.put('/api/admin/tasks/:id', requireAdmin, (req, res) => {
    const admin = (req as any).user as User;
    const { id } = req.params;
    const db = getDb();
    const task = (db.stepTasks || []).find(t => t.id === id);

    if (!task) {
      return res.status(404).json({ error: 'تسک یافت نشد.' });
    }

    const {
      stepNumber,
      title,
      description,
      reward,
      submissionType,
      requiresAdminApproval,
      actionUrl,
      buttonText,
      isActive,
    } = req.body;

    if (stepNumber !== undefined) task.stepNumber = Number(stepNumber);
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (reward !== undefined) task.reward = Math.max(0, Number(reward));
    if (submissionType !== undefined) task.submissionType = submissionType;
    if (requiresAdminApproval !== undefined) task.requiresAdminApproval = !!requiresAdminApproval;
    if (actionUrl !== undefined) task.actionUrl = actionUrl.trim() || undefined;
    if (buttonText !== undefined) task.buttonText = buttonText.trim() || undefined;
    if (isActive !== undefined) task.isActive = !!isActive;

    logAdminAction(
      admin.id,
      admin.username,
      'TASK_UPDATED',
      `بروزرسانی مشخصات تسک مرحله ${task.stepNumber}: «${task.title}»`,
      undefined,
      req.ip || '127.0.0.1'
    );

    saveDb();
    res.json({ success: true, task, message: 'تسک با موفقیت بروزرسانی شد.' });
  });

  // Admin: Delete task
  app.delete('/api/admin/tasks/:id', requireAdmin, (req, res) => {
    const admin = (req as any).user as User;
    const { id } = req.params;
    const db = getDb();
    const index = (db.stepTasks || []).findIndex(t => t.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'تسک یافت نشد.' });
    }

    const [deleted] = db.stepTasks.splice(index, 1);
    logAdminAction(
      admin.id,
      admin.username,
      'TASK_DELETED',
      `حذف تسک مرحله ${deleted.stepNumber}: «${deleted.title}»`,
      undefined,
      req.ip || '127.0.0.1'
    );

    saveDb();
    res.json({ success: true, message: 'تسک با موفقیت حذف شد.' });
  });

  // Admin: Review User Submission (Approve or Reject)
  app.post('/api/admin/tasks/submissions/:id/review', requireAdmin, (req, res) => {
    const admin = (req as any).user as User;
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'وضعیت باید approved یا rejected باشد.' });
    }

    const db = getDb();
    const sub = (db.taskSubmissions || []).find(s => s.id === id);
    if (!sub) {
      return res.status(404).json({ error: 'مدرک ارسالی یافت نشد.' });
    }

    const targetUser = db.users.find(u => u.id === sub.userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'کاربر مربوط به این مدرک یافت نشد.' });
    }

    const previousStatus = sub.status;

    if (status === 'approved' && previousStatus !== 'approved') {
      // Award the money to user balance
      targetUser.balance += sub.reward;
      sub.status = 'approved';
      sub.reviewedAt = new Date().toISOString();
      sub.reviewedBy = admin.username;
      sub.adminNote = adminNote?.trim() || 'تأیید شده توسط مدیریت';

      logAdminAction(
        admin.id,
        admin.username,
        'SUBMISSION_APPROVED',
        `تأیید تسک مرحله ${sub.stepNumber} کاربر ${targetUser.username} و واریز ${sub.reward.toLocaleString('fa-IR')} تومان به موجودی او`,
        targetUser.username,
        req.ip || '127.0.0.1'
      );
    } else if (status === 'rejected') {
      // If was previously approved, we deduct the reward back
      if (previousStatus === 'approved') {
        targetUser.balance = Math.max(0, targetUser.balance - sub.reward);
      }
      sub.status = 'rejected';
      sub.reviewedAt = new Date().toISOString();
      sub.reviewedBy = admin.username;
      sub.adminNote = adminNote?.trim() || 'مدرک ارسالی مورد تأیید قرار نگرفت.';

      logAdminAction(
        admin.id,
        admin.username,
        'SUBMISSION_REJECTED',
        `رد مدرک تسک مرحله ${sub.stepNumber} کاربر ${targetUser.username} به دلیل: ${sub.adminNote}`,
        targetUser.username,
        req.ip || '127.0.0.1'
      );
    }

    saveDb();
    res.json({
      success: true,
      submission: sub,
      message: status === 'approved' ? 'مدرک با موفقیت تأیید شد و پاداش به حساب کاربر منظور گردید.' : 'مدرک رد شد و کاربر می‌تواند مجدداً اقدام کند.',
    });
  });

  // ----------------------------------------------------
  // VITE MIDDLEWARE (Development) or STATIC (Production)
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aria Casino Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
