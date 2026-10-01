import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive, ArchiveRestore, BriefcaseBusiness, ExternalLink, Filter, LayoutGrid,
  List, MessageSquareMore, Pencil, Plus, Search, Sparkles, Target, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useResumes } from '../../hooks/useResumes';
import { useVersions } from '../../hooks/useResumeOptimizer';
import {
  useCreateJobApplication, useDeleteJobApplication, useJobApplications, useUpdateJobApplication,
} from '../../hooks/useJobApplications';
import {
  APPLICATION_STATUSES, type ApplicationStatus, type JobApplication, type JobApplicationInput,
} from '../../types/jobApplication.types';

const statusMeta: Record<ApplicationStatus, { label: string; className: string }> = {
  saved: { label: 'Saved', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' },
  applied: { label: 'Applied', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
  interview: { label: 'Interview', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' },
  offer: { label: 'Offer', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
  rejected: { label: 'Rejected', className: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' },
};

const emptyForm: JobApplicationInput = {
  company: '', role: '', url: '', description: '', status: 'saved',
  applicationDate: null, followUpDate: null, notes: '', resumeId: null, resumeVersionNumber: null,
};

const inputDate = (value: string | null) => value ? value.slice(0, 10) : '';
const errorMessage = (error: any, fallback: string) => error.response?.data?.message || fallback;

function ApplicationForm({ application, onClose }: { application: JobApplication | null; onClose: () => void }) {
  const [form, setForm] = useState<JobApplicationInput>(emptyForm);
  const createMutation = useCreateJobApplication();
  const updateMutation = useUpdateJobApplication();
  const { data: resumes = [] } = useResumes();
  const { data: versions = [] } = useVersions(form.resumeId ?? null);
  const saving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    setForm(application ? {
      company: application.company, role: application.role, url: application.url,
      description: application.description, status: application.status,
      applicationDate: inputDate(application.applicationDate), followUpDate: inputDate(application.followUpDate),
      notes: application.notes, resumeId: application.resumeId,
      resumeVersionNumber: application.resumeVersionNumber,
    } : emptyForm);
  }, [application]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.description.trim().length < 50) return toast.error('Job description must be at least 50 characters.');
    try {
      if (application) await updateMutation.mutateAsync({ id: application._id, input: form });
      else await createMutation.mutateAsync(form);
      toast.success(application ? 'Application updated.' : 'Application added.');
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, 'Application could not be saved.'));
    }
  };

  return <form onSubmit={submit} className="space-y-4" noValidate>
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} maxLength={120} required />
      <Input label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} maxLength={120} required />
    </div>
    <Input label="Job URL" type="url" placeholder="https://company.com/jobs/..." value={form.url ?? ''} onChange={(e) => setForm({ ...form, url: e.target.value })} />
    <div>
      <div className="mb-1.5 flex justify-between"><label className="label-base">Job description</label><span className="text-[10px] text-stone-400">{form.description.length} / 5,000</span></div>
      <textarea className="input-base min-h-36 resize-y text-sm leading-6" value={form.description} maxLength={5000} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Paste responsibilities, requirements, skills, and qualifications…" required />
      <p className="mt-1 text-[10px] text-stone-400">Saved here so ATS and optimization can reuse the exact target.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      <div><label className="label-base">Status</label><select className="input-base" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ApplicationStatus })}>{APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{statusMeta[status].label}</option>)}</select></div>
      <Input label="Application date" type="date" value={form.applicationDate ?? ''} onChange={(e) => setForm({ ...form, applicationDate: e.target.value || null })} />
      <Input label="Follow-up date" type="date" value={form.followUpDate ?? ''} onChange={(e) => setForm({ ...form, followUpDate: e.target.value || null })} />
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div><label className="label-base">Linked resume</label><select className="input-base" value={form.resumeId ?? ''} onChange={(e) => setForm({ ...form, resumeId: e.target.value || null, resumeVersionNumber: null })}><option value="">No linked resume</option>{resumes.map((resume) => <option key={resume._id} value={resume._id}>{resume.originalName}</option>)}</select></div>
      <div><label className="label-base">Exact resume version</label><select className="input-base" disabled={!form.resumeId} value={form.resumeVersionNumber ?? ''} onChange={(e) => setForm({ ...form, resumeVersionNumber: e.target.value ? Number(e.target.value) : null })}><option value="">Original / not pinned</option>{versions.map((version) => <option key={version._id} value={version.versionNumber}>Version {version.versionNumber} · {version.versionName}</option>)}</select></div>
    </div>
    <div><label className="label-base">Notes</label><textarea className="input-base min-h-24 resize-y text-sm" value={form.notes ?? ''} maxLength={5000} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Contacts, next steps, preparation notes…" /></div>
    <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" isLoading={saving}>{application ? 'Save changes' : 'Add application'}</Button></div>
  </form>;
}

function ApplicationCard({ application, onEdit }: { application: JobApplication; onEdit: (application: JobApplication) => void }) {
  const updateMutation = useUpdateJobApplication();
  const deleteMutation = useDeleteJobApplication();
  const updateStatus = async (status: ApplicationStatus) => {
    try { await updateMutation.mutateAsync({ id: application._id, input: { status } }); toast.success(`Moved to ${statusMeta[status].label}.`); }
    catch (error) { toast.error(errorMessage(error, 'Status could not be updated.')); }
  };
  const toggleArchive = async () => {
    try { await updateMutation.mutateAsync({ id: application._id, input: { archived: !application.archivedAt } }); toast.success(application.archivedAt ? 'Application restored.' : 'Application archived.'); }
    catch (error) { toast.error(errorMessage(error, 'Application could not be updated.')); }
  };
  const remove = async () => {
    if (!window.confirm(`Permanently delete ${application.role} at ${application.company}?`)) return;
    try { await deleteMutation.mutateAsync(application._id); toast.success('Application deleted.'); }
    catch (error) { toast.error(errorMessage(error, 'Application could not be deleted.')); }
  };
  const optimizeQuery = application.resumeId
    ? `/dashboard/optimizer?resumeId=${application.resumeId}&jobId=${application._id}${application.resumeVersionNumber ? `&version=${application.resumeVersionNumber}` : ''}`
    : '/dashboard/resume';

  return <article className="workspace-panel p-5">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">{application.company}</p><h3 className="mt-1 truncate text-base font-semibold">{application.role}</h3></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusMeta[application.status].className}`}>{statusMeta[application.status].label}</span></div>
    <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{application.notes || application.description}</p>
    <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-[var(--muted)]"><span>Added {new Date(application.createdAt).toLocaleDateString()}</span><span>{application.followUpDate ? `Follow up ${new Date(application.followUpDate).toLocaleDateString()}` : 'No follow-up set'}</span><span>{application.resumeVersionNumber ? `Resume version ${application.resumeVersionNumber}` : application.resumeId ? 'Resume linked' : 'No resume linked'}</span><span>{application.events.length} timeline event{application.events.length === 1 ? '' : 's'}</span></div>
    <select aria-label={`Status for ${application.role} at ${application.company}`} className="input-base mt-4 text-xs" value={application.status} disabled={updateMutation.isPending} onChange={(e) => updateStatus(e.target.value as ApplicationStatus)}>{APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{statusMeta[status].label}</option>)}</select>
    <div className="mt-4 flex flex-wrap gap-2">
      <Button size="sm" variant="secondary" leftIcon={<Pencil size={12} />} onClick={() => onEdit(application)}>Edit</Button>
      {application.resumeId && <><Button as={Link} to={`/dashboard/ats?resumeId=${application.resumeId}&jobId=${application._id}`} size="sm" variant="secondary" leftIcon={<Target size={12} />}>ATS</Button><Button as={Link} to={optimizeQuery} size="sm" variant="secondary" leftIcon={<Sparkles size={12} />}>Optimize</Button></>}
      {application.resumeId && <Button as={Link} to={`/dashboard/interview?jobId=${application._id}`} size="sm" variant="secondary" leftIcon={<MessageSquareMore size={12} />}>Interview</Button>}
      {application.url && <a className="workspace-text-link px-2" href={application.url} target="_blank" rel="noreferrer">Job post <ExternalLink size={12} /></a>}
      <button className="ml-auto p-2 text-[var(--muted)] hover:text-[var(--accent)]" onClick={toggleArchive} title={application.archivedAt ? 'Restore' : 'Archive'}>{application.archivedAt ? <ArchiveRestore size={15} /> : <Archive size={15} />}</button>
      <button className="p-2 text-stone-400 hover:text-red-500" onClick={remove} title="Delete"><Trash2 size={15} /></button>
    </div>
    {application.events.length > 1 && <details className="mt-4 border-t border-[var(--line)] pt-3"><summary className="cursor-pointer text-[10px] font-semibold text-[var(--muted)]">Status history</summary><ol className="mt-2 space-y-1 text-[10px] text-[var(--muted)]">{[...application.events].reverse().map((event, index) => <li key={`${event.occurredAt}-${index}`}>{new Date(event.occurredAt).toLocaleString()} · {event.kind.replace('_', ' ')}{event.toStatus ? ` → ${statusMeta[event.toStatus].label}` : ''}</li>)}</ol></details>}
  </article>;
}

export default function JobTrackerPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | ''>('');
  const [archived, setArchived] = useState(false);
  const [view, setView] = useState<'list' | 'board'>('board');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<JobApplication | null>(null);
  const filters = useMemo(() => ({ search: search.trim() || undefined, status: status || undefined, archived }), [search, status, archived]);
  const { data: applications = [], isLoading, isError, refetch } = useJobApplications(filters);
  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (application: JobApplication) => { setEditing(application); setModalOpen(true); };

  return <div className="max-w-7xl">
    <div className="overview-heading"><div><p className="eyebrow">APPLICATION PIPELINE</p><h1>Job tracker<span className="heading-dot">.</span></h1><p>Keep every opportunity, target description, resume version, and next step together.</p></div><Button leftIcon={<Plus size={15} />} onClick={openCreate}>Add application</Button></div>
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 lg:flex-row lg:items-center">
      <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" /><input className="input-base pl-9" aria-label="Search applications" placeholder="Search company, role, or notes…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <div className="flex flex-wrap items-center gap-2"><Filter size={14} className="text-[var(--muted)]" /><select className="input-base w-auto text-xs" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus | '')}><option value="">All statuses</option>{APPLICATION_STATUSES.map((value) => <option key={value} value={value}>{statusMeta[value].label}</option>)}</select><Button size="sm" variant={archived ? 'primary' : 'secondary'} onClick={() => setArchived(!archived)} leftIcon={<Archive size={13} />}>{archived ? 'Viewing archived' : 'Archived'}</Button><span className="mx-1 h-5 w-px bg-[var(--line)]" /><Button size="sm" variant={view === 'board' ? 'primary' : 'ghost'} onClick={() => setView('board')} aria-label="Board view"><LayoutGrid size={14} /></Button><Button size="sm" variant={view === 'list' ? 'primary' : 'ghost'} onClick={() => setView('list')} aria-label="List view"><List size={14} /></Button></div>
    </div>

    {isLoading ? <div className="workspace-panel p-10 text-center text-sm text-[var(--muted)]" role="status">Loading applications…</div> : isError ? <div className="workspace-panel p-10 text-center"><p>Applications could not be loaded.</p><Button className="mt-4" variant="secondary" onClick={() => refetch()}>Try again</Button></div> : applications.length === 0 ? <div className="workspace-panel flex flex-col items-center p-14 text-center"><span className="coming-soon-icon"><BriefcaseBusiness size={28} /></span><h2 className="mt-4 text-xl font-semibold">{search || status || archived ? 'No matching applications' : 'Build your application pipeline'}</h2><p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{search || status || archived ? 'Adjust your filters or return to active applications.' : 'Save a target role, link the resume you used, and move it through each stage.'}</p>{!search && !status && !archived && <Button className="mt-5" leftIcon={<Plus size={14} />} onClick={openCreate}>Add your first application</Button>}</div> : view === 'list' ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{applications.map((application) => <ApplicationCard key={application._id} application={application} onEdit={openEdit} />)}</div> : <div className="grid min-w-0 gap-4 xl:grid-cols-5">{APPLICATION_STATUSES.filter((value) => !status || value === status).map((column) => <section key={column} className="min-w-0 rounded-xl border border-[var(--line)] bg-[var(--sidebar)] p-3"><div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-semibold">{statusMeta[column].label}</h2><span className="subtle-badge">{applications.filter((item) => item.status === column).length}</span></div><div className="space-y-3">{applications.filter((item) => item.status === column).map((application) => <ApplicationCard key={application._id} application={application} onEdit={openEdit} />)}{applications.every((item) => item.status !== column) && <p className="rounded-lg border border-dashed border-[var(--line)] p-5 text-center text-[10px] text-[var(--muted)]">No applications</p>}</div></section>)}</div>}

    <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit application' : 'Add application'} description="Store the exact target and resume used for this opportunity." size="xl" closeOnBackdrop={false}><ApplicationForm application={editing} onClose={() => setModalOpen(false)} /></Modal>
  </div>;
}
