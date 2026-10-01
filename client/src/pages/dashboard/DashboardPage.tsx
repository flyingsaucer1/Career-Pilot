import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Check, FileText, Upload, ScanText, Target, Wand2, Database, Cpu, ChevronRight, CircleHelp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useResumes } from '../../hooks/useResumes';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { useJobAnalytics } from '../../hooks/useJobApplications';
import { MAX_UPLOAD_MB } from '../../utils/uploadLimits';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: resumes = [], isLoading, isError, refetch } = useResumes();
  const { data: status, isPending: checking, isError: statusError } = useSystemStatus();
  const { data: jobAnalytics, isLoading: jobsLoading, isError: jobsError } = useJobAnalytics();
  const latest = resumes[0];
  const aiState = checking ? 'Checking' : statusError ? 'Unavailable' : status?.ai.ready ? 'Available' : 'Needs setup';
  const tools = [
    { title: 'Resume analysis', detail: 'Understand your strengths and where to improve.', icon: ScanText, path: latest ? `/dashboard/analysis?resumeId=${latest._id}` : '/dashboard/resume', tag: 'REVIEW' },
    { title: 'ATS compatibility', detail: 'Compare your experience with a job description.', icon: Target, path: latest ? `/dashboard/ats?resumeId=${latest._id}` : '/dashboard/resume', tag: 'COMPARE' },
    { title: 'Resume optimizer', detail: 'Explore targeted wording and content suggestions.', icon: Wand2, path: latest ? `/dashboard/optimizer?resumeId=${latest._id}` : '/dashboard/resume', tag: 'REFINE' },
  ];

  return <div className="overview">
    <div className="overview-heading"><div><p className="eyebrow">YOUR CAREER WORKSPACE</p><h1>Workspace overview<span className="heading-dot">.</span></h1><p>Welcome back, {user?.name?.split(' ')[0] ?? 'there'}. Let’s make your next application count.</p></div><Link to="/dashboard/resume" className="workspace-primary"><Upload size={16} />Upload resume</Link></div>

    <section className="overview-stats" aria-label="Workspace summary">
      <div><span className="stat-icon"><FileText size={19} /></span><div><p>Resume library</p><strong>{isLoading || isError ? '—' : String(resumes.length).padStart(2, '0')}</strong><small>{isError ? 'Unable to load' : 'Documents in your workspace'}</small></div></div>
      <div><span className="stat-icon"><BriefcaseBusiness size={19} /></span><div><p>Active applications</p><strong>{jobsLoading || jobsError ? '—' : String(jobAnalytics?.total ?? 0).padStart(2, '0')}</strong><small>{jobsError ? 'Unable to load' : `${jobAnalytics?.interviews ?? 0} reached interview stage`}</small></div></div>
      <div><span className="stat-icon"><Cpu size={19} /></span><div><p>AI assistant</p><strong className="stat-word"><span className={`status-dot ${status?.ai.ready ? '' : 'muted'}`} />{aiState}</strong><small>Personalized resume guidance</small></div></div>
    </section>

    <div className="overview-columns"><div className="overview-primary-column">
      <section className="workspace-panel resume-panel"><div className="panel-heading"><div><span className="panel-overline">RESUME STUDIO</span><h2>Your resumes</h2></div><Link to="/dashboard/resume" className="workspace-text-link">View library <ArrowUpRight size={15} /></Link></div><div className="panel-tabs"><span className="selected">Recent documents <b>{isLoading || isError ? '—' : resumes.length}</b></span><span>PDF & DOCX</span></div>
{isLoading ? <div className="resume-empty" role="status">Loading your resume library…</div> : isError ? <div className="resume-empty"><h3>We couldn’t load your resumes</h3><button className="workspace-secondary" onClick={() => refetch()}>Try again</button></div> : latest ? <div className="overview-resume-list">{resumes.slice(0, 3).map((resume) => <div className="overview-resume-row" key={resume._id}><span className="document-symbol"><FileText size={22} /></span><div><strong>{resume.originalName}</strong><small>{resume.fileType.toUpperCase()} · {Math.round(resume.fileSize / 1024)} KB · {new Date(resume.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small></div><Link to={`/dashboard/analysis?resumeId=${resume._id}`} className="workspace-text-link">Analyze <ArrowRight size={15} /></Link></div>)}</div> : <div className="resume-empty"><div className="empty-document"><FileText size={35} strokeWidth={1.25} /><span><Upload size={13} /></span></div><h3>Your next chapter starts here</h3><p>Add your resume to get tailored feedback,<br className="desktop-break" /> discover skill gaps, and prepare a stronger application.</p><Link to="/dashboard/resume" className="workspace-secondary"><Upload size={15} />Upload your first resume</Link><small>Text-based PDF or DOCX · Up to {MAX_UPLOAD_MB} MB</small></div>}
        <div className="panel-footnote"><CircleHelp size={14} /><span>Start with your current resume. You can add more versions anytime.</span></div>
      </section>

      <section className="workspace-panel tools-panel"><div className="panel-heading"><div><span className="panel-overline">MAKE YOUR EXPERIENCE STAND OUT</span><h2>Your resume toolkit</h2></div><span className="subtle-badge">AI assisted</span></div><div className="tool-grid">{tools.map((tool) => <Link to={tool.path} className="workspace-tool" key={tool.title}><span className="tool-top"><tool.icon size={24} strokeWidth={1.5} /><ArrowUpRight size={16} /></span><span className="tool-tag">{tool.tag}</span><h3>{tool.title}</h3><p>{tool.detail}</p><span className="tool-link">{latest ? 'Open tool' : 'Add a resume to start'}<ArrowRight size={14} /></span></Link>)}</div></section>
    </div>

    <aside className="overview-secondary-column" aria-label="Workspace guidance">
      <section className="workspace-panel checklist-panel"><div className="panel-heading"><div><span className="panel-overline">A SIMPLE PLACE TO START</span><h2>Your next steps</h2></div></div><ol className="workspace-checklist"><li className="complete"><span><Check size={13} /></span><div><strong>Create your workspace</strong><p>You’re all set. Make it your own.</p></div></li><li className={latest ? 'complete' : 'current'}><span>{latest ? <Check size={13} /> : '2'}</span><div><strong>Upload a resume</strong><p>Bring your experience into focus.</p>{!latest && <Link to="/dashboard/resume">Add a document <ChevronRight size={13} /></Link>}</div></li><li><span>3</span><div><strong>Review your analysis</strong><p>Turn feedback into a stronger story.</p></div></li><li><span>4</span><div><strong>Find your fit</strong><p>Compare against your target role.</p></div></li></ol></section>
      <section className="workspace-panel connections-panel"><div className="panel-heading"><h2>Workspace status</h2><span className="live-label">LIVE</span></div><div className="connection-row"><Cpu size={17} /><span>AI assistant</span><strong className={status?.ai.ready ? 'positive' : ''}>{aiState}</strong></div><div className="connection-row"><Database size={17} /><span>Database</span><strong className={status?.databaseReady ? 'positive' : ''}>{checking ? 'Checking' : statusError ? 'Unavailable' : status?.databaseReady ? 'Connected' : 'Offline'}</strong></div><p className="connection-note">{status && !status.ai.ready ? 'The assistant is unavailable right now. Check your connection or try again later.' : 'Availability is checked automatically. Analysis time depends on your document.'}</p></section>
      <div className="workspace-tip"><span className="eyebrow">THE SMALL DETAILS MATTER</span><h3>Lead with impact.</h3><p>Show what changed because of your work. Clear outcomes tell a stronger story than a list of responsibilities.</p><span>RESUME TIP <span>01 / 03</span></span></div>
    </aside></div>
  </div>;
}
