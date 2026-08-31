import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
    Brain, MessageCircle, Camera, Mic, TrendingUp, Shield,
    ArrowRight, ChevronRight,
    Lock, Server, Eye, CheckCircle2,
    Home, Layers, Route, Cpu, Info,
    Sparkles, Network, GitMerge, Gauge,
} from 'lucide-react'

const features = [
    { icon: Brain, title: 'Behaviour AI', desc: 'Reads lifestyle and daily-habit signals for early stress patterns.' },
    { icon: MessageCircle, title: 'Guided Chat', desc: 'A conversational check-in with real-time crisis detection built in.' },
    { icon: Camera, title: 'Facial Read', desc: 'Decodes micro-expressions from a short video frame, nothing stored.' },
    { icon: Mic, title: 'Voice Read', desc: 'Extracts vocal-stress markers from tone, pace, and tremor.' },
    { icon: TrendingUp, title: 'Severity Score', desc: 'Fuses every signal into one clinically-weighted result.' },
    { icon: Shield, title: 'Safety Routing', desc: 'High-risk results are routed straight to emergency support.' },
]

const steps = [
    { n: '01', title: 'Create an account', desc: 'Sign up in under thirty seconds.', icon: Brain },
    { n: '02', title: 'Answer a few questions', desc: 'A short lifestyle questionnaire.', icon: MessageCircle },
    { n: '03', title: 'Talk it through', desc: 'A guided chat session, at your pace.', icon: Camera },
    { n: '04', title: 'Quick face & voice scan', desc: 'Under a minute, nothing is saved.', icon: Mic },
    { n: '05', title: 'Get your score', desc: 'A clear, personalised assessment.', icon: TrendingUp },
    { n: '06', title: 'See it over time', desc: 'A dashboard that tracks the trend.', icon: Shield },
]

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
    }),
}
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const revealProps = { variants: fadeUp, initial: 'hidden', whileInView: 'show', viewport: { once: true, margin: '-60px' } }

function BreathLine({ compact = false }) {
    const h = compact ? 90 : 220
    return (
        <svg
            viewBox={`0 0 640 ${h}`}
            width="100%"
            height={h}
            style={{ overflow: 'visible' }}
            aria-hidden="true"
        >
            <path
                d={`M0 ${h / 2} C 80 ${h / 2}, 110 ${h * 0.2}, 160 ${h * 0.2} S 240 ${h * 0.85}, 300 ${h * 0.85} S 380 ${h * 0.15}, 440 ${h * 0.15} S 520 ${h / 2}, 640 ${h / 2}`}
                fill="none"
                stroke="url(#mc-line-grad)"
                strokeWidth={compact ? 1.5 : 2}
                strokeLinecap="round"
                className="mc-draw"
            />
            <g className="mc-breathe">
                <circle cx="300" cy={h * 0.85} r={compact ? 3 : 4} fill="var(--mc-coral)" />
            </g>
            <defs>
                <linearGradient id="mc-line-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--mc-sage)" stopOpacity="0.7" />
                    <stop offset="50%" stopColor="var(--mc-coral)" />
                    <stop offset="100%" stopColor="var(--mc-sage)" stopOpacity="0.7" />
                </linearGradient>
            </defs>
        </svg>
    )
}

const DOCK_ITEMS = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'features', label: 'Features', icon: Layers },
    { id: 'how-it-works', label: 'Process', icon: Route },
    { id: 'technology', label: 'Tech', icon: Cpu },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'about', label: 'About', icon: Info },
]

function BottomDock({ active, onNavigate }) {
    return (
        <div className="mc-dock-wrap">
            <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="mc-dock"
            >
                <button className="mc-dock-brand" onClick={() => onNavigate('home')} aria-label="MindCare AI home">
                    <Brain size={14} color="#10131a" />
                </button>

                <span className="mc-dock-divider" />

                {DOCK_ITEMS.filter(i => i.id !== 'home').map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className="mc-dock-item"
                        data-active={active === item.id}
                        aria-label={item.label}
                    >
                        <item.icon size={15} />
                        <span className="mc-dock-label">{item.label}</span>
                    </button>
                ))}

                <button onClick={() => onNavigate('cta-register')} className="mc-dock-cta">
                    Get started
                </button>
            </motion.div>
        </div>
    )
}

function SignalPanel() {
    const rows = [
        { label: 'Behaviour', value: 82, icon: Brain },
        { label: 'Voice', value: 91, icon: Mic },
        { label: 'Facial', value: 76, icon: Camera },
        { label: 'Chat', value: 88, icon: MessageCircle },
    ]
    return (
        <div className="mc-card p-7 flex flex-col gap-5">
            <span className="mc-caption">Read in isolation</span>
            <div className="flex flex-col gap-4">
                {rows.map((r, i) => (
                    <div key={r.label} className="flex items-center gap-3">
                        <r.icon size={13} style={{ color: 'var(--mc-muted)', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--mc-muted)', width: 62, flexShrink: 0 }}>{r.label}</span>
                        <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'rgba(237,233,226,0.08)', overflow: 'hidden' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${r.value}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                style={{ height: '100%', borderRadius: 999, background: 'var(--mc-muted)' }}
                            />
                        </div>
                        <span className="mc-caption" style={{ width: 26, textAlign: 'right' }}>{r.value}</span>
                    </div>
                ))}
            </div>
            <p className="mc-body" style={{ fontSize: 12, color: 'var(--mc-muted)' }}>
                Four separate readings, four separate stories — none of them complete on its own.
            </p>
        </div>
    )
}

function ScoreDial() {
    const radius = 68
    const circumference = 2 * Math.PI * radius
    return (
        <div className="mc-card p-7 flex flex-col items-center gap-5">
            <span className="mc-caption">Fused in real time</span>
            <svg viewBox="0 0 180 180" width="170" height="170">
                <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(237,233,226,0.08)" strokeWidth="10" />
                <motion.circle
                    cx="90" cy="90" r={radius} fill="none" stroke="url(#mc-dial-grad)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    whileInView={{ strokeDashoffset: circumference * (1 - 0.92) }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    transform="rotate(-90 90 90)"
                />
                <defs>
                    <linearGradient id="mc-dial-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="var(--mc-coral)" />
                        <stop offset="100%" stopColor="var(--mc-sage)" />
                    </linearGradient>
                </defs>
                <text x="90" y="84" textAnchor="middle" fontFamily="var(--font-display)" fontSize="34" fontWeight="500" fill="var(--mc-paper)">92</text>
                <text x="90" y="104" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="8.5" letterSpacing="1.5" fill="var(--mc-muted)">WELLNESS INDEX</text>
            </svg>
            <div className="flex items-center gap-4 flex-wrap justify-center">
                {['Behaviour', 'Voice', 'Facial', 'Chat'].map((l) => (
                    <span key={l} style={{ fontSize: 10.5, color: 'var(--mc-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--mc-sage)' }} />
                        {l}
                    </span>
                ))}
            </div>
        </div>
    )
}

function smoothPath(pts) {
    if (pts.length < 2) return ''
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? i : i - 1]
        const p1 = pts[i]
        const p2 = pts[i + 1]
        const p3 = pts[i + 2] || p2
        const cp1x = p1.x + (p2.x - p0.x) / 6
        const cp1y = p1.y + (p2.y - p0.y) / 6
        const cp2x = p2.x - (p3.x - p1.x) / 6
        const cp2y = p2.y - (p3.y - p1.y) / 6
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }
    return d
}

function WellnessChart() {
    const values = [54, 58, 55, 63, 61, 70, 75, 84, 92]
    const W = 480, H = 200, padX = 8, padY = 16
    const min = 40, max = 100
    const pts = values.map((v, i) => ({
        x: padX + (i * (W - padX * 2)) / (values.length - 1),
        y: padY + (1 - (v - min) / (max - min)) * (H - padY * 2),
    }))
    const linePath = smoothPath(pts)
    const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`
    const gridLines = [0, 0.25, 0.5, 0.75, 1]
    const last = pts[pts.length - 1]

    return (
        <div className="mc-card p-7 flex flex-col gap-5 relative">
            <div className="flex items-center justify-between">
                <span className="mc-caption">Wellness trend · 9 weeks</span>
                <span className="flex items-center gap-1.5" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mc-sage)' }}>
                    <TrendingUp size={13} />
                    +38%
                </span>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow: 'visible' }}>
                {gridLines.map((g) => (
                    <line key={g} x1="0" x2={W} y1={padY + g * (H - padY * 2)} y2={padY + g * (H - padY * 2)} stroke="rgba(237,233,226,0.06)" strokeWidth="1" />
                ))}

                <defs>
                    <linearGradient id="mc-area-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--mc-coral)" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="var(--mc-coral)" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="mc-line-grad-2" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--mc-sage)" />
                        <stop offset="100%" stopColor="var(--mc-coral)" />
                    </linearGradient>
                </defs>

                <motion.path
                    d={areaPath}
                    fill="url(#mc-area-grad)"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                />
                <motion.path
                    d={linePath}
                    fill="none"
                    stroke="url(#mc-line-grad-2)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                />
                <circle cx={last.x} cy={last.y} r="4.5" fill="var(--mc-coral)" className="mc-breathe" />
            </svg>

            <div className="flex items-center justify-between" style={{ fontSize: 10.5, color: 'var(--mc-muted)' }}>
                <span>9 weeks ago</span>
                <span>Today</span>
            </div>

            <p className="mc-body" style={{ fontSize: 12, color: 'var(--mc-muted)' }}>
                Every completed session adds a point — the trend is the point, not any single score.
            </p>
        </div>
    )
}

function lerpColor(c1, c2, t) {
    const a = c1.match(/\d+/g).map(Number)
    const b = c2.match(/\d+/g).map(Number)
    const r = Math.round(a[0] + (b[0] - a[0]) * t)
    const g = Math.round(a[1] + (b[1] - a[1]) * t)
    const bch = Math.round(a[2] + (b[2] - a[2]) * t)
    return `rgb(${r}, ${g}, ${bch})`
}

function windingPath(pts, amp) {
    if (pts.length < 2) return ''
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i], p1 = pts[i + 1]
        const dir = i % 2 === 0 ? 1 : -1
        const c1y = p0.y + (p1.y - p0.y) * 0.33
        const c2y = p0.y + (p1.y - p0.y) * 0.67
        d += ` C ${p0.x + dir * amp} ${c1y}, ${p1.x + dir * amp} ${c2y}, ${p1.x} ${p1.y}`
    }
    return d
}

function ProcessPath({ steps }) {
    const rowH = 168
    const railW = 88
    const totalH = rowH * steps.length
    const pts = steps.map((_, i) => ({ x: railW / 2, y: rowH * i + rowH / 2 }))
    const pathD = windingPath(pts, 26)

    return (
        <div className="relative">
            <svg
                className="absolute left-0 top-0"
                width={railW}
                height={totalH}
                viewBox={`0 0 ${railW} ${totalH}`}
                style={{ overflow: 'visible' }}
                aria-hidden="true"
            >
                <motion.path
                    d={pathD}
                    fill="none"
                    stroke="url(#mc-process-grad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                />
                <defs>
                    <linearGradient id="mc-process-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--mc-coral)" />
                        <stop offset="100%" stopColor="var(--mc-sage)" />
                    </linearGradient>
                </defs>
            </svg>

            <div className="flex flex-col">
                {steps.map((step, i) => {
                    const tint = lerpColor('rgb(255,122,89)', 'rgb(127,169,142)', i / (steps.length - 1))
                    const isLast = i === steps.length - 1
                    return (
                        <motion.div
                            key={step.n}
                            initial={{ opacity: 0, x: -14 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                            className="flex items-center gap-6"
                            style={{ minHeight: rowH }}
                        >
                            <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: railW }}>
                                {isLast && (
                                    <span className="mc-breathe" style={{ position: 'absolute', width: 46, height: 46, borderRadius: '50%', background: 'rgba(127,169,142,0.18)' }} />
                                )}
                                <div className="relative flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: '50%', background: `${tint.replace('rgb', 'rgba').replace(')', ', 0.16)')}`, border: `1px solid ${tint.replace('rgb', 'rgba').replace(')', ', 0.4)')}` }}>
                                    <step.icon size={15} style={{ color: tint }} />
                                    <span
                                        className="absolute flex items-center justify-center"
                                        style={{
                                            top: -6, right: -8, width: 18, height: 18, borderRadius: '50%',
                                            background: 'var(--mc-ink)', border: '1px solid var(--mc-line)',
                                            fontFamily: 'var(--font-sans)', fontSize: 8.5, fontWeight: 700, color: 'var(--mc-muted)',
                                        }}
                                    >
                                        {step.n}
                                    </span>
                                </div>
                            </div>
                            <div
                                className="mc-card flex-1 flex flex-col gap-1 p-5"
                                onMouseEnter={e => e.currentTarget.style.borderColor = tint.replace('rgb', 'rgba').replace(')', ', 0.35)')}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--mc-line)'}
                            >
                                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--mc-paper)' }}>{step.title}</span>
                                <p className="mc-body" style={{ fontSize: 12.5, color: 'var(--mc-muted)' }}>{step.desc}</p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

function AccuracyChart() {
    const chartH = 148
    const data = [
        { label: 'Behaviour', sub: 'Gradient boosting', value: 94 },
        { label: 'Facial', sub: 'ResNet CNN', value: 91 },
        { label: 'Voice', sub: 'Custom CNN', value: 98 },
        { label: 'Chat / NLP', sub: 'Sentiment fusion', value: 93 },
    ]
    return (
        <div className="mc-card p-7 flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between">
                <span className="mc-caption">Accuracy by model · held-out test set</span>
                <span style={{ fontSize: 10, color: 'var(--mc-sage)', border: '1px solid rgba(127,169,142,0.35)', borderRadius: 999, padding: '2px 9px' }}>
                    90%+ avg
                </span>
            </div>
            <div className="flex items-end justify-center gap-8 md:gap-10" style={{ height: chartH }}>
                {data.map((d, i) => {
                    const tint = lerpColor('rgb(255,122,89)', 'rgb(127,169,142)', i / (data.length - 1))
                    const barH = (chartH * d.value) / 100
                    return (
                        <div key={d.label} className="flex flex-col items-center" style={{ height: chartH, justifyContent: 'flex-end' }}>
                            <motion.span
                                initial={{ opacity: 0, y: 6 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.15 + 0.4 }}
                                style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--mc-paper)', marginBottom: 6 }}
                            >
                                {d.value}%
                            </motion.span>
                            <motion.div
                                initial={{ height: 0 }}
                                whileInView={{ height: barH }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    width: 38, borderRadius: '10px 10px 4px 4px',
                                    background: `linear-gradient(180deg, ${tint}, ${tint.replace('rgb', 'rgba').replace(')', ', 0.3)')})`,
                                }}
                            />
                        </div>
                    )
                })}
            </div>
            <div className="flex items-start justify-center gap-8 md:gap-10">
                {data.map((d) => (
                    <div key={d.label} className="flex flex-col items-center gap-0.5" style={{ width: 66 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--mc-muted)', textAlign: 'center' }}>{d.label}</span>
                        <span className="mc-caption" style={{ textAlign: 'center', lineHeight: 1.4 }}>{d.sub}</span>
                    </div>
                ))}
            </div>
            <p className="mc-body" style={{ fontSize: 12, color: 'var(--mc-muted)' }}>
                Every one of the four models clears 90% on its held-out set — the fusion engine inherits that floor rather than averaging it away.
            </p>
        </div>
    )
}

function FusionPanel() {
    const bands = [
        { label: 'Low', range: '0–30', color: 'var(--mc-sage)', width: 30 },
        { label: 'Moderate', range: '31–55', color: '#e8c97a', width: 25 },
        { label: 'High', range: '56–79', color: 'var(--mc-coral)', width: 24 },
        { label: 'Critical', range: '80–100', color: '#e05a5a', width: 21 },
    ]
    return (
        <div className="mc-card p-7 flex flex-col gap-6 h-full">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,122,89,0.14)' }}>
                    <GitMerge size={15} style={{ color: 'var(--mc-coral)' }} />
                </div>
                <span className="mc-caption">Weighted fusion engine</span>
            </div>

            <p className="mc-body" style={{ fontSize: 13, color: 'var(--mc-muted)' }}>
                Behaviour, facial, voice, and chat scores are never averaged blindly. Each model's confidence adjusts its weight in real time, so a strong voice read can outvote a weak facial one — then the result lands on a four-tier risk scale.
            </p>

            <div className="flex flex-col gap-3">
                <div className="flex w-full rounded-full overflow-hidden" style={{ height: 8 }}>
                    {bands.map((b) => (
                        <motion.span
                            key={b.label}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            style={{ width: `${b.width}%`, background: b.color }}
                        />
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    {bands.map((b) => (
                        <div key={b.label} className="flex items-center gap-2">
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: 'var(--mc-paper)', fontWeight: 600 }}>{b.label}</span>
                            <span className="mc-caption" style={{ marginLeft: 'auto' }}>{b.range}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-1" style={{ borderTop: '1px solid var(--mc-line)' }}>
                {[
                    { icon: Network, text: 'Four models run independently, in parallel' },
                    { icon: Gauge, text: 'Confidence-weighted, not a flat average' },
                    { icon: Sparkles, text: 'Critical results trigger safety routing instantly' },
                ].map((row) => (
                    <div key={row.text} className="flex items-center gap-2.5 pt-1">
                        <row.icon size={13} style={{ color: 'var(--mc-sage)', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--mc-muted)' }}>{row.text}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function CountUp({ target, suffix = '' }) {
    const [count, setCount] = useState(0)
    const ref = useRef(null)
    const started = useRef(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true
                    let start = 0
                    const duration = 1000
                    const step = (ts) => {
                        if (!start) start = ts
                        const progress = Math.min((ts - start) / duration, 1)
                        setCount(Math.floor(progress * target))
                        if (progress < 1) requestAnimationFrame(step)
                    }
                    requestAnimationFrame(step)
                }
            },
            { threshold: 0.5 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [target])

    return <span ref={ref}>{count}{suffix}</span>
}

export default function Landing() {
    const nav = useNavigate()
    const [footerModal, setFooterModal] = useState({ isOpen: false, title: '', message: '' })
    const [active, setActive] = useState('home')

    useEffect(() => {
        const ids = DOCK_ITEMS.map(i => i.id)
        const els = ids.map(id => document.getElementById(id)).filter(Boolean)
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActive(entry.target.id)
                })
            },
            { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
        )
        els.forEach(el => observer.observe(el))
        return () => observer.disconnect()
    }, [])

    const handleDockNavigate = (id) => {
        if (id === 'cta-register') { nav('/register'); return }
        if (id === 'home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className="w-full overflow-x-hidden">
            <BottomDock active={active} onNavigate={handleDockNavigate} />

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <section id="home" className="relative w-full" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', paddingTop: 'clamp(100px, 15vh, 150px)' }}>
                <div className="max-w-7xl mx-auto w-full px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div initial="hidden" animate="show" variants={stagger} className="flex flex-col gap-6">
                        <motion.div variants={fadeUp} className="flex items-center gap-2.5">
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mc-coral)' }} />
                            <span className="mc-caption" style={{ color: 'var(--mc-sage)' }}>
                                Multimodal mental health AI
                            </span>
                        </motion.div>

                        <motion.h1
                            variants={fadeUp}
                            className="mc-serif"
                            style={{
                                fontSize: 'clamp(40px, 5.4vw, 68px)',
                                fontWeight: 500,
                                lineHeight: 1.15,
                                letterSpacing: '-0.01em',
                                color: 'var(--mc-paper)'
                            }}
                        >
                            Understanding your mind, <span className="mc-gradient-text">at scale.</span>
                        </motion.h1>

                        <motion.p
                            variants={fadeUp}
                            className="mc-body"
                            style={{ fontSize: 16, color: 'var(--mc-muted)', maxWidth: 460 }}
                        >
                            One assessment reads behaviour, voice, and expression together — the way a clinician would, in under two minutes.
                        </motion.p>

                        <motion.div variants={fadeUp} className="flex items-center gap-4 flex-wrap pt-2">
                            <button onClick={() => nav('/register')} className="mc-btn-primary group" style={{ padding: '14px 30px', fontSize: 13 }}>
                                Begin assessment
                                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200" />
                            </button>
                            <button onClick={() => nav('/login')} className="mc-btn-secondary" style={{ padding: '14px 26px', fontSize: 13 }}>
                                Sign in
                                <ChevronRight size={14} />
                            </button>
                        </motion.div>

                        <motion.div variants={fadeUp} className="flex items-center gap-7 flex-wrap pt-4" style={{ borderTop: '1px solid var(--mc-line)', marginTop: 6 }}>
                            {[{ v: 4, s: '', l: 'AI models' }, { v: 100, s: '%', l: 'Private' }, { v: 2, s: 'min', l: 'Per session' }].map(({ v, s, l }) => (
                                <div key={l} className="flex flex-col gap-1">
                                    <span className="mc-serif" style={{ fontSize: 26, fontWeight: 500, color: 'var(--mc-paper)' }}>
                                        <CountUp target={v} suffix={s} />
                                    </span>
                                    <span className="mc-caption">{l}</span>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <WellnessChart />
                    </motion.div>
                </div>
            </section>

            {/* ── Features ─────────────────────────────────────────────── */}
            <section id="features" className="w-full" style={{ padding: 'clamp(48px, 7vw, 90px) clamp(20px, 5vw, 60px)' }}>
                <div className="max-w-7xl mx-auto flex flex-col gap-10">
                    <motion.div {...revealProps} className="flex flex-col gap-3">
                        <span className="mc-caption" style={{ color: 'var(--mc-sage)' }}>Capabilities</span>
                        <h2 className="mc-serif" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 500, lineHeight: 1.2, color: 'var(--mc-paper)', maxWidth: 560 }}>
                            Six ways of reading how you're really doing
                        </h2>
                    </motion.div>

                    <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map((f) => (
                            <motion.div
                                key={f.title}
                                variants={fadeUp}
                                className="mc-card flex flex-col gap-4 p-6"
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,122,89,0.3)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--mc-line)'}
                            >
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(127,169,142,0.14)' }}>
                                    <f.icon size={16} style={{ color: 'var(--mc-sage)' }} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <h3 style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--mc-paper)' }}>{f.title}</h3>
                                    <p className="mc-body" style={{ fontSize: 12.5, color: 'var(--mc-muted)' }}>{f.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── How it works ─────────────────────────────────────────── */}
            <section id="how-it-works" className="w-full" style={{ padding: 'clamp(48px, 7vw, 90px) clamp(20px, 5vw, 60px)', background: 'rgba(255,255,255,0.015)' }}>
                <div className="max-w-7xl mx-auto flex flex-col gap-10">
                    <motion.div {...revealProps} className="flex flex-col gap-3">
                        <span className="mc-caption" style={{ color: 'var(--mc-sage)' }}>Process</span>
                        <h2 className="mc-serif" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 500, lineHeight: 1.2, color: 'var(--mc-paper)' }}>
                            How it works
                        </h2>
                        <p className="mc-body" style={{ fontSize: 14, color: 'var(--mc-muted)', maxWidth: 420 }}>Six steps, start to finish.</p>
                    </motion.div>

                    <div className="max-w-xl mx-auto w-full">
                        <ProcessPath steps={steps} />
                    </div>
                </div>
            </section>

            {/* ── Problem / Solution ───────────────────────────────────── */}
            <section className="w-full" style={{ padding: 'clamp(56px, 8vw, 104px) clamp(20px, 5vw, 60px)' }}>
                <div className="max-w-7xl mx-auto flex flex-col gap-16">
                    <motion.div {...revealProps} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="flex flex-col gap-5">
                            <span className="mc-caption" style={{ color: 'var(--mc-sage)' }}>The problem</span>
                            <h2 className="mc-serif" style={{ fontSize: 'clamp(26px, 3.6vw, 42px)', fontWeight: 500, color: 'var(--mc-paper)', lineHeight: 1.2 }}>
                                Words are only part of how people communicate.
                            </h2>
                            <p className="mc-body" style={{ fontSize: 14.5, color: 'var(--mc-muted)', maxWidth: 460 }}>
                                A chatbot alone reads what you type. Real insight also needs tone of voice, facial expression, and behaviour over time — read together, not in isolation.
                            </p>
                        </div>
                        <SignalPanel />
                    </motion.div>

                    <motion.div {...revealProps} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="order-last lg:order-first">
                            <ScoreDial />
                        </div>
                        <div className="flex flex-col gap-5">
                            <span className="mc-caption" style={{ color: 'var(--mc-sage)' }}>The solution</span>
                            <h2 className="mc-serif" style={{ fontSize: 'clamp(26px, 3.6vw, 42px)', fontWeight: 500, color: 'var(--mc-paper)', lineHeight: 1.2 }}>
                                One score, built from four signals.
                            </h2>
                            <p className="mc-body" style={{ fontSize: 14.5, color: 'var(--mc-muted)', maxWidth: 460 }}>
                                Mindora AI fuses behaviour, voice, expression, and conversation into a single severity score, in under two minutes.
                            </p>
                            <div className="flex flex-col gap-2.5 mt-1">
                                {['Four signals read at once', 'Weighted fusion, not an average', 'Clinical-grade risk stratification', 'Automatic routing for high-risk results'].map((item) => (
                                    <div key={item} className="flex items-start gap-2.5">
                                        <CheckCircle2 size={14} style={{ color: 'var(--mc-sage)', marginTop: 2, flexShrink: 0 }} />
                                        <span style={{ fontSize: 13, color: 'var(--mc-muted)' }}>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Technology ───────────────────────────────────────────── */}
            <section id="technology" className="w-full" style={{ padding: 'clamp(56px, 8vw, 104px) clamp(20px, 5vw, 60px)', background: 'rgba(255,255,255,0.015)' }}>
                <div className="max-w-7xl mx-auto flex flex-col gap-12">
                    <motion.div {...revealProps} className="flex flex-col gap-3">
                        <span className="mc-caption" style={{ color: 'var(--mc-sage)' }}>Under the hood</span>
                        <h2 className="mc-serif" style={{ fontSize: 'clamp(26px, 3.6vw, 46px)', fontWeight: 500, lineHeight: 1.2, color: 'var(--mc-paper)', maxWidth: 540 }}>
                            The model stack
                        </h2>
                        <p className="mc-body" style={{ fontSize: 14.5, color: 'var(--mc-muted)', maxWidth: 460 }}>
                            Four independently trained models, each cleared for production at 90%+ accuracy, combined by a single fusion engine.
                        </p>
                    </motion.div>

                    <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <motion.div variants={fadeUp}><AccuracyChart /></motion.div>
                        <motion.div variants={fadeUp}><FusionPanel /></motion.div>
                    </motion.div>

                    <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {[
                            { icon: Brain, title: 'Behaviour AI', subtitle: 'Gradient boosting · 94%', desc: 'Reads sleep, activity, heart rate, and stress metrics to flag non-linear risk patterns early.', tags: ['GBM', 'Scikit-learn'] },
                            { icon: MessageCircle, title: 'Chat NLP', subtitle: 'Sentiment fusion · 93%', desc: 'Combines sentiment scoring with an LLM-guided conversation to extract triggers and intensity.', tags: ['VADER', 'LLM', 'NLP'] },
                            { icon: Camera, title: 'Facial emotion', subtitle: 'ResNet CNN · 91%', desc: 'A fine-tuned convolutional network reads dominant expression straight from the camera feed.', tags: ['ResNet', 'TensorFlow', 'OpenCV'] },
                            { icon: Mic, title: 'Voice stress', subtitle: 'Custom CNN · 98%', desc: 'MFCC and spectral features from a few seconds of speech identify emotional tone and strain.', tags: ['CNN', 'MFCC', 'Librosa'] },
                        ].map((card) => (
                            <motion.div key={card.title} variants={fadeUp} className="mc-card flex flex-col gap-4 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(127,169,142,0.14)' }}>
                                        <card.icon size={16} style={{ color: 'var(--mc-sage)' }} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="mc-caption" style={{ color: 'var(--mc-sage)' }}>{card.subtitle}</span>
                                        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--mc-paper)' }}>{card.title}</span>
                                    </div>
                                </div>
                                <p className="mc-body" style={{ fontSize: 13, color: 'var(--mc-muted)' }}>{card.desc}</p>
                                <div className="flex flex-wrap gap-2">
                                    {card.tags.map(tag => (
                                        <span key={tag} className="mc-caption" style={{ border: '1px solid var(--mc-line)', padding: '3px 10px', borderRadius: 999 }}>{tag}</span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── Security ─────────────────────────────────────────────── */}
            <section id="security" className="w-full" style={{ padding: 'clamp(56px, 8vw, 104px) clamp(20px, 5vw, 60px)' }}>
                <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-12">
                    <motion.div {...revealProps} className="flex flex-col items-center gap-4">
                        <span className="mc-caption" style={{ color: 'var(--mc-sage)' }}>Trust</span>
                        <h2 className="mc-serif" style={{ fontSize: 'clamp(26px, 3.6vw, 46px)', fontWeight: 500, lineHeight: 1.2, color: 'var(--mc-paper)', maxWidth: 480 }}>
                            Your data is never our product.
                        </h2>
                        <p className="mc-body" style={{ fontSize: 14.5, color: 'var(--mc-muted)', maxWidth: 460 }}>
                            Sessions are private, encrypted, and never stored longer than they need to be.
                        </p>
                    </motion.div>

                    <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
                        {[
                            { icon: Lock, title: 'End-to-end encryption', desc: 'All session data is encrypted in transit and at rest with AES-256.' },
                            { icon: Eye, title: 'Zero data retention', desc: 'Face and voice streams are processed live and discarded immediately.' },
                            { icon: Server, title: 'Secure architecture', desc: 'Isolated namespaces and role-based access across every service.' },
                        ].map(({ icon: Icon, title, desc }) => (
                            <motion.div key={title} variants={fadeUp} className="mc-card flex flex-col items-center text-center gap-4 p-7">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,122,89,0.12)' }}>
                                    <Icon size={20} style={{ color: 'var(--mc-coral)' }} />
                                </div>
                                <h3 style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--mc-paper)' }}>{title}</h3>
                                <p className="mc-body" style={{ fontSize: 12.5, color: 'var(--mc-muted)' }}>{desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── About / CTA ──────────────────────────────────────────── */}
            <section id="about" className="w-full" style={{ padding: 'clamp(64px, 9vw, 130px) clamp(20px, 5vw, 60px)', background: 'rgba(255,255,255,0.015)' }}>
                <motion.div {...revealProps} className="max-w-3xl mx-auto flex flex-col items-center text-center gap-8">
                    <BreathLine compact />
                    <h2 className="mc-serif" style={{ fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 500, color: 'var(--mc-paper)', lineHeight: 1.15 }}>
                        Take the first step toward <span className="mc-gradient-text">clarity.</span>
                    </h2>
                    <p className="mc-body" style={{ fontSize: 15, color: 'var(--mc-muted)', maxWidth: 480 }}>
                        A full assessment in under two minutes. Free, private, and built with clinical-grade precision.
                    </p>
                    <div className="flex items-center gap-4 flex-wrap justify-center">
                        <button onClick={() => nav('/register')} className="mc-btn-primary" style={{ padding: '16px 36px', fontSize: 13 }}>
                            Get started free
                            <ArrowRight size={15} />
                        </button>
                        <button onClick={() => nav('/login')} className="mc-btn-secondary" style={{ padding: '16px 30px', fontSize: 13 }}>
                            Sign in to dashboard
                        </button>
                    </div>
                    <div className="flex items-center gap-7 flex-wrap justify-center pt-4" style={{ borderTop: '1px solid var(--mc-line)' }}>
                        {['100% private', 'No payment required', 'Free forever'].map((item) => (
                            <span key={item} className="mc-caption">{item}</span>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <footer style={{ borderTop: '1px solid var(--mc-line)' }}>
                <div className="max-w-7xl mx-auto px-6 md:px-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 py-10" style={{ borderBottom: '1px solid var(--mc-line)' }}>
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--mc-coral)' }}>
                                <Brain size={13} color="#10131a" />
                            </div>
                            <span className="mc-serif" style={{ fontSize: 14, color: 'var(--mc-paper)' }}>Mindora AI</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => nav('/login')} style={{ fontSize: 12.5, color: 'var(--mc-muted)', background: 'none', border: 'none', padding: '8px 14px' }}>Sign in</button>
                            <button onClick={() => nav('/register')} className="mc-btn-primary" style={{ padding: '9px 20px', fontSize: 11.5 }}>Register</button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
                        <span style={{ fontSize: 11, color: 'var(--mc-muted)' }}>© 2026 Mindora AI</span>
                        <div className="flex items-center gap-6">
                            {[
                                { label: 'Privacy', message: 'Session data is end-to-end encrypted and never stored permanently.' },
                                { label: 'Terms', message: 'Mindora AI is a support tool, not a substitute for clinical medical advice.' },
                                { label: 'Contact', message: 'Reach our support team at support@mindoraai.com' },
                            ].map(item => (
                                <button
                                    key={item.label}
                                    onClick={() => setFooterModal({ isOpen: true, title: item.label, message: item.message })}
                                    style={{ background: 'none', border: 'none', fontSize: 11.5, color: 'var(--mc-muted)' }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: 10.5, color: 'var(--mc-muted)', opacity: 0.7 }}>Not a substitute for professional medical advice.</p>
                    </div>
                </div>
            </footer>

            {/* ── Footer Modal ─────────────────────────────────────────── */}
            <AnimatePresence>
                {footerModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setFooterModal({ ...footerModal, isOpen: false })}
                            className="absolute inset-0 cursor-pointer"
                            style={{ background: 'rgba(0,0,0,0.6)' }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            className="mc-card relative z-10 max-w-md w-full p-8"
                            style={{ background: '#181b23' }}
                        >
                            <h3 className="mc-serif" style={{ fontSize: 20, color: 'var(--mc-paper)', marginBottom: 12 }}>{footerModal.title}</h3>
                            <p className="mc-body" style={{ fontSize: 13.5, color: 'var(--mc-muted)', marginBottom: 24 }}>{footerModal.message}</p>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setFooterModal({ ...footerModal, isOpen: false })}
                                    className="mc-btn-secondary"
                                    style={{ padding: '9px 20px', fontSize: 12 }}
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
