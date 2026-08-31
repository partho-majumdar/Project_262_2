import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import API from '../api'
import toast from 'react-hot-toast'
import StepProgress from '../components/StepProgress'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AlertTriangle, CheckCircle, Info, Zap, User, BarChart2, RefreshCw, Brain } from 'lucide-react'

const BMI_OPTIONS = ['Healthy Weight', 'Overweight', 'Obese']
const GENDER_OPTIONS = ['Male', 'Female']
const OCCUPATION_OPTIONS = [
  'Accountant', 'Doctor', 'Engineer', 'Lawyer', 'Manager', 'Nurse',
  'Sales_person', 'Scientist', 'Software Engineer', 'Student', 'Teacher'
]

const THEMES = {
  Low: { color: 'var(--mc-sage)', bg: 'rgba(127,169,142,0.12)', border: 'rgba(127,169,142,0.35)', icon: CheckCircle, message: 'Excellent wellness profile! Your habits are contributing to a healthy lifestyle.' },
  Medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', icon: Info, message: 'Moderate indicators detected. Small adjustments to your routine could significantly improve your balance.' },
  High: { color: 'var(--mc-coral)', bg: 'rgba(255,122,89,0.12)', border: 'rgba(255,122,89,0.35)', icon: AlertTriangle, message: 'Action required. Your metrics suggest significant physiological or lifestyle stress that needs attention.' }
}

function Slider({ label, name, value, min, max, onChange, colorMap }) {
  const pct = ((value - min) / (max - min)) * 100
  const color = colorMap ? colorMap(pct, value) : 'var(--mc-sage)'
  return (
    <div className="group">
      <div className="flex justify-between mb-3 items-center">
        <label className="mc-caption">{label}</label>
        <div className="mc-slider-value" style={{ color }}>{value}</div>
      </div>
      <div className="relative w-full h-4 flex items-center">
        <div className="mc-slider-track">
          <div className="mc-slider-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}40, ${color})` }} />
        </div>
        <div className="mc-slider-thumb" style={{ left: `calc(${pct}% - 10px)`, borderColor: color, boxShadow: `0 0 12px ${color}50` }} />
        <input type="range" min={min} max={max} value={value} onChange={e => onChange(name, parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
      </div>
    </div>
  )
}

export default function BehaviourTest() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [userInfo, setUserInfo] = useState(null)
  const [form, setForm] = useState({
    bmi_category: 'Healthy Weight', sleep_hours: 7, sleep_quality: 6,
    physical_activity: 50, stress_level: 5, heart_rate: 72,
    daily_steps: 5000, systolic_bp: 120, diastolic_bp: 80
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [showPreloader, setShowPreloader] = useState(true)
  const [manualInfo, setManualInfo] = useState({ full_name: '', age: 25, gender: 'Male', occupation: 'Engineer' })

  useEffect(() => {
    const timer = setTimeout(() => setShowPreloader(false), 1500)
    API.get('/auth/me').then(r => {
      setUserInfo(r.data)
      setManualInfo({ full_name: r.data.full_name, age: r.data.age, gender: r.data.gender, occupation: r.data.occupation })
    }).catch(() => {})
    return () => clearTimeout(timer)
  }, [])

  const updateLabel = (k, v) => setManualInfo(p => ({ ...p, [k]: v }))
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const sleepHoursColor = (_, val) => val >= 7 ? 'var(--mc-sage)' : val >= 5 ? '#F59E0B' : 'var(--mc-coral)'
  const sleepQualityColor = (_, val) => val >= 7 ? 'var(--mc-sage)' : val >= 4 ? '#F59E0B' : 'var(--mc-coral)'
  const stressColor = (_, val) => val <= 3 ? 'var(--mc-sage)' : val <= 7 ? '#F59E0B' : 'var(--mc-coral)'

  const handleSubmit = async () => {
    if (loading) return
    if (form.physical_activity < 1 || form.physical_activity > 100) {
      toast.error('Physical Activity must be between 1 and 100', { id: 'validation-error' })
      return
    }
    const fields = [
      { name: 'heart_rate', label: 'Heart Rate', min: 40, max: 200 },
      { name: 'daily_steps', label: 'Daily Steps', min: 0, max: 50000 },
      { name: 'systolic_bp', label: 'Systolic BP', min: 70, max: 250 },
      { name: 'diastolic_bp', label: 'Diastolic BP', min: 40, max: 150 }
    ]
    for (const f of fields) {
      if (form[f.name] < f.min || form[f.name] > f.max) {
        toast.error(`${f.label} must be between ${f.min} and ${f.max}`, { id: 'validation-error' })
        return
      }
    }
    setLoading(true)
    const toastId = 'prediction-flow'
    toast.loading('Processing Intelligence Analysis...', { id: toastId })
    try {
      const endpoint = manualMode ? '/behaviour/analyse-manual' : '/behaviour/analyse'
      const payload = manualMode ? { ...form, ...manualInfo } : form
      const { data } = await API.post(endpoint, payload)
      setResult(data)
      toast.success('Intelligence Analysis complete!', { id: toastId })
    } catch (err) {
      const msg = err.response?.data?.detail
      const errorMsg = Array.isArray(msg) ? msg.map(m => `${m.loc.join('.')}: ${m.msg}`).join(', ') : (msg || err.message)
      toast.error(errorMsg || 'Analysis failed', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {showPreloader && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="mc-preloader">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-6">
              <div className="mc-preloader-icon">
                <motion.div animate={{ top: ['100%', '-10%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="mc-preloader-scan" />
                <Brain size={32} className="mc-text-coral relative z-10" />
              </div>
              <h2 className="mc-display text-2xl md:text-3xl tracking-[0.15em] mc-text-paper">
                STEP <span className="mc-text-coral">1</span> : BEHAVIOUR TEST
              </h2>
              <div className="mc-preloader-bar">
                <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.4 }} className="mc-preloader-bar-fill" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mc-page">
        <div className="mc-page-bg" />
        <div className="w-full max-w-[1000px] mx-auto z-10 relative">
          <div className="flex items-center justify-center gap-5 mb-10 mt-4 print:hidden">
            <motion.div className="mc-brand-icon" animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}>
              <Brain size={26} className="mc-text-coral" />
            </motion.div>
            <span className="mc-display text-[clamp(28px,5vw,42px)] mc-text-paper">Mindora AI</span>
          </div>

          <div className="print:hidden"><StepProgress current={0} /></div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-8">
            <div className="text-center mb-10 print:hidden">
              <h1 className="mc-display text-[clamp(28px,5vw,40px)] mb-2 mc-text-paper">Behaviour Analysis</h1>
              <p className="mc-body text-[15px] mc-text-muted">Step 1/4 — AI-powered mental health behaviour prediction</p>
            </div>

            {!result ? (
              <div className="mc-card-form p-8 md:p-12 space-y-8 mx-auto w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8" style={{ borderBottom: '1px solid var(--mc-line)' }}>
                  <div>
                    <h2 className="mc-heading text-xl md:text-2xl flex items-center gap-3 mc-text-paper">
                      <div className="mc-section-icon"><User size={18} className="mc-text-coral" /></div>
                      Personal Metrics
                    </h2>
                    <p className="mc-caption mt-2">Precision parameters for deep evaluation</p>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="mc-identity" data-active={manualMode || undefined}>
                    <div>
                      <label className="mc-label">Full Name</label>
                      <input type="text" className="mc-identity-input" value={manualMode ? manualInfo.full_name : (userInfo?.full_name || 'Loading...')} onChange={e => updateLabel('full_name', e.target.value)} readOnly={!manualMode} />
                    </div>
                    <div>
                      <label className="mc-label">Age</label>
                      <input type="number" className="mc-identity-input" value={manualMode ? manualInfo.age : (userInfo?.age || 0)} onChange={e => updateLabel('age', parseInt(e.target.value) || '')} readOnly={!manualMode} />
                    </div>
                    <div>
                      <label className="mc-label">Gender</label>
                      {manualMode ? (
                        <select className="mc-identity-input" value={manualInfo.gender} onChange={e => updateLabel('gender', e.target.value)}>
                          {GENDER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type="text" className="mc-identity-input" value={userInfo?.gender || '...'} readOnly />
                      )}
                    </div>
                    <div>
                      <label className="mc-label">Occupation</label>
                      {manualMode ? (
                        <select className="mc-identity-input" value={manualInfo.occupation} onChange={e => updateLabel('occupation', e.target.value)}>
                          {OCCUPATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type="text" className="mc-identity-input" value={userInfo?.occupation || '...'} readOnly />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="text-sm font-semibold mb-4 flex items-center gap-2 mc-text-paper">
                        <span className="mc-dot mc-dot-coral" /> Weight Profile (BMI)
                      </label>
                      <div className="flex gap-2">
                        {BMI_OPTIONS.map(o => (
                          <button key={o} type="button" onClick={() => update('bmi_category', o)} className="mc-chip" data-active={form.bmi_category === o || undefined}>{o}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-4 flex items-center gap-2 mc-text-paper">
                        <span className="mc-dot mc-dot-sage" /> Physical Activity Level (1–100)
                      </label>
                      <div className="relative">
                        <input type="number" className="mc-input mc-input-plain" value={form.physical_activity} min={1} max={100}
                          onChange={e => update('physical_activity', parseInt(e.target.value) || '')}
                          style={form.physical_activity < 1 || form.physical_activity > 100 ? { borderColor: 'rgba(239,68,68,0.5)' } : undefined} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-widest pointer-events-none mc-text-muted">%</span>
                      </div>
                      {(form.physical_activity < 1 || form.physical_activity > 100) && (
                        <p className="text-xs mt-2 mc-text-coral">⚠ Must be between 1 and 100</p>
                      )}
                    </div>
                  </div>

                  <div className="mc-panel grid grid-cols-1 gap-10">
                    <Slider label="Daily Sleep Duration (Hours)" name="sleep_hours" value={form.sleep_hours} min={1} max={12} onChange={update} colorMap={sleepHoursColor} />
                    <Slider label="Sleep Quality Assessment Index (1–10)" name="sleep_quality" value={form.sleep_quality} min={1} max={10} onChange={update} colorMap={sleepQualityColor} />
                    <Slider label="Perceived Stress Level Magnitude (1–10)" name="stress_level" value={form.stress_level} min={1} max={10} onChange={update} colorMap={stressColor} />
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      ['Heart Rate', 'heart_rate', 40, 200, 'BPM'],
                      ['Daily Steps', 'daily_steps', 0, 50000, 'Steps'],
                      ['Systolic BP', 'systolic_bp', 70, 250, 'mmHg'],
                      ['Diastolic BP', 'diastolic_bp', 40, 150, 'mmHg']
                    ].map(([label, key, min, max, unit]) => (
                      <div key={key} className="mc-vital">
                        <label className="mc-caption block mb-2">{label}</label>
                        <div className="flex items-baseline justify-center gap-1">
                          <input type="number" className="mc-vital-input" value={form[key]} min={min} max={max} onChange={e => update(key, parseInt(e.target.value) || '')} />
                          <span className="text-[10px] font-semibold uppercase mc-text-muted">{unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <motion.button type="button" onClick={handleSubmit} disabled={loading} className="mc-btn-primary w-full py-4 text-sm"
                      whileHover={!loading ? { scale: 1.01 } : {}} whileTap={!loading ? { scale: 0.98 } : {}}>
                      {loading ? (<><div className="mc-spinner" /> Decrypting Neural Patterns...</>) : (<><Brain size={18} /> Run AI Behaviour Intelligence Analysis <Zap size={16} fill="currentColor" /></>)}
                    </motion.button>
                    <div className="flex items-center justify-center gap-3 mt-6 opacity-40">
                      <div className="mc-divider-line" /><p className="mc-caption">Secure AI Core v2.0</p><div className="mc-divider-line" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 print:block" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                {(() => {
                  const theme = THEMES[result?.behaviour_risk] || THEMES.Medium
                  const Icon = theme.icon
                  return (
                    <div className="mc-card-form p-8 print:border print:border-gray-300" style={{ borderColor: theme.border }}>
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-5">
                          <div className="mc-risk-icon" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
                            <Icon size={30} style={{ color: theme.color }} />
                          </div>
                          <div>
                            <h2 className="mc-heading text-2xl md:text-3xl mc-text-paper">
                              Prediction: <span style={{ color: theme.color }}>{result?.behaviour_risk} Risk</span>
                            </h2>
                            <p className="mc-body text-sm mt-1 mc-text-muted">{theme.message}</p>
                          </div>
                        </div>
                        <div className="text-center md:text-right">
                          <div className="text-5xl font-semibold leading-tight" style={{ color: theme.color, fontFamily: 'var(--font-display)' }}>
                            {result?.severity_score}<span className="text-xl font-normal mc-text-muted">/10</span>
                          </div>
                          <div className="mc-caption mt-1">Global Severity</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="mc-subcard space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="mc-caption">AI Confidence</span>
                            <span className="text-sm font-semibold mc-text-sage">{result?.confidence?.toFixed(1)}%</span>
                          </div>
                          <div className="mc-progress-track">
                            <motion.div className="mc-progress-fill" initial={{ width: 0 }} animate={{ width: `${result?.confidence}%` }} transition={{ duration: 1.5 }} />
                          </div>
                        </div>
                        <div className="mc-subcard flex flex-col justify-center gap-4">
                          <div className="flex items-center gap-2">
                            <User size={14} className="mc-text-muted" /><span className="mc-caption">User Profile</span>
                          </div>
                          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                            {[
                              ['Name', (manualMode ? manualInfo.full_name : userInfo?.full_name) || 'Anonymous'],
                              ['Age', manualMode ? manualInfo.age : userInfo?.age],
                              ['Gender', manualMode ? manualInfo.gender : userInfo?.gender],
                              ['Occupation', manualMode ? manualInfo.occupation : userInfo?.occupation]
                            ].map(([l, v]) => (
                              <div key={l}>
                                <p className="mc-caption mb-0.5">{l}</p>
                                <p className="text-sm font-medium truncate mc-text-paper">{v}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 mc-card-form p-6">
                    <h3 className="mc-caption mb-6 flex items-center gap-2 mc-text-paper opacity-85">
                      <BarChart2 size={14} className="mc-text-coral" /> Metric Visualization
                    </h3>
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Sleep Q', val: form.sleep_quality },
                          { name: 'Stress', val: form.stress_level },
                          { name: 'Activity', val: form.physical_activity / 10 },
                          { name: 'Steps', val: form.daily_steps / 1500 }
                        ]} barSize={40}>
                          <XAxis dataKey="name" stroke="var(--mc-muted)" tick={{ fontSize: 10, fill: 'var(--mc-muted)' }} />
                          <YAxis domain={[0, 10]} stroke="var(--mc-muted)" tick={{ fontSize: 10, fill: 'var(--mc-muted)' }} />
                          <Tooltip contentStyle={{ background: 'var(--mc-ink)', border: '1px solid var(--mc-line)', borderRadius: 12, color: 'var(--mc-paper)' }} />
                          <Bar dataKey="val" radius={[6, 6, 0, 0]}>
                            {[0, 1, 2, 3].map(i => <Cell key={i} fill={['var(--mc-sage)', '#F59E0B', 'var(--mc-coral)', '#8B5CF6'][i]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="mc-card-form p-6 space-y-4">
                    <h3 className="mc-caption mb-2 flex items-center gap-2 mc-text-paper opacity-85">
                      <Zap size={14} className="mc-text-coral" /> Key Factors
                    </h3>
                    {[
                      { label: 'Stress', val: form.stress_level, threshold: 7, bad: 'High' },
                      { label: 'Sleep', val: form.sleep_quality, threshold: 4, bad: 'Low', reverse: true },
                      { label: 'Steps', val: form.daily_steps, threshold: 4000, bad: 'Inactive', reverse: true }
                    ].map(f => {
                      const isBad = f.reverse ? f.val <= f.threshold : f.val >= f.threshold
                      return (
                        <div key={f.label} className="mc-factor" data-bad={isBad || undefined}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="mc-caption">{f.label}</span>
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${isBad ? 'mc-text-coral' : 'mc-text-sage'}`}>{isBad ? 'Alert' : 'Good'}</span>
                          </div>
                          <p className={`text-sm font-semibold ${isBad ? 'mc-text-coral' : 'mc-text-paper'}`}>{f.val}{isBad ? ` (${f.bad})` : ''}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="mc-card-form p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="mc-caption mb-4 mc-text-paper">🔍 Prediction Insight</h3>
                      <p className="mc-body text-sm leading-relaxed mc-text-muted">
                        Your pattern indicates a <span className="mc-text-coral font-semibold">{result?.behaviour_risk?.toLowerCase()}</span> risk.
                        {result?.behaviour_risk === 'High' ? ' High stress and poor sleep are the primary triggers. Focus on recovery.'
                          : result?.behaviour_risk === 'Medium' ? ' Metrics are stable but have room for lifestyle optimization.'
                            : ' Habits are well-maintained. Continue your current self-care routine.'}
                      </p>
                    </div>
                    <button type="button" onClick={() => window.print()} className="mc-btn-secondary w-full py-3 mt-6 text-[11px] uppercase tracking-widest print:hidden">
                      Export Analysis Report
                    </button>
                  </div>
                  <div className="mc-card-form p-6">
                    <h3 className="mc-caption mb-4 mc-text-paper">💡 AI Recommendations</h3>
                    <div className="space-y-3">
                      {result?.recommendations?.slice(0, 3).map((r, i) => (
                        <div key={i} className="mc-rec-item"><span className="mc-text-coral">✦</span> {r}</div>
                      ))}
                    </div>
                  </div>
                </div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="pt-4 flex flex-col sm:flex-row gap-4 print:hidden">
                  <button type="button" onClick={() => setResult(null)} className="mc-btn-secondary flex-[0.6] py-3.5 text-sm">
                    <RefreshCw size={15} /> Retake Test
                  </button>
                  <button type="button" onClick={() => nav('/chat')} className="mc-btn-primary flex-[2] py-3.5 text-sm">
                    Continue to Counselling <Zap size={15} fill="currentColor" />
                  </button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  )
}
