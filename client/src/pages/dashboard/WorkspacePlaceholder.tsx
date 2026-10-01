import { ArrowLeft, ArrowUpRight, Construction } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { workspacePageTitle } from '../../components/layout/workspaceNavigation';

const descriptions: Record<string, string> = {
  jobs: 'A dedicated place to organize applications, track their progress, and keep your next opportunity in sight.',
  interview: 'Role-focused questions and structured practice to help you prepare for your next conversation.',
  analytics: 'A clear view of your applications and resume progress, built from your actual activity.',
  settings: 'Profile editing and account preferences are still in development. You can already switch between light and dark mode from the header.',
};

export default function WorkspacePlaceholder() {
  const { pathname } = useLocation();
  const title = workspacePageTitle(pathname);
  const key = pathname.split('/').pop() ?? '';
  return <div className="workspace-coming-soon"><p className="eyebrow">GROWING WITH YOUR AMBITIONS</p><h1>{title}</h1><section className="workspace-panel"><span className="coming-soon-icon"><Construction size={29} strokeWidth={1.5} /></span><span className="subtle-badge">In development</span><h2>A little more work. A better experience.</h2><p>{descriptions[key] ?? 'This part of your workspace is being built.'}</p><p>In the meantime, your resume library, AI analysis, and ATS comparison are available.</p><div><Link to="/dashboard/resume" className="workspace-primary">Open resume studio <ArrowUpRight size={15} /></Link><Link to="/dashboard" className="workspace-text-link"><ArrowLeft size={14} />Back to overview</Link></div></section></div>;
}
