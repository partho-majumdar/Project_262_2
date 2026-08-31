import React, { useState, useRef, useEffect } from 'react'
import * as faceapi from '@vladmandic/face-api'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Camera, StopCircle, Upload, RefreshCw, Brain, Activity, ArrowLeft } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import API from '../api'
import toast from 'react-hot-toast'
import StepProgress from '../components/StepProgress'

const EMOTION_COLORS = {
  Happy: 'var(--mc-sage)', Neutral: '#6366F1', Sad: '#3B82F6',
  Angry: 'var(--mc-coral)', Surprise: '#F59E0B', Fear: '#8B5CF6', Disgust: '#EC4899'
}
const EMOTION_EMOJI = { Happy: '😊', Sad: '😢', Angry: '😠', Fear: '😨', Surprise: '😲', Neutral: '😐', Disgust: '🤢' }
const INSIGHT_TEXTS = {
  Happy: 'Looking great! Detected a smile.',
  Neutral: 'You appear calm and balanced.',
  Sad: 'Sensing some low energy or sadness.',
  Angry: 'You appear upset or frustrated.',
  Surprise: 'You look surprised by something!',
  Fear: 'Detected signs of anxiety or fear.',
  Disgust: 'Sensing discomfort or disgust.'
}
const RECORD_SECONDS = 20
const EMPTY_SCORES = { Happy: 0, Neutral: 0, Sad: 0, Angry: 0, Surprise: 0, Fear: 0, Disgust: 0 }

export default function FaceEmotion() {
  const nav = useNavigate()
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const isRecordingRef = useRef(false)
  const emotionCountsRef = useRef({ ...EMPTY_SCORES })
  const canvasRef = useRef(null)
  const liveScoresRef = useRef({ ...EMPTY_SCORES })
  const latestDetectedRef = useRef({ dominantCapKey: null, scoreMap: { ...EMPTY_SCORES }, highestScore: 0 })

  const [isLoading, setIsLoading] = useState(true)
  const [recording, setRecording] = useState(false)
  const [liveCounts, setLiveCounts] = useState({ ...EMPTY_SCORES })
  const [dominantEmotion, setDominantEmotion] = useState(null)
  const [floatingEmojis, setFloatingEmojis] = useState([])
  const [countdown, setCountdown] = useState(RECORD_SECONDS)
  const [videoBlob, setVideoBlob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [stream, setStream] = useState(null)
  const [permission, setPermission] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [liveScores, setLiveScores] = useState({ ...EMPTY_SCORES })
  const [timelineData, setTimelineData] = useState([])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ])
        setModelsLoaded(true)
      } catch (err) {
        console.error('Failed to load face-api models', err)
        toast.error('Failed to load local face tracking models.')
      }
    }
    loadModels()
  }, [])

  useEffect(() => {
    const uiInterval = setInterval(() => {
      if (!stream && !recording) return
      const { dominantCapKey, scoreMap, highestScore } = latestDetectedRef.current
      if (dominantCapKey) {
        setDominantEmotion(dominantCapKey)
        setLiveScores(scoreMap)
        if (isRecordingRef.current) {
          setLiveCounts({ ...emotionCountsRef.current })
          if (highestScore > 0.85 && Math.random() > 0.5) {
            setFloatingEmojis(prev => [...prev.slice(-10), {
              id: Date.now() + Math.random(),
              emotion: dominantCapKey,
              left: `${20 + Math.random() * 60}%`,
              size: 20 + Math.random() * 20
            }])
          }
        }
      } else {
        setLiveScores({ ...EMPTY_SCORES })
      }
    }, 800)
    return () => clearInterval(uiInterval)
  }, [stream, recording])

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream
  }, [stream, permission])

  useEffect(() => () => { stream?.getTracks().forEach(t => t.stop()) }, [stream])

  const requestCamera = async () => {
    stream?.getTracks().forEach(t => t.stop())
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setStream(s)
      setPermission(true)
    } catch {
      toast.error('Camera permission denied. Please allow camera access.')
    }
  }

  const startRecording = () => {
    chunksRef.current = []
    emotionCountsRef.current = { ...EMPTY_SCORES }
    setLiveCounts(emotionCountsRef.current)
    setTimelineData([])
    const mr = new MediaRecorder(stream, { mimeType: 'video/webm' })
    mr.ondataavailable = e => chunksRef.current.push(e.data)
    mr.onstop = () => setVideoBlob(new Blob(chunksRef.current, { type: 'video/webm' }))
    mediaRecorderRef.current = mr
    mr.start()
    setRecording(true)
    isRecordingRef.current = true
    setCountdown(RECORD_SECONDS)
    let sec = RECORD_SECONDS
    const iv = setInterval(() => {
      sec--
      setCountdown(sec)
      setTimelineData(prev => [...prev, { time: `${RECORD_SECONDS - sec}s`, ...liveScoresRef.current }])
      if (sec <= 0) {
        clearInterval(iv)
        mr.stop()
        setRecording(false)
        isRecordingRef.current = false
      }
    }, 1000)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    isRecordingRef.current = false
  }

  const handleRetry = async () => {
    setResult(null)
    setVideoBlob(null)
    setTimelineData([])
    setLiveCounts({ ...EMPTY_SCORES })
    stream?.getTracks().forEach(t => t.stop())
    await requestCamera()
  }

  const uploadAndAnalyze = async () => {
    if (!videoBlob) return
    setLoading(true)
    const formData = new FormData()
    formData.append('video', videoBlob, 'face_recording.webm')
    formData.append('live_counts', JSON.stringify(liveCounts))
    try {
      const { data } = await API.post('/face/analyse', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResult(data)
      stream?.getTracks().forEach(t => t.stop())
      toast.success('Facial analysis complete!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const SEVERITY_COLOR = (s) => (s <= 3 ? 'var(--mc-sage)' : s <= 6 ? '#F59E0B' : 'var(--mc-coral)')
  const pieData = result ? Object.entries(result.emotion_distribution || {}).map(([k, v]) => ({ name: k, value: v })) : []

  const getComplexEmotion = () => {
    const { Sad, Fear, Angry, Disgust, Happy, Surprise } = liveCounts
    if (Sad > 0 && Fear > 0) return 'Anxiety / Distress'
    if (Angry > 0 && Disgust > 0) return 'Frustration / Contempt'
    if (Happy > 0 && Surprise > 0) return 'Excitement / Awe'
    return 'Focused / Singular Emotion'
  }

  const calculateVolatility = () => {
    let changes = 0
    let lastDominant = null
    timelineData.forEach(data => {
      let dominant = null
      let maxScore = -1
      ;['Happy', 'Neutral', 'Sad', 'Angry', 'Surprise', 'Fear', 'Disgust'].forEach(emp => {
        if (data[emp] > maxScore) { maxScore = data[emp]; dominant = emp }
      })
      if (lastDominant && dominant !== lastDominant) changes++
      lastDominant = dominant
    })
    if (changes > 5) return 'High (Rapid mood shifts detected)'
    if (changes >= 2) return 'Moderate (Normal emotional flow)'
    return 'Stable (Consistent emotional state)'
  }

  const mapEmotionKey = (k) => {
    let cap = k.charAt(0).toUpperCase() + k.slice(1)
    if (cap === 'Surprised') cap = 'Surprise'
    if (cap === 'Fearful') cap = 'Fear'
    if (cap === 'Disgusted') cap = 'Disgust'
    return cap
  }

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
                STEP <span className="mc-text-coral">3</span> : FACE EMOTION
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
            <button type="button" onClick={() => nav('/chat')} className="mc-back-link group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Back to Step 2 – Chat Analysis
            </button>

            <div className="flex items-center justify-center gap-5 print:hidden">
              <motion.div className="mc-brand-icon" animate={{ y: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}>
                <Brain size={26} className="mc-text-coral" />
              </motion.div>
              <span className="mc-display text-[clamp(28px,5vw,42px)] mc-text-paper">MindCare AI</span>
            </div>

            <div className="w-full flex justify-center print:hidden">
              <StepProgress current={2} />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="mc-display text-[clamp(28px,5vw,40px)] mc-text-paper">Face Emotion Analysis</h1>
            <p className="mc-body text-[15px] mc-text-muted">Step 3/4 — Record a 20-second video for AI emotion detection</p>
            <div className="h-px w-24 mx-auto mt-3" style={{ background: 'var(--mc-line)' }} />
          </div>

          <div className="mc-card-form p-6 lg:p-8 w-full">
            {!result ? (
              <div className={`w-full flex flex-col gap-8 ${(recording || videoBlob) ? 'lg:grid lg:grid-cols-12 lg:gap-8 items-stretch' : 'items-center'}`}>
                <div className="lg:col-span-7 flex flex-col gap-6 w-full">
                  <div className="mc-video-frame" style={{ willChange: 'transform', transform: 'translateZ(0)' }}>
                    {!permission ? (
                      <div className="flex flex-col items-center justify-center gap-4 relative z-20 w-full h-full p-6">
                        <Camera size={48} className="mc-text-muted" />
                        <button type="button" onClick={requestCamera} className="mc-btn-primary px-8 py-3 text-sm">
                          📷 Enable Camera
                        </button>
                        <p className="mc-body text-sm mc-text-muted">Camera permission required for facial analysis</p>
                      </div>
                    ) : (
                      <div className="relative w-full h-full rounded-xl overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                          style={{ transform: 'scaleX(-1) translateZ(0)', willChange: 'transform' }}
                          onPlay={() => {
                            const canvas = canvasRef.current
                            const video = videoRef.current
                            const interval = setInterval(async () => {
                              if (!video || !canvas || video.paused || video.ended) {
                                clearInterval(interval)
                                return
                              }
                              if (modelsLoaded && video.readyState === 4) {
                                const detections = await faceapi
                                  .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                                  .withFaceExpressions()
                                const displaySize = { width: video.clientWidth, height: video.clientHeight }
                                faceapi.matchDimensions(canvas, displaySize)
                                const ctx = canvas.getContext('2d')
                                if (detections) {
                                  const resized = faceapi.resizeResults(detections, displaySize)
                                  ctx.clearRect(0, 0, canvas.width, canvas.height)
                                  const sorted = Object.entries(detections.expressions).sort((a, b) => b[1] - a[1])
                                  const [highestEmotion, highestScore] = sorted[0]
                                  const dominantCapKey = mapEmotionKey(highestEmotion)
                                  if (isRecordingRef.current) emotionCountsRef.current[dominantCapKey] += 1
                                  const scoreMap = { ...EMPTY_SCORES }
                                  Object.entries(detections.expressions).forEach(([k, v]) => {
                                    const capKey = mapEmotionKey(k)
                                    if (scoreMap[capKey] !== undefined) scoreMap[capKey] = (v * 100).toFixed(1)
                                  })
                                  liveScoresRef.current = scoreMap
                                  latestDetectedRef.current = { dominantCapKey, scoreMap, highestScore }
                                  const box = resized.detection.box
                                  const emotionColor = EMOTION_COLORS[dominantCapKey] || 'var(--mc-coral)'
                                  ctx.strokeStyle = emotionColor
                                  ctx.lineWidth = 2
                                  ctx.strokeRect(box.x, box.y, box.width, box.height)
                                  ctx.save()
                                  ctx.translate(box.x + box.width / 2, box.y - 5)
                                  ctx.scale(-1, 1)
                                  ctx.textAlign = 'center'
                                  ctx.font = 'bold 16px var(--font-sans)'
                                  const labelText = `${dominantCapKey}: ${(highestScore * 100).toFixed(1)}%`
                                  const tw = ctx.measureText(labelText).width + 12
                                  ctx.fillStyle = emotionColor
                                  ctx.fillRect(-tw / 2, -20, tw, 24)
                                  ctx.fillStyle = '#fff'
                                  ctx.fillText(labelText, 0, 0)
                                  ctx.restore()
                                } else {
                                  ctx.clearRect(0, 0, canvas.width, canvas.height)
                                }
                              }
                            }, 150)
                            canvasRef.current.intervalId = interval
                          }}
                          onPause={() => {
                            if (canvasRef.current?.intervalId) clearInterval(canvasRef.current.intervalId)
                            canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                          }}
                        />

                        {recording && (
                          <div className="absolute inset-0 border-4 border-red-500 rounded-xl pointer-events-none">
                            <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 rounded-lg px-3 py-1.5 z-10">
                              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                              <span className="text-white text-xs font-bold">REC</span>
                            </div>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 z-10">
                              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                                <motion.circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--mc-coral)" strokeWidth="2"
                                  strokeDasharray={`${(countdown / RECORD_SECONDS) * 100} 100`} strokeLinecap="round" />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg drop-shadow-md">{countdown}</span>
                            </div>
                          </div>
                        )}

                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ transform: 'scaleX(-1) translateZ(0)' }} />

                        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                          <AnimatePresence>
                            {floatingEmojis.map(emoji => (
                              <motion.div
                                key={emoji.id}
                                initial={{ opacity: 0, y: 50, scale: 0.5, x: emoji.left }}
                                animate={{ opacity: [0, 1, 0], y: -150 - Math.random() * 100, scale: 1, x: `calc(${emoji.left} + ${Math.random() > 0.5 ? 20 : -20}px)` }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 2 + Math.random(), ease: 'easeOut' }}
                                className="absolute bottom-0"
                                style={{ fontSize: `${emoji.size}px`, transform: 'translateX(-50%)' }}
                                onAnimationComplete={() => setFloatingEmojis(prev => prev.filter(e => e.id !== emoji.id))}
                              >
                                {EMOTION_EMOJI[emoji.emotion]}
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>

                        {videoBlob && !recording && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                            <div className="text-center">
                              <p className="mc-text-sage font-semibold text-xl">✅ Recording Complete!</p>
                              <p className="mc-text-muted text-sm mt-1">Click Analyze to detect emotions</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mc-subcard p-6 md:p-8 text-center w-full">
                    <h2 className="mc-heading text-xl mc-text-paper mb-4 flex items-center justify-center gap-2">
                      <Brain className="mc-text-coral" size={22} /> AI Analysis
                    </h2>
                    {permission ? (
                      <>
                        <p className="mc-body text-[15px] mc-text-muted mb-6 leading-relaxed">
                          {modelsLoaded ? (
                            <><span className="mc-text-coral font-semibold">💡 Instruction:</span> Look at the camera and speak naturally about your feelings for 20 seconds. Keep your face clearly visible.</>
                          ) : (
                            <>⏳ Initializing secure face tracking models...</>
                          )}
                        </p>
                        <div className="flex gap-3 justify-center flex-wrap">
                          {!recording && !videoBlob && (
                            <motion.button type="button" onClick={startRecording} disabled={!modelsLoaded}
                              className={`mc-btn-primary px-8 py-3.5 text-sm ${!modelsLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
                              whileHover={modelsLoaded ? { scale: 1.02 } : {}}>
                              <Camera size={18} /> Start 20-sec Recording
                            </motion.button>
                          )}
                          {recording && (
                            <motion.button type="button" onClick={stopRecording}
                              className="px-8 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center gap-2"
                              whileHover={{ scale: 1.02 }}>
                              <StopCircle size={18} /> Stop Recording
                            </motion.button>
                          )}
                          {videoBlob && !recording && (
                            <div className="flex gap-3 w-full flex-col sm:flex-row justify-center">
                              <button type="button" onClick={() => {
                                setVideoBlob(null)
                                if (!stream?.active) requestCamera().then(() => startRecording())
                                else startRecording()
                              }} className="mc-btn-secondary px-6 py-3 text-sm">
                                <RefreshCw size={16} /> Retake
                              </button>
                              <motion.button type="button" onClick={uploadAndAnalyze} disabled={loading}
                                className="mc-btn-primary px-6 py-3 text-sm" whileHover={{ scale: 1.02 }}>
                                {loading ? <><div className="mc-spinner" /> Analyzing...</> : <><Upload size={16} /> Analyze Face</>}
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="mc-body text-[15px] mc-text-muted">
                        Enable your camera to continue. Use a well-lit environment.
                      </p>
                    )}
                  </div>
                </div>

                {(recording || videoBlob) && !result && (
                  <div className="lg:col-span-5 flex flex-col gap-4 w-full">
                    {permission && (
                      <motion.div className="mc-subcard p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="mc-caption mb-3 mc-text-coral">Live Emotion Activity</h3>
                        <div className="space-y-3">
                          {Object.entries(liveScores).map(([emotion, score]) => (
                            <div key={emotion} className="flex items-center gap-3">
                              <div className="w-24 text-xs mc-text-muted text-right">{emotion} {EMOTION_EMOJI[emotion]}</div>
                              <div className="mc-live-bar-track">
                                <motion.div className="mc-live-bar-fill" style={{ backgroundColor: EMOTION_COLORS[emotion] }}
                                  animate={{ width: `${score}%` }} transition={{ duration: 0.6, ease: 'linear' }} />
                              </div>
                              <div className="w-12 text-xs font-mono mc-text-paper">{Math.round(score)}%</div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {permission && timelineData.length > 0 && (
                      <motion.div className="mc-subcard p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="mc-caption mb-3 mc-text-coral">Emotional State Timeline</h3>
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--mc-line)" vertical={false} />
                            <XAxis dataKey="time" stroke="var(--mc-muted)" fontSize={10} tickMargin={8} />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip contentStyle={{ background: 'var(--mc-ink)', border: '1px solid var(--mc-line)', borderRadius: 12, color: 'var(--mc-paper)' }} />
                            {Object.keys(EMOTION_COLORS).map(emp => (
                              <Line key={emp} type="monotone" dataKey={emp} stroke={EMOTION_COLORS[emp]} strokeWidth={2} dot={false} isAnimationActive={false} />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </motion.div>
                    )}

                    {recording && dominantEmotion && (
                      <motion.div className="mc-subcard p-3 text-center" style={{ borderLeft: `4px solid ${EMOTION_COLORS[dominantEmotion]}` }}
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} key={dominantEmotion}>
                        <p className="text-sm font-medium" style={{ color: EMOTION_COLORS[dominantEmotion] }}>
                          {INSIGHT_TEXTS[dominantEmotion]}
                        </p>
                      </motion.div>
                    )}

                    <motion.div className="mc-subcard p-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <h3 className="mc-caption mb-3 mc-text-coral">Live Frame Count Summary</h3>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {Object.entries(liveCounts).map(([emp, count]) => (
                          <div key={emp} className="mc-frame-chip">
                            <div className="text-xl leading-none mb-1">{EMOTION_EMOJI[emp]}</div>
                            <div className="mc-caption text-[9px]">{emp}</div>
                            <div className="mc-text-coral font-mono text-lg font-bold mt-1 leading-none">{count}</div>
                            <div className="text-[9px] uppercase mc-text-muted mt-0.5">frames</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            ) : (
              <motion.div className="space-y-6" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    ['Emotion', result.facial_emotion, 'var(--mc-coral)'],
                    ['Severity', `${result.severity_score}/10`, SEVERITY_COLOR(result.severity_score)],
                    ['Confidence', `${(result.confidence * 100).toFixed(1)}%`, 'var(--mc-sage)']
                  ].map(([k, v, c]) => (
                    <div key={k} className="mc-metric-tile">
                      <div className="mc-display text-3xl lg:text-4xl mb-1" style={{ color: c }}>{v}</div>
                      <div className="mc-caption mt-2">{k}</div>
                    </div>
                  ))}
                </div>

                <div className="mc-insight-banner">
                  <h3 className="mc-caption mb-2 flex items-center gap-2">
                    <Brain size={14} className="mc-text-coral" /> AI Counsellor Insight
                  </h3>
                  <p className="mc-body text-base mc-text-paper italic leading-relaxed">
                    “{{
                      Happy: "You seem to be experiencing positive emotions. It's wonderful to see you in a good space. Hold on to this feeling!",
                      Sad: "We detected signs of sadness. It's completely okay to feel this way. Remember to be gentle with yourself right now.",
                      Fear: 'We noticed expressions that may indicate fear or anxiety. Take a slow, deep breath. You are in a safe space.',
                      Disgust: "There are hints of discomfort or aversion. We're here to help you unpack those feelings safely.",
                      Surprise: "We saw a reaction of surprise. Whether it's positive or overwhelming, take a moment to process what you're feeling.",
                      Angry: 'We detected high levels of frustration or anger. Take a deep breath, this is a safe space to express yourself.',
                      Neutral: "You're displaying a calm and balanced state. Sometimes neutral is exactly what we need for clarity and focus."
                    }[result.facial_emotion] || "Let's continue to explore your emotions."}”
                  </p>
                </div>

                <div className="mc-card-form p-6">
                  <h3 className="mc-caption mb-4 flex items-center gap-2">
                    <Activity size={14} className="mc-text-coral" /> Advanced Psychological Metrics
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="mc-subcard p-4">
                      <div className="mc-caption mb-1">Derived Complex Emotion</div>
                      <div className="mc-text-coral font-semibold text-sm sm:text-base">{getComplexEmotion()}</div>
                    </div>
                    <div className="mc-subcard p-4">
                      <div className="mc-caption mb-1">Emotional Volatility (Mood Swings)</div>
                      <div className="mc-text-coral font-semibold text-sm sm:text-base">{calculateVolatility()}</div>
                    </div>
                  </div>
                </div>

                {pieData.length > 0 && (
                  <div className="mc-card-form p-6">
                    <h3 className="mc-caption mb-4">📊 Emotion Distribution</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                          label={({ name, value }) => (value > 0 ? `${name}: ${value}%` : '')}>
                          {pieData.map(e => <Cell key={e.name} fill={EMOTION_COLORS[e.name] || '#6366F1'} />)}
                        </Pie>
                        <Tooltip formatter={v => `${v}%`} contentStyle={{ background: 'var(--mc-ink)', border: '1px solid var(--mc-line)', borderRadius: 12, color: 'var(--mc-paper)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {timelineData.length > 0 && (
                  <div className="mc-card-form p-6">
                    <h3 className="mc-caption mb-3">Session Timeline Summary</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--mc-line)" vertical={false} />
                        <XAxis dataKey="time" stroke="var(--mc-muted)" fontSize={10} tickMargin={8} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip contentStyle={{ background: 'var(--mc-ink)', border: '1px solid var(--mc-line)', borderRadius: 12, color: 'var(--mc-paper)' }} />
                        {Object.keys(EMOTION_COLORS).map(emp => (
                          <Line key={emp} type="monotone" dataKey={emp} stroke={EMOTION_COLORS[emp]} strokeWidth={2} dot={false} isAnimationActive={false} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="mc-card-form p-6">
                  <h3 className="mc-caption mb-4 text-center">Session Frame Metrics</h3>
                  <div className="flex flex-wrap justify-center gap-3">
                    {Object.entries(liveCounts).map(([emp, count]) => (
                      <div key={emp} className="mc-frame-chip min-w-[80px] py-3 px-4">
                        <div className="text-xl leading-none mb-1">{EMOTION_EMOJI[emp]}</div>
                        <div className="mc-text-coral text-xl font-bold leading-none my-1">{count}</div>
                        <div className="mc-caption text-[10px]">{emp}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 mt-4 flex-col md:flex-row">
                  <button type="button" onClick={handleRetry} className="mc-btn-secondary flex-1 py-3.5 text-sm">
                    <RefreshCw size={16} /> Retake Analysis
                  </button>
                  <motion.button type="button" onClick={() => nav('/voice')} className="mc-btn-primary flex-1 py-3.5 text-sm" whileHover={{ scale: 1.02 }}>
                    Proceed to Step 4 → Voice Analysis
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
