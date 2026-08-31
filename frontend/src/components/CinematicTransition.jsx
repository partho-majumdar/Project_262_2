import React from 'react'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

const ease = [0.76, 0, 0.24, 1]

const panelVariants = {
  initial: {
    scaleY: 1,
    transformOrigin: 'top',
  },
  animate: {
    scaleY: 0,
    transformOrigin: 'top',
    transition: { duration: 0.55, ease, delay: 0.1 },
  },
  exit: {
    scaleY: 1,
    transformOrigin: 'bottom',
    transition: { duration: 0.42, ease },
  },
}

const contentVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.45, delay: 0.65, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
}

export default function CinematicTransition({ children }) {
  const location = useLocation()

  return (
    <>
      <motion.div
        key={location.pathname + '-content'}
        variants={contentVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ width: '100%', minHeight: '100vh' }}
      >
        {children}
      </motion.div>

      <motion.div
        key={location.pathname + '-panel'}
        variants={panelVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9000,
          pointerEvents: 'none',
          background: '#10131a',
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(237, 233, 226, 0.02) 2px,
              rgba(237, 233, 226, 0.02) 4px
            )
          `,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #ff7a59, transparent)',
            boxShadow: '0 0 20px 4px rgba(255, 122, 89, 0.45)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'rgba(255, 122, 89, 0.35)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            fontFamily: 'Inter, system-ui, sans-serif',
            userSelect: 'none',
          }}
        >
          Mindora AI
        </div>
      </motion.div>
    </>
  )
}