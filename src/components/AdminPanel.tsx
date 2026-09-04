import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Sliders,
  FileText,
  Activity,
  DollarSign,
  TrendingUp,
  Percent,
  Search,
  Plus,
  Minus,
  Ban,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Flame,
  CircleDot,
  Sparkles,
  Bomb,
  Dices,
  Lock,
  Edit,
  History,
  KeyRound,
  ShieldCheck,
  Gift,
  ExternalLink,
  Image as ImageIcon,
  Video as VideoIcon,
  Link as LinkIcon,
  Trash2,
  Eye,
  Check,
  X,
  Layers,
  Clock,
  Coins,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Copy,
  CheckCheck,
  Play,
} from 'lucide-react';
import { User, AdminLog, Bet, GameSettings, StepTask, TaskSubmission, SubmissionType } from '../types';
import { sound } from '../utils/audio';

interface AdminPanelProps {
  currentUser: User;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onClose }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'rtp' | 'override' | 'logs' | 'bets' | 'security' | 'tasks'
  >('overview');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Security Credentials state
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [new2faCode, setNew2faCode] = useState('');

  // Step Tasks state
  const [adminTasks, setAdminTasks] = useState<StepTask[]>([]);
  const [adminSubmissions, setAdminSubmissions] = useState<TaskSubmission[]>([]);
  const [taskSubFilter, setTaskSubFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState<boolean>(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Task Form inputs
  const [taskStepNumber, setTaskStepNumber] = useState<number>(1);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [taskReward, setTaskReward] = useState<number>(50000);
  const [taskSubmissionType, setTaskSubmissionType] = useState<SubmissionType>('none');
  const [taskRequiresAdminApproval, setTaskRequiresAdminApproval] = useState<boolean>(false);
  const [taskActionUrl, setTaskActionUrl] = useState<string>('');
  const [taskButtonText, setTaskButtonText] = useState<string>('');
  const [taskIsActive, setTaskIsActive] = useState<boolean>(true);

  // Review Submission
  const [reviewingSub, setReviewingSub] = useState<TaskSubmission | null>(null);
  const [adminReviewNote, setAdminReviewNote] = useState<string>('');
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const [viewingProofSub, setViewingProofSub] = useState<TaskSubmission | null>(null);
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [imageRotate, setImageRotate] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userQuery, setUserQuery] = useState<string>('');
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);

  // User balance modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [balanceAmount, setBalanceAmount] = useState<string>('50000');
  const [balanceAction, setBalanceAction] = useState<'add' | 'subtract' | 'set'>('add');
  const [balanceReason, setBalanceReason] = useState<string>('شارژ دستی توسط ادمین');

  // Manual Override states
  const [crashNext, setCrashNext] = useState<string>('2.50');
  const [rouletteNext, setRouletteNext] = useState<string>('17');
  const [slotsNext, setSlotsNext] = useState<'jackpot' | 'mega' | 'triple' | 'loss'>('jackpot');
  const [minesStep, setMinesStep] = useState<string>('2');
  const [diceNext, setDiceNext] = useState<string>('95.50');

  const token = localStorage.getItem('aria_token');

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOverview(data);
      if (data.settings) setSettings(data.settings);
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(userQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSettings(data.settings);
    } catch (e) {}
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {}
  };

  const fetchBets = async () => {
    try {
      const res = await fetch('/api/admin/bets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBets(data.bets || []);
    } catch (e) {}
  };

  const fetchAdminTasks = async () => {
    try {
      const res = await fetch('/api/admin/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAdminTasks(data.tasks || []);
      setAdminSubmissions(data.submissions || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchOverview();
    fetchAdminTasks();
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'rtp') fetchSettings();
    else if (activeTab === 'override') fetchSettings();
    else if (activeTab === 'logs') fetchLogs();
    else if (activeTab === 'bets') fetchBets();
    else if (activeTab === 'tasks') fetchAdminTasks();
  }, [activeTab]);

  const handleOpenCreateTask = () => {
    setEditingTaskId(null);
    setTaskStepNumber(adminTasks.length + 1);
    setTaskTitle('');
    setTaskDescription('');
    setTaskReward(50000);
    setTaskSubmissionType('none');
    setTaskRequiresAdminApproval(false);
    setTaskActionUrl('');
    setTaskButtonText('');
    setTaskIsActive(true);
    setIsTaskFormOpen(true);
  };

  const handleOpenEditTask = (task: StepTask) => {
    setEditingTaskId(task.id);
    setTaskStepNumber(task.stepNumber);
    setTaskTitle(task.title);
    setTaskDescription(task.description);
    setTaskReward(task.reward);
    setTaskSubmissionType(task.submissionType);
    setTaskRequiresAdminApproval(task.requiresAdminApproval);
    setTaskActionUrl(task.actionUrl || '');
    setTaskButtonText(task.buttonText || '');
    setTaskIsActive(task.isActive);
    setIsTaskFormOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingTaskId ? `/api/admin/tasks/${editingTaskId}` : '/api/admin/tasks';
      const method = editingTaskId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stepNumber: taskStepNumber,
          title: taskTitle,
          description: taskDescription,
          reward: taskReward,
          submissionType: taskSubmissionType,
          requiresAdminApproval: taskRequiresAdminApproval,
          actionUrl: taskActionUrl || undefined,
          buttonText: taskButtonText || undefined,
          isActive: taskIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ذخیره تسک');

      setMessage({
        text: editingTaskId ? 'تسک با موفقیت ویرایش شد.' : 'تسک جدید با موفقیت ایجاد شد.',
        type: 'success',
      });
      setIsTaskFormOpen(false);
      setEditingTaskId(null);
      fetchAdminTasks();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('آیا از حذف این تسک اطمینان دارید؟')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در حذف تسک');
      setMessage({ text: 'تسک با موفقیت حذف گردید.', type: 'success' });
      fetchAdminTasks();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaskActive = async (task: StepTask) => {
    try {
      const res = await fetch(`/api/admin/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !task.isActive }),
      });
      if (res.ok) {
        fetchAdminTasks();
      }
    } catch (err) {}
  };

  const handleReviewSubmission = async (status: 'approved' | 'rejected') => {
    if (!reviewingSub) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tasks/submissions/${reviewingSub.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          adminNote: adminReviewNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در بررسی مدرک');

      setMessage({ text: data.message, type: 'success' });
      setReviewingSub(null);
      if (viewingProofSub && viewingProofSub.id === reviewingSub.id) {
        setViewingProofSub(null);
      }
      setAdminReviewNote('');
      fetchAdminTasks();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getProofCategory = (sub: TaskSubmission): 'image' | 'video' | 'link' | 'text' | 'none' => {
    if (sub.submissionType === 'image') return 'image';
    if (sub.submissionType === 'video') return 'video';
    if (sub.submissionType === 'link') return 'link';
    if (sub.submissionType === 'text') return 'text';
    if (sub.submissionType === 'none') return 'none';

    const content = sub.content || '';
    const fileName = (sub.fileName || '').toLowerCase();
    if (content.startsWith('data:image/') || fileName.match(/\.(png|jpg|jpeg|webp|gif|bmp|svg|heic)$/i)) {
      return 'image';
    }
    if (
      content.startsWith('data:video/') ||
      fileName.match(/\.(mp4|webm|mov|mkv|avi|m4v|3gp)$/i) ||
      content.includes('youtube.com') ||
      content.includes('youtu.be') ||
      content.includes('aparat.com')
    ) {
      return 'video';
    }
    if (content.startsWith('http://') || content.startsWith('https://')) {
      return 'link';
    }
    return content ? 'text' : 'none';
  };

  const handleDownloadProofFile = (content: string, rawFileName?: string, subType: string = 'image') => {
    try {
      if (!content) return;
      const isData = content.startsWith('data:');
      let ext = subType === 'video' ? 'mp4' : 'jpg';
      if (isData) {
        const match = content.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);/);
        if (match && match[1]) {
          const mime = match[1].toLowerCase();
          if (mime.includes('png')) ext = 'png';
          else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
          else if (mime.includes('webp')) ext = 'webp';
          else if (mime.includes('gif')) ext = 'gif';
          else if (mime.includes('svg')) ext = 'svg';
          else if (mime.includes('mp4')) ext = 'mp4';
          else if (mime.includes('webm')) ext = 'webm';
          else if (mime.includes('quicktime') || mime.includes('mov')) ext = 'mov';
          else if (mime.includes('x-matroska') || mime.includes('mkv')) ext = 'mkv';
        }
      }
      const finalName = rawFileName || `madrak_${Date.now()}.${ext}`;

      const link = document.createElement('a');
      link.href = content;
      link.download = finalName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      window.open(content, '_blank');
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(balanceAmount),
          action: balanceAction,
          reason: balanceReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در تغییر موجودی');

      setMessage({ text: 'موجودی کاربر با موفقیت تغییر کرد و در لاگ ثبت شد.', type: 'success' });
      setSelectedUser(null);
      fetchUsers();
      fetchOverview();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: any) => {
    const nextStatus = user.status === 'banned' ? 'active' : 'banned';
    if (!confirm(`آیا از ${nextStatus === 'banned' ? 'مسدودسازی' : 'فعال‌سازی'} کاربر ${user.username} اطمینان دارید؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus, reason: 'تغییر وضعیت دستی ادمین' }),
      });
      if (!res.ok) throw new Error();
      fetchUsers();
      setMessage({ text: 'وضعیت کاربر با موفقیت به روزرسانی شد.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'خطا در تغییر وضعیت کاربر', type: 'error' });
    }
  };

  const handleSaveRTP = async () => {
    if (!settings) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          crashRtp: settings.crash.rtp,
          rouletteRtp: settings.roulette.rtp,
          slotsRtp: settings.slots.rtp,
          minesRtp: settings.mines.rtp,
          diceRtp: settings.dice.rtp,
          globalFairMode: settings.globalFairMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ثبت تنظیمات');
      setSettings(data.settings);
      setMessage({ text: 'تنظیمات نرخ برد (RTP) با موفقیت در دیتابیس ذخیره و ثبت لاگ شد.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleForceResult = async (game: string, value: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/force-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ game, value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ثبت نتیجه اجباری');
      setSettings(data.settings);
      setMessage({
        text: `نتیجه اجباری برای بازی ${game} با موفقیت اعمال و در لاگ ثبت شد.`,
        type: 'success',
      });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/security/update-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: currentAdminPassword,
          newPassword: newAdminPassword || undefined,
          new2faSecret: new2faCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در بروزرسانی مشخصات امنیتی');
      setMessage({ text: data.message || 'مشخصات امنیتی ادمین با موفقیت بروزرسانی شد.', type: 'success' });
      setCurrentAdminPassword('');
      setNewAdminPassword('');
      setNew2faCode('');
      fetchLogs();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 border border-red-500/40 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/40 flex items-center justify-center text-red-400 shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-100">پنل کنترل مرکزی و مانیتورینگ ادمین</h2>
              <span className="text-[10px] bg-red-600 text-white font-mono px-2 py-0.5 rounded font-bold">
                2FA VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400">
              ورود با احراز هویت دومرحله‌ای • ثبت دقیق تمام تغییرات در لاگ نظارتی دیتابیس
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === 'overview') fetchOverview();
              else if (activeTab === 'users') fetchUsers();
              else if (activeTab === 'logs') fetchLogs();
              else if (activeTab === 'bets') fetchBets();
              else if (activeTab === 'tasks') fetchAdminTasks();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>بروزرسانی داده‌ها</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white text-xs">
            بستن
          </button>
        </div>
      )}

      {/* Admin Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-2 scrollbar-none text-xs">
        {[
          { id: 'overview', name: 'آمار مالی و داشبورد', icon: Activity },
          { id: 'users', name: 'مدیریت کاربران و موجودی', icon: Users },
          {
            id: 'tasks',
            name: 'تسک‌های مرحله‌ای و جوایز ✨',
            icon: Gift,
            badge: adminSubmissions.filter((s) => s.status === 'pending').length,
          },
          { id: 'rtp', name: 'نرخ برد و شانس (RTP)', icon: Sliders },
          { id: 'override', name: 'کنترل دستی نتایج بازی‌ها', icon: Percent },
          { id: 'logs', name: 'لاگ‌های امنیتی ادمین', icon: FileText },
          { id: 'bets', name: 'جدول زنده شرط‌ها', icon: History },
          { id: 'security', name: 'تنظیمات امنیتی و رمز ۲FA', icon: KeyRound },
        ].map((tab: any) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition relative ${
                isActive
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black font-mono animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <span className="text-xs text-slate-400 flex items-center justify-between">
                <span>کل کاربران ثبت‌نامی</span>
                <Users className="w-4 h-4 text-blue-400" />
              </span>
              <div className="text-2xl font-black font-mono text-slate-100">{overview.totalUsers} نفر</div>
              <div className="text-[11px] text-emerald-400">{overview.activeUsers} کاربر فعال</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <span className="text-xs text-slate-400 flex items-center justify-between">
                <span>مجموع گردش مالی شرط‌ها</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </span>
              <div className="text-2xl font-black font-mono text-amber-300" dir="ltr">
                {overview.totalWagered.toLocaleString('fa-IR')} ت
              </div>
              <div className="text-[11px] text-slate-400">تعداد کل شرط‌ها: {overview.totalBetsCount}</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <span className="text-xs text-slate-400 flex items-center justify-between">
                <span>مجموع جوایز پرداختی به کاربران</span>
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </span>
              <div className="text-2xl font-black font-mono text-slate-200" dir="ltr">
                {overview.totalPayouts.toLocaleString('fa-IR')} ت
              </div>
              <div className="text-[11px] text-slate-400">واریزی‌های سیستمی</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <span className="text-xs text-slate-400 flex items-center justify-between">
                <span>سود خالص کازینو (House Edge)</span>
                <Percent className="w-4 h-4 text-emerald-400" />
              </span>
              <div
                className={`text-2xl font-black font-mono ${
                  overview.casinoProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
                dir="ltr"
              >
                {overview.casinoProfit.toLocaleString('fa-IR')} ت
              </div>
              <div className="text-[11px] text-slate-400">درآمد سیستم از مابه‌التفاوت شرط‌ها</div>
            </div>
          </div>

          {/* Quick status banner */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <div className="font-bold text-slate-200">وضعیت امنیت و کنترل بازی‌ها:</div>
              <div className="text-slate-400">
                احراز هویت دو مرحله‌ای (2FA): <span className="text-emerald-400 font-bold">فعال</span> • حالت بازی منصفانه: {overview.settings?.globalFairMode ? <span className="text-emerald-400">روشن (RNG خالص)</span> : <span className="text-amber-400">تنظیم دستی فعال</span>}
              </div>
            </div>
            <button
              onClick={() => setActiveTab('override')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition"
            >
              رفتن به کنترل دستی نتایج بازی‌ها
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              <input
                type="text"
                placeholder="جستجوی نام کاربری یا ایمیل..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                className="w-full pr-10 pl-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              جستجو
            </button>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs text-slate-300">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-3.5">نام کاربری</th>
                    <th className="p-3.5">ایمیل</th>
                    <th className="p-3.5">موجودی</th>
                    <th className="p-3.5">تعداد شرط</th>
                    <th className="p-3.5">مجموع برد / باخت</th>
                    <th className="p-3.5">نقش</th>
                    <th className="p-3.5">وضعیت</th>
                    <th className="p-3.5 text-center">عملیات ادمین</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-bold text-slate-100">{u.username}</td>
                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">{u.email}</td>
                      <td className="p-3.5 font-mono font-bold text-amber-300">
                        {u.balance.toLocaleString('fa-IR')} ت
                      </td>
                      <td className="p-3.5 font-mono">{u.stats?.totalBets || 0}</td>
                      <td className="p-3.5 text-[11px] font-mono">
                        <span className="text-emerald-400">+{(u.stats?.totalWon || 0).toLocaleString('fa-IR')}</span> /{' '}
                        <span className="text-rose-400">-{(u.stats?.totalLost || 0).toLocaleString('fa-IR')}</span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === 'admin'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {u.role === 'admin' ? 'مدیر ارشد' : 'کاربر عادی'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'banned'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {u.status === 'banned' ? 'مسدود شده' : 'فعال'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setBalanceAmount('50000');
                              setBalanceAction('add');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-[11px] transition flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            <span>تغییر موجودی</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab('tasks');
                              setTaskSubFilter('all');
                            }}
                            className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold text-[11px] transition flex items-center gap-1"
                            title="مشاهده و بررسی مدارک ارسالی این کاربر"
                          >
                            <FileText className="w-3 h-3" />
                            <span>مدارک</span>
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`p-1.5 rounded-lg border transition ${
                                u.status === 'banned'
                                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/60'
                                  : 'bg-rose-950/40 border-rose-500/30 text-rose-400 hover:bg-rose-900/60'
                              }`}
                              title={u.status === 'banned' ? 'رفع مسدودی کاربر' : 'مسدود کردن کاربر'}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal for Balance Adjustment */}
          {selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    ویرایش موجودی کاربر: {selectedUser.username}
                  </h4>
                  <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white text-xs">
                    بستن
                  </button>
                </div>

                <form onSubmit={handleUpdateBalance} className="space-y-4">
                  <div className="p-3 rounded-xl bg-slate-950 text-xs flex justify-between items-center">
                    <span className="text-slate-400">موجودی کنونی کاربر:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {selectedUser.balance.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">نوع عملیات:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setBalanceAction('add')}
                        className={`py-2 rounded-xl text-xs font-bold transition border ${
                          balanceAction === 'add'
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        + افزایش
                      </button>
                      <button
                        type="button"
                        onClick={() => setBalanceAction('subtract')}
                        className={`py-2 rounded-xl text-xs font-bold transition border ${
                          balanceAction === 'subtract'
                            ? 'bg-rose-600 text-white border-rose-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        - کسر
                      </button>
                      <button
                        type="button"
                        onClick={() => setBalanceAction('set')}
                        className={`py-2 rounded-xl text-xs font-bold transition border ${
                          balanceAction === 'set'
                            ? 'bg-amber-600 text-white border-amber-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        = تنظیم قطعی
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">مبلغ (تومان):</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">دلیل و توضیحات (جهت ثبت در لاگ نظارتی):</label>
                    <input
                      type="text"
                      required
                      value={balanceReason}
                      onChange={(e) => setBalanceReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition"
                  >
                    ثبت تغییرات موجودی و ذخیره لاگ امنیتی
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RTP & WIN RATES */}
      {activeTab === 'rtp' && settings && (
        <div className="space-y-6 max-w-3xl mx-auto p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              تنظیم نرخ بازگشت به بازیکن (RTP) و شانس برد بازی‌ها
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              تعیین درصد شانس و سودآوری کازینو. هرچه عدد کمتر باشد، سود کازینو بیشتر خواهد بود.
            </p>
          </div>

          <div className="space-y-5">
            {/* Crash RTP */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  نرخ برد بازی انفجار (Crash RTP)
                </span>
                <span className="font-mono font-bold text-amber-300">{settings.crash.rtp}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={99}
                step={1}
                value={settings.crash.rtp}
                onChange={(e) =>
                  setSettings({ ...settings, crash: { ...settings.crash, rtp: Number(e.target.value) } })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Roulette RTP */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <CircleDot className="w-4 h-4 text-emerald-400" />
                  نرخ برد رولت اروپایی (Roulette RTP)
                </span>
                <span className="font-mono font-bold text-emerald-300">{settings.roulette.rtp}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={99}
                step={1}
                value={settings.roulette.rtp}
                onChange={(e) =>
                  setSettings({ ...settings, roulette: { ...settings.roulette, rtp: Number(e.target.value) } })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Slots RTP */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  نرخ بازگشت اسلات نئونی ۷۷۷ (Slots RTP)
                </span>
                <span className="font-mono font-bold text-yellow-300">{settings.slots.rtp}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={98}
                step={1}
                value={settings.slots.rtp}
                onChange={(e) =>
                  setSettings({ ...settings, slots: { ...settings.slots, rtp: Number(e.target.value) } })
                }
                className="w-full accent-yellow-500 cursor-pointer"
              />
            </div>

            {/* Mines RTP */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <Bomb className="w-4 h-4 text-blue-400" />
                  نرخ برد بازی مین‌ها (Mines RTP)
                </span>
                <span className="font-mono font-bold text-blue-300">{settings.mines.rtp}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={99}
                step={1}
                value={settings.mines.rtp}
                onChange={(e) =>
                  setSettings({ ...settings, mines: { ...settings.mines, rtp: Number(e.target.value) } })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Fair Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-200">حالت تصادفی منصفانه (Global Fair Mode)</div>
                <div className="text-[11px] text-slate-400">
                  در صورت فعال بودن، ضرایب کاملاً ریاضی و بدون هیچ دستکاری یا دخالت ادمین عمل می‌کنند.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.globalFairMode}
                onChange={(e) => setSettings({ ...settings, globalFairMode: e.target.checked })}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <button
              onClick={handleSaveRTP}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-950/50 transition"
            >
              ذخیره تغییرات نرخ برد در دیتابیس
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: MANUAL RESULT OVERRIDE (امکان مدیریت دستی نتایج بازیها) */}
      {activeTab === 'override' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>کنترل دقیق دستی نتایج:</strong> شما می‌توانید برنده یا بازنده دور بعدی هر یک از بازی‌ها را به صورت قطعی مشخص نمایید. این قابلیت جهت تست و کنترل بازی‌ها تعبیه شده و تمامی اقدامات در لاگ ادمین ثبت می‌شود.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Crash Force */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                تنظیم نتیجه بعدی بازی انفجار
              </h4>
              <p className="text-xs text-slate-400">ضریب پرواز دور بعدی موشک را به دلخواه تعیین کنید:</p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleForceResult('crash', 1.0)}
                  className="flex-1 py-1.5 bg-rose-950 border border-rose-500 text-rose-300 rounded-lg text-xs font-bold"
                >
                  باخت آنی (1.00x)
                </button>
                <button
                  type="button"
                  onClick={() => handleForceResult('crash', 2.0)}
                  className="flex-1 py-1.5 bg-slate-800 text-slate-200 rounded-lg text-xs"
                >
                  2.00x
                </button>
                <button
                  type="button"
                  onClick={() => handleForceResult('crash', 5.0)}
                  className="flex-1 py-1.5 bg-slate-800 text-slate-200 rounded-lg text-xs"
                >
                  5.00x
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={crashNext}
                  onChange={(e) => setCrashNext(e.target.value)}
                  placeholder="ضریب دلخواه (مثلاً 3.50)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-amber-300"
                />
                <button
                  onClick={() => handleForceResult('crash', parseFloat(crashNext))}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                >
                  اعمال
                </button>
              </div>
            </div>

            {/* Roulette Force */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-emerald-500" />
                تعیین عدد برنده بعدی رولت
              </h4>
              <p className="text-xs text-slate-400">توپ دقیقاً روی این خانه خواهد ایستاد (۰ تا ۳۶):</p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleForceResult('roulette', 0)}
                  className="flex-1 py-1.5 bg-emerald-950 border border-emerald-500 text-emerald-300 rounded-lg text-xs font-bold"
                >
                  عدد ۰ (سبز)
                </button>
                <button
                  type="button"
                  onClick={() => handleForceResult('roulette', 17)}
                  className="flex-1 py-1.5 bg-slate-800 text-slate-200 rounded-lg text-xs"
                >
                  عدد ۱۷
                </button>
                <button
                  type="button"
                  onClick={() => handleForceResult('roulette', 7)}
                  className="flex-1 py-1.5 bg-red-950 text-red-300 rounded-lg text-xs"
                >
                  عدد ۷
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={36}
                  value={rouletteNext}
                  onChange={(e) => setRouletteNext(e.target.value)}
                  placeholder="عدد 0 تا 36"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100"
                />
                <button
                  onClick={() => handleForceResult('roulette', parseInt(rouletteNext, 10))}
                  className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
                >
                  اعمال
                </button>
              </div>
            </div>

            {/* Slots Force */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                تعیین نتیجه اسپین بعدی اسلات ۷۷۷
              </h4>
              <p className="text-xs text-slate-400">نتیجه چرخش بعدی ریل‌های اسلات را تنظیم کنید:</p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleForceResult('slots', 'jackpot')}
                  className="py-2 px-2 bg-amber-950/60 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold"
                >
                  جک‌پات ۷۷۷ (150x)
                </button>
                <button
                  onClick={() => handleForceResult('slots', 'mega')}
                  className="py-2 px-2 bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold"
                >
                  مگاوین الماس (80x)
                </button>
                <button
                  onClick={() => handleForceResult('slots', 'loss')}
                  className="py-2 px-2 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold"
                >
                  باخت کامل
                </button>
                <button
                  onClick={() => handleForceResult('slots', null)}
                  className="py-2 px-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  حالت رندوم خودکار
                </button>
              </div>
            </div>

            {/* Mines Force */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Bomb className="w-4 h-4 text-blue-500" />
                انفجار اجباری بازی مین‌ها
              </h4>
              <p className="text-xs text-slate-400">مین در چندمین خانه کلیک شده منفجر شود:</p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleForceResult('mines', 1)}
                  className="flex-1 py-1.5 bg-rose-950 border border-rose-500/50 text-rose-300 rounded-lg text-xs"
                >
                  اولین کلیک
                </button>
                <button
                  onClick={() => handleForceResult('mines', 2)}
                  className="flex-1 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  دومین کلیک
                </button>
                <button
                  onClick={() => handleForceResult('mines', null)}
                  className="flex-1 py-1.5 bg-emerald-950/60 text-emerald-300 rounded-lg text-xs"
                >
                  بازی منصفانه
                </button>
              </div>
            </div>

            {/* Dice Force */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Dices className="w-4 h-4 text-purple-500" />
                تعیین عدد تاس بعدی
              </h4>
              <p className="text-xs text-slate-400">تاس بعدی دقیقاً این عدد خواهد بود (0.00 تا 99.99):</p>

              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={99.99}
                  value={diceNext}
                  onChange={(e) => setDiceNext(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100"
                />
                <button
                  onClick={() => handleForceResult('dice', parseFloat(diceNext))}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                >
                  اعمال تاس
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ADMIN AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              لاگ‌های نظارتی و امنیتی ادمین (Admin Audit Trail)
            </h3>
            <span className="text-xs text-slate-400 font-mono">تعداد لاگ‌ها: {logs.length}</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs text-slate-300">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-3.5">زمان</th>
                    <th className="p-3.5">نام ادمین</th>
                    <th className="p-3.5">نوع عملیات</th>
                    <th className="p-3.5">کاربر هدف</th>
                    <th className="p-3.5">شرح دقیق رویداد</th>
                    <th className="p-3.5">آی‌پی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap" dir="ltr">
                        {new Date(l.timestamp).toLocaleTimeString('fa-IR')}
                      </td>
                      <td className="p-3.5 font-bold text-slate-100">{l.adminUsername}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-amber-300">
                          {l.action}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">{l.targetUser || '-'}</td>
                      <td className="p-3.5 text-slate-200">{l.details}</td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-500" dir="ltr">
                        {l.ip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: LIVE BETS */}
      {activeTab === 'bets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              جدول زنده شرط‌بندی‌های اخیر کاربران
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs text-slate-300">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-3.5">زمان</th>
                    <th className="p-3.5">کاربر</th>
                    <th className="p-3.5">بازی</th>
                    <th className="p-3.5">مبلغ شرط</th>
                    <th className="p-3.5">ضریب</th>
                    <th className="p-3.5">مبلغ پرداختی</th>
                    <th className="p-3.5">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {bets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-500">
                        هنوز شرطی در سیستم ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    bets.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-800/40">
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]" dir="ltr">
                          {new Date(b.timestamp).toLocaleTimeString('fa-IR')}
                        </td>
                        <td className="p-3.5 font-bold text-slate-100">{b.username}</td>
                        <td className="p-3.5 font-semibold text-amber-400">{b.game}</td>
                        <td className="p-3.5 font-mono">{b.betAmount.toLocaleString('fa-IR')} ت</td>
                        <td className="p-3.5 font-mono font-bold text-slate-200">{b.multiplier}x</td>
                        <td className="p-3.5 font-mono text-emerald-400 font-bold">
                          {b.payout > 0 ? `${b.payout.toLocaleString('fa-IR')} ت` : '-'}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.won
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {b.won ? 'برد' : 'باخت'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SECURITY & 2FA CREDENTIALS */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100">مدیریت اطلاعات و رمزهای ورود ادمین (۲FA)</h3>
                <p className="text-xs text-slate-400">
                  اطلاعات احراز هویت ادمین محرمانه است و فقط در این بخش قابل مشاهده و تغییر می‌باشد.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">نام کاربری فعلی ادمین:</span>
                <span className="font-mono text-amber-300 font-bold bg-slate-900 px-2 py-1 rounded">
                  {currentUser.username}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">نوع حساب:</span>
                <span className="font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30">
                  مدیر ارشد با دسترسی کامل ۲FA
                </span>
              </div>
            </div>

            <form onSubmit={handleUpdateCredentials} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رمز عبور فعلی ادمین <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="رمز فعلی ادمین را وارد کنید"
                  value={currentAdminPassword}
                  onChange={(e) => setCurrentAdminPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    رمز عبور جدید ادمین (اختیاری)
                  </label>
                  <input
                    type="password"
                    placeholder="در صورت تمایل به تغییر رمز عبور جدید وارد کنید"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">حداقل ۶ کاراکتر</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    کد ۶ رقمی احراز هویت دومرحله‌ای ۲FA (اختیاری)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="کد ۶ رقمی جدید مثلا 778899"
                    value={new2faCode}
                    onChange={(e) => setNew2faCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 font-mono tracking-widest text-center focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">کد ۶ رقمی اختصاصی ورود مرحله دوم</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-950/50 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{loading ? 'در حال ثبت تغییرات...' : 'ذخیره مشخصات امنیتی ادمین'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 8: STEP TASKS & REWARDS (تسک‌های مرحله‌ای و جوایز نقدی) */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Header & Quick Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-slate-100">
                  مدیریت تسک‌های مرحله‌ای و جوایز رایگان ✨
                </h3>
              </div>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                تسک‌ها همواره مرحله‌به‌مرحله به کاربران نمایش داده می‌شوند. شما می‌توانید نوع مدرک
                (عکس، ویدیو، لینک یا متن) و نیاز به تأیید مدیریت را تعیین نمایید.
              </p>
            </div>

            <button
              onClick={handleOpenCreateTask}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>تعریف تسک / مرحله جدید</span>
            </button>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-lg">
              <span className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>کل مراحل تعریف شده</span>
                <Layers className="w-4 h-4 text-amber-400" />
              </span>
              <div className="text-xl font-black font-mono text-slate-100">
                {adminTasks.length} مرحله
              </div>
              <div className="text-[10px] text-slate-500">
                {adminTasks.filter((t) => t.isActive).length} مرحله فعال و در دسترس
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-lg">
              <span className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>در انتظار بررسی ادمین</span>
                <Clock className="w-4 h-4 text-yellow-400" />
              </span>
              <div className="text-xl font-black font-mono text-yellow-400">
                {adminSubmissions.filter((s) => s.status === 'pending').length} مدرک
              </div>
              <div className="text-[10px] text-yellow-500/80">نیازمند تأیید یا رد مدرک</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-lg">
              <span className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>مدارک تأیید شده</span>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </span>
              <div className="text-xl font-black font-mono text-emerald-400">
                {adminSubmissions.filter((s) => s.status === 'approved').length} مورد
              </div>
              <div className="text-[10px] text-emerald-500/80">پاداش به حسابشان افزوده شد</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-lg">
              <span className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>مجموع جوایز پرداخت‌شده</span>
                <Coins className="w-4 h-4 text-amber-400" />
              </span>
              <div className="text-lg font-black font-mono text-amber-300 truncate">
                {adminSubmissions
                  .filter((s) => s.status === 'approved')
                  .reduce((sum, s) => {
                    const t = adminTasks.find((x) => x.id === s.taskId);
                    return sum + (t ? t.reward : 0);
                  }, 0)
                  .toLocaleString('fa-IR')}{' '}
                تومان
              </div>
              <div className="text-[10px] text-slate-500">شارژ رایگان اهدا شده به کاربران</div>
            </div>
          </div>

          {/* TASK CREATION / EDIT FORM MODAL */}
          {isTaskFormOpen && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-black text-slate-100">
                    {editingTaskId ? 'ویرایش اطلاعات مرحله تسک' : 'ایجاد مرحله جدید تسک'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTaskFormOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      شماره مرحله (ترتیب نمایش) <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={taskStepNumber}
                      onChange={(e) => setTaskStepNumber(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      کاربر فقط پس از انجام مراحل قبل، این مرحله را می‌بیند.
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-bold mb-1">
                      عنوان تسک <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: عضویت در کانال تلگرام و دریافت ۵۰ هزار تومان هدیه"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      مبلغ پاداش نقدی (تومان) <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      required
                      value={taskReward}
                      onChange={(e) => setTaskReward(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      معادل {taskReward.toLocaleString('fa-IR')} تومان به موجودی کاربر
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      نیازمند ارسال چه نوع مدرکی است؟ <span className="text-amber-400">*</span>
                    </label>
                    <select
                      value={taskSubmissionType}
                      onChange={(e) => setTaskSubmissionType(e.target.value as SubmissionType)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="none">بدون مدرک (فقط اقدام و کلیک مستقیم)</option>
                      <option value="image">عکس / اسکرین‌شات از انجام کار</option>
                      <option value="video">ویدیو یا فیلم کوتاه</option>
                      <option value="link">لینک یا نشانی وب (مثلاً لینک پست یا کانال)</option>
                      <option value="text">توضیحات متنی یا کد پیگیری / آیدی</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    توضیحات و راهنمای گام‌به‌گام برای کاربر <span className="text-amber-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="توضیح دهید که کاربر دقیقاً باید چه کاری انجام دهد و چه مدرکی ارسال کند..."
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      لینک اقدام مستقیم (اختیاری)
                    </label>
                    <input
                      type="url"
                      placeholder="https://t.me/your_channel"
                      value={taskActionUrl}
                      onChange={(e) => setTaskActionUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-left focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      دکمه‌ای در مودال کاربر جهت هدایت مستقیم به این لینک قرار می‌گیرد.
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      متن دکمه اقدام (اختیاری)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: ورود به کانال تلگرام"
                      value={taskButtonText}
                      onChange={(e) => setTaskButtonText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Settings toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taskRequiresAdminApproval}
                      onChange={(e) => setTaskRequiresAdminApproval(e.target.checked)}
                      className="mt-0.5 rounded text-amber-500 focus:ring-0 focus:outline-none"
                    />
                    <div>
                      <span className="font-bold text-slate-200 block">
                        نیازمند بررسی و تأیید ادمین قبل از واریز جایزه
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        در صورت تیک زدن، پس از ارسال مدرک توسط کاربر، پاداش تنها پس از تأیید شما در
                        همین پنل واریز می‌شود. در غیر این صورت به محض ارسال، جایزه خودکار واریز می‌گردد.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taskIsActive}
                      onChange={(e) => setTaskIsActive(e.target.checked)}
                      className="mt-0.5 rounded text-amber-500 focus:ring-0 focus:outline-none"
                    />
                    <div>
                      <span className="font-bold text-slate-200 block">وضعیت مرحله: فعال</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        در صورت غیرفعال بودن، این مرحله به کاربران در لابی نمایش داده نمی‌شود.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTaskFormOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    {loading ? 'در حال ثبت...' : editingTaskId ? 'ذخیره تغییرات تسک' : 'ایجاد و ثبت تسک'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LIST OF DEFINED TASKS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-black text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>مراحل تسک‌های تعریف‌شده در سامانه (به ترتیب اجرا)</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">{adminTasks.length} تسک</span>
            </div>

            {adminTasks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-dashed border-slate-800 text-center space-y-2">
                <Gift className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-400">هنوز تسکی تعریف نشده است.</p>
                <p className="text-[11px] text-slate-500">
                  جهت راه‌اندازی کادر موجودی رایگان در صفحه اصلی، دکمه «تعریف تسک / مرحله جدید» را بزنید.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {adminTasks
                  .slice()
                  .sort((a, b) => a.stepNumber - b.stepNumber)
                  .map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        task.isActive
                          ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/60 border-slate-800/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-black text-sm shrink-0">
                          {task.stepNumber}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-black text-slate-100">
                              {task.title}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              + {task.reward.toLocaleString('fa-IR')} تومان
                            </span>
                            {!task.isActive && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                غیرفعال
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-2 max-w-2xl">
                            {task.description}
                          </p>

                          <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400 flex-wrap">
                            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                              {task.submissionType === 'image' && <ImageIcon className="w-3 h-3 text-blue-400" />}
                              {task.submissionType === 'video' && <VideoIcon className="w-3 h-3 text-purple-400" />}
                              {task.submissionType === 'link' && <LinkIcon className="w-3 h-3 text-emerald-400" />}
                              {task.submissionType === 'text' && <FileText className="w-3 h-3 text-amber-400" />}
                              {task.submissionType === 'none' && <Check className="w-3 h-3 text-slate-400" />}
                              <span>
                                {task.submissionType === 'image'
                                  ? 'نیازمند عکس/اسکرین‌شات'
                                  : task.submissionType === 'video'
                                  ? 'نیازمند ویدیو'
                                  : task.submissionType === 'link'
                                  ? 'نیازمند لینک'
                                  : task.submissionType === 'text'
                                  ? 'نیازمند توضیحات متنی'
                                  : 'بدون مدرک (اقدام مستقیم)'}
                              </span>
                            </span>

                            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              {task.requiresAdminApproval ? (
                                <span className="text-yellow-400 font-bold">نیازمند بررسی ادمین</span>
                              ) : (
                                <span className="text-emerald-400 font-bold">واریز آنی و خودکار</span>
                              )}
                            </span>

                            {task.actionUrl && (
                              <a
                                href={task.actionUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:underline flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
                              >
                                <span>{task.buttonText || 'مشاهده لینک'}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                        <button
                          onClick={() => handleToggleTaskActive(task)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                            task.isActive
                              ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
                          }`}
                        >
                          {task.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                        </button>

                        <button
                          onClick={() => handleOpenEditTask(task)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
                          title="ویرایش تسک"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 transition border border-rose-500/30"
                          title="حذف تسک"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* SECTION: USER SUBMISSIONS QUEUE (کارتابل بررسی مدارک) */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>کارتابل بررسی مدارک ارسالی کاربران (Submissions)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  مدارک ارسال شده توسط کاربران برای تسک‌های نیازمند تأیید مدیریت
                </p>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
                {[
                  { id: 'all', label: 'همه' },
                  {
                    id: 'pending',
                    label: `در انتظار بررسی (${adminSubmissions.filter((s) => s.status === 'pending').length})`,
                  },
                  { id: 'approved', label: 'تأیید شده' },
                  { id: 'rejected', label: 'رد شده' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTaskSubFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                      taskSubFilter === f.id
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submissions List */}
            {adminSubmissions.filter((s) =>
              taskSubFilter === 'all' ? true : s.status === taskSubFilter
            ).length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-dashed border-slate-800 text-center space-y-1">
                <FileText className="w-7 h-7 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-400">
                  هیچ مدرک ارسالی با این فیلتر یافت نشد.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {adminSubmissions
                  .filter((s) => (taskSubFilter === 'all' ? true : s.status === taskSubFilter))
                  .slice()
                  .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                  .map((sub) => {
                    const task = adminTasks.find((t) => t.id === sub.taskId);
                    const category = getProofCategory(sub);
                    const hasProofContent = Boolean(sub.content && sub.content.trim());

                    return (
                      <div
                        key={sub.id}
                        className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg hover:border-slate-700/80 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                              کاربر: {sub.username}
                            </span>
                            <span className="text-slate-400">
                              مرحله {task?.stepNumber || sub.stepNumber || '?'}:
                            </span>
                            <span className="font-bold text-amber-300">
                              «{task?.title || sub.taskTitle || 'تسک انجام شده'}»
                            </span>
                            <span className="font-mono text-emerald-400 font-bold">
                              (+ {(task?.reward || sub.reward || 0).toLocaleString('fa-IR')} تومان)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-slate-500 font-mono">
                              {new Date(sub.submittedAt).toLocaleDateString('fa-IR')}{' '}
                              {new Date(sub.submittedAt).toLocaleTimeString('fa-IR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                                sub.status === 'pending'
                                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                                  : sub.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              {sub.status === 'pending'
                                ? 'در انتظار بررسی ⏳'
                                : sub.status === 'approved'
                                ? 'تأیید و پرداخت شده ✓'
                                : 'رد شده ✕'}
                            </span>
                          </div>
                        </div>

                        {/* Submitted Proof / Content Showcase */}
                        <div className="text-xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                              <span>مدرک ارسال شده توسط کاربر:</span>
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-amber-400 font-bold">
                                {category === 'image'
                                  ? '📷 تصویر / اسکرین‌شات'
                                  : category === 'video'
                                  ? '🎬 فایل ویدیویی'
                                  : category === 'link'
                                  ? '🔗 پیوند اینترنتی'
                                  : category === 'text'
                                  ? '📝 متن توضیحات'
                                  : 'بدون مدرک'}
                              </span>
                            </span>

                            {hasProofContent && (
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingProofSub(sub);
                                  setImageZoom(1);
                                  setImageRotate(0);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[11px] transition active:scale-95"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>دیدن مدرک ارسال شده</span>
                              </button>
                            )}
                          </div>

                          {/* Image Proof */}
                          {category === 'image' && hasProofContent && (
                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                              <div
                                onClick={() => {
                                  setViewingProofSub(sub);
                                  setImageZoom(1);
                                  setImageRotate(0);
                                }}
                                className="relative w-28 h-20 rounded-lg overflow-hidden border border-slate-700 cursor-pointer group bg-black shrink-0"
                                title="کلیک برای دیدن مدرک در ابعاد بزرگ"
                              >
                                <img
                                  src={sub.content}
                                  alt="مدرک ارسالی"
                                  className="w-full h-full object-cover group-hover:scale-105 transition"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                  <Eye className="w-5 h-5" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="text-slate-300 font-mono text-xs truncate">
                                  {sub.fileName || 'تصویر اسکرین‌شات ارسالی'}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewingProofSub(sub);
                                      setImageZoom(1);
                                      setImageRotate(0);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1 transition"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>دیدن مدرک ارسال شده</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadProofFile(sub.content, sub.fileName, 'image')}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] flex items-center gap-1 border border-slate-700 transition"
                                  >
                                    <Download className="w-3.5 h-3.5 text-amber-400" />
                                    <span>دانلود عکس مدرک</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Video Proof */}
                          {category === 'video' && hasProofContent && (
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                                    <VideoIcon className="w-4 h-4" />
                                  </div>
                                  <span className="text-slate-300 font-mono text-xs truncate">
                                    {sub.fileName || sub.content.slice(0, 55)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setViewingProofSub(sub)}
                                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-1 shadow-md shadow-purple-950 transition"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    <span>دیدن مدرک ارسال شده</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadProofFile(sub.content, sub.fileName, 'video')}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 border border-slate-700 transition"
                                    title="دانلود مستقیم ویدیو"
                                  >
                                    <Download className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="hidden sm:inline">دانلود</span>
                                  </button>
                                </div>
                              </div>

                              {/* Direct in-card video preview */}
                              {sub.content.startsWith('data:video/') && (
                                <video
                                  src={sub.content}
                                  controls
                                  preload="metadata"
                                  className="w-full max-h-48 rounded-lg bg-black object-contain mt-2"
                                />
                              )}
                            </div>
                          )}

                          {/* Link Proof */}
                          {category === 'link' && hasProofContent && (
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <LinkIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span className="text-slate-300 font-mono text-xs truncate" dir="ltr">
                                  {sub.content}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setViewingProofSub(sub)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>دیدن مدرک ارسال شده</span>
                                </button>
                                <a
                                  href={sub.content}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>باز کردن</span>
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Text Proof */}
                          {category === 'text' && hasProofContent && (
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                              <div className="text-slate-200 text-xs whitespace-pre-wrap leading-relaxed line-clamp-3">
                                {sub.content}
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => setViewingProofSub(sub)}
                                  className="text-amber-400 hover:underline text-[11px] font-bold flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>دیدن مدرک ارسال شده کامل</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* None Proof */}
                          {category === 'none' && (
                            <div className="text-slate-400 text-xs italic p-2 rounded-lg bg-slate-950/40">
                              این تسک نیازی به مدرک ارسالی نداشته و توسط کاربر تکمیل شده است.
                            </div>
                          )}

                          {/* Admin Note if already reviewed */}
                          {sub.adminNote && (
                            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                              <span className="font-bold text-amber-400 shrink-0">
                                یادداشت بررسی ادمین:
                              </span>
                              <span>{sub.adminNote}</span>
                            </div>
                          )}
                        </div>

                        {/* Review actions & View proof primary button */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800/80">
                          {hasProofContent ? (
                            <button
                              type="button"
                              onClick={() => {
                                setViewingProofSub(sub);
                                setImageZoom(1);
                                setImageRotate(0);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
                            >
                              <Eye className="w-4 h-4" />
                              <span>دیدن مدرک ارسال شده</span>
                            </button>
                          ) : <div />}

                          <div className="flex items-center gap-2">
                            {sub.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => {
                                    setReviewingSub(sub);
                                    setAdminReviewNote('مدرک مورد تایید است.');
                                    handleReviewSubmission('approved');
                                  }}
                                  disabled={loading}
                                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>تأیید مدرک و واریز جایزه</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setReviewingSub(sub);
                                    setAdminReviewNote('');
                                  }}
                                  disabled={loading}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition disabled:opacity-50"
                                >
                                  <X className="w-4 h-4" />
                                  <span>رد مدرک</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setReviewingSub(sub);
                                  setAdminReviewNote(sub.adminNote || '');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition"
                              >
                                تغییر وضعیت یا ویرایش یادداشت
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REJECTION / REVIEW DIALOG MODAL */}
      {reviewingSub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-black text-slate-100">
                بررسی مدرک کاربر «{reviewingSub.username}»
              </h4>
              <button
                onClick={() => setReviewingSub(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                لطفاً دلیل رد مدرک یا توضیحات مربوطه را بنویسید. این پیام برای کاربر نمایش داده می‌شود تا بتواند مدرک صحیح را ارسال کند.
              </p>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  پیام / دلیل رد برای کاربر:
                </label>
                <textarea
                  rows={3}
                  placeholder="مثال: عکس ارسالی واضح نیست یا عضویت در کانال تأیید نشد. لطفاً اسکرین‌شات واضح‌تری بارگذاری کنید."
                  value={adminReviewNote}
                  onChange={(e) => setAdminReviewNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingSub(null)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                >
                  انصراف
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewSubmission('rejected')}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow-lg shadow-rose-950/50 disabled:opacity-50"
                >
                  {loading ? 'در حال ثبت...' : 'رد قطعی مدرک'}
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewSubmission('approved')}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                >
                  {loading ? 'در حال ثبت...' : 'تأیید و واریز هدیه'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UNIVERSAL PROOF VIEWER MODAL (دیدن مدرک ارسال شده - عکس، ویدیو، لینک و متن با هر پسوندی و دانلود با امنیت) */}
      {viewingProofSub && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setViewingProofSub(null);
            }
          }}
        >
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/90 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-white">
                      دیدن مدرک ارسال شده
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        viewingProofSub.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                          : viewingProofSub.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {viewingProofSub.status === 'pending'
                        ? 'در انتظار بررسی ⏳'
                        : viewingProofSub.status === 'approved'
                        ? 'تأیید شده ✓'
                        : 'رد شده ✕'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    کاربر: <span className="text-amber-300 font-bold">{viewingProofSub.username}</span> | مرحله {viewingProofSub.stepNumber}: «{viewingProofSub.taskTitle}»
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {viewingProofSub.content && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadProofFile(
                        viewingProofSub.content,
                        viewingProofSub.fileName,
                        getProofCategory(viewingProofSub)
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition"
                    title="دانلود فایل ارسالی کاربر"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">دانلود فایل مدرک</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingProofSub(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Media Content Display */}
            <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center bg-slate-950/70 min-h-[300px]">
              {/* IMAGE CATEGORY */}
              {getProofCategory(viewingProofSub) === 'image' && (
                <div className="w-full flex flex-col items-center justify-center space-y-3">
                  {/* Image Toolbar */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-md">
                    <button
                      type="button"
                      onClick={() => setImageZoom((prev) => Math.max(0.4, Number((prev - 0.2).toFixed(1))))}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition"
                      title="کوچک‌نمایی"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-xs font-bold text-amber-400 px-1">
                      {Math.round(imageZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setImageZoom((prev) => Math.min(3, Number((prev + 0.2).toFixed(1))))}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition"
                      title="بزرگ‌نمایی"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <span className="w-px h-4 bg-slate-800 mx-1" />
                    <button
                      type="button"
                      onClick={() => setImageRotate((prev) => (prev + 90) % 360)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 transition"
                      title="چرخش ۹۰ درجه"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span className="text-[11px]">چرخش</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageZoom(1);
                        setImageRotate(0);
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 transition"
                      title="تنظیم مجدد"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="text-[11px]">ریست</span>
                    </button>
                  </div>

                  {/* Image Canvas Box */}
                  <div className="relative max-w-full max-h-[60vh] overflow-hidden flex items-center justify-center p-2 rounded-2xl bg-black/50 border border-slate-800 shadow-inner">
                    <img
                      src={viewingProofSub.content}
                      alt={viewingProofSub.fileName || 'مدرک ارسالی'}
                      style={{
                        transform: `scale(${imageZoom}) rotate(${imageRotate}deg)`,
                        transition: 'transform 0.15s ease-out',
                      }}
                      className="max-h-[56vh] max-w-full object-contain rounded-xl select-none"
                    />
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono text-center">
                    نام فایل: {viewingProofSub.fileName || 'تصویر اسکرین‌شات کاربر'}
                  </div>
                </div>
              )}

              {/* VIDEO CATEGORY */}
              {getProofCategory(viewingProofSub) === 'video' && (
                <div className="w-full max-w-3xl flex flex-col items-center justify-center space-y-3">
                  <div className="w-full bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                    <video
                      src={viewingProofSub.content}
                      controls
                      playsInline
                      autoPlay
                      className="w-full max-h-[62vh] rounded-2xl bg-black object-contain"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 w-full px-2 text-xs">
                    <span className="text-slate-300 font-mono text-[11px] truncate">
                      فایل: {viewingProofSub.fileName || 'ویدیو مدرک ارسالی'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadProofFile(
                            viewingProofSub.content,
                            viewingProofSub.fileName,
                            'video'
                          )
                        }
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>دانلود مستقیم ویدیو</span>
                      </button>
                      <a
                        href={viewingProofSub.content}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>نمایش در پنجره جدید</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* LINK CATEGORY */}
              {getProofCategory(viewingProofSub) === 'link' && (
                <div className="w-full max-w-xl p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-center shadow-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <LinkIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">پیوند ارسالی توسط کاربر</h4>
                    <p className="text-xs text-slate-400 font-mono break-all p-3 rounded-xl bg-slate-950 border border-slate-800" dir="ltr">
                      {viewingProofSub.content}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <a
                      href={viewingProofSub.content}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>باز کردن لینک در تب جدید</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyText(viewingProofSub.content)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
                    >
                      {copiedLink ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? 'کپی شد!' : 'کپی کردن آدرس'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TEXT CATEGORY */}
              {getProofCategory(viewingProofSub) === 'text' && (
                <div className="w-full max-w-2xl p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span>توضیحات و متن ارسالی کاربر</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(viewingProofSub.content)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition"
                    >
                      {copiedLink ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'کپی شد' : 'کپی متن'}</span>
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs leading-relaxed whitespace-pre-wrap max-h-[50vh] overflow-auto">
                    {viewingProofSub.content}
                  </div>
                </div>
              )}

              {/* NONE CATEGORY */}
              {getProofCategory(viewingProofSub) === 'none' && (
                <div className="text-center p-6 space-y-2 text-slate-400">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-200">این تسک بدون مدرک ارسالی بوده است.</p>
                  <p className="text-xs">تسک با کلیک کاربر انجام و ثبت گردیده است.</p>
                </div>
              )}
            </div>

            {/* Modal Review Actions Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>زمان ارسال:</span>
                <span className="font-mono text-slate-200">
                  {new Date(viewingProofSub.submittedAt).toLocaleDateString('fa-IR')}{' '}
                  {new Date(viewingProofSub.submittedAt).toLocaleTimeString('fa-IR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="w-px h-3 bg-slate-800" />
                <span className="text-emerald-400 font-bold">
                  جایزه: {(viewingProofSub.reward || 0).toLocaleString('fa-IR')} تومان
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {viewingProofSub.status === 'pending' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewingSub(viewingProofSub);
                        setAdminReviewNote('مدرک مورد تایید است.');
                        handleReviewSubmission('approved');
                      }}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>تأیید مدرک و واریز جایزه</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const targetSub = viewingProofSub;
                        setViewingProofSub(null);
                        setReviewingSub(targetSub);
                        setAdminReviewNote('');
                      }}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>رد مدرک</span>
                    </button>
                  </>
                ) : (
                  <div className="text-xs text-slate-400">
                    وضعیت فعلی:{' '}
                    <span className="font-bold text-slate-200">
                      {viewingProofSub.status === 'approved' ? 'تأیید شده' : 'رد شده'}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setViewingProofSub(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
