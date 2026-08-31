import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, PhoneCall, CheckCircle, ChevronDown, Sparkles, Brain } from 'lucide-react'
import API from '../api'
import toast from 'react-hot-toast'

export default function FinalSeverity() {
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [loadStage, setLoadStage] = useState(1)
  const [apiDataReady, setApiDataReady] = useState(false)
  const [emergency, setEmergency] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [counter, setCounter] = useState(0)
  const [expandedCard, setExpandedCard] = useState(null)

  useEffect(() => {
    const timer1 = setTimeout(() => setLoadStage(2), 2500)
    const timer2 = setTimeout(() => setLoadStage(3), 4500)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  useEffect(() => {
    API.get('/final-severity')
      .then((r) => {
        setData(r.data)
        setEmergency(r.data.emergency)
        setApiDataReady(true)

        let n = 0
        const iv = setInterval(() => {
          n = Math.min(n + 0.5, r.data.final_severity)
          setCounter(Math.round(n))
          if (n >= r.data.final_severity) clearInterval(iv)
        }, 80)
      })
      .catch(() => {
        setApiDataReady(true)
        toast.error('Failed to calculate severity')
      })
  }, [])

  const RISK_COLOR = { Low: 'var(--mc-sage)', Moderate: '#F59E0B', High: 'var(--mc-coral)' }
  const color = data ? RISK_COLOR[data.risk_level] || 'var(--mc-coral)' : 'var(--mc-coral)'

  if (loadStage === 1) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="success"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'var(--mc-ink)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex items-center justify-center gap-4 mb-2">
              <motion.div
                className="flex items-center justify-center w-14 h-14 rounded-2xl"
                style={{
                  background: 'rgba(255,122,89,0.14)',
                  border: '1px solid rgba(255,122,89,0.25)',
                }}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Brain size={26} style={{ color: 'var(--mc-coral)' }} />
              </motion.div>
              <span className="mc-display text-[clamp(28px,5vw,36px)]" style={{ color: 'var(--mc-paper)' }}>
                MindCare AI
              </span>
            </div>
            <p className="mc-body text-sm" style={{ color: 'var(--mc-muted)' }}>
              Analyzing multimodal data...
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  if (loadStage === 2 || !apiDataReady) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="calculating"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'var(--mc-ink)' }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center flex flex-col items-center gap-6"
          >
            <div className="mc-preloader-icon">
              <div
                className="w-10 h-10 rounded-full border-2 animate-spin"
                style={{
                  borderColor: 'rgba(255,122,89,0.2)',
                  borderTopColor: 'var(--mc-coral)',
                }}
              />
            </div>
            <p className="mc-caption tracking-[0.15em]" style={{ color: 'var(--mc-muted)' }}>
              Processing Multimodal Severity Score...
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: 'var(--mc-ink)', color: 'var(--mc-paper)' }}>
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

      <div className="relative z-10 flex flex-col items-center justify-start pt-12 pb-24 px-4 min-h-screen">
        <div className="w-full max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-center gap-5 mb-6 mt-4 print:hidden w-full">
              <motion.div
                className="flex items-center justify-center w-14 h-14 rounded-2xl shrink-0"
                style={{
                  background: 'rgba(255,122,89,0.14)',
                  border: '1px solid rgba(255,122,89,0.25)',
                }}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Brain size={26} style={{ color: 'var(--mc-coral)' }} />
              </motion.div>
              <span className="mc-display text-[clamp(28px,5vw,42px)]" style={{ color: 'var(--mc-paper)' }}>
                MindCare AI
              </span>
            </div>

            <div className="text-center mb-10">
              <h1 className="mc-display text-[clamp(28px,5vw,42px)] mb-2" style={{ color: 'var(--mc-paper)' }}>
                Final Assessment
              </h1>
              <p className="mc-body text-sm md:text-base" style={{ color: 'var(--mc-muted)' }}>
                Combined multimodal severity score analyzed.
              </p>
            </div>
          </motion.div>

          {data && (
            <div className="space-y-6">
              {data.user_profile && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="mc-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex flex-col">
                    <span className="mc-heading text-xl" style={{ color: 'var(--mc-paper)' }}>
                      {data.user_profile.name}
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="mc-caption px-2 py-0.5 rounded-md"
                        style={{
                          background: 'rgba(237,233,226,0.05)',
                          border: '1px solid var(--mc-line)',
                        }}
                      >
                        {data.user_profile.age} YRS
                      </span>
                      <span
                        className="mc-caption px-2 py-0.5 rounded-md"
                        style={{
                          background: 'rgba(237,233,226,0.05)',
                          border: '1px solid var(--mc-line)',
                        }}
                      >
                        {data.user_profile.gender}
                      </span>
                    </div>
                  </div>
                  <div className="md:text-right">
                    <span
                      className="mc-caption px-3 py-1 rounded-full"
                      style={{
                        background: 'rgba(127,169,142,0.1)',
                        color: 'var(--mc-sage)',
                        border: '1px solid rgba(127,169,142,0.25)',
                      }}
                    >
                      {data.user_profile.occupation}
                    </span>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="mc-card p-8 md:p-12 text-center relative overflow-hidden"
              >
                <div className="relative inline-block w-56 h-56 mb-8 mt-4">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="rgba(237,233,226,0.08)"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={color}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(data.final_severity / 10) * 314} 314`}
                      initial={{ strokeDasharray: '0 314' }}
                      animate={{ strokeDasharray: `${(data.final_severity / 10) * 314} 314` }}
                      transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="mc-display text-6xl tracking-tighter" style={{ color }}>
                      {counter}
                    </span>
                    <span className="mc-caption mt-1" style={{ color: 'var(--mc-muted)' }}>
                      / 10
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-6">
                  <div
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-semibold tracking-widest uppercase"
                    style={{
                      border: `1px solid ${color}40`,
                      color,
                      background: 'rgba(16,19,26,0.5)',
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full mr-3 animate-pulse"
                      style={{ backgroundColor: color }}
                    />
                    {data.risk_level} Risk Detected
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="mc-card p-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Sparkles size={100} style={{ color: 'var(--mc-coral)' }} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        background: 'rgba(255,122,89,0.1)',
                        border: '1px solid rgba(255,122,89,0.2)',
                      }}
                    >
                      <Sparkles size={20} style={{ color: 'var(--mc-coral)' }} />
                    </div>
                    <h3 className="mc-heading text-xl" style={{ color: 'var(--mc-paper)' }}>
                      AI Counsellor Insight
                    </h3>
                  </div>

                  {data.summary_note && (
                    <div
                      className="mb-8 p-6 rounded-r-2xl relative overflow-hidden"
                      style={{
                        background: 'rgba(237,233,226,0.03)',
                        borderLeft: '4px solid var(--mc-coral)',
                      }}
                    >
                      <p className="mc-body text-lg italic leading-relaxed" style={{ color: 'var(--mc-muted)' }}>
                        &ldquo;{data.summary_note}&rdquo;
                      </p>
                    </div>
                  )}

                  {data.detailed_records && data.detailed_records.recommendations && (
                    <div className="space-y-4">
                      <h4 className="mc-caption mb-4" style={{ color: 'var(--mc-coral)' }}>
                        Recommended Actions
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(Array.isArray(data.detailed_records.recommendations)
                          ? data.detailed_records.recommendations
                          : typeof data.detailed_records.recommendations === 'string'
                            ? (() => {
                                try {
                                  return JSON.parse(data.detailed_records.recommendations)
                                } catch {
                                  return data.detailed_records.recommendations
                                    .split(/[.-]\s+/)
                                    .filter(Boolean)
                                }
                              })()
                            : []
                        ).map((rec, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-4 rounded-xl"
                            style={{
                              background: 'rgba(237,233,226,0.03)',
                              border: '1px solid var(--mc-line)',
                            }}
                          >
                            <CheckCircle
                              size={18}
                              className="mt-0.5 flex-shrink-0"
                              style={{ color: 'var(--mc-sage)' }}
                            />
                            <span className="mc-body text-sm leading-relaxed" style={{ color: 'var(--mc-muted)' }}>
                              {rec}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 gap-4"
              >
                {[
                  ['🧠 Behaviour Model', data.behaviour_score, 'var(--mc-coral)', 'behaviour', data.detailed_records?.behaviour],
                  ['💬 Conversational AI', data.chat_score, 'var(--mc-sage)', 'chat', data.detailed_records?.chat],
                  ['😐 Facial Emotion', data.face_score, '#A78BFA', 'face', data.detailed_records?.face],
                  ['🎙️ Voice Analysis', data.voice_score, '#F59E0B', 'voice', data.detailed_records?.voice],
                ].map(([label, score, barColor, key, details]) => {
                  const isExpanded = expandedCard === key
                  return (
                    <div
                      key={label}
                      className="mc-card overflow-hidden transition-all duration-300"
                      style={{
                        borderColor: isExpanded ? 'rgba(255,122,89,0.22)' : undefined,
                      }}
                    >
                      <div
                        className="p-5 cursor-pointer flex items-center justify-between"
                        onClick={() => setExpandedCard(isExpanded ? null : key)}
                      >
                        <div className="flex-1 mr-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold tracking-wide" style={{ color: 'var(--mc-paper)' }}>
                              {label}
                            </span>
                            <span
                              className="text-xs px-2.5 py-1 rounded-md"
                              style={{
                                background: 'rgba(237,233,226,0.05)',
                                border: '1px solid var(--mc-line)',
                                color: 'var(--mc-paper)',
                              }}
                            >
                              {score}/10
                            </span>
                          </div>
                          <div
                            className="h-1.5 rounded-full overflow-hidden w-full relative"
                            style={{ background: 'rgba(237,233,226,0.08)' }}
                          >
                            <motion.div
                              className="absolute top-0 left-0 h-full rounded-full"
                              style={{ background: barColor }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(score / 10) * 100}%` }}
                              transition={{ duration: 1.5, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                        <div
                          className={`p-2 rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                          style={{ background: 'rgba(237,233,226,0.05)' }}
                        >
                          <ChevronDown size={20} style={{ color: 'var(--mc-muted)' }} />
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && details && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                            style={{
                              borderTop: '1px solid var(--mc-line)',
                              background: 'rgba(0,0,0,0.15)',
                            }}
                          >
                            {Object.keys(details || {}).length > 0 ? (
                              <div className="p-6 text-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6">
                                {Object.entries(details)
                                  .filter(([k]) => k !== 'recommendations' && k !== 'notes')
                                  .map(([k, v]) => {
                                    let displayValue = v
                                    if (Array.isArray(v)) {
                                      displayValue = v.join(', ')
                                    } else if (typeof v === 'string' && (v.startsWith('{') || v.startsWith('['))) {
                                      try {
                                        const parsed = JSON.parse(v)
                                        if (Array.isArray(parsed)) displayValue = parsed.join(', ')
                                        else if (typeof parsed === 'object')
                                          displayValue = Object.entries(parsed)
                                            .map(([pk, pv]) => `${pk}: ${pv}`)
                                            .join(' | ')
                                      } catch {}
                                    } else if (typeof v === 'object' && v !== null) {
                                      displayValue = Object.entries(v)
                                        .map(([pk, pv]) => `${pk}: ${pv}`)
                                        .join(' | ')
                                    }

                                    const colSpan =
                                      String(displayValue).length > 40
                                        ? 'col-span-1 md:col-span-2 lg:col-span-3'
                                        : ''

                                    return (
                                      <div key={k} className={`flex flex-col ${colSpan}`}>
                                        <span className="mc-caption mb-1.5">
                                          {k.replace(/_/g, ' ')}
                                        </span>
                                        {String(displayValue).length > 60 ? (
                                          <span
                                            className="block p-3 rounded-lg text-sm leading-relaxed"
                                            style={{
                                              background: 'rgba(0,0,0,0.25)',
                                              border: '1px solid var(--mc-line)',
                                              color: 'var(--mc-muted)',
                                            }}
                                          >
                                            {displayValue}
                                          </span>
                                        ) : (
                                          <span
                                            className="font-semibold capitalize tracking-wide"
                                            style={{ color: 'var(--mc-paper)' }}
                                          >
                                            {String(displayValue)}
                                          </span>
                                        )}
                                      </div>
                                    )
                                  })}
                              </div>
                            ) : (
                              <div className="p-6 text-sm italic text-center" style={{ color: 'var(--mc-muted)' }}>
                                Detailed telemetry for this module is currently unavailable.
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </motion.div>

              <AnimatePresence>
                {emergency && (
                  <motion.div
                    className="rounded-2xl p-6"
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.35)',
                    }}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className="flex items-center gap-4 mb-5">
                      <div
                        className="p-3 rounded-xl"
                        style={{
                          background: 'rgba(239,68,68,0.15)',
                          border: '1px solid rgba(239,68,68,0.3)',
                        }}
                      >
                        <AlertTriangle size={24} className="text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-red-400 font-bold text-lg tracking-wide">
                          Immediate Support Recommended
                        </h3>
                        <p className="text-red-200/70 text-sm">
                          High risk indicators detected. Please reach out for professional help.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                      <a
                        href="tel:18005990019"
                        className="flex items-center gap-3 p-3 rounded-xl text-sm transition-all"
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          color: 'var(--mc-paper)',
                        }}
                      >
                        <PhoneCall size={16} className="text-red-400 flex-shrink-0" />
                        <span>
                          KIRAN <strong className="block text-red-400">1800-599-0019</strong>
                        </span>
                      </a>
                      <a
                        href="tel:9152987821"
                        className="flex items-center gap-3 p-3 rounded-xl text-sm transition-all"
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          color: 'var(--mc-paper)',
                        }}
                      >
                        <PhoneCall size={16} className="text-red-400 flex-shrink-0" />
                        <span>
                          iCALL <strong className="block text-red-400">9152987821</strong>
                        </span>
                      </a>
                      <a
                        href="tel:112"
                        className="flex items-center gap-3 p-3 rounded-xl text-sm transition-all"
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          color: 'var(--mc-paper)',
                        }}
                      >
                        <PhoneCall size={16} className="text-red-400 flex-shrink-0" />
                        <span>
                          Emergency <strong className="block text-red-400">112</strong>
                        </span>
                      </a>
                    </div>
                    <label
                      className="flex items-center gap-3 cursor-pointer p-3 rounded-lg"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={acknowledged}
                        onChange={(e) => setAcknowledged(e.target.checked)}
                        className="w-5 h-5 accent-red-500 rounded"
                      />
                      <span className="text-sm text-red-200/80 font-medium">
                        I understand and will seek professional support if needed
                      </span>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              {data.risk_level === 'Low' && (
                <motion.div
                  className="rounded-2xl p-6 text-center"
                  style={{
                    background: 'rgba(127,169,142,0.08)',
                    border: '1px solid rgba(127,169,142,0.3)',
                  }}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3"
                    style={{ background: 'rgba(127,169,142,0.15)' }}
                  >
                    <CheckCircle size={32} style={{ color: 'var(--mc-sage)' }} />
                  </div>
                  <h3 className="font-bold text-lg mb-1 tracking-wide" style={{ color: 'var(--mc-sage)' }}>
                    Rest & Recovery Optimized
                  </h3>
                  <p className="text-sm" style={{ color: 'rgba(127,169,142,0.8)' }}>
                    Baseline telemetry indicates low stress. Continue maintaining your current behavioral patterns.
                  </p>
                </motion.div>
              )}

              <div className="pt-6">
                <motion.button
                  onClick={() => nav('/dashboard')}
                  disabled={emergency && !acknowledged}
                  className={`w-full py-4 rounded-full text-base flex items-center justify-center gap-3 transition-all duration-300 ${
                    emergency && !acknowledged
                      ? 'cursor-not-allowed opacity-50'
                      : 'mc-btn-primary'
                  }`}
                  style={
                    emergency && !acknowledged
                      ? {
                          background: 'rgba(237,233,226,0.08)',
                          border: '1px solid var(--mc-line)',
                          color: 'var(--mc-muted)',
                        }
                      : undefined
                  }
                  whileHover={emergency && !acknowledged ? {} : { scale: 1.01 }}
                  whileTap={emergency && !acknowledged ? {} : { scale: 0.98 }}
                >
                  {emergency && !acknowledged
                    ? 'Acknowledge Notice to Proceed'
                    : 'Go to Dashboard'}
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
