import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, MessageSquareMore,
  Play, RotateCcw, Sparkles, Target, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { useJobApplications } from '../../hooks/useJobApplications';
import {
  useAnswerInterview, useCreateInterview, useDeleteInterview,
  useInterviewSession, useInterviewSessions, useUpdateInterviewStatus,
} from '../../hooks/useInterviews';
import type { InterviewQuestion } from '../../types/interview.types';

const errorMessage = (error: any, fallback: string) => error.response?.data?.message || fallback;
const questionLabels = { technical: 'Technical', behavioral: 'Behavioral', resume: 'Resume-specific' } as const;

function Feedback({ question }: { question: InterviewQuestion }) {
  if (!question.feedback) return null;
  const feedback = question.feedback;
  return <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900 dark:bg-emerald-950/20">
    <div className="flex items-center justify-between"><div><span className="panel-overline">COACH FEEDBACK</span><h3 className="font-semibold">Answer review</h3></div><span className="text-3xl font-semibold text-emerald-600">{Math.round(feedback.score)}</span></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-5">{Object.entries(feedback.rubric).map(([label, score]) => <div key={label}><div className="flex justify-between text-[9px] uppercase text-[var(--muted)]"><span>{label}</span><b>{Math.round(score)}</b></div><div className="mt-1 h-1.5 rounded-full bg-[var(--line)]"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${score}%` }} /></div></div>)}</div>
    <div className="mt-5 grid gap-5 md:grid-cols-2"><div><h4 className="text-xs font-semibold">What worked</h4><ul className="mt-2 space-y-1 text-xs leading-5 text-[var(--muted)]">{feedback.strengths.map((item) => <li key={item}>• {item}</li>)}</ul></div><div><h4 className="text-xs font-semibold">Improve next</h4><ul className="mt-2 space-y-1 text-xs leading-5 text-[var(--muted)]">{feedback.improvements.map((item) => <li key={item}>• {item}</li>)}</ul></div></div>
    <details className="mt-5 border-t border-emerald-200 pt-4 dark:border-emerald-900"><summary className="cursor-pointer text-xs font-semibold">View grounded example answer</summary><p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-[var(--muted)]">{feedback.exampleAnswer}</p></details>
    <div className="mt-4 rounded-lg bg-white/70 p-3 text-xs dark:bg-white/[0.04]"><b>Likely follow-up:</b> <span className="text-[var(--muted)]">{feedback.followUpQuestion}</span></div>
  </div>;
}

function PracticeQuestion({ sessionId, question }: { sessionId: string; question: InterviewQuestion }) {
  const [answer, setAnswer] = useState(question.answer);
  const mutation = useAnswerInterview();
  useEffect(() => setAnswer(question.answer), [question._id, question.answer]);
  const submit = async () => {
    if (answer.trim().length < 20) return toast.error('Write at least 20 characters before requesting feedback.');
    try {
      await mutation.mutateAsync({ sessionId, questionId: question._id, answer });
      toast.success('Feedback saved to this practice session.');
    } catch (error) { toast.error(errorMessage(error, 'Feedback could not be generated.')); }
  };
  return <section className="workspace-panel p-6">
    <div className="flex flex-wrap items-center gap-2"><span className="subtle-badge">{questionLabels[question.type]}</span><span className="subtle-badge">{question.difficulty}</span>{question.feedback && <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-emerald-600"><CheckCircle2 size={13} /> Answered</span>}</div>
    <h2 className="mt-5 text-xl font-semibold leading-8">{question.question}</h2>
    <p className="mt-3 text-xs leading-5 text-[var(--muted)]"><b>What the interviewer is testing:</b> {question.intent}</p>
    <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-[var(--accent)]">Answer guidance and follow-ups</summary><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{question.answerGuidance}</p><ul className="mt-2 text-xs text-[var(--muted)]">{question.followUpPrompts.map((prompt) => <li key={prompt}>• {prompt}</li>)}</ul></details>
    <div className="mt-5"><div className="mb-1.5 flex justify-between"><label className="label-base">Your practice answer</label><span className="text-[10px] text-[var(--muted)]">{answer.length} / 5,000</span></div><textarea className="input-base min-h-44 resize-y text-sm leading-6" maxLength={5000} value={answer} disabled={mutation.isPending} onChange={(event) => setAnswer(event.target.value)} placeholder="Structure your answer clearly. For experience questions, consider Situation, Task, Action, and Result…" /></div>
    <Button className="mt-4" leftIcon={<Sparkles size={14} />} onClick={submit} isLoading={mutation.isPending}>{question.feedback ? 'Re-evaluate answer' : 'Get structured feedback'}</Button>
    <Feedback question={question} />
  </section>;
}

export default function InterviewPrepPage() {
  const [params, setParams] = useSearchParams();
  const sessionId = params.get('sessionId');
  const requestedJobId = params.get('jobId');
  const [applicationId, setApplicationId] = useState(requestedJobId ?? '');
  const [questionIndex, setQuestionIndex] = useState(0);
  const { data: applications = [], isLoading: jobsLoading } = useJobApplications();
  const { data: sessions = [], isLoading: sessionsLoading, isError: sessionsError, refetch } = useInterviewSessions();
  const { data: session, isLoading: sessionLoading, isError: sessionError } = useInterviewSession(sessionId);
  const createMutation = useCreateInterview();
  const statusMutation = useUpdateInterviewStatus();
  const deleteMutation = useDeleteInterview();
  const eligibleApplications = useMemo(() => applications.filter((item) => item.resumeId), [applications]);
  const answered = session?.questions.filter((question) => question.feedback).length ?? 0;
  const currentQuestion = session?.questions[questionIndex];

  useEffect(() => { if (requestedJobId) setApplicationId(requestedJobId); }, [requestedJobId]);
  useEffect(() => { setQuestionIndex(0); }, [sessionId]);
  useEffect(() => {
    if (!session || questionIndex < session.questions.length) return;
    setQuestionIndex(Math.max(0, session.questions.length - 1));
  }, [session, questionIndex]);

  const start = async () => {
    if (!applicationId) return toast.error('Choose a saved application with a linked resume.');
    try {
      const created = await createMutation.mutateAsync(applicationId);
      setParams({ sessionId: created._id });
      toast.success('Interview practice session created.');
    } catch (error) { toast.error(errorMessage(error, 'Questions could not be generated.')); }
  };
  const toggleComplete = async () => {
    if (!session) return;
    try {
      await statusMutation.mutateAsync({ id: session._id, status: session.status === 'completed' ? 'active' : 'completed' });
      toast.success(session.status === 'completed' ? 'Session reopened.' : 'Session completed.');
    } catch (error) { toast.error(errorMessage(error, 'Session could not be updated.')); }
  };
  const remove = async () => {
    if (!session || !window.confirm(`Delete interview practice for ${session.targetRole} at ${session.company}?`)) return;
    try { await deleteMutation.mutateAsync(session._id); setParams({}); toast.success('Interview session deleted.'); }
    catch (error) { toast.error(errorMessage(error, 'Session could not be deleted.')); }
  };

  return <div className="max-w-7xl">
    <div className="overview-heading"><div><p className="eyebrow">ROLE-FOCUSED PRACTICE</p><h1>Interview preparation<span className="heading-dot">.</span></h1><p>Practice grounded questions, improve your answers, and return to saved coaching sessions.</p></div></div>
    <section className="workspace-panel mb-5 p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-end"><div className="flex-1"><label className="label-base">Start from a saved application</label><select className="input-base" value={applicationId} disabled={jobsLoading || createMutation.isPending} onChange={(event) => setApplicationId(event.target.value)}><option value="">Choose an application with a linked resume</option>{eligibleApplications.map((item) => <option value={item._id} key={item._id}>{item.role} · {item.company}{item.resumeVersionNumber ? ` · Resume v${item.resumeVersionNumber}` : ''}</option>)}</select></div><Button leftIcon={<Play size={14} />} onClick={start} isLoading={createMutation.isPending}>Generate practice session</Button></div>{!jobsLoading && eligibleApplications.length === 0 && <p className="mt-3 text-xs text-amber-600">Add an application and link a resume in Job Tracker before starting.</p>}</section>

    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]"><aside className="workspace-panel h-fit p-4"><div className="mb-4 flex items-center justify-between"><div><span className="panel-overline">HISTORY</span><h2 className="font-semibold">Practice sessions</h2></div><MessageSquareMore size={18} className="text-[var(--accent)]" /></div>{sessionsLoading ? <p className="text-xs text-[var(--muted)]">Loading sessions…</p> : sessionsError ? <div><p className="text-xs text-rose-600">History could not be loaded.</p><Button size="sm" className="mt-3" variant="secondary" onClick={() => refetch()}>Retry</Button></div> : sessions.length ? <div className="space-y-2">{sessions.map((item) => { const count = item.questions.filter((question) => question.feedback).length; return <button key={item._id} onClick={() => setParams({ sessionId: item._id })} className={`w-full rounded-lg border p-3 text-left transition ${sessionId === item._id ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--line)] hover:border-[var(--accent)]'}`}><strong className="block truncate text-xs">{item.targetRole}</strong><span className="block truncate text-[10px] text-[var(--muted)]">{item.company} · {count}/{item.questions.length} answered</span><span className="mt-1 block text-[9px] uppercase text-[var(--muted)]">{item.status} · {new Date(item.updatedAt).toLocaleDateString()}</span></button>; })}</div> : <p className="text-xs leading-5 text-[var(--muted)]">No sessions yet. Generate one from a saved application.</p>}</aside>

      <main>{!sessionId ? <div className="workspace-panel flex min-h-96 flex-col items-center justify-center p-12 text-center"><span className="coming-soon-icon"><BrainCircuit size={30} /></span><h2 className="mt-4 text-xl font-semibold">Choose your target role</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">CareerPilot uses the saved job description and linked resume to build technical, behavioral, and resume-specific practice questions.</p></div> : sessionLoading ? <div className="workspace-panel p-12 text-center text-sm text-[var(--muted)]">Restoring your practice session…</div> : sessionError || !session || !currentQuestion ? <div className="workspace-panel p-12 text-center"><p>That interview session could not be loaded.</p><Button className="mt-4" variant="secondary" onClick={() => setParams({})}>Back to sessions</Button></div> : <div className="space-y-4"><section className="workspace-panel p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="panel-overline">{session.company}</span><h2 className="text-lg font-semibold">{session.targetRole}</h2><p className="mt-1 text-[10px] text-[var(--muted)]">{answered}/{session.questions.length} answered · {session.resumeVersionNumber ? `Resume version ${session.resumeVersionNumber}` : 'Original resume'}</p></div><div className="flex gap-2"><Button size="sm" variant="secondary" leftIcon={session.status === 'completed' ? <RotateCcw size={13} /> : <CheckCircle2 size={13} />} onClick={toggleComplete} isLoading={statusMutation.isPending}>{session.status === 'completed' ? 'Reopen' : 'Complete'}</Button><Button size="sm" variant="ghost" onClick={remove} disabled={deleteMutation.isPending} aria-label="Delete session"><Trash2 size={14} /></Button></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--line)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(answered / session.questions.length) * 100}%` }} /></div></section>
        <PracticeQuestion key={currentQuestion._id} sessionId={session._id} question={currentQuestion} />
        <div className="flex items-center justify-between"><Button variant="secondary" leftIcon={<ArrowLeft size={14} />} disabled={questionIndex === 0} onClick={() => setQuestionIndex((index) => index - 1)}>Previous</Button><div className="flex flex-wrap justify-center gap-1">{session.questions.map((question, index) => <button key={question._id} aria-label={`Question ${index + 1}`} onClick={() => setQuestionIndex(index)} className={`h-8 w-8 rounded-full text-[10px] font-semibold ${index === questionIndex ? 'bg-[var(--accent)] text-white' : question.feedback ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--line)] text-[var(--muted)]'}`}>{index + 1}</button>)}</div><Button variant="secondary" rightIcon={<ArrowRight size={14} />} disabled={questionIndex === session.questions.length - 1} onClick={() => setQuestionIndex((index) => index + 1)}>Next</Button></div>
        <div className="workspace-panel flex items-start gap-3 p-4 text-xs leading-5 text-[var(--muted)]"><Target size={16} className="mt-0.5 shrink-0 text-[var(--accent)]" /><p>AI feedback is coaching, not a factual source. Keep every example truthful and replace placeholders only with outcomes you can verify.</p></div>
      </div>}</main></div>
  </div>;
}
