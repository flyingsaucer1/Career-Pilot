import { LayoutDashboard, FileText, ScanText, Target, Wand2, BriefcaseBusiness, MessagesSquare, ChartNoAxesCombined } from 'lucide-react';

export const workspaceGroups = [
  { label: 'WORKSPACE', items: [{ label: 'Overview', href: '/dashboard', icon: LayoutDashboard }] },
  { label: 'RESUME STUDIO', items: [
    { label: 'My resumes', href: '/dashboard/resume', icon: FileText },
    { label: 'AI analysis', href: '/dashboard/analysis', icon: ScanText },
    { label: 'ATS compatibility', href: '/dashboard/ats', icon: Target },
    { label: 'Resume optimizer', href: '/dashboard/optimizer', icon: Wand2 },
  ] },
  { label: 'CAREER TOOLS', items: [
    { label: 'Job tracker', href: '/dashboard/jobs', icon: BriefcaseBusiness },
    { label: 'Interview practice', href: '/dashboard/interview', icon: MessagesSquare },
    { label: 'Career analytics', href: '/dashboard/analytics', icon: ChartNoAxesCombined },
  ] },
];

export const workspacePageTitle = (path: string) =>
  workspaceGroups.flatMap((group) => group.items).find((item) => item.href === path)?.label
  ?? (path.endsWith('/settings') ? 'Settings' : path.endsWith('/help') ? 'Help & support' : 'Workspace');
