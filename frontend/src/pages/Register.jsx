import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Brain, User, Mail, Lock, Phone, MapPin, ChevronRight, ChevronLeft, Eye, EyeOff } from 'lucide-react'
import API from '../api'
import toast from 'react-hot-toast'

const OCCUPATIONS = [
  'Accountant', 'Doctor', 'Engineer', 'Lawyer', 'Manager', 'Nurse',
  'Sales_person', 'Scientist', 'Software Engineer', 'Student', 'Teacher'
]

const steps = ['Personal Info', 'Contact Info', 'Account Setup']

const Err = ({ name, errors }) =>
  errors[name] ? (
    <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: 'var(--mc-coral)' }}>
      <span className="text-[10px]">⚠</span> {errors[name]}
    </p>
  ) : null

const InputWrapper = ({ icon: Icon, children }) => (
  <div className="relative group">
    <Icon
      size={17}
      className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10"
      style={{ color: 'var(--mc-muted)' }}
    />
    {children}
  </div>
)

export default function Register() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    full_name: '', age: '', gender: 'Male', occupation: 'Student',
    phone: '', location: '', email: '', password: '', confirm_password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const nav = useNavigate()

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const validateStep = () => {
    const e = {}
    if (step === 0) {
      if (!form.full_name.trim()) e.full_name = 'Full name is required'
      if (!form.age || form.age < 10 || form.age > 100) e.age = 'Age must be 10–100'
    }
    if (step === 1 && form.phone && !/^\d{10}$/.test(form.phone)) {
      e.phone = '10-digit number required'
    }
    if (step === 2) {
      if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
      if (form.password.length < 8) e.password = 'Min 8 characters'
      else if (!/[A-Z]/.test(form.password)) e.password = 'Need an uppercase letter'
      else if (!/[a-z]/.test(form.password)) e.password = 'Need a lowercase letter'
      else if (!/[0-9]/.test(form.password)) e.password = 'Need a number'
      else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) e.password = 'Need a special character'
      if (form.password && form.confirm_password && form.password !== form.confirm_password) {
        e.confirm_password = 'Passwords do not match'
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validateStep()) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    if (!validateStep()) return
    setLoading(true)
    const payload = { ...form, age: parseInt(form.age) }

    try {
      const res = await API.post('/auth/register', payload)
      toast.dismiss()
      toast.success(res.data?.message || 'Registration successful! Taking you to your first assessment.')
      nav('/behaviour')
    } catch (err) {
      toast.dismiss()
      if (!err.response) {
        toast.error('Network error. Is the backend running?')
        return
      }
      const { status, data } = err.response
      const detail = data?.detail
      if (status === 422) {
        toast.error(Array.isArray(detail) ? `Validation error: ${detail[0]?.msg || 'check fields'}` : 'Invalid data format.')
      } else if (status === 400) {
        toast.error(detail || 'Registration failed.')
      } else {
        toast.error('Server error. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-start justify-center px-4 pt-10 pb-8 md:pt-14 md:pb-10">
      {/* Soft radial background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,122,89,0.06) 0%, transparent 60%),
              radial-gradient(ellipse 50% 40% at 80% 80%, rgba(127,169,142,0.05) 0%, transparent 50%),
              var(--mc-ink)
            `
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[480px] relative z-10"
      >
        {/* Brand */}
        <div className="text-center mb-6 flex flex-col items-center">
          <motion.div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'rgba(255,122,89,0.14)', border: '1px solid rgba(255,122,89,0.25)' }}
            whileHover={{ scale: 1.04 }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Brain size={26} style={{ color: 'var(--mc-coral)' }} />
          </motion.div>

          <h1 className="mc-display text-[clamp(26px,5vw,32px)] mb-1.5" style={{ color: 'var(--mc-paper)' }}>
            Create your account
          </h1>
          <p className="mc-body text-[14px]" style={{ color: 'var(--mc-muted)', maxWidth: 400 }}>
            Join MindCare AI for personalised wellness support
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full h-[3px] rounded-full transition-all duration-300"
                  style={{
                    background: i <= step
                      ? 'linear-gradient(90deg, var(--mc-coral), var(--mc-sage))'
                      : 'rgba(237,233,226,0.1)'
                  }}
                />
                <span
                  className="mc-caption text-center"
                  style={{
                    color: i === step ? 'var(--mc-coral)' : i < step ? 'var(--mc-sage)' : 'var(--mc-muted)'
                  }}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="mc-card-form p-6 md:p-8 mb-5">
          <div className="min-h-[280px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.28, ease: 'easeInOut' }}
                className="space-y-5"
              >
                {step === 0 && (
                  <>
                    <div className="flex flex-col">
                      <label className="mc-label">Full Name *</label>
                      <InputWrapper icon={User}>
                        <input
                          className="mc-input"
                          placeholder="John Doe"
                          value={form.full_name}
                          onChange={e => update('full_name', e.target.value)}
                        />
                      </InputWrapper>
                      <Err name="full_name" errors={errors} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="mc-label">Age *</label>
                        <input
                          type="number"
                          className="mc-input mc-input-plain"
                          placeholder="25"
                          value={form.age}
                          onChange={e => update('age', e.target.value)}
                          min={10}
                          max={100}
                        />
                        <Err name="age" errors={errors} />
                      </div>
                      <div className="flex flex-col">
                        <label className="mc-label">Gender *</label>
                        <div className="relative">
                          <select
                            className="mc-select"
                            value={form.gender}
                            onChange={e => update('gender', e.target.value)}
                          >
                            <option>Male</option>
                            <option>Female</option>
                          </select>
                          <ChevronRight
                            size={15}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none"
                            style={{ color: 'var(--mc-muted)' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="mc-label">Occupation *</label>
                      <div className="relative">
                        <select
                          className="mc-select"
                          value={form.occupation}
                          onChange={e => update('occupation', e.target.value)}
                        >
                          {OCCUPATIONS.map(o => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                        <ChevronRight
                          size={15}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none"
                          style={{ color: 'var(--mc-muted)' }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div className="flex flex-col">
                      <label className="mc-label">
                        Phone Number{' '}
                        <span style={{ color: 'var(--mc-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                          (optional)
                        </span>
                      </label>
                      <InputWrapper icon={Phone}>
                        <input
                          className="mc-input"
                          placeholder="+88 01 xx-xxx-xxxx"
                          value={form.phone}
                          onChange={e => update('phone', e.target.value)}
                        />
                      </InputWrapper>
                      <Err name="phone" errors={errors} />
                    </div>

                    <div className="flex flex-col">
                      <label className="mc-label">
                        Location{' '}
                        <span style={{ color: 'var(--mc-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                          (optional)
                        </span>
                      </label>
                      <InputWrapper icon={MapPin}>
                        <input
                          className="mc-input"
                          placeholder="City, Country"
                          value={form.location}
                          onChange={e => update('location', e.target.value)}
                        />
                      </InputWrapper>
                    </div>

                    <div
                      className="rounded-xl p-4 mt-1 flex gap-3"
                      style={{
                        background: 'rgba(127,169,142,0.08)',
                        border: '1px solid rgba(127,169,142,0.2)'
                      }}
                    >
                      <Lock size={15} style={{ color: 'var(--mc-sage)', flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 12.5, color: 'rgba(237,233,226,0.7)', lineHeight: 1.65 }}>
                        Your personal data is encrypted and used exclusively for personalised mental health analysis.
                      </p>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="flex flex-col">
                      <label className="mc-label">Email Address *</label>
                      <InputWrapper icon={Mail}>
                        <input
                          type="email"
                          className="mc-input"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={e => update('email', e.target.value)}
                        />
                      </InputWrapper>
                      <Err name="email" errors={errors} />
                    </div>

                    <div className="flex flex-col relative">
                      <label className="mc-label">Password *</label>
                      <InputWrapper icon={Lock}>
                        <input
                          type={showPwd ? 'text' : 'password'}
                          className="mc-input"
                          style={{ paddingRight: 44 }}
                          placeholder="••••••••"
                          value={form.password}
                          onChange={e => update('password', e.target.value)}
                        />
                      </InputWrapper>
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3.5 top-[34px] z-20"
                        style={{ color: 'var(--mc-muted)' }}
                      >
                        {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                      <Err name="password" errors={errors} />
                    </div>

                    <div className="flex flex-col relative">
                      <label className="mc-label">Confirm Password *</label>
                      <InputWrapper icon={Lock}>
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          className="mc-input"
                          style={{ paddingRight: 44 }}
                          placeholder="••••••••"
                          value={form.confirm_password}
                          onChange={e => update('confirm_password', e.target.value)}
                        />
                      </InputWrapper>
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-[34px] z-20"
                        style={{ color: 'var(--mc-muted)' }}
                      >
                        {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                      <Err name="confirm_password" errors={errors} />
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Buttons */}
          <div className="flex mt-2 pt-6" style={{ borderTop: '1px solid var(--mc-line)' }}>
            {step > 0 && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="mc-btn-secondary flex-1 py-3.5 text-sm"
                onClick={back}
              >
                <ChevronLeft size={16} /> Back
              </motion.button>
            )}

            {step < 2 ? (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="mc-btn-primary flex-[2] py-3.5 text-sm"
                onClick={next}
              >
                Next step <ChevronRight size={16} />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                disabled={loading}
                className="mc-btn-primary flex-[2] py-3.5 text-sm"
                onClick={handleSubmit}
              >
                {loading ? (
                  <>
                    <div
                      className="w-4 h-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: 'rgba(16,19,26,0.3)', borderTopColor: 'var(--mc-ink)' }}
                    />
                    Creating...
                  </>
                ) : (
                  'Create account'
                )}
              </motion.button>
            )}
          </div>
        </div>

        <p className="text-center text-sm pb-2" style={{ color: 'var(--mc-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium" style={{ color: 'var(--mc-coral)' }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
