import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AuthVisualPanel } from '../../components/auth/AuthVisualPanel';
import { AuthAmbientBackground } from '../../components/auth/AuthAmbientBackground';
import { AUTH_LAUNCH_MS, canAnimateAuthLaunch } from '../../components/auth/authLaunch';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      await login(data.email, data.password);
      setIsLaunching(true);
      toast.success('Welcome back!');
      if (canAnimateAuthLaunch()) {
        await new Promise((resolve) => window.setTimeout(resolve, AUTH_LAUNCH_MS));
      }
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      setIsLaunching(false);
      toast.error(err.response?.data?.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50 dark:bg-[#101b20]">
      <AuthVisualPanel
        mode="login"
        isLaunching={isLaunching}
        eyebrow="Welcome back"
        title="Your career workspace,"
        accent="ready when you are."
        description="Return to your saved resumes, targeted drafts, ATS comparisons, and interview practice in one focused place."
      />

      {/* Right — Auth form */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-5 sm:p-8 lg:p-12">
        <AuthAmbientBackground variant="login" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md rounded-3xl border border-white/80 bg-white/90 p-7 shadow-[0_24px_70px_rgba(15,43,54,0.12)] backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#14262f]/90 sm:p-9"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center">
              <Rocket size={15} className="text-[#06202e]" />
            </div>
            <span className="text-lg font-bold text-stone-900 dark:text-white">
              Career<span className="text-teal-700 dark:text-teal-300">Pilot</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
              Sign in
            </h1>
            <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
              New here?{' '}
              <Link to="/register" className="font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700">
                Create an account
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label className="label-base" htmlFor="login-email">Email</label>
              <Input
                id="login-email"
                autoComplete="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                error={errors.email?.message}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="label-base" htmlFor="login-password">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700">
                  Forgot?
                </Link>
              </div>
              <Input
                id="login-password"
                autoComplete="current-password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
              />
            </div>

            <Button type="submit" fullWidth size="lg" isLoading={isLoading} className="mt-2">
              Sign In
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
