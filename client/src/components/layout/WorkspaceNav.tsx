import { useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Compass, Settings2, CircleHelp, X, ArrowUpRight } from 'lucide-react';
import { workspaceGroups as groups } from './workspaceNavigation';

export function WorkspaceNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const drawer = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const elements = Array.from(drawer.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);
      const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    const desktop = window.matchMedia('(min-width: 1024px)');
    const handleResize = () => { if (desktop.matches) onClose(); };
    desktop.addEventListener('change', handleResize);
    return () => { document.body.style.overflow = originalOverflow; document.removeEventListener('keydown', handleKey); desktop.removeEventListener('change', handleResize); previous?.focus(); };
  }, [open, onClose]);

  return <>
    {open && <button className="workspace-scrim" aria-label="Close navigation" onClick={onClose} tabIndex={-1} />}
    <aside id="workspace-navigation-drawer" ref={drawer} className={`workspace-sidebar ${open ? 'is-open' : ''}`} aria-label="Workspace navigation" {...(open ? { role: 'dialog', 'aria-modal': true } : {})}>
      <div className="workspace-brand-row">
        <Link to="/dashboard" className="workspace-brand" onClick={onClose}><span className="brand-symbol"><Compass size={23} strokeWidth={1.7} /></span><span>CareerPilot<span className="brand-ai">AI</span></span></Link>
        <button ref={closeButton} onClick={onClose} className="workspace-icon-button drawer-close" aria-label="Close navigation"><X size={19} /></button>
      </div>
      <div className="workspace-label"><span className="workspace-initial">P</span><div><strong>Personal workspace</strong><small>Your career, in focus</small></div></div>
      <nav aria-label="Main navigation" className="workspace-navigation">
        {groups.map((group) => <div className="workspace-nav-group" key={group.label}><p>{group.label}</p>{group.items.map((item) => <NavLink key={item.href} to={item.href} end={item.href === '/dashboard'} onClick={onClose} className={({ isActive }) => `workspace-nav-link ${isActive ? 'active' : ''}`}><item.icon size={17} strokeWidth={1.7} /><span>{item.label}</span></NavLink>)}</div>)}
      </nav>
      <div className="workspace-sidebar-bottom">
        <div className="workspace-note"><span className="eyebrow">A LITTLE FOCUS GOES A LONG WAY</span><p>One stronger resume.<br />Your next opportunity.</p><Link to="/dashboard/resume" onClick={onClose}>Open resume studio <ArrowUpRight size={14} /></Link></div>
        <NavLink to="/dashboard/settings" onClick={onClose} className={`workspace-nav-link ${location.pathname.endsWith('/settings') ? 'active' : ''}`}><Settings2 size={17} />Settings</NavLink>
        <NavLink to="/dashboard/help" onClick={onClose} className="workspace-nav-link"><CircleHelp size={17} />Help & support</NavLink>
        <div className="workspace-version"><span className="status-dot" /> Development workspace <span>v0.1</span></div>
      </div>
    </aside>
  </>;
}
