import { Suspense, useCallback, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronRight, LogOut, Menu } from 'lucide-react';
import { WorkspaceNav } from './WorkspaceNav';
import { workspacePageTitle } from './workspaceNavigation';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';
import { AIConsentPanel } from '../auth/AIConsentPanel';

export function DashboardLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const closeNav = useCallback(() => setNavOpen(false), []);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const signOut = async () => {
    setSigningOut(true);
    try { await logout(); navigate('/login'); }
    catch { toast.error('Unable to sign out. Please try again.'); }
    finally { setSigningOut(false); }
  };

  return <div className="workspace">
    <a className="workspace-skip" href="#workspace-main">Skip to main content</a>
    <WorkspaceNav open={navOpen} onClose={closeNav} />
    <div className="workspace-body">
      <header className="workspace-header">
        <button className="workspace-icon-button mobile-menu" onClick={() => setNavOpen(true)} aria-label="Open navigation" aria-controls="workspace-navigation-drawer" aria-expanded={navOpen}><Menu size={20} /></button>
        <div className="workspace-breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{workspacePageTitle(location.pathname)}</strong></div>
        <div className="workspace-header-actions"><ThemeToggle size="sm" /><span className="header-divider" /><Link to="/dashboard/settings" className="workspace-profile" title="Account settings"><span className="profile-initial">{user?.name?.slice(0, 1).toUpperCase() ?? 'U'}</span><span>{user?.name?.split(' ')[0] ?? 'Account'}</span></Link><button className="workspace-icon-button" onClick={signOut} disabled={signingOut} aria-label="Sign out" title="Sign out"><LogOut size={16} /></button></div>
      </header>
      <main id="workspace-main" className="workspace-main" tabIndex={-1}>{location.pathname !== '/dashboard/settings' && <AIConsentPanel />}<Suspense fallback={<div role="status" className="workspace-panel p-8 text-sm text-slate-500">Loading this part of your workspace…</div>}><Outlet /></Suspense></main>
      <footer className="workspace-footer"><span>CareerPilot AI</span><nav className="flex gap-4"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/support">Support</Link></nav></footer>
    </div>
  </div>;
}
