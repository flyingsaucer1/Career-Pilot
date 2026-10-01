import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, KeyRound, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/auth.service';

const schema = z.object({
  password: z.string().min(8, 'Use at least 8 characters').regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Include an uppercase letter, lowercase letter, and number'
  ).refine((value) => new TextEncoder().encode(value).length <= 72, 'Password must be at most 72 UTF-8 bytes'),
  confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});

type ResetForm = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({ resolver: zodResolver(schema) });

  const submit = async (values: ResetForm) => {
    if (!token) return;
    setSubmitting(true);
    try {
      await authService.resetPassword(token, values.password);
      toast.success('Password reset. You can sign in now.');
      navigate('/login', { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'This reset link could not be used.');
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#111110] p-4">
    <div className="w-full max-w-md">
      <Link to="/" className="mb-7 flex items-center justify-center gap-2 text-stone-900 dark:text-white">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-white"><Zap size={17} /></span>
        <span className="text-xl font-bold">Career<span className="text-violet-500">Pilot</span></span>
      </Link>
      <Card padding="lg" className="border-stone-200 dark:border-white/10 shadow-xl">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"><KeyRound size={22} /></span>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Choose a new password</h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">This link can be used once before it expires.</p>
        </div>
        {!token ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          This reset link is incomplete. Request a new one from the forgot-password page.
        </div> : <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <Input label="New password" type="password" autoComplete="new-password" {...register('password')} error={errors.password?.message} />
          <Input label="Confirm password" type="password" autoComplete="new-password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
          <Button type="submit" fullWidth size="lg" isLoading={submitting}>Reset password</Button>
        </form>}
        <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"><ArrowLeft size={15} /> Back to sign in</Link>
      </Card>
    </div>
  </div>;
}
