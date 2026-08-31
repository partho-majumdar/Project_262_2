import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Mic, StopCircle, RefreshCw, ArrowLeft, Brain } from 'lucide-react'
import API from '../api'
import toast from 'react-hot-toast'
import StepProgress from '../components/StepProgress'

const interleave = (inputL, inputR) => {
  const length = inputL.length + inputR.length
  const result = new Float32Array(length)
  let index = 0, inputIndex = 0
  while (index < length) {
    result[index++] = inputL[inputIndex]
    result[index++] = inputR[inputIndex]
    inputIndex++
  }
  return result
}

const encodeWAV = (samples, format, sampleRate, numChannels, bitDepth) => {
  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
  const view = new DataView(buffer)
  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i))
  }
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + samples.length * bytesPerSample, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, samples.length * bytesPerSample, true)
  let offset = 44
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
  }
  return new Blob([view], { type: 'audio/wav' })
}

const audioBufferToWav = (buffer) => {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const result = numChannels === 2
    ? interleave(buffer.getChannelData(0), buffer.getChannelData(1))
    : buffer.getChannelData(0)
  return encodeWAV(result, 1, sampleRate, numChannels, 16)
}

const RECORD_SECONDS = 15
const STRESS_COLOR = {
  Low: 'var(--mc-sage)',
  Medium: '#F59E0B',
  High: 'var(--mc-coral)'
}

export default function VoiceAnalysis() {
  const nav = useNavigate()
  const [recording, setRecording] = useState(false)
  const [countdown, setCountdown] = useState(RECORD_SECONDS)
  const [audioBlob, setAudioBlob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [activeTab] = useState('live')
  const [audioData, setAudioData] = useState(new Array(24).fill(6))
  const [vocalStatus, setVocalStatus] = useState('Listening...')
  const [statusTone, setStatusTone] = useState('muted') // muted | sage | warn | coral
  const [isLoading, setIsLoading] = useState(true)

  const mediaRecRef = useRef(null)
  const chunksRef = useRef([])
  const authContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const cleanupAudioBlocks = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (authContextRef.current && authContextRef.current.state !== 'closed') {
      authContextRef.current.close().catch(() => {})
    }
    setAudioData(new Array(24).fill(6))
    setVocalStatus('Listening...')
    setStatusTone('muted')
  }

  useEffect(() => () => cleanupAudioBlocks(), [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
          channelCount: 1
        }
      })
      chunksRef.current = []

      const AudioContext = window.AudioContext || window.webkitAudioContext
      authContextRef.current = new AudioContext()
      analyserRef.current = authContextRef.current.createAnalyser()
      const source = authContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 64
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

      const drawWaveform = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        setAudioData(Array.from(dataArray).slice(0, 24).map(val => Math.max(6, (val / 255) * 50)))
        const avg = dataArray.reduce((a, v) => a + v, 0) / dataArray.length
        const percent = (avg / 255) * 100
        if (percent > 60) {
          setVocalStatus('High Energy / Potential Stress detected...')
          setStatusTone('coral')
        } else if (percent > 30) {
          setVocalStatus('Normal Conversational Tone...')
          setStatusTone('warn')
        } else if (percent > 5) {
          setVocalStatus('Calm / Quiet Tone...')
          setStatusTone('sage')
        } else {
          setVocalStatus('Listening...')
          setStatusTone('muted')
        }
        animationRef.current = requestAnimationFrame(drawWaveform)
      }
      drawWaveform()

      const mr = new MediaRecorder(stream)
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        const tempBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        try {
          const arrayBuffer = await tempBlob.arrayBuffer()
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
          setAudioBlob(audioBufferToWav(audioBuffer))
        } catch (err) {
          console.error('WAV conversion failed', err)
          setAudioBlob(tempBlob)
        }
        stream.getTracks().forEach(t => t.stop())
        cleanupAudioBlocks()
      }
      mediaRecRef.current = mr
      mr.start()
      setRecording(true)
      setCountdown(RECORD_SECONDS)

      let sec = RECORD_SECONDS
      const iv = setInterval(() => {
        sec--
        setCountdown(sec)
        if (sec <= 0) {
          clearInterval(iv)
          mr.stop()
          setRecording(false)
        }
      }, 1000)
    } catch {
      toast.error('Microphone permission denied')
    }
  }

  const stopRecording = () => {
    mediaRecRef.current?.stop()
    setRecording(false)
  }

  const upload = async () => {
    if (!audioBlob) return
    setLoading(true)
    const fd = new FormData()
    fd.append('audio', audioBlob, 'voice.wav')
    try {
      const { data } = await API.post('/voice/analyse', fd)
      setResult(data)
      toast.success('Voice analysis complete!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setResult(null)
    setAudioBlob(null)
    setCountdown(RECORD_SECONDS)
    setAudioData(new Array(24).fill(6))
    setVocalStatus('Listening...')
    setStatusTone('muted')
  }

  const statusClass =
    statusTone === 'coral' ? 'mc-text-coral'
      : statusTone === 'sage' ? 'mc-text-sage'
        : statusTone === 'warn' ? 'mc-text-warn'
          : 'mc-text-muted'

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
                STEP <span className="mc-text-coral">4</span> : VOICE ANALYSIS
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
          className="w-full max-w-4xl mx-auto z-10 relative flex flex-col items-center space-y-8 px-4"
        >
          <div className="flex flex-col gap-6 w-full">
            <div className="flex items-center justify-center gap-5 print:hidden">
              <motion.div className="mc-brand-icon" animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}>
                <Brain size={26} className="mc-text-coral" />
              </motion.div>
              <span className="mc-display text-[clamp(28px,5vw,42px)] mc-text-paper">MindCare AI</span>
            </div>

            <button type="button" onClick={() => nav('/face')} className="mc-back-link group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Back to Step 3 – Facial Analysis
            </button>

            <div className="w-full flex justify-center print:hidden">
              <StepProgress current={3} />
            </div>
          </div>

          <div className="text-center space-y-2 w-full">
            <h1 className="mc-display text-[clamp(28px,5vw,40px)] mc-text-paper">Voice Stress Analysis</h1>
            <p className="mc-body text-[15px] mc-text-muted">Step 4/4 — 15-second voice recording for stress detection</p>
            <div className="h-px w-24 mx-auto mt-3" style={{ background: 'var(--mc-line)' }} />
          </div>

          <div className="mc-card-form p-6 lg:p-8 w-full">
            {!result ? (
              <div className="space-y-6">
                <div className="mc-voice-stage" data-recording={recording || undefined}>
                  {activeTab === 'live' && (
                    <>
                      <div className="flex justify-center mb-6">
                        <div className="relative">
                          <motion.div
                            className="mc-mic-ring"
                            data-recording={recording || undefined}
                            animate={recording ? {
                              scale: [1, 1.1, 1],
                              boxShadow: [
                                '0 0 0 0 rgba(239,68,68,0.35)',
                                '0 0 0 18px rgba(239,68,68,0)',
                                '0 0 0 0 rgba(239,68,68,0)'
                              ]
                            } : { boxShadow: '0 0 24px rgba(255,122,89,0.15)' }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Mic size={40} className={recording ? 'text-red-400' : 'mc-text-coral'} />
                          </motion.div>
                          {recording && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full animate-pulse" />
                          )}
                        </div>
                      </div>

                      <div className="flex justify-center gap-1 mb-6 h-16 items-end">
                        {audioData.map((h, i) => (
                          <motion.div
                            key={i}
                            className="mc-wave-bar"
                            data-active={recording || undefined}
                            animate={{ height: h }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          />
                        ))}
                      </div>

                      {recording && (
                        <>
                          <div className="text-5xl font-semibold text-red-400 mb-2 tabular-nums">{countdown}s</div>
                          <div className={`text-sm font-semibold tracking-widest uppercase mb-4 ${statusClass}`}>
                            {vocalStatus}
                          </div>
                        </>
                      )}

                      {!recording && audioBlob && (
                        <div className="mc-text-sage font-semibold mb-4 flex items-center justify-center gap-2">
                          <span className="text-xl">✅</span> Recording saved! Ready to analyze.
                        </div>
                      )}

                      <p className="mc-body text-[15px] mc-text-muted mb-6">
                        {recording
                          ? '🎙️ Keep speaking clearly. AI is mapping your acoustic energy...'
                          : audioBlob
                            ? 'Click Analyze to detect voice stress patterns'
                            : (
                              <>
                                <span className="mc-text-coral font-semibold">💡 Instruction:</span>{' '}
                                Click Start and speak for 15 seconds about your current mood.
                              </>
                            )}
                      </p>

                      <div className="flex gap-3 justify-center flex-wrap">
                        {!recording && !audioBlob && (
                          <motion.button type="button" onClick={startRecording} className="mc-btn-primary px-10 py-3.5 text-sm" whileHover={{ scale: 1.03 }}>
                            <Mic size={18} /> Start Recording
                          </motion.button>
                        )}
                        {recording && (
                          <motion.button type="button" onClick={stopRecording}
                            className="px-8 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center gap-2"
                            whileHover={{ scale: 1.03 }}>
                            <StopCircle size={18} /> Stop
                          </motion.button>
                        )}
                        {audioBlob && !recording && (
                          <div className="flex gap-3 justify-center">
                            <button type="button" onClick={() => setAudioBlob(null)} className="mc-btn-secondary px-5 py-2.5 text-sm">
                              <RefreshCw size={15} /> Retry
                            </button>
                            <motion.button type="button" onClick={upload} disabled={loading} className="mc-btn-primary px-8 py-3 text-sm" whileHover={{ scale: 1.03 }}>
                              {loading ? <><div className="mc-spinner" /> Analyzing...</> : '🔍 Analyze Voice'}
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <motion.div className="space-y-5" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="mc-subcard p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="mc-heading text-2xl mc-text-paper">Voice Analysis Result</h2>
                    <span className="text-3xl">🎙️</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                      ['Emotion', result.voice_emotion, 'var(--mc-coral)'],
                      ['Mood', result.voice_mood, '#8B5CF6'],
                      ['Stress', result.voice_stress, STRESS_COLOR[result.voice_stress]],
                      ['Severity', `${result.severity_score}/10`, result.severity_score >= 7 ? 'var(--mc-coral)' : '#F59E0B']
                    ].map(([k, v, c]) => (
                      <div key={k} className="mc-metric-tile p-3">
                        <div className="text-xl font-semibold" style={{ color: c }}>{v}</div>
                        <div className="mc-caption mt-1">{k}</div>
                      </div>
                    ))}
                  </div>

                  {result.emotion_counts && Object.keys(result.emotion_counts).length > 0 && (
                    <div className="mb-5 mc-subcard p-4">
                      <div className="mc-caption mb-3">15s Sliding Window Detection</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(result.emotion_counts)
                          .sort(([, a], [, b]) => b - a)
                          .map(([label, count]) => (
                            <div key={label} className="mc-frame-chip px-3 py-1.5 flex-row gap-2 min-w-0" style={{ flexDirection: 'row' }}>
                              <span className="mc-text-paper text-sm font-medium">{label}</span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(255,122,89,0.15)', color: 'var(--mc-coral)' }}>
                                {count} {count === 1 ? 'frame' : 'frames'}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-sm mb-2">
                    <span className="mc-text-muted">AI Confidence</span>
                    <span className="font-medium mc-text-paper">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="mc-progress-track">
                    <motion.div
                      className="mc-progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${result.confidence * 100}%` }}
                      transition={{ duration: 1.2 }}
                    />
                  </div>
                </div>

                <div
                  className="mc-subcard p-4 text-center font-semibold text-sm"
                  style={{
                    borderColor: STRESS_COLOR[result.voice_stress],
                    color: STRESS_COLOR[result.voice_stress]
                  }}
                >
                  🎯 Stress Level: {result.voice_stress}
                </div>

                <div className="flex gap-4 mt-2 flex-col sm:flex-row">
                  <motion.button type="button" onClick={handleRetry} className="mc-btn-secondary flex-1 py-3.5 text-sm" whileHover={{ scale: 1.02 }}>
                    <RefreshCw size={16} /> Retry / Record Again
                  </motion.button>
                  <motion.button type="button" onClick={() => nav('/severity')} className="mc-btn-primary flex-1 py-3.5 text-sm" whileHover={{ scale: 1.02 }}>
                    Continue to Final Severity →
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  )
}
