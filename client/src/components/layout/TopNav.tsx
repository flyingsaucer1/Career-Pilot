import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut, User, Settings, Menu } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Breadcrumbs } from './Breadcrumbs';
import { useAuth } from '../../hooks/useAuth';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface TopNavProps {
  onMobileMenuToggle: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
    <header className="h-[58px] bg-stone-50/80 dark:bg-[#111110]/80 backdrop-blur-md border-b border-stone-200/80 dark:border-white/[0.05] flex items-center px-4 lg:px-6 gap-4 shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-2 rounded-xl text-stone-500 hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumbs */}
      <div className="flex-1">
        <Breadcrumbs />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors"
          aria-label="Search"
        >
          <Search size={16} />
        </button>

        <button
          className="relative p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
        </button>

        <ThemeToggle size="sm" />

        {/* User dropdown */}
        <div className="relative ml-1">
          <button
            onClick={() => setIsDropdownOpen((v) => !v)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors"
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
          >
            <Avatar name={user?.name ?? 'User'} src={user?.avatar} size="sm" />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.97, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -6 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-2 w-52 z-20 bg-white dark:bg-[#1c1b18] border border-stone-200/80 dark:border-white/[0.07] rounded-2xl shadow-card-hover dark:shadow-dark-card-hover overflow-hidden"
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-stone-100 dark:border-white/[0.05]">
                    <p className="text-xs font-semibold text-stone-900 dark:text-stone-50 truncate">
                      {user?.name ?? 'User'}
                    </p>
                    <p className="text-[11px] text-stone-400 truncate">{user?.email}</p>
                  </div>

                  <div className="p-1.5">
                    <Link
                      to="/dashboard/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-[13px] text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/[0.05] rounded-xl transition-colors"
                    >
                      <User size={14} />
                      Profile
                    </Link>
                    <Link
                      to="/dashboard/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-[13px] text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/[0.05] rounded-xl transition-colors"
                    >
                      <Settings size={14} />
                      Settings
                    </Link>
                    <hr className="my-1 border-stone-100 dark:border-white/[0.05]" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
