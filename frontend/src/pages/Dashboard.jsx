import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { RadialBarChart, RadialBar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import {
  CheckCircle, Circle, Send, Loader2, Sparkles, Activity, MessageSquare,
  Flame, Quote, User, LogOut, Settings, RefreshCw, X, Mail, Phone, MapPin,
  Book, PlayCircle, Smile, Brain
} from 'lucide-react'
import API from '../api'
import toast from 'react-hot-toast'

const getScoreColorClass = (score) => {
  if (score === undefined || score === null) return 'mc-text-muted'
  if (score <= 3) return 'mc-text-sage'
  if (score <= 7) return 'mc-text-warn'
  return 'mc-text-coral'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="mc-subcard p-3 shadow-xl">
        <p className="mc-caption mb-1">{label}</p>
        <p className="mc-text-coral font-semibold text-sm">
          Severity Score: <span className="mc-text-paper text-base">{payload[0].value}</span>
        </p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [suggestions, setSuggestions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPreloader, setShowPreloader] = useState(true)
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hello! I am Dr. MindCare. How are you feeling today?' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '', email: '', age: '', gender: '', occupation: '', phone: '', location: ''
  })

  useEffect(() => {
    Promise.all([
      API.get('/dashboard-data'),
      API.get('/smart-suggestions').catch(() => ({
        data: {
          lifestyle: ['Maintain a regular sleep schedule', 'Stay socially connected'],
          quotes: ['Every day is a new beginning.'],
          daily_tasks: []
        }
      }))
    ]).then(([dashRes, sugRes]) => {
      setData(dashRes.data)
      setSuggestions(sugRes.data)
      setEditForm({
        full_name: dashRes.data.user?.full_name || '',
        email: dashRes.data.user?.email || '',
        age: dashRes.data.user?.age || '',
        gender: dashRes.data.user?.gender || '',
        occupation: dashRes.data.user?.occupation || '',
        phone: dashRes.data.user?.phone || '',
        location: dashRes.data.user?.location || ''
      })
      setLoading(false)
    }).catch(err => {
      console.error(err)
      toast.error('Failed to load dashboard')
      setLoading(false)
    })
    const timer = setTimeout(() => setShowPreloader(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    const userMsg = { role: 'user', text: chatInput }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await API.post('/doctor-chat', { message: userMsg.text })
      setChatMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }])
    } catch (err) {
      console.error(err)
      toast.error('Failed to reach AI Doctor')
    } finally {
      setChatLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('mindcare_token')
    localStorage.removeItem('mindcare_user')
    window.location.href = '/login'
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    try {
      const res = await API.put('/update-profile', {
        full_name: editForm.full_name,
        email: editForm.email,
        age: parseInt(editForm.age) || null,
        gender: editForm.gender,
        occupation: editForm.occupation,
        phone: editForm.phone,
        location: editForm.location
      })
      toast.success('Profile updated!')
      setShowEditModal(false)
      setData(prev => ({ ...prev, user: { ...prev.user, ...res.data.user } }))
    } catch {
      toast.error('Failed to update profile')
    }
  }

  const toggleTask = (taskId) => {
    if (!data?.daily_tasks) return
    const taskToUpdate = data.daily_tasks.find(t => t.id === taskId)
    if (!taskToUpdate) return
    const updatedCompleted = !taskToUpdate.completed
    const snapshot = data
    setData({
      ...data,
      daily_tasks: data.daily_tasks.map(t =>
        t.id === taskId ? { ...t, completed: updatedCompleted } : t
      )
    })
    API.post('/toggle-task', { task_id: taskId, completed: updatedCompleted }).catch(() => {
      toast.error('Failed to update task')
      setData(snapshot)
    })
  }

  if (loading) {
    return (
      <div className="mc-preloader" style={{ pointerEvents: 'auto' }}>
        <div className="flex flex-col items-center gap-6">
          <div className="mc-preloader-icon">
            <Loader2 size={32} className="mc-text-coral animate-spin relative z-10" />
          </div>
          <h2 className="mc-display text-2xl tracking-[0.15em] mc-text-paper">
            LOADING <span className="mc-text-coral">DATA</span>
          </h2>
        </div>
      </div>
    )
  }

  if (!data) return null

  const score = data.severity?.final_severity || 0
  let color = 'var(--mc-sage)'
  if (score >= 4 && score <= 7) color = '#F59E0B'
  if (score > 7) color = 'var(--mc-coral)'
  const radialData = [{ name: 'Severity', value: score, fill: color }]
  const breakdown = {
    behaviour: data.severity?.behaviour_score || 0,
    chat: data.severity?.chat_score || 0,
    face: data.severity?.face_score || 0,
    voice: data.severity?.voice_score || 0
  }

  const getWeekDays = () => {
    const days = []
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() + diffToMonday)
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push({
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        dayNumber: date.getDate(),
        isToday: date.toDateString() === today.toDateString()
      })
    }
    return days
  }
  const weekDays = getWeekDays()
  const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <>
      {showPreloader && (
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.8, delay: 0.7 }} className="mc-preloader">
          <div className="flex flex-col items-center gap-6">
            <div className="mc-preloader-icon">
              <motion.div animate={{ top: ['100%', '-10%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="mc-preloader-scan" />
              <Brain size={32} className="mc-text-coral relative z-10" />
            </div>
            <h2 className="mc-display text-2xl tracking-[0.15em] mc-text-paper">
              DASHBOARD
            </h2>
            <div className="mc-preloader-bar">
              <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.4 }} className="mc-preloader-bar-fill" />
            </div>
          </div>
        </motion.div>
      )}

      <div className="mc-page" style={{ alignItems: 'stretch', justifyContent: 'flex-start', paddingTop: 0, paddingBottom: 0 }}>
        <div className="mc-page-bg" />

        <div className="mc-dash-shell">
          {/* Brand */}
          <div
            onClick={() => { window.location.href = '/' }}
            className="flex items-center justify-center gap-5 mb-10 cursor-pointer hover:opacity-90 transition-opacity print:hidden"
            title="Go to Home"
          >
            <motion.div className="mc-brand-icon" animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}>
              <Brain size={26} className="mc-text-coral" />
            </motion.div>
            <span className="mc-display text-[clamp(28px,5vw,42px)] mc-text-paper">MindCare AI</span>
          </div>

          {/* Welcome + actions */}
          <div className="flex justify-between items-center mb-10 relative gap-4 flex-wrap">
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="mc-display text-3xl md:text-4xl mc-text-paper">
                  Welcome back, {data.user?.full_name?.split(' ')[0] || 'Friend'}
                </h1>
                <span className="mc-live-pill">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--mc-sage)] animate-pulse" />
                  Live
                </span>
              </div>
              <p className="mc-body text-base mc-text-muted">Your personalized mental wellness overview — updated in real time.</p>
            </motion.div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { window.location.href = '/behaviour' }}
                className="mc-btn-primary hidden sm:inline-flex px-5 py-2.5 text-sm"
              >
                <RefreshCw size={16} /> New Assessment
              </button>

              <div className="relative">
                <button type="button" onClick={() => setShowProfileMenu(!showProfileMenu)} className="mc-profile-btn">
                  <User className="mc-text-coral" size={20} />
                </button>
                {showProfileMenu && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mc-profile-menu">
                    <div className="p-4 border-b border-[var(--mc-line)]" style={{ background: 'rgba(237,233,226,0.04)' }}>
                      <h3 className="font-semibold mc-text-paper truncate">{data.user?.full_name}</h3>
                      <p className="text-sm mc-text-muted">{data.user?.age} yrs · {data.user?.occupation || 'No occupation'}</p>
                    </div>
                    <div className="p-3 border-b border-[var(--mc-line)] space-y-2">
                      {data.user?.email && (
                        <div className="flex items-center gap-2 text-xs mc-text-muted">
                          <Mail size={14} className="mc-text-coral shrink-0" /><span className="truncate">{data.user.email}</span>
                        </div>
                      )}
                      {data.user?.phone && (
                        <div className="flex items-center gap-2 text-xs mc-text-muted">
                          <Phone size={14} className="mc-text-coral shrink-0" /><span>{data.user.phone}</span>
                        </div>
                      )}
                      {data.user?.gender && (
                        <div className="flex items-center gap-2 text-xs mc-text-muted">
                          <User size={14} className="mc-text-coral shrink-0" /><span>{data.user.gender}</span>
                        </div>
                      )}
                      {data.user?.location && (
                        <div className="flex items-center gap-2 text-xs mc-text-muted">
                          <MapPin size={14} className="mc-text-coral shrink-0" /><span className="truncate">{data.user.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <button type="button" onClick={() => { setShowProfileMenu(false); setShowEditModal(true) }} className="w-full flex items-center gap-3 px-3 py-2 text-sm mc-text-muted hover:bg-white/5 rounded-lg">
                        <Settings size={16} /> Edit Profile
                      </button>
                      <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg mt-1">
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-start">
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center gap-3">
                <span className="mc-section-label">Assessment Summary</span>
                <div className="mc-section-rule" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Severity meter */}
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mc-card-form p-6 flex flex-col items-center justify-center relative">
                  <h2 className="mc-heading text-lg mc-text-muted absolute top-6 left-6">Current Status</h2>
                  <div className="absolute top-6 right-6">
                    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ color, border: `1px solid ${color}40`, background: 'rgba(0,0,0,0.35)' }}>
                      <span className="inline-block w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: color }} />
                      {data.severity?.risk_level || 'Moderate'} Risk
                    </span>
                  </div>
                  <div className="relative mt-10 w-56 h-56 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={15} data={radialData} startAngle={180} endAngle={0}>
                        <RadialBar minAngle={15} cornerRadius={10} background={{ fill: 'rgba(237,233,226,0.08)' }} clockWise dataKey="value" />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center -translate-y-4">
                      <span className="mc-display text-5xl mc-text-paper">{score}</span>
                      <span className="mc-caption mt-1">/ 10</span>
                    </div>
                  </div>
                  <div className="mt-6 w-full p-4 rounded-2xl mc-subcard flex items-start gap-3">
                    <Sparkles size={18} className="mc-text-coral flex-shrink-0 mt-0.5" />
                    <p className="text-sm mc-text-muted leading-relaxed">
                      Based on your score, a 10-minute mindfulness session is recommended today to maintain balance.
                    </p>
                  </div>
                </motion.div>

                {/* Breakdown */}
                <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Behaviour', icon: <Activity size={16} />, value: breakdown.behaviour },
                    { label: 'Chat', icon: <MessageSquare size={16} />, value: breakdown.chat },
                    { label: 'Facial', icon: <span className="text-sm">😐</span>, value: breakdown.face },
                    { label: 'Voice', icon: <span className="text-sm">🎙️</span>, value: breakdown.voice }
                  ].map(({ label, icon, value }) => (
                    <div key={label} className="mc-subcard p-4 flex flex-col justify-between">
                      <div className="flex items-center gap-2 mc-text-coral mb-3">
                        {icon}
                        <span className="mc-caption">{label}</span>
                      </div>
                      <div className="flex items-end gap-1">
                        <span className={`text-3xl font-semibold ${getScoreColorClass(value)}`}>{value}</span>
                        <span className="text-sm mc-text-muted mb-0.5">/10</span>
                      </div>
                    </div>
                  ))}

                  <div className="col-span-2 mc-subcard p-4 flex items-start gap-3 relative overflow-hidden" style={{ borderColor: 'rgba(239,68,68,0.25)' }}>
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-transparent" />
                    <Flame size={18} className="text-red-400 flex-shrink-0 ml-2 mt-0.5" />
                    <div className="w-full">
                      <span className="mc-caption block mb-2" style={{ color: 'rgba(254,202,202,0.8)' }}>Known Triggers</span>
                      <div className="flex flex-wrap gap-2">
                        {data.chat?.triggers ? (
                          String(data.chat.triggers).replace(/([A-Z])/g, ' $1').trim().split(',').map((t, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-full text-xs capitalize" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fecaca' }}>
                              {t.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm mc-text-muted">None identified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Trends */}
              {data.historical_trends?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mc-card-form p-6 md:p-8 relative">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="mc-heading text-lg flex items-center gap-2 mc-text-paper">
                      <Activity className="mc-text-coral" size={18} /> Progress Over Time
                    </h3>
                    <span className="mc-caption">Assessment History</span>
                  </div>
                  {data.historical_trends.length === 1 && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none mb-10">
                      <div className="mc-subcard px-6 py-3 text-sm font-semibold mc-text-coral">
                        Take more assessments to unlock your progress trend line!
                      </div>
                    </div>
                  )}
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.historical_trends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff7a59" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#ff7a59" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--mc-line)" vertical={false} />
                        <XAxis dataKey="date" stroke="var(--mc-line)" tick={{ fill: 'var(--mc-muted)', fontSize: 12 }} tickMargin={10} axisLine={false} />
                        <YAxis domain={[0, 10]} stroke="var(--mc-line)" tick={{ fill: 'var(--mc-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--mc-line)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area type="monotone" dataKey="score" name="Severity" stroke="var(--mc-coral)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)"
                          activeDot={{ r: 7, fill: 'var(--mc-ink)', stroke: 'var(--mc-coral)', strokeWidth: 3 }}
                          dot={{ fill: 'var(--mc-ink)', stroke: 'var(--mc-coral)', strokeWidth: 2, r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}

              <div className="flex items-center gap-3 mt-2">
                <span className="mc-section-label">Wellness Tools</span>
                <div className="mc-section-rule" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Suggestions + mood */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
                  <h3 className="mc-heading text-lg flex items-center gap-2 mc-text-paper">
                    <Sparkles className="mc-text-coral" size={18} /> Smart Suggestions
                  </h3>
                  <div className="mc-card-form p-6 space-y-3 min-h-[150px] relative">
                    {!suggestions ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center mc-text-muted">
                        <Loader2 className="animate-spin mb-2 mc-text-coral" size={24} />
                        <span className="mc-caption">AI Generating Insights...</span>
                      </div>
                    ) : (
                      <>
                        {suggestions.lifestyle?.map(sug => (
                          <div key={sug} className="flex gap-3 text-sm mc-subcard p-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--mc-coral)] mt-1.5 flex-shrink-0" />
                            <span className="mc-text-muted leading-relaxed">{sug}</span>
                          </div>
                        ))}
                        {(suggestions.quotes?.[0] || suggestions.quote) && (
                          <div className="mt-4 pt-4 border-t border-[var(--mc-line)] flex gap-3 text-sm italic mc-text-muted">
                            <Quote size={18} className="flex-shrink-0 mc-text-coral opacity-60" />
                            <span>"{suggestions.quotes?.[0] || suggestions.quote}"</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <h3 className="mc-heading text-lg flex items-center gap-2 mc-text-paper mt-4">
                    <Smile className="mc-text-coral" size={18} /> Quick Check-in
                  </h3>
                  <div className="mc-card-form p-6">
                    <p className="mc-caption mb-4">How are you feeling right now?</p>
                    <div className="flex justify-between items-center">
                      {['😫', '😟', '😐', '🙂', '🤩'].map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => toast.success('Mood logged successfully!')}
                          className="w-12 h-12 flex items-center justify-center text-2xl rounded-full border border-[var(--mc-line)] bg-[rgba(237,233,226,0.04)] hover:border-[rgba(255,122,89,0.4)] hover:scale-110 transition-all"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Tasks */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="mc-heading text-xl flex items-center gap-2 mc-text-paper">
                      <CheckCircle className="mc-text-coral" size={20} /> Daily Tasks
                    </h3>
                    <span className="mc-caption">{currentMonthYear}</span>
                  </div>

                  <div className="mc-card-form p-4">
                    <div className="grid grid-cols-7 gap-1 md:gap-2">
                      {weekDays.map((d, idx) => (
                        <div key={idx} className="mc-day-cell" data-today={d.isToday || undefined}>
                          <span className="text-[10px] font-bold tracking-widest opacity-70">{d.dayName}</span>
                          <span className="text-xl font-semibold mt-1">{d.dayNumber}</span>
                          {d.isToday && <span className="w-1.5 h-1.5 rounded-full bg-[var(--mc-ink)] mt-1.5" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mc-card-form p-6 md:p-8">
                    {data.daily_tasks?.length > 0 && (() => {
                      const done = data.daily_tasks.filter(t => t.completed).length
                      const pct = Math.round((done / data.daily_tasks.length) * 100)
                      return (
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs mc-text-muted">{done} of {data.daily_tasks.length} completed</span>
                            <span className="text-xs font-bold mc-text-coral">{pct}%</span>
                          </div>
                          <div className="mc-progress-track">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} className="mc-progress-fill" />
                          </div>
                        </div>
                      )
                    })()}

                    <div className="relative">
                      <div className="absolute left-[19px] top-5 bottom-5 w-0.5" style={{ background: 'linear-gradient(to bottom, rgba(255,122,89,0.35), transparent)' }} />
                      <div className="space-y-3">
                        {data.daily_tasks?.map(task => (
                          <motion.div key={task.id} layout className="flex items-start gap-4">
                            <div className="relative flex-shrink-0 z-10 mt-3">
                              <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => toggleTask(task.id)} className="mc-task-node" data-done={task.completed || undefined}>
                                {task.completed ? <CheckCircle size={18} className="mc-text-sage" /> : <Circle size={18} className="mc-text-muted" />}
                              </motion.button>
                            </div>
                            <motion.div onClick={() => toggleTask(task.id)} whileHover={{ x: 3 }} className="mc-task-card" data-done={task.completed || undefined}>
                              <div className="flex items-center justify-between gap-3">
                                <span className={`text-sm leading-snug ${task.completed ? 'mc-text-muted line-through' : 'mc-text-paper'}`}>
                                  {task.task}
                                </span>
                                {task.completed && (
                                  <span className="text-[10px] font-bold mc-text-sage uppercase tracking-wider flex-shrink-0 px-2 py-0.5 rounded-full" style={{ background: 'rgba(127,169,142,0.12)', border: '1px solid rgba(127,169,142,0.25)' }}>
                                    Done ✓
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right column */}
            <div className="sticky top-28 z-20 flex flex-col gap-5">
              <div className="flex items-center gap-3 mb-1">
                <span className="mc-section-label">AI Support</span>
                <div className="mc-section-rule" />
              </div>

              <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="mc-card-form mc-chat-panel relative">
                <div className="p-5 border-b border-[var(--mc-line)] flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border border-[rgba(255,122,89,0.25)]" style={{ background: 'rgba(255,122,89,0.1)' }}>👨‍⚕️</div>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[var(--mc-sage)] border-[3px] border-[var(--mc-ink)] rounded-full" />
                  </div>
                  <div>
                    <h3 className="mc-heading text-lg mc-text-paper">Dr. MindCare</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--mc-sage)] animate-pulse" />
                      <span className="mc-caption mc-text-sage">AI Therapist Online</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                      <div className={msg.role === 'assistant' ? 'mc-chat-bubble-ai' : 'mc-chat-bubble-user'}>{msg.text}</div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="mc-chat-bubble-ai">
                        <div className="flex gap-2">
                          {[0, 150, 300].map(d => (
                            <div key={d} className="w-2 h-2 rounded-full bg-[var(--mc-coral)] opacity-50 animate-pulse" style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-[var(--mc-line)]">
                  <form onSubmit={handleSendMessage} className="relative flex items-center">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Type your message..."
                      disabled={chatLoading}
                      className="mc-input mc-input-plain pr-14"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || chatLoading}
                      className="absolute right-2 p-2.5 mc-btn-primary disabled:opacity-50"
                      style={{ borderRadius: 12, width: 42, height: 42 }}
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mc-card-form p-4 flex gap-3">
                <a href="tel:18005990019" className="flex-1 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <Phone size={16} /> Call Helpline
                </a>
                <button type="button" onClick={() => toast.success('Journal module opening soon...')} className="flex-1 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 mc-text-coral" style={{ background: 'rgba(255,122,89,0.1)', border: '1px solid rgba(255,122,89,0.25)' }}>
                  <Book size={16} /> Log Journal
                </button>
              </motion.div>

              <div className="mc-card-form p-6 text-center relative overflow-hidden">
                <span className="mc-section-label mb-2 block">Mindfulness</span>
                <h4 className="mc-heading mc-text-paper text-base mb-1">1-Minute Reset</h4>
                <p className="text-xs mc-text-muted mb-5">Sync your breathing to the circle</p>
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-[rgba(255,122,89,0.3)] rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
                  <div className="relative w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--mc-coral), var(--mc-sage))', boxShadow: '0 0 20px rgba(255,122,89,0.35)' }}>
                    <span className="text-[10px] font-bold text-[var(--mc-ink)] uppercase tracking-widest">Breathe</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="mc-heading text-base flex items-center gap-2 mc-text-paper">
                    <PlayCircle className="mc-text-coral" size={16} /> Recommended
                  </h3>
                  <div className="mc-section-rule" />
                </div>
                {[
                  ['inpok4MKVLM', '5-Minute Meditation You Can Do Anywhere'],
                  ['O-6f5wQXSu8', '10-Minute Relief from Stress & Anxiety'],
                  ['8TuRYHQTrZA', '15-Minute Relaxing Yoga for Stress'],
                  ['1ZYbU82GVz4', 'Deep Sleep & Relaxation Music']
                ].map(([id, title]) => (
                  <a key={id} href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer" className="mc-video-row group">
                    <div className="w-28 h-16 rounded-xl relative flex items-center justify-center overflow-hidden border border-[var(--mc-line)] flex-shrink-0">
                      <img src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-black/30" />
                      <PlayCircle size={22} className="text-white relative z-10" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mc-text-paper group-hover:text-[var(--mc-coral)] transition-colors line-clamp-1">{title}</h4>
                      <p className="text-xs mc-text-coral opacity-80 mt-1">{data.severity?.risk_level || 'Moderate'} Risk Suggestion</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Edit modal */}
        {showEditModal && (
          <div className="mc-modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mc-modal">
              <button type="button" onClick={() => setShowEditModal(false)} className="absolute top-5 right-5 mc-text-muted hover:text-[var(--mc-paper)]">
                <X size={22} />
              </button>
              <h2 className="mc-display text-2xl mc-text-paper mb-6">Edit Profile</h2>
              <form onSubmit={handleEditSave} className="space-y-4">
                <div>
                  <label className="mc-label" htmlFor="edit-fullname">Full Name</label>
                  <input id="edit-fullname" type="text" className="mc-input mc-input-plain" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} required />
                </div>
                <div>
                  <label className="mc-label" htmlFor="edit-email">Email</label>
                  <input id="edit-email" type="email" className="mc-input mc-input-plain" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mc-label" htmlFor="edit-age">Age</label>
                    <input id="edit-age" type="number" className="mc-input mc-input-plain" value={editForm.age} onChange={e => setEditForm({ ...editForm, age: e.target.value })} required />
                  </div>
                  <div>
                    <label className="mc-label" htmlFor="edit-gender">Gender</label>
                    <select id="edit-gender" className="mc-select" value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} required>
                      <option value="" disabled>Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mc-label" htmlFor="edit-occupation">Occupation</label>
                  <select id="edit-occupation" className="mc-select" value={editForm.occupation} onChange={e => setEditForm({ ...editForm, occupation: e.target.value })} required>
                    <option value="" disabled>Select Occupation</option>
                    {['Accountant', 'Doctor', 'Engineer', 'Lawyer', 'Manager', 'Nurse', 'Sales_person', 'Scientist', 'Software Engineer', 'Student', 'Teacher', 'Other'].map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mc-label" htmlFor="edit-phone">Phone</label>
                    <input id="edit-phone" type="text" className="mc-input mc-input-plain" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="mc-label" htmlFor="edit-location">Location</label>
                    <input id="edit-location" type="text" className="mc-input mc-input-plain" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
                  </div>
                </div>
                <div className="pt-3 flex gap-3">
                  <button type="button" onClick={() => setShowEditModal(false)} className="mc-btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
                  <button type="submit" className="mc-btn-primary flex-1 py-2.5 text-sm">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </>
  )
}
