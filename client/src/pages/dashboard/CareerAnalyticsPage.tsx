import { Link } from 'react-router-dom';
import { ArrowUpRight, BarChart3, BriefcaseBusiness, CalendarClock, MessageSquareMore, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useJobAnalytics } from '../../hooks/useJobApplications';
import { APPLICATION_STATUSES, type ApplicationStatus } from '../../types/jobApplication.types';

const labels: Record<ApplicationStatus, string> = {
  saved: 'Saved', applied: 'Applied', interview: 'Interview', offer: 'Offer', rejected: 'Rejected',
};
const colors: Record<ApplicationStatus, string> = {
  saved: '#64748b', applied: '#3b82f6', interview: '#d97706', offer: '#059669', rejected: '#e11d48',
};

export default function CareerAnalyticsPage() {
  const { data, isLoading, isError, refetch } = useJobAnalytics();
  if (isLoading) return <div className="workspace-panel p-10 text-center text-sm text-[var(--muted)]" role="status">Building your career analytics…</div>;
  if (isError || !data) return <div className="workspace-panel p-10 text-center"><p>Career analytics could not be loaded.</p><Button className="mt-4" variant="secondary" onClick={() => refetch()}>Try again</Button></div>;
  const maxStatus = Math.max(1, ...Object.values(data.byStatus));
  const interviewRate = data.total ? Math.round((data.interviews / data.total) * 100) : 0;

  return <div className="max-w-6xl">
    <div className="overview-heading"><div><p className="eyebrow">REAL WORKSPACE DATA</p><h1>Career analytics<span className="heading-dot">.</span></h1><p>Application totals and ATS movement calculated from your saved records.</p></div><Link to="/dashboard/jobs" className="workspace-primary">Open job tracker <ArrowUpRight size={14} /></Link></div>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[{ label: 'Active applications', value: data.total, icon: BriefcaseBusiness }, { label: 'Reached interview', value: data.interviews, icon: MessageSquareMore }, { label: 'Interview rate', value: `${interviewRate}%`, icon: TrendingUp }, { label: 'Upcoming follow-ups', value: data.upcomingFollowUps.length, icon: CalendarClock }].map(({ label, value, icon: Icon }) => <div className="workspace-panel p-5" key={label}><Icon size={18} className="text-[var(--accent)]" /><p className="mt-4 text-[10px] uppercase tracking-wider text-[var(--muted)]">{label}</p><strong className="mt-1 block text-3xl font-semibold">{value}</strong></div>)}
    </section>

    {data.total === 0 && data.scoreHistory.length === 0 ? <section className="workspace-panel mt-5 p-12 text-center"><BarChart3 className="mx-auto text-[var(--accent)]" size={30} /><h2 className="mt-4 text-lg font-semibold">Analytics begin with saved activity</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">Add applications and calculate ATS comparisons to build this dashboard from real records.</p><Link to="/dashboard/jobs" className="workspace-primary mt-5">Add an application</Link></section> : <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <section className="workspace-panel p-6"><div className="mb-6"><span className="panel-overline">PIPELINE</span><h2 className="font-semibold">Applications by stage</h2></div><div className="space-y-4">{APPLICATION_STATUSES.map((status) => <div key={status}><div className="mb-1.5 flex justify-between text-xs"><span>{labels[status]}</span><strong>{data.byStatus[status]}</strong></div><div className="h-2 overflow-hidden rounded-full bg-[var(--line)]"><div className="h-full rounded-full transition-all" style={{ width: `${(data.byStatus[status] / maxStatus) * 100}%`, backgroundColor: colors[status] }} /></div></div>)}</div><p className="mt-5 text-[10px] text-[var(--muted)]">Archived applications: {data.archived}. Interview count includes roles that previously reached interview.</p></section>
      <section className="workspace-panel p-6"><div className="mb-6"><span className="panel-overline">ATS MOVEMENT</span><h2 className="font-semibold">Saved score comparisons</h2></div>{data.scoreHistory.length ? <div className="space-y-3">{data.scoreHistory.slice(0, 8).map((score) => { const delta = score.atsScoreAfter - score.atsScoreBefore; return <Link key={score._id} to={`/dashboard/optimizer?resumeId=${score.resumeId}&version=${score.versionNumber}`} className="block rounded-lg border border-[var(--line)] p-3 hover:border-[var(--accent)]"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><strong className="block truncate text-xs">Version {score.versionNumber} · {score.versionName}</strong><span className="text-[10px] text-[var(--muted)]">{new Date(score.updatedAt).toLocaleDateString()}</span></div><span className={`text-sm font-semibold ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-[var(--muted)]'}`}>{score.atsScoreBefore} → {score.atsScoreAfter} ({delta > 0 ? '+' : ''}{delta})</span></div></Link>; })}</div> : <p className="text-sm leading-6 text-[var(--muted)]">No saved before/after comparisons yet. Scores appear after you recheck an optimized draft.</p>}</section>
      <section className="workspace-panel p-6"><div className="mb-6"><span className="panel-overline">NEXT ACTIONS</span><h2 className="font-semibold">Upcoming follow-ups</h2></div>{data.upcomingFollowUps.length ? <ul className="space-y-3">{data.upcomingFollowUps.map((item) => <li className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3 last:border-0" key={item._id}><span><strong className="block text-xs">{item.role}</strong><small className="text-[var(--muted)]">{item.company}</small></span><time className="text-xs text-[var(--accent)]">{new Date(item.followUpDate).toLocaleDateString()}</time></li>)}</ul> : <p className="text-sm text-[var(--muted)]">No follow-ups scheduled in the next 14 days.</p>}</section>
      <section className="workspace-panel p-6"><div className="mb-6"><span className="panel-overline">RECENT ACTIVITY</span><h2 className="font-semibold">Latest application changes</h2></div>{data.recentActivity.length ? <ul className="space-y-3">{data.recentActivity.map((item) => <li className="flex items-start justify-between gap-3" key={item.applicationId}><span><strong className="block text-xs">{item.role} · {item.company}</strong><small className="text-[var(--muted)]">{item.event?.kind.replace('_', ' ') ?? 'updated'}</small></span><time className="text-[10px] text-[var(--muted)]">{new Date(item.updatedAt).toLocaleDateString()}</time></li>)}</ul> : <p className="text-sm text-[var(--muted)]">No application activity yet.</p>}</section>
    </div>}
  </div>;
}
