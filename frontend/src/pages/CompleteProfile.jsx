import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Brain, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import API from '../api'
import toast from 'react-hot-toast'

const OCCUPATIONS = [
  'Accountant', 'Doctor', 'Engineer', 'Lawyer', 'Manager', 'Nurse',
  'Sales_person', 'Scientist', 'Software Engineer', 'Student', 'Teacher', 'Other'
]

export default function CompleteProfile() {
  const { user, login, token } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({
    age: '',
    gender: 'Male',
    occupation: 'Student',
  })
  const [loading, setLoading] = useState(false)

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.age || form.age < 10 || form.age > 100) {
      toast.error('Age must be between 10 and 100')
      return
    }

    setLoading(true)
    try {
      const { data } = await API.put('/update-profile', {
        age: parseInt(form.age),
        gender: form.gender,
        occupation: form.occupation,
      })

      login({ ...user, ...data.user }, token)
      toast.success('Profile completed!')
      nav('/behaviour')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
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
            Complete Your Profile
          </h1>
          <p
            className="mc-body text-[14px]"
            style={{ color: 'var(--mc-muted)', maxWidth: 360 }}
          >
            Hi {user?.full_name || 'there'}! Please fill a few details to continue.
          </p>
        </div>

        {/* Form card */}
        <div className="mc-card-form p-6 md:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col">
              <label className="mc-label">Age *</label>
              <input
                type="number"
                min={10}
                max={100}
                required
                value={form.age}
                onChange={(e) => update('age', e.target.value)}
                className="mc-input mc-input-plain"
                placeholder="25"
              />
            </div>

            <div className="flex flex-col">
              <label className="mc-label">Gender *</label>
              <div className="relative">
                <select
                  value={form.gender}
                  onChange={(e) => update('gender', e.target.value)}
                  className="mc-select"
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

            <div className="flex flex-col">
              <label className="mc-label">Occupation *</label>
              <div className="relative">
                <select
                  value={form.occupation}
                  onChange={(e) => update('occupation', e.target.value)}
                  className="mc-select"
                >
                  {OCCUPATIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <ChevronRight
                  size={15}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none"
                  style={{ color: 'var(--mc-muted)' }}
                />
              </div>
            </div>

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
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

