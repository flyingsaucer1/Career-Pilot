import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  BriefcaseBusiness,
  MessageSquare,
  BarChart3,
  Zap,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Menu,
  X,
  Bell,
  Target,
  Wand2,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard',      href: '/dashboard',           icon: <LayoutDashboard size={15} /> },
  { label: 'Resumes',        href: '/dashboard/resume',    icon: <FileText size={15} /> },
  { label: 'AI Analysis',    href: '/dashboard/analysis',  icon: <Sparkles size={15} /> },
  { label: 'ATS Checker',    href: '/dashboard/ats',       icon: <Target size={15} /> },
  { label: 'Optimizer',      href: '/dashboard/optimizer', icon: <Wand2 size={15} /> },
  { label: 'Job Tracker',    href: '/dashboard/jobs',      icon: <BriefcaseBusiness size={15} /> },
  { label: 'Interview Prep', href: '/dashboard/interview', icon: <MessageSquare size={15} /> },
  { label: 'Analytics',      href: '/dashboard/analytics', icon: <BarChart3 size={15} /> },
];

interface AppNavProps {
  onMobileMenuToggle: () => void;
}

export const AppNav: React.FC<AppNavProps> = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Signed out');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-stone-50/80 dark:bg-[#111110]/90 backdrop-blur-xl border-b border-stone-200/70 dark:border-white/[0.05]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 h-14 flex items-center gap-6">

        {/* ── Brand ─────────────────────────────────────────────── */}
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shadow-glow">
            <Zap size={13} className="text-white" />
          </div>
          <span className="text-sm font-bold text-stone-900 dark:text-white tracking-tight hidden sm:block">
            Career<span className="text-violet-600 dark:text-violet-400">Pilot</span>
          </span>
        </Link>

        {/* ── Desktop Nav Pills ──────────────────────────────────── */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/dashboard'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-violet-50 dark:bg-violet-500/[0.12] text-violet-700 dark:text-violet-300'
                    : 'text-stone-500 dark:text-stone-500 hover:bg-stone-100/80 dark:hover:bg-white/[0.05] hover:text-stone-900 dark:hover:text-stone-200'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={isActive ? 'text-violet-600 dark:text-violet-400' : 'text-stone-400 dark:text-stone-600'}>
                    {item.icon}
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Spacer for mobile */}
        <div className="flex-1 lg:hidden" />

        {/* ── Right Side ────────────────────────────────────────── */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors">
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
          </button>

          <ThemeToggle size="sm" />

          {/* User menu */}
          <div className="relative ml-1">
            <button
              onClick={() => setIsUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <Avatar name={user?.name ?? 'User'} src={user?.avatar} size="sm" />
              <span className="hidden sm:block text-xs font-medium text-stone-700 dark:text-stone-300 max-w-[80px] truncate">
                {user?.name?.split(' ')[0]}
              </span>
              <ChevronDown size={13} className="text-stone-400 hidden sm:block" />
            </button>

            <AnimatePresence>
              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-2 w-52 z-20 bg-white dark:bg-[#1c1b18] border border-stone-200/80 dark:border-white/[0.07] rounded-2xl shadow-card-hover overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-stone-100 dark:border-white/[0.05]">
                      <p className="text-xs font-semibold text-stone-900 dark:text-stone-50 truncate">{user?.name}</p>
                      <p className="text-[11px] text-stone-400 truncate">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        to="/dashboard/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-[13px] text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/[0.05] rounded-xl transition-colors"
                      >
                        <User size={13} /> Profile
                      </Link>
                      <Link
                        to="/dashboard/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-[13px] text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/[0.05] rounded-xl transition-colors"
                      >
                        <Settings size={13} /> Settings
                      </Link>
                      <hr className="my-1 border-stone-100 dark:border-white/[0.05]" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors"
                      >
                        <LogOut size={13} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden ml-1 p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <Menu size={17} />
          </button>
        </div>
      </div>
    </header>
  );
};

/* ── Mobile Drawer Nav ─────────────────────────────────────────── */
interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 w-72 z-50 lg:hidden bg-stone-50 dark:bg-[#151412] border-l border-stone-200 dark:border-white/[0.06] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/80 dark:border-white/[0.05]">
              <span className="text-sm font-bold text-stone-900 dark:text-white">Menu</span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/dashboard'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-violet-50 dark:bg-violet-500/[0.12] text-violet-700 dark:text-violet-300'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/[0.05]'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={isActive ? 'text-violet-600' : 'text-stone-400'}>{item.icon}</span>
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
