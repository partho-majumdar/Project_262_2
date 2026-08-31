import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff, Brain, Mail, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import API from '../api'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const nav = useNavigate()

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const { data } = await API.post('/auth/google-login', {
          token: tokenResponse.access_token || tokenResponse.credential,
        })
        login(data.user, data.access_token)
        toast.success(`Welcome, ${data.user.full_name}!`)

        if (data.profile_complete === false) {
          nav('/complete-profile')
          return
        }

        try {
          const dashRes = await API.get('/dashboard-data')
          if (dashRes.data?.severity?.final_severity) {
            nav('/dashboard')
          } else {
            nav('/behaviour')
          }
        } catch {
          nav('/behaviour')
        }
      } catch {
        toast.error('Google Login failed')
      }
    },
    onError: () => toast.error('Google Login Failed'),
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await API.post('/auth/login', form)
      login(data.user, data.access_token)
      toast.success(`Welcome back, ${data.user.full_name}!`)

      try {
        const dashRes = await API.get('/dashboard-data')
        if (dashRes.data?.severity?.final_severity) {
          nav('/dashboard')
        } else {
          nav('/behaviour')
        }
      } catch {
        nav('/behaviour')
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10 md:py-14">
      {/* Soft radial background — matches Register / Landing */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,122,89,0.06) 0%, transparent 60%),
              radial-gradient(ellipse 50% 40% at 80% 80%, rgba(127,169,142,0.05) 0%, transparent 50%),
              var(--mc-ink)
            `,
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[440px] relative z-10"
      >
        {/* Brand */}
        <div className="text-center mb-7 flex flex-col items-center">
          <motion.div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: 'rgba(255,122,89,0.14)',
              border: '1px solid rgba(255,122,89,0.25)',
            }}
            whileHover={{ scale: 1.04 }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Brain size={26} style={{ color: 'var(--mc-coral)' }} />
          </motion.div>

          <h1
            className="mc-display text-[clamp(26px,5vw,32px)] mb-1.5"
            style={{ color: 'var(--mc-paper)' }}
          >
            Welcome back
          </h1>
          <p
            className="mc-body text-[14px]"
            style={{ color: 'var(--mc-muted)', maxWidth: 360 }}
          >
            Secure access to your MindCare AI dashboard
          </p>
        </div>

        {/* Form card */}
        <div className="mc-card-form p-6 md:p-8 mb-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col">
              <label className="mc-label">Email Address</label>
              <div className="relative group">
                <Mail
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                  style={{ color: 'var(--mc-muted)' }}
                />
                <input
                  type="email"
                  className="mc-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col relative">
              <label className="mc-label">Password</label>
              <div className="relative group">
                <Lock
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                  style={{ color: 'var(--mc-muted)' }}
                />
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="mc-input"
                  style={{ paddingRight: 44 }}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20"
                  style={{ color: 'var(--mc-muted)' }}
                >
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <div className="text-right mt-2">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium transition-colors"
                  style={{ color: 'var(--mc-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--mc-coral)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--mc-muted)')}
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Sign in */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="mc-btn-primary w-full py-3.5 text-sm mt-1"
            >
              {loading ? (
                <>
                  <div
                    className="w-4 h-4 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: 'rgba(16,19,26,0.3)',
                      borderTopColor: 'var(--mc-ink)',
                    }}
                  />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--mc-line)' }} />
            <span className="mc-caption">Or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--mc-line)' }} />
          </div>

          {/* Google */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => googleLogin()}
            className="mc-btn-secondary w-full py-3.5 text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-1.07 2.978-4.844 2.978-2.921 0-5.4-2.373-5.4-5.4 0-3.026 2.479-5.4 5.4-5.4 1.713 0 2.865.632 3.536 1.244l2.433-2.375C13.9.84 11.665 0 9 0 4.02 0 0 4.024 0 9s4.02 9 9 9c5.16 0 8.44-3.672 8.44-8.8 0-.6-.068-1.058-.16-1.448l-.16-.352z"
              />
            </svg>
            Continue with Google
          </motion.button>
        </div>

        <p className="text-center text-sm pb-2" style={{ color: 'var(--mc-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="font-medium" style={{ color: 'var(--mc-coral)' }}>
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

