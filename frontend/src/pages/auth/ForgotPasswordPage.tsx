import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { authService } from '../../api/auth.service'
import { toast } from 'sonner'
import { cn } from '../../utils'
import Logo from '../../components/common/Logo'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      await authService.forgotPassword(data.email)
      toast.success('Reset link sent successfully')
      setIsSubmitted(true)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Something went wrong. Please try again.')
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
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="w-14 h-14 rounded-full bg-lime-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-lime-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check your inbox</h2>
              <p className="text-sm text-white/50 leading-relaxed">
                If an account exists with this email, we've sent a password reset link. Check your inbox.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-lime-300 hover:text-lime-200 font-medium transition-colors mt-6"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">Forgot password?</h2>
                <p className="text-sm text-white/50 mt-1">Enter your email and we'll send you a reset link</p>
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full justify-center py-3 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-white/30">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-lime-300 hover:text-lime-200 font-medium transition-colors">
                  <ArrowLeft size={14} />
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
