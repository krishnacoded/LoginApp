import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import { authService } from '../../api/auth.service'
import { toast } from 'sonner'
import { cn } from '../../utils'
import Logo from '../../components/common/Logo'

const schema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Min 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      await authService.register(data)
      toast.success('Account created. Check your email to verify it before signing in.')
      navigate('/login')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Registration failed')
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
          <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
          <p className="text-sm text-white/50 mb-6">Request access to your workspace</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 mb-1.5 block font-medium">First Name</label>
                <input {...register('firstName')} placeholder="John" className={cn('input-field', errors.firstName && 'border-red-500/50')} />
                {errors.firstName && <p className="text-xs text-red-400 mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block font-medium">Last Name</label>
                <input {...register('lastName')} placeholder="Doe" className={cn('input-field', errors.lastName && 'border-red-500/50')} />
                {errors.lastName && <p className="text-xs text-red-400 mt-1">{errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block font-medium">Email</label>
              <input {...register('email')} type="email" placeholder="you@company.com" className={cn('input-field', errors.email && 'border-red-500/50')} />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block font-medium">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="••••••••" className={cn('input-field pr-10', errors.password && 'border-red-500/50')} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block font-medium">Confirm Password</label>
              <input {...register('confirmPassword')} type="password" placeholder="••••••••" className={cn('input-field', errors.confirmPassword && 'border-red-500/50')} />
              {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-3 mt-2">
              {isLoading ? <><Loader2 size={16} className="animate-spin mr-2" />Creating account...</> : <>Create Account <ArrowRight size={16} className="ml-2" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/30">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-[#F2A900] font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
