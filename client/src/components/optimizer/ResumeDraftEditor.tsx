import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download, Eye, FilePenLine, Gauge, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { optimizerQueryKey, versionQueryKey, useCompareATSScores, useResumeDraftState, useSaveResumeDraft } from '../../hooks/useResumeOptimizer';
import { optimizerService } from '../../services/optimizer.service';
import type { ResumeVersion } from '../../types/optimizer.types';
import type { ChangeItem } from '../../types/optimizer.types';
import { ChangeComparison } from './ChangeComparison';
import { applyOneSuggestion } from '../../utils/resumeSuggestions';

interface Props {
  resumeId: string;
  version: ResumeVersion;
  originalText: string;
  jobDescription: string;
  onDirtyChange: (dirty: boolean) => void;
  onSavingChange: (saving: boolean) => void;
  autoOpenSuggestions?: boolean;
}

const isHeading = (line: string) =>
  /^(summary|profile|experience|professional experience|work experience|education|skills|technical skills|projects|certifications|achievements)$/i.test(line) ||
  (line.length > 3 && line.length < 55 && /^[A-Z\s&/-]+$/.test(line));

const suggestionKey = (change: ChangeItem): string => `${change.original}\u0000${change.optimized}`;

export function ResumeDraftEditor({
  resumeId,
  version,
  originalText,
  jobDescription,
  onDirtyChange,
  onSavingChange,
  autoOpenSuggestions = false,
}: Props) {
  const startingText = version.contentFormat === 'resume' ? version.optimizedContent : originalText;
  const queryClient = useQueryClient();
  const { draft, updateDraft } = useResumeDraftState(version, originalText);
  const { text } = draft;
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);
  const [conflict, setConflict] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(autoOpenSuggestions);
  const [reviewed, setReviewed] = useState<Record<string, 'applied' | 'skipped'>>({});
  const saveMutation = useSaveResumeDraft(resumeId);
  const compareMutation = useCompareATSScores(resumeId);
  const dirty = text !== draft.savedText || draft.needsConversion;
  const suggestions = [
    ...version.changes.experienceChanges,
    ...version.changes.projectChanges,
    ...version.changes.skillChanges,
    ...version.changes.bulletPointChanges,
  ];
  const pendingSuggestions = suggestions.filter((change) => !reviewed[suggestionKey(change)]);
  // Legacy versions may hold a score for a different job. Show scores only
  // after the comparison has pinned its target job description.
  const beforeScore = version.targetJobDescription ? version.atsScoreBefore : null;
  const afterScore = dirty || !version.targetJobDescription ? null : version.atsScoreAfter;
  const scoreChange = beforeScore !== null && afterScore !== null ? afterScore - beforeScore : null;
  const needsOriginalJobDescription = !version.targetJobDescription &&
    (jobDescription.trim().length < 50 || jobDescription.trim().length > 5000);

  const acceptSuggestion = (change: ChangeItem) => {
    if (saveMutation.isPending || reloading || comparing || conflict) return;
    const updated = applyOneSuggestion(text, change);
    if (!updated) return toast.error('This wording no longer appears exactly once in the draft. Review or edit it manually.');
    if (updated.length > 30000) return toast.error('The draft would exceed 30,000 characters.');
    updateDraft((current) => ({ ...current, text: updated }));
    setReviewed((current) => ({ ...current, [suggestionKey(change)]: 'applied' }));
    toast.success('Suggestion applied. Review the wording before saving.');
  };

  const skipSuggestion = (change: ChangeItem) => {
    setReviewed((current) => ({ ...current, [suggestionKey(change)]: 'skipped' }));
  };

  useEffect(() => {
    // A background refresh must not erase edits or advance their save revision.
    if (!dirty && draft.expectedUpdatedAt !== version.updatedAt) {
      updateDraft({ text: startingText, savedText: startingText, expectedUpdatedAt: version.updatedAt, needsConversion: version.contentFormat !== 'resume' });
    }
  }, [dirty, draft.expectedUpdatedAt, startingText, updateDraft, version.contentFormat, version.updatedAt]);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    onSavingChange(saveMutation.isPending || reloading || !!exporting || comparing);
    return () => onSavingChange(false);
  }, [saveMutation.isPending, reloading, exporting, comparing, onSavingChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = () => {
    if (!text.trim()) return toast.error('Resume content cannot be empty.');
    saveMutation.mutate(
      { versionNumber: version.versionNumber, request: { content: text.trim(), expectedUpdatedAt: draft.expectedUpdatedAt } },
      {
        onSuccess: () => {
          setConflict(false);
          toast.success('Resume draft saved.');
        },
        onError: (error: any) => {
          setConflict(error?.response?.status === 409);
          toast.error(error?.response?.data?.message ?? 'Could not save the draft.');
        },
      }
    );
  };

  const savePendingEdits = async () => {
    if (!dirty) return;
    await saveMutation.mutateAsync({
      versionNumber: version.versionNumber,
      request: { content: text.trim(), expectedUpdatedAt: draft.expectedUpdatedAt },
    });
    setConflict(false);
  };

  const compareScores = async () => {
    if (!text.trim()) return toast.error('Resume content cannot be empty.');
    if (conflict || reloading || comparing || saveMutation.isPending || exporting) return;
    if (needsOriginalJobDescription) return toast.error('Paste the original job description above to compare this older version.');
    setComparing(true);
    try {
      await savePendingEdits();
      await compareMutation.mutateAsync({
        versionNumber: version.versionNumber,
        request: { jobDescription: version.targetJobDescription ? undefined : jobDescription.trim() || undefined },
      });
      toast.success('ATS scores compared against the same job description.');
    } catch (error: any) {
      setConflict(error?.response?.status === 409 && /changed|reload/i.test(error?.response?.data?.message ?? ''));
      toast.error(error?.response?.data?.message ?? 'Could not compare ATS scores. Please try again.');
    } finally {
      setComparing(false);
    }
  };

  const reloadSaved = async () => {
    if (!window.confirm('Replace your unsaved edits with the latest saved draft? Copy any text you want to keep first.')) return;
    setReloading(true);
    try {
      const latest = await optimizerService.getVersion(resumeId, version.versionNumber);
      const latestText = latest.contentFormat === 'resume' ? latest.optimizedContent : originalText;
      await queryClient.cancelQueries({ queryKey: optimizerQueryKey(resumeId) });
      queryClient.setQueryData(versionQueryKey(resumeId, latest.versionNumber), latest);
      queryClient.setQueryData<ResumeVersion[]>(optimizerQueryKey(resumeId), (current = []) =>
        current.map((item) => item.versionNumber === latest.versionNumber ? latest : item)
      );
      updateDraft({ text: latestText, savedText: latestText, expectedUpdatedAt: latest.updatedAt, needsConversion: latest.contentFormat !== 'resume' });
      setReviewed({});
      setConflict(false);
    } catch {
      toast.error('Could not reload the draft. Your edits are still here.');
    } finally {
      setReloading(false);
    }
  };

  const download = async (format: 'pdf' | 'docx') => {
    if (!text.trim()) return toast.error('Resume content cannot be empty.');
    if (conflict || reloading || comparing || saveMutation.isPending || exporting) return;
    setExporting(format);
    try {
      await savePendingEdits();
      const blob = await optimizerService.exportDraft(resumeId, version.versionNumber, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `careerpilot-resume-v${version.versionNumber}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error: any) {
      setConflict(error?.response?.status === 409 && /changed|reload/i.test(error?.response?.data?.message ?? ''));
      let message = error?.response?.data?.message;
      if (error?.response?.data instanceof Blob) {
        try { message = JSON.parse(await error.response.data.text()).message; } catch { /* Use the fallback message. */ }
      }
      toast.error(message ?? 'Could not save or download the resume. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">Editable resume</p>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <FilePenLine size={19} /> Draft for version {version.versionNumber}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Review every claim before you apply or export AI wording. Your uploaded file stays separate.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span role="status" className="text-xs text-slate-500 dark:text-slate-400">{saveMutation.isPending ? 'Saving…' : dirty ? 'Unsaved changes' : 'Saved'}</span>
          <Button
            onClick={() => download('pdf')}
            disabled={!!exporting || comparing || saveMutation.isPending || reloading || conflict || !text.trim()}
            isLoading={exporting === 'pdf'}
            leftIcon={<Download size={15} />}
          >
            Download updated resume (PDF)
          </Button>
        </div>
      </div>
      {draft.needsConversion && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
          This older version stored an advice report. The editor starts with your original resume text. Review and save it to enable exports.
        </p>
      )}
      {conflict && (
        <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
          <p>This version changed in another session. Your edits are preserved here. Copy any text you want to keep, then reload the saved draft before editing again.</p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={reloadSaved} isLoading={reloading}>Reload saved draft</Button>
        </div>
      )}
      <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900/50 dark:bg-violet-950/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-white"><Gauge size={16} className="text-violet-600" /> ATS score comparison</h3>
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">Compare the original resume with your current draft for the same job.</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={compareScores}
            disabled={!text.trim() || needsOriginalJobDescription || !!exporting || comparing || saveMutation.isPending || reloading || conflict}
            isLoading={comparing}
          >
            {afterScore === null ? 'Compare ATS scores' : 'Recheck ATS scores'}
          </Button>
        </div>
        {needsOriginalJobDescription && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            This older version needs its original job description. Paste it in the Job Description box above (50–5,000 characters) to compare scores.
          </p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-3 dark:bg-white/[0.05]">
            <p className="text-xs text-stone-500 dark:text-stone-400">Before · original</p>
            <p className="mt-1 text-xl font-bold text-stone-900 dark:text-white">{beforeScore === null ? '—' : `${beforeScore}/100`}</p>
          </div>
          <div className="rounded-lg bg-white p-3 dark:bg-white/[0.05]">
            <p className="text-xs text-stone-500 dark:text-stone-400">After · current draft</p>
            <p className="mt-1 text-xl font-bold text-stone-900 dark:text-white">{afterScore === null ? '—' : `${afterScore}/100`}</p>
          </div>
          <div className="col-span-2 rounded-lg bg-white p-3 sm:col-span-1 dark:bg-white/[0.05]">
            <p className="text-xs text-stone-500 dark:text-stone-400">Change</p>
            <p className={`mt-1 text-xl font-bold ${scoreChange === null ? 'text-stone-400' : scoreChange > 0 ? 'text-emerald-700 dark:text-emerald-400' : scoreChange < 0 ? 'text-rose-700 dark:text-rose-400' : 'text-stone-900 dark:text-white'}`}>
              {scoreChange === null ? 'Not checked' : scoreChange > 0 ? `+${scoreChange} points` : scoreChange < 0 ? `${scoreChange} points` : 'No change'}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">Scores are estimates, not an ATS pass guarantee. AI suggestions are not included until you apply them to the draft. Recheck after editing.</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="resume-draft-content" className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-100">Resume content</label>
          <textarea
            id="resume-draft-content"
            value={text}
            onChange={(event) => updateDraft({ ...draft, text: event.target.value })}
            maxLength={30000}
            rows={24}
            spellCheck
            disabled={saveMutation.isPending || reloading || comparing}
            aria-describedby="resume-draft-hint"
            className="w-full resize-y rounded-xl border border-slate-300 bg-white p-4 font-mono text-sm leading-6 text-slate-900 shadow-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
          <p id="resume-draft-hint" className="mt-2 text-xs text-slate-500 dark:text-slate-400">Put your name on the first line and section headings on their own lines. Download saves your current edits first; save separately before reloading this page.</p>
        </div>
        <div className="min-w-0">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100"><Eye size={16} /> Resume preview</h3>
          <div aria-label="Resume content preview" className="max-h-[610px] min-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 font-sans text-sm leading-relaxed text-slate-800 shadow-sm sm:p-8">
            {text.trim() ? text.trim().replace(/\r\n/g, '\n').split('\n').map((raw, index) => {
              const line = raw.trim();
              if (!line) return <div key={index} className="h-3" />;
              if (index === 0) return <p key={index} className="mb-4 break-words text-xl font-bold text-slate-900">{line}</p>;
              if (isHeading(line)) return <h4 key={index} className="mb-2 mt-4 break-words text-xs font-bold uppercase tracking-wide text-teal-700">{line}</h4>;
              return <p key={index} className="mb-1 break-words">{line}</p>;
            }) : <p className="text-slate-500">Your resume preview will appear here as you type.</p>}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Content preview. Line wrapping and page breaks may differ in PDF and Word.</p>
        </div>
      </div>
      {suggestions.length > 0 && (
        <details
          open={suggestionsOpen}
          onToggle={(event) => setSuggestionsOpen(event.currentTarget.open)}
          className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
        >
          <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-slate-100">
            Review AI suggestions ({pendingSuggestions.length} remaining)
          </summary>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
            Apply only claims you can verify. Skip suggestions you do not want. Changes appear in the editor above and are not saved until you select Save draft.
          </p>
          <div className="mt-4 max-h-[550px] space-y-4 overflow-y-auto">
            <ChangeComparison
              changes={pendingSuggestions}
              emptyMessage="All suggestions reviewed. You can still edit the resume directly."
              hideHeader
              onAccept={acceptSuggestion}
              onReject={skipSuggestion}
            />
          </div>
          {Object.keys(reviewed).length > 0 && (
            <button type="button" className="mt-3 text-xs font-medium text-teal-700 underline dark:text-teal-300" onClick={() => setReviewed({})}>
              Show reviewed suggestions again
            </button>
          )}
        </details>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={save} disabled={!dirty || saveMutation.isPending || reloading || comparing || conflict || !!exporting || !text.trim()} isLoading={saveMutation.isPending} leftIcon={<Save size={15} />}>Save draft</Button>
        <Button variant="secondary" onClick={() => download('pdf')} disabled={!!exporting || comparing || saveMutation.isPending || reloading || conflict || !text.trim()} leftIcon={<Download size={15} />}>
          {exporting === 'pdf' ? 'Preparing PDF…' : 'Export PDF'}
        </Button>
        <Button variant="secondary" onClick={() => download('docx')} disabled={!!exporting || comparing || saveMutation.isPending || reloading || conflict || !text.trim()} leftIcon={<Download size={15} />}>
          {exporting === 'docx' ? 'Preparing Word…' : 'Export Word'}
        </Button>
        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{text.length.toLocaleString()} / 30,000 characters</span>
      </div>
    </Card>
  );
}
