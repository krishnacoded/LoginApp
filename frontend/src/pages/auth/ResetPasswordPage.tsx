import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, CheckCircle2, Lock, AlertCircle, ArrowRight } from 'lucide-react'
import { authService } from '../../api/auth.service'
import { toast } from 'sonner'
import { cn } from '../../utils'
import Logo from '../../components/common/Logo'

const schema = z.object({
  password: z.string().min(8, 'Min 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!token) return
    setIsLoading(true)
    try {
      await authService.resetPassword(token, data.password)
      toast.success('Password reset successfully')
      setIsSuccess(true)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,rgba(255,226,100,0.18),transparent_40rem),radial-gradient(circle_at_90%_90%,rgba(48,127,226,0.28),transparent_40rem),linear-gradient(135deg,#FFE264_-10%,#F2A900_15%,#307FE2_55%,#00205B_100%)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-15 blur-3xl animate-float"
          style={{ background: 'radial-gradient(circle, #FFE264 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15 blur-3xl animate-float"
          style={{ background: 'radial-gradient(circle, #307FE2 0%, transparent 70%)', animationDelay: '2s' }} />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Logo size="md" />
        </div>

        <div className="glass-card rounded-2xl p-8 border-white/10 bg-black/35 backdrop-blur-xl">
          {!token ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} className="text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Invalid reset link</h2>
              <p className="text-sm text-white/50 leading-relaxed">
                This password reset link is invalid or missing a token. Please request a new one.
              </p>
              <Link
                to="/forgot-password"
                className="btn-primary inline-flex justify-center py-2.5 px-6 mt-6"
              >
                Request new link
              </Link>
            </motion.div>
          ) : isSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="w-14 h-14 rounded-full bg-lime-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-lime-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Password reset successfully</h2>
              <p className="text-sm text-white/50 leading-relaxed">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Link
                to="/login"
                className="btn-primary inline-flex items-center gap-2 justify-center py-2.5 px-6 mt-6"
              >
                Go to sign in
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">Reset password</h2>
                <p className="text-sm text-white/50 mt-1">Enter your new password below</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={cn('input-field pl-9 pr-10', errors.password && 'border-red-500/50')}
                      autoComplete="new-password"
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

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                    <input
                      {...register('confirmPassword')}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={cn('input-field pl-9 pr-10', errors.confirmPassword && 'border-red-500/50')}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full justify-center py-3 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    'Reset password'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-white/30">
                Remember your password?{' '}
                <Link to="/login" className="text-lime-300 hover:text-lime-200 font-medium transition-colors">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
