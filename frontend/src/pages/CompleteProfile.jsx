import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Brain } from 'lucide-react'
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

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

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
    <div className="relative min-h-screen bg-[#05110d] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl border border-emerald-500/30 flex items-center justify-center bg-emerald-500/10">
            <Brain className="text-emerald-400" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-slate-400 text-sm">
            Hi {user?.full_name || 'there'}! Please fill a few details to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Age *</label>
            <input
              type="number"
              min={10}
              max={100}
              required
              value={form.age}
              onChange={e => update('age', e.target.value)}
              className="mt-2 w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              placeholder="25"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Gender *</label>
            <select
              value={form.gender}
              onChange={e => update('gender', e.target.value)}
              className="mt-2 w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            >
              <option className="bg-[#05110d]">Male</option>
              <option className="bg-[#05110d]">Female</option>
              <option className="bg-[#05110d]">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Occupation *</label>
            <select
              value={form.occupation}
              onChange={e => update('occupation', e.target.value)}
              className="mt-2 w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            >
              {OCCUPATIONS.map(o => (
                <option key={o} className="bg-[#05110d]" value={o}>{o}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-black bg-gradient-to-r from-[#00ff88] to-[#00cc6a] hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}