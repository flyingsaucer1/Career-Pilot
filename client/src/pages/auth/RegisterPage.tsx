import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase, one lowercase, and one number'
      ).refine((value) => new TextEncoder().encode(value).length <= 72, 'Password must be at most 72 UTF-8 bytes'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((value) => value, 'Please review and accept the terms'),
    acceptAIDataUse: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      await registerUser(data.name, data.email, data.password, { acceptTerms: data.acceptTerms, acceptAIDataUse: data.acceptAIDataUse });
      setIsLaunching(true);
      toast.success('Account created successfully!');
      if (canAnimateAuthLaunch()) {
        await new Promise((resolve) => window.setTimeout(resolve, AUTH_LAUNCH_MS));
      }
      navigate('/dashboard');
    } catch (err: any) {
      setIsLaunching(false);
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50 dark:bg-[#101b20]">
      <AuthVisualPanel
        mode="register"
        isLaunching={isLaunching}
        eyebrow="A better starting point"
        title="Your next move,"
        accent="made clearer."
        description="Create a private workspace for analysis, targeted ATS comparisons, editable drafts, and application tracking."
      />

      {/* Right — Form */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-5 sm:p-8 lg:p-12">
        <AuthAmbientBackground variant="register" />
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
              Create account
            </h1>
            <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Input label="Full Name" placeholder="John Doe" autoComplete="name" {...register('name')} error={errors.name?.message} />
            </div>

            <div className="space-y-1.5">
              <Input label="Email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} error={errors.email?.message} />
            </div>

            <div className="space-y-1.5">
              <Input label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" {...register('password')} error={errors.password?.message} />
            </div>

            <div className="space-y-1.5">
              <Input label="Confirm Password" type="password" autoComplete="new-password" placeholder="••••••••" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
            </div>

            <label className="flex items-start gap-2 text-xs leading-5 text-stone-500"><input type="checkbox" {...register('acceptTerms')} className="mt-1" /><span>I am 18 or older and accept the <Link className="text-teal-700 underline" to="/terms">terms of use</Link>.</span></label>
            {errors.acceptTerms && <p role="alert" className="text-xs text-red-600">{errors.acceptTerms.message}</p>}
            <label className="flex items-start gap-2 text-xs leading-5 text-stone-500"><input type="checkbox" {...register('acceptAIDataUse')} className="mt-1" /><span>I agree to AI processing described in the <Link className="text-teal-700 underline" to="/privacy">privacy and data-use notice</Link>. Optional—you can enable it later.</span></label>
            <Button type="submit" fullWidth size="lg" isLoading={isLoading} className="mt-2">
              Create Account
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
