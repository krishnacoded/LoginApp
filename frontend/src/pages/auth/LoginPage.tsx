import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Loader2, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../store/auth.store';
import { toast } from 'sonner';
import { cn } from '../../utils';
import Logo from '../../components/common/Logo';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;



export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,rgba(255,226,100,0.18),transparent_40rem),radial-gradient(circle_at_90%_90%,rgba(48,127,226,0.28),transparent_40rem),linear-gradient(135deg,#FFE264_-10%,#F2A900_15%,#307FE2_55%,#00205B_100%)] flex relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl animate-float"
          style={{ background: 'radial-gradient(circle, #FFE264 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full opacity-15 blur-3xl animate-float"
          style={{ background: 'radial-gradient(circle, #307FE2 0%, transparent 70%)', animationDelay: '2s' }} />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-10 blur-3xl animate-float"
          style={{ background: 'radial-gradient(circle, #003087 0%, transparent 70%)', animationDelay: '4s' }} />
      </div>

      {/* Left panel - Branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative z-10">
        <div className="flex items-center gap-3">
          <Logo size="md" />
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl font-bold leading-tight">
              <span className="text-white">People operations,</span><br />
              <span className="gradient-text">reimagined.</span>
            </h1>
            <p className="mt-4 text-lg text-white/70 leading-relaxed max-w-md">
              Streamline your workforce with AI-powered insights, seamless leave management, and beautiful analytics.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-3 gap-4 max-w-md"
          >
            {[
              { value: '10k+', label: 'Employees managed' },
              { value: '500+', label: 'Companies trust us' },
              { value: '99.9%', label: 'Uptime SLA' },
            ].map(({ value, label }) => (
              <div key={label} className="glass-card rounded-xl p-4 border-white/10 bg-black/25">
                <p className="text-2xl font-bold gradient-text">{value}</p>
                <p className="text-xs text-white/50 mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="text-sm text-white/30">© 2026 PeopleFlow. All rights reserved.</p>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Logo size="md" />
          </div>

          <div className="glass-card rounded-2xl p-8 border-white/10 bg-black/35 backdrop-blur-xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">Welcome back</h2>
              <p className="text-sm text-white/50 mt-1">Sign in to your workspace</p>
            </div>



            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@company.com"
                    className={cn('input-field pl-9', errors.email && 'border-red-500/50')}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-white/60">Password</label>
                  <Link to="/forgot-password" className="text-xs text-lime-300 hover:text-lime-200 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={cn('input-field pl-9 pr-10', errors.password && 'border-red-500/50')}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  id="rememberMe"
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-lime-500"
                />
                <label htmlFor="rememberMe" className="text-sm text-white/40 cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full justify-center py-3 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/30">
              Don't have an account?{' '}
              <Link to="/register" className="text-lime-300 hover:text-lime-200 font-medium transition-colors">
                Request access
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}