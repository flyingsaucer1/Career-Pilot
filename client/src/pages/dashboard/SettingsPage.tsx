import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, Moon, Palette, Sun, Trash2, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { AIConsentPanel } from '../../components/auth/AIConsentPanel';

const messageFor = (error: any, fallback: string) => error.response?.data?.message || fallback;

export default function SettingsPage() {
  const { user, updateProfile, updateThemePreference, changePassword, deleteAccount } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: user?.name ?? '', email: user?.email ?? '', currentPassword: '' });
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) setProfile({ name: user.name, email: user.email, currentPassword: '' });
  }, [user]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (profile.name.trim().length < 2) return toast.error('Name must be at least 2 characters.');
    setSavingProfile(true);
    try {
      await updateProfile({
        name: profile.name.trim(), email: profile.email.trim(),
        ...(profile.email.trim().toLowerCase() !== user?.email ? { currentPassword: profile.currentPassword } : {}),
      });
      setProfile((value) => ({ ...value, currentPassword: '' }));
      toast.success('Profile updated.');
    } catch (error) {
      toast.error(messageFor(error, 'Profile could not be updated.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (new TextEncoder().encode(password.next).length > 72) return toast.error('Password must be at most 72 UTF-8 bytes.');
    if (password.next.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password.next)) {
      return toast.error('Use 8+ characters with uppercase, lowercase, and a number.');
    }
    if (password.next !== password.confirm) return toast.error('New passwords do not match.');
    setSavingPassword(true);
    try {
      await changePassword(password.current, password.next);
      setPassword({ current: '', next: '', confirm: '' });
      toast.success('Password changed. Other sessions have expired.');
    } catch (error) {
      toast.error(messageFor(error, 'Password could not be changed.'));
    } finally {
      setSavingPassword(false);
    }
  };

  const selectTheme = async (nextTheme: 'light' | 'dark') => {
    if (nextTheme === theme || savingTheme) return;
    setSavingTheme(true);
    try {
      await updateThemePreference(nextTheme);
      toast.success('Theme preference saved.');
    } catch (error) {
      toast.error(messageFor(error, 'Theme preference could not be saved.'));
    } finally {
      setSavingTheme(false);
    }
  };

  const confirmDelete = async (event: FormEvent) => {
    event.preventDefault();
    setDeleting(true);
    try {
      const result = await deleteAccount(deletePassword);
      toast.success(result.storageCleanupPending
        ? 'Account deleted. Stored-file cleanup will continue automatically.'
        : 'Account and associated data deleted.');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(messageFor(error, 'Account could not be deleted.'));
      setDeleting(false);
    }
  };

  return <div className="max-w-4xl">
    <AIConsentPanel settings />
    <div className="overview-heading"><div><p className="eyebrow">YOUR ACCOUNT</p><h1>Settings<span className="heading-dot">.</span></h1><p>Manage your identity, security, appearance, and stored data.</p></div></div>
    <div className="space-y-5">
      <section className="workspace-panel p-6">
        <div className="mb-6 flex items-start gap-3"><UserRound className="mt-0.5 text-[var(--accent)]" size={20} /><div><h2 className="font-semibold">Profile</h2><p className="mt-1 text-xs text-[var(--muted)]">Your name appears in the workspace. Changing email requires your current password.</p></div></div>
        <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2" noValidate>
          <Input label="Full name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} maxLength={60} required />
          <Input label="Email" type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} required />
          {profile.email.trim().toLowerCase() !== user?.email && <Input containerClassName="md:col-span-2" label="Current password" type="password" value={profile.currentPassword} onChange={(event) => setProfile({ ...profile, currentPassword: event.target.value })} hint="Required to confirm an email change." required />}
          <div className="md:col-span-2"><Button type="submit" isLoading={savingProfile}>Save profile</Button></div>
        </form>
      </section>

      <section className="workspace-panel p-6">
        <div className="mb-6 flex items-start gap-3"><Palette className="mt-0.5 text-[var(--accent)]" size={20} /><div><h2 className="font-semibold">Appearance</h2><p className="mt-1 text-xs text-[var(--muted)]">Your choice is saved to your account and restored when you sign in.</p></div></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {([{ value: 'light', label: 'Light', icon: Sun }, { value: 'dark', label: 'Dark', icon: Moon }] as const).map(({ value, label, icon: Icon }) => <button key={value} type="button" onClick={() => selectTheme(value)} disabled={savingTheme} aria-pressed={theme === value} className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${theme === value ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--line)] hover:border-[var(--accent)]'}`}><Icon size={18} /><span><strong className="block text-sm">{label}</strong><small className="text-[var(--muted)]">{value === 'light' ? 'Bright, clean workspace' : 'Reduced-light workspace'}</small></span></button>)}
        </div>
      </section>

      <section className="workspace-panel p-6">
        <div className="mb-6 flex items-start gap-3"><LockKeyhole className="mt-0.5 text-[var(--accent)]" size={20} /><div><h2 className="font-semibold">Password</h2><p className="mt-1 text-xs text-[var(--muted)]">Changing it immediately expires every older access and refresh token.</p></div></div>
        <form onSubmit={savePassword} className="grid gap-4 md:grid-cols-2" noValidate>
          <Input containerClassName="md:col-span-2" label="Current password" type="password" autoComplete="current-password" value={password.current} onChange={(event) => setPassword({ ...password, current: event.target.value })} required />
          <Input label="New password" type="password" autoComplete="new-password" value={password.next} onChange={(event) => setPassword({ ...password, next: event.target.value })} hint="8+ characters; uppercase, lowercase, number." required />
          <Input label="Confirm new password" type="password" autoComplete="new-password" value={password.confirm} onChange={(event) => setPassword({ ...password, confirm: event.target.value })} required />
          <div className="md:col-span-2"><Button type="submit" isLoading={savingPassword}>Change password</Button></div>
        </form>
      </section>

      <section className="rounded-xl border border-red-200 bg-red-50/60 p-6 dark:border-red-900/70 dark:bg-red-950/20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="font-semibold text-red-800 dark:text-red-300">Delete account</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-red-700/80 dark:text-red-300/70">Permanently removes your profile, resumes, analyses, ATS results, and optimized drafts. Stored files are deleted immediately or queued for automatic cleanup.</p></div><Button variant="danger" leftIcon={<Trash2 size={15} />} onClick={() => setDeleteOpen(true)}>Delete account</Button></div>
      </section>
    </div>

    <Modal isOpen={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} title="Permanently delete account" description="This cannot be undone." closeOnBackdrop={!deleting}>
      <form onSubmit={confirmDelete} className="space-y-4">
        <p className="text-sm leading-6 text-stone-600 dark:text-stone-300">Enter your password to confirm deletion of your account and all CareerPilot data.</p>
        <Input label="Password" type="password" autoComplete="current-password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} required autoFocus />
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button><Button type="submit" variant="danger" isLoading={deleting} disabled={!deletePassword}>Delete permanently</Button></div>
      </form>
    </Modal>
  </div>;
}
