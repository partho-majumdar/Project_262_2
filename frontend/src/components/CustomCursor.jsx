import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function CustomCursor() {
  const [hover, setHover] = useState(false)
  const [visible, setVisible] = useState(false)

  const rawX = useMotionValue(-100)
  const rawY = useMotionValue(-100)

  const ringX = useSpring(rawX, { stiffness: 180, damping: 28 })
  const ringY = useSpring(rawY, { stiffness: 180, damping: 28 })
  const dotX = useSpring(rawX, { stiffness: 900, damping: 40 })
  const dotY = useSpring(rawY, { stiffness: 900, damping: 40 })

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    const onMove = (e) => {
      rawX.set(e.clientX)
      rawY.set(e.clientY)
      setVisible(true)
    }

    const onOver = (e) => {
      const t = e.target
      setHover(!!t.closest('button, a, label, input, select, textarea, [data-cursor]'))
    }

    const onLeave = () => setVisible(false)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)
    document.documentElement.addEventListener('mouseleave', onLeave)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null
  }

  return (
    <>
      {/* Ring */}
      <motion.div
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 9998,
          border: '1.5px solid rgba(255, 122, 89, 0.55)',
          borderRadius: '50%',
          opacity: visible ? 1 : 0,
        }}
        animate={{
          width: hover ? 44 : 32,
          height: hover ? 44 : 32,
          borderColor: hover ? 'rgba(255, 122, 89, 0.9)' : 'rgba(255, 122, 89, 0.45)',
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      />

      {/* Dot */}
      <motion.div
        style={{
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: '#ff7a59',
          opacity: visible ? 1 : 0,
        }}
      />
    </>
  )
}