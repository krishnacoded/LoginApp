import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-foreground" style={{ background: 'var(--bg-app-gradient)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FFE264, #F2A900)',
            }}
          >
            <ShieldAlert size={20} className="text-[#001133]" />
          </div>

          <span className="text-xl font-bold gradient-text">
            PeopleFlow
          </span>
        </div>

        <h1 className="text-8xl font-bold gradient-text mb-4">
          403
        </h1>

        <h2 className="text-2xl font-semibold text-white/60 mb-3">
          Access Denied
        </h2>

        <p className="text-white/30 mb-8 max-w-sm mx-auto">
          You don't have permission to access this page.
          Contact your administrator if you believe this is a mistake.
        </p>

        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </motion.div>
    </div>
  )
}