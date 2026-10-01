import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Rocket, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth.service';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsLoading(true);
      await authService.requestPasswordReset(data.email);
      setIsSubmitted(true);
      toast.success('Check your email for the next step.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2.5 mb-6 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow">
              <Rocket size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-surface-900 dark:text-white">
              Career<span className="gradient-text">Pilot</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white text-center">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400 text-center">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <Card padding="lg" className="border-surface-200 dark:border-surface-800 shadow-xl">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                error={errors.email?.message}
              />

              <Button type="submit" fullWidth isLoading={isLoading} className="mt-6">
                Send Reset Link
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50 mb-2">
                Check your email
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
                If an account exists for that address, a single-use reset link is on its way.
              </p>
              <Button
                variant="outline"
                fullWidth
                onClick={() => setIsSubmitted(false)}
              >
                Try another email
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-50 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to log in
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
