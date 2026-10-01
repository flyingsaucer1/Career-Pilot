import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  BriefcaseBusiness,
  MessageSquare,
  BarChart3,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  HelpCircle,
  Sparkles,
  ClipboardCheck,
  Bot,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard',       href: '/dashboard',            icon: <LayoutDashboard size={17} /> },
  { label: 'Resumes',         href: '/dashboard/resume',     icon: <FileText size={17} /> },
  { label: 'AI Analysis',     href: '/dashboard/analysis',   icon: <Sparkles size={17} /> },
  { label: 'ATS Checker',     href: '/dashboard/ats',        icon: <ClipboardCheck size={17} /> },
  { label: 'Resume Optimizer', href: '/dashboard/optimizer', icon: <Bot size={17} /> },
  { label: 'Job Tracker',     href: '/dashboard/jobs',       icon: <BriefcaseBusiness size={17} /> },
  { label: 'Interview Prep',  href: '/dashboard/interview',  icon: <MessageSquare size={17} /> },
  { label: 'Analytics',       href: '/dashboard/analytics',  icon: <BarChart3 size={17} /> },
];

const bottomNavItems: NavItem[] = [
  { label: 'Help & Support', href: '/dashboard/help',     icon: <HelpCircle size={17} /> },
  { label: 'Settings',       href: '/dashboard/settings', icon: <Settings size={17} /> },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Signed out successfully');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 68 : 232 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative hidden lg:flex flex-col h-full bg-stone-50 dark:bg-[#151412] border-r border-stone-200/80 dark:border-white/[0.05] overflow-hidden select-none"
    >
      {/* Brand Header */}
      <div className="flex items-center h-[58px] px-4 border-b border-stone-200/80 dark:border-white/[0.05] shrink-0">
        <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shrink-0 shadow-glow">
          <Zap size={15} className="text-white" />
        </div>
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className="ml-2.5 text-sm font-bold text-stone-900 dark:text-white tracking-tight"
            >
              Career<span className="text-violet-600 dark:text-violet-400">Pilot</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto hide-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-colors duration-150',
                isActive
                  ? 'bg-violet-50 dark:bg-violet-500/[0.12] text-violet-700 dark:text-violet-300 font-semibold'
                  : 'text-stone-600 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-white/[0.04] hover:text-stone-900 dark:hover:text-stone-200'
              )
            }
            title={isCollapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                <span className={cn('shrink-0', isActive ? 'text-violet-600 dark:text-violet-400' : 'text-stone-400 dark:text-stone-600')}>
                  {item.icon}
                </span>
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-2.5 pb-3 space-y-0.5 border-t border-stone-200/80 dark:border-white/[0.05] pt-3 shrink-0">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-stone-100 dark:bg-white/[0.07] text-stone-900 dark:text-stone-100'
                  : 'text-stone-500 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-white/[0.04] hover:text-stone-800 dark:hover:text-stone-200'
              )
            }
            title={isCollapsed ? item.label : undefined}
          >
            <span className="shrink-0 text-stone-400 dark:text-stone-600">{item.icon}</span>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}

        {/* User Card */}
        <div
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 mt-1 rounded-xl bg-stone-100/60 dark:bg-white/[0.03] border border-stone-200/60 dark:border-white/[0.05]',
            isCollapsed ? 'justify-center px-2' : ''
          )}
        >
          <Avatar name={user?.name ?? 'User'} src={user?.avatar} size="sm" />
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 truncate">
                  {user?.name ?? 'User'}
                </p>
                <p className="text-[10px] text-stone-400 dark:text-stone-600 truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="shrink-0 p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-[72px] z-10 w-6 h-6 rounded-full bg-white dark:bg-[#1c1b18] border border-stone-200 dark:border-white/[0.08] flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 shadow-sm transition-colors"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </motion.aside>
  );
};
