import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Brain, Mail, ArrowLeft, Key, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import API from '../api'

export default function ForgotPassword() {
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const nav = useNavigate()

  useEffect(() => {
    let timer
    if (countdown > 0 && step === 2) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [countdown, step])

  const handleSendOTP = async (e) => {
    e?.preventDefault()
    setLoading(true)
    try {
      await API.post('/auth/forgot-password', { email })
      toast.success('OTP sent to your email!')
      setStep(2)
      setCountdown(60)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP. Check your email.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await API.post('/auth/verify-otp', { email, otp })
      toast.success('OTP Verified!')
      setStep(3)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await API.post('/auth/reset-password', { email, newPassword })
      toast.success('Password reset successfully! Please login.')
      nav('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  const titles = {
    1: 'Reset Password',
    2: 'Enter OTP',
    3: 'New Password',
  }

  const subtitles = {
    1: 'Enter your email to receive a reset code',
    2: `We sent a 6-digit code to ${email}`,
    3: 'Secure your account with a new password',
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10 md:py-14">
      {/* Soft radial background — matches Login / Register */}
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
        {/* Brand — same as Login / Register */}
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
            {titles[step]}
          </h1>
          <p
            className="mc-body text-[14px]"
            style={{ color: 'var(--mc-muted)', maxWidth: 360 }}
          >
            {subtitles[step]}
          </p>
        </div>

        {/* Form card */}
        <div className="mc-card-form p-6 md:p-8 mb-5">
          {/* STEP 1: EMAIL */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="flex flex-col gap-5">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading || !email}
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
                    Sending...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </motion.button>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="flex flex-col gap-5">
              <div className="flex flex-col">
                <label className="mc-label">6-Digit OTP</label>
                <div className="relative group">
                  <Key
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                    style={{ color: 'var(--mc-muted)' }}
                  />
                  <input
                    type="text"
                    maxLength={6}
                    className="mc-input"
                    style={{ letterSpacing: '0.35em', textAlign: 'center', paddingLeft: 44 }}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm px-0.5">
                <span style={{ color: 'var(--mc-muted)' }}>Didn’t receive it?</span>
                <button
                  type="button"
                  disabled={countdown > 0 || loading}
                  onClick={handleSendOTP}
                  className="font-medium transition-colors disabled:opacity-50"
                  style={{ color: countdown > 0 ? 'var(--mc-muted)' : 'var(--mc-coral)' }}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>

              <motion.button
                type="submit"
                disabled={loading || otp.length < 4}
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
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </motion.button>
            </form>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
              <div className="flex flex-col">
                <label className="mc-label">New Password</label>
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
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
              </div>

              <motion.button
                type="submit"
                disabled={loading || !newPassword}
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
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </motion.button>
            </form>
          )}
        </div>

        {/* Back link — matches Login footer style */}
        <p className="text-center text-sm pb-2" style={{ color: 'var(--mc-muted)' }}>
          <button
            type="button"
            onClick={() => (step > 1 ? setStep(step - 1) : nav('/login'))}
            className="inline-flex items-center gap-2 font-medium transition-colors"
            style={{ color: 'var(--mc-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--mc-coral)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--mc-muted)')}
          >
            <ArrowLeft size={15} />
            {step > 1 ? 'Back' : 'Back to Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}

