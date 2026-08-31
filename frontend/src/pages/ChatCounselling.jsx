import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Send, AlertTriangle, CheckCircle, ArrowLeft, Trash2, Zap, Brain, Copy, Check, ArrowDown, Square } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import StepProgress from '../components/StepProgress'

export default function ChatCounselling() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [emergency, setEmergency] = useState(false)
  const [chatComplete, setChatComplete] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [showSummary, setShowSummary] = useState(false)

  const bottomRef = useRef(null)
  const chatContainerRef = useRef(null)
  const abortControllerRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    api.get('/api/chat/history').then(r => {
      if (r.data.length > 0) {
        setMessages(r.data.map(m => ({ ...m, id: m.id || Date.now() })))
      } else {
        setMessages([{
          id: 1, sender: 'bot',
          message: `Hi ${user?.full_name || 'there'}! 👋 I'm your Mindora AI counsellor.\n\nI'm here to listen and help you. **What is your problem?**`,
          timestamp: new Date().toISOString()
        }])
      }
    }).catch(() => {
      setMessages([{
        id: 1, sender: 'bot',
        message: `Hi ${user?.full_name}! 👋 I'm your Mindora AI counsellor. I'm here to listen and help you. What is your problem?`,
        timestamp: new Date().toISOString()
      }])
    })

    api.get('/api/chat/analysis').then(r => {
      if (r.data.stage === 'completed') setChatComplete(true)
    }).catch(() => {})
  }, [user?.full_name])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    setShowScrollTop(scrollHeight - scrollTop - clientHeight >= 100)
  }

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setLoading(false)
    }
  }

  const handleInputResize = (e) => {
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const send = async () => {
    if (!input.trim() || loading || showSummary) return

    const userMsg = { id: Date.now(), sender: 'user', message: input.trim(), timestamp: new Date().toISOString() }
    setMessages(p => [...p, userMsg])
    const sentInput = input.trim()
    setInput('')
    setLoading(true)

    if (abortControllerRef.current) abortControllerRef.current.abort()
    abortControllerRef.current = new AbortController()

    let botMsgId = null
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const token = localStorage.getItem('mindcare_token') || localStorage.getItem('access_token')

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: sentInput }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('mindcare_token')
          localStorage.removeItem('mindcare_user')
          window.location.href = '/login'
        }
        throw new Error('HTTP Error ' + response.status)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      botMsgId = Date.now() + 1
      setMessages(p => [...p, { id: botMsgId, sender: 'bot', message: '', timestamp: new Date().toISOString() }])
      setLoading(false)

      let accumulatedReply = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop()

        for (const ev of parts) {
          if (ev.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(ev.substring(6))
              if (parsed.type === 'chunk') {
                accumulatedReply += parsed.text
                setMessages(p => p.map(m => m.id === botMsgId ? { ...m, message: accumulatedReply } : m))
              } else if (parsed.type === 'done') {
                const finalData = parsed.final_data
                if (finalData?.emergency) setEmergency(true)
                if (finalData?.stage === 'completed') setChatComplete(true)
              }
            } catch { /* ignore parse errors */ }
          }
        }
      }

      if (!accumulatedReply.trim()) throw new Error('Empty response received from AI service')
    } catch (error) {
      if (error.name === 'AbortError') return
      console.error('Chat send error:', error)
      toast.error('Failed to send message. Please try again.')
      setMessages(p => {
        let filtered = p.filter(m => m.id !== userMsg.id)
        if (botMsgId) filtered = filtered.filter(m => !(m.id === botMsgId && (!m.message || m.message === '')))
        return [...filtered, { id: Date.now() + 2, sender: 'bot', message: '⚠️ Request failed. Please try again.', timestamp: new Date().toISOString() }]
      })
      setInput(sentInput)
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }

  const finishChat = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/chat/finalize')
      setAnalysisResults(data)
      setShowSummary(true)
      toast.success('Assessment complete!')
    } catch {
      toast.error('Failed to finalize assessment')
    } finally {
      setLoading(false)
    }
  }

  const formatMessage = (text) => text.split('\n').map((line, i) => {
    const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    return (
      <p key={i} dangerouslySetInnerHTML={{ __html: boldLine || '&nbsp;' }} className={line === '' ? 'mb-1' : 'leading-relaxed'} />
    )
  })

  const resetChat = async () => {
    try {
      const response = await api.delete('/api/chat/clear')
      if (response.data && response.data.success === false) throw new Error('Backend failed to clear chat')
      setMessages([{
        id: Date.now(),
        sender: 'bot',
        message: `Hi ${user?.full_name || 'there'}! 👋 I'm resetting our session to give us a fresh start. What would you like to talk about?`,
        timestamp: new Date().toISOString()
      }])
      setEmergency(false)
      setChatComplete(false)
      setShowSummary(false)
      setAnalysisResults(null)
      toast.success('Chat history cleared')
    } catch (err) {
      console.error('Clear chat error:', err)
      toast.error('Failed to clear chat history')
    }
  }

  const getEmotionEmoji = (text) => {
    const lower = text.toLowerCase()
    if (lower.includes('sad') || lower.includes('unhappy') || lower.includes('lonely') || lower.includes('depressed')) return '😢'
    if (lower.includes('happy') || lower.includes('glad') || lower.includes('great') || lower.includes('good')) return '😊'
    if (lower.includes('angry') || lower.includes('mad') || lower.includes('frustrat')) return '😠'
    if (lower.includes('anxious') || lower.includes('worry') || lower.includes('scared') || lower.includes('fear')) return '😰'
    return null
  }

  const SummaryCard = ({ data }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mc-card-form p-8 space-y-6 w-full max-w-[950px] mx-auto mt-6"
    >
      <div className="flex items-center gap-4 mb-2">
        <div className="mc-section-icon"><Zap size={22} className="mc-text-coral" /></div>
        <div>
          <h2 className="mc-heading text-xl mc-text-paper">AI Assessment Summary</h2>
          <p className="mc-caption mt-1 mc-text-sage">Based on your conversation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { label: 'Problem', value: data.problem },
          { label: 'Duration', value: data.duration },
          { label: 'Severity', value: data.severity },
          { label: 'Sentiment', value: data.sentiment },
          {
            label: 'Risk Level',
            value: data.risk_level || 'Low',
            color: data.risk_level === 'High' ? 'mc-text-coral' : data.risk_level === 'Medium' ? 'mc-text-warn' : 'mc-text-sage'
          },
          { label: 'Triggers', value: data.triggers?.join(', ') || 'None' },
          { label: 'Impact on Life', value: data.impact_on_daily_life ? 'Yes' : 'No' },
          { label: 'Emotions', value: data.emotions?.join(', ') || 'Not specified' },
          { label: 'Physical Symptoms', value: data.physical_symptoms?.join(', ') || 'None reported' },
          { label: 'Coping Methods', value: data.coping_strategy || 'None identified' },
          { label: 'Support Available', value: data.support_available ? 'Yes' : 'No' }
        ].map((item, i) => (
          <div key={i} className="mc-summary-row">
            <span className="mc-caption">{item.label}</span>
            <span className={`text-sm font-semibold ${item.color || 'mc-text-paper'}`}>{item.value || 'N/A'}</span>
          </div>
        ))}

        {data.additional_notes?.trim() && (
          <div className="col-span-1 md:col-span-2 mc-subcard flex flex-col items-start mt-1">
            <span className="mc-caption mb-2">Additional Notes</span>
            <span className="text-sm mc-text-muted leading-relaxed">{data.additional_notes}</span>
          </div>
        )}
      </div>

      <div className="pt-2">
        <p className="text-xs mc-text-muted italic mb-6 text-center opacity-70">
          This summary is an AI-generated assessment. Please proceed to the next step for a multi-modal analysis.
        </p>
        <button type="button" onClick={() => nav('/face')} className="mc-btn-primary w-full py-4 text-sm">
          Proceed to Next Step → Face Analysis <CheckCircle size={16} />
        </button>
      </div>
    </motion.div>
  )

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="mc-preloader">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-6">
              <div className="mc-preloader-icon">
                <motion.div animate={{ top: ['100%', '-10%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="mc-preloader-scan" />
                <Brain size={32} className="mc-text-coral relative z-10" />
              </div>
              <h2 className="mc-display text-2xl md:text-3xl tracking-[0.15em] mc-text-paper">
                STEP <span className="mc-text-coral">2</span> : COUNSELLING
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

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.4 }}
          className="w-full max-w-5xl mx-auto z-10 relative flex flex-col items-center space-y-8"
        >
          <div className="flex flex-col gap-6 w-full">
            <button type="button" onClick={() => nav('/behaviour')} className="mc-back-link group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Back to Step 1 – Behaviour Analysis
            </button>

            <div className="flex items-center justify-center gap-5 print:hidden">
              <motion.div className="mc-brand-icon" animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}>
                <Brain size={26} className="mc-text-coral" />
              </motion.div>
              <span className="mc-display text-[clamp(28px,5vw,42px)] mc-text-paper">Mindora AI</span>
            </div>

            <div className="w-full flex justify-center print:hidden">
              <StepProgress current={1} />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="mc-display text-[clamp(28px,5vw,40px)] mc-text-paper">AI Counselling Chat</h1>
            <p className="mc-body text-[15px] mc-text-muted">Step 2/4 — Share your thoughts in a safe and private space</p>
            <div className="h-px w-24 mx-auto mt-3" style={{ background: 'var(--mc-line)' }} />
          </div>

          {/* Chat shell */}
          <div className="mc-chat-shell">
            <div className="mc-chat-header">
              <div>
                <h3 className="mc-heading text-lg mc-text-paper flex items-center gap-2">
                  AI Counsellor
                  <span className="mc-chat-status-dot" />
                </h3>
              </div>
              <button type="button" onClick={resetChat} className="mc-icon-btn" title="Reset Chat">
                <motion.div whileHover={{ rotate: 12 }} whileTap={{ scale: 0.9 }}>
                  <Trash2 size={18} />
                </motion.div>
              </button>
            </div>

            <div className="mc-chat-body custom-scrollbar" ref={chatContainerRef} onScroll={handleScroll}>
              <AnimatePresence>
                {emergency && (
                  <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mc-emergency mb-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.12)' }}>
                        <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                      </div>
                      <div>
                        <p className="mc-caption mb-2" style={{ color: '#fecaca' }}>Emergency Crisis Support</p>
                        <p className="text-xs leading-relaxed mc-text-muted">
                          If you are in immediate danger, please reach out:<br />
                          <span className="font-semibold" style={{ color: '#ef4444' }}>KIRAN: 1800-599-0019</span>
                          {' '}|{' '}
                          <span className="font-semibold" style={{ color: '#ef4444' }}>iCALL: 9152987821</span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex w-full items-start mb-6 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="mc-avatar-bot">
                      <Brain size={14} className="mc-text-coral" />
                    </div>
                  )}

                  <div className={`flex flex-col w-fit max-w-[85%] md:max-w-[70%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`relative group ${msg.sender === 'user' ? 'mc-bubble-user' : 'mc-bubble-bot'}`}>
                      {msg.sender === 'bot' && !loading && msg.message && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.message, msg.id)}
                          className="absolute -right-11 top-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity mc-icon-btn"
                          title="Copy Message"
                          style={{ color: copiedId === msg.id ? 'var(--mc-sage)' : undefined }}
                        >
                          {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      )}
                      <div className="whitespace-pre-wrap">
                        {msg.message ? (
                          formatMessage(msg.message)
                        ) : msg.sender === 'bot' && (
                          <div className="flex gap-1.5 h-6 items-center px-1">
                            {[0, 0.2, 0.4].map(d => (
                              <motion.div key={d} className="mc-typing-dot" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d }} />
                            ))}
                          </div>
                        )}
                      </div>

                      {msg.sender === 'user' && getEmotionEmoji(msg.message) && (
                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(237,233,226,0.06)', border: '1px solid var(--mc-line)' }}>
                          {getEmotionEmoji(msg.message)}
                        </div>
                      )}
                    </div>
                    <div className={`mt-2 flex items-center gap-2 text-[10px] tabular-nums opacity-40 ${msg.sender === 'user' ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      {msg.sender === 'user' && <CheckCircle size={10} className="mc-text-coral" />}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="mc-avatar-user">{user?.full_name?.charAt(0) || 'U'}</div>
                  )}
                </motion.div>
              ))}

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start items-start mb-6">
                  <div className="mc-avatar-bot"><Brain size={14} className="mc-text-coral" /></div>
                  <div className="mc-bubble-bot flex items-center gap-3">
                    <div className="flex gap-1.5 h-3 items-center">
                      {[0, 0.2, 0.4].map(d => (
                        <motion.div key={d} className="mc-typing-dot" style={{ width: 8, height: 8 }} animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />

              <AnimatePresence>
                {showScrollTop && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={scrollToBottom}
                    className="mc-scroll-fab"
                  >
                    <ArrowDown size={18} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div className="mc-chat-input-bar">
              <textarea
                value={input}
                onChange={e => { setInput(e.target.value); handleInputResize(e) }}
                onKeyDown={handleKeyDown}
                placeholder="Describe how you're feeling today..."
                className="mc-chat-textarea custom-scrollbar"
                disabled={loading || showSummary}
                rows={1}
              />
              {loading && !showSummary ? (
                <motion.button type="button" onClick={stopGeneration} className="mc-stop-btn" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} title="Stop generating">
                  <Square fill="currentColor" size={18} />
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={send}
                  disabled={!input.trim() || showSummary}
                  className="mc-send-btn"
                  whileHover={input.trim() && !showSummary ? { scale: 1.05 } : {}}
                  whileTap={input.trim() && !showSummary ? { scale: 0.95 } : {}}
                >
                  <Send size={18} fill={input.trim() && !showSummary ? 'currentColor' : 'none'} />
                </motion.button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {(messages.length >= 8 || chatComplete) && !showSummary && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-center w-full max-w-4xl pt-2">
                <button type="button" onClick={finishChat} className="mc-btn-primary w-full max-w-sm py-4 text-sm">
                  Done Chatting <Zap size={16} fill="currentColor" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showSummary && analysisResults && (
              <div className="w-full max-w-4xl">
                <SummaryCard data={analysisResults} />
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}

