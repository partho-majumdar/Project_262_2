import React from 'react'

const STEPS = ['Behaviour', 'Chat', 'Face', 'Voice']

export default function StepProgress({ current }) {
  return (
    <div
      className="w-full mb-10 px-6 py-5 rounded-2xl"
      style={{
        background: 'rgba(237, 233, 226, 0.035)',
        border: '1px solid var(--mc-line)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div className="flex items-center justify-between relative max-w-[800px] mx-auto w-full">
        <div className="absolute left-4 right-4 top-4 -translate-y-1/2 h-[2px] z-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: 'rgba(237, 233, 226, 0.12)' }}
          />
          <div
            className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-700 ease-in-out"
            style={{
              width: `${(current / (STEPS.length - 1)) * 100}%`,
              background: 'linear-gradient(90deg, var(--mc-coral), var(--mc-sage))',
              boxShadow: '0 0 14px rgba(255, 122, 89, 0.35)',
            }}
          />
        </div>

        {STEPS.map((s, i) => {
          const isDone = i < current
          const isActive = i === current

          return (
            <div key={s} className="relative z-10 flex flex-col items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500"
                style={
                  isDone
                    ? {
                        background: 'rgba(127, 169, 142, 0.18)',
                        borderColor: 'var(--mc-sage)',
                        color: 'var(--mc-sage)',
                        boxShadow: '0 0 12px rgba(127, 169, 142, 0.3)',
                      }
                    : isActive
                      ? {
                          background: 'rgba(255, 122, 89, 0.18)',
                          borderColor: 'var(--mc-coral)',
                          color: 'var(--mc-coral)',
                          boxShadow: '0 0 16px rgba(255, 122, 89, 0.4)',
                        }
                      : {
                          background: 'var(--mc-ink)',
                          borderColor: 'rgba(237, 233, 226, 0.12)',
                          color: 'var(--mc-muted)',
                        }
                }
              >
                {isDone ? '✓' : i + 1}
              </div>

              <span
                className="text-[9px] font-bold uppercase tracking-widest hidden sm:block transition-colors duration-300"
                style={{
                  color: isActive
                    ? 'var(--mc-coral)'
                    : isDone
                      ? 'var(--mc-sage)'
                      : 'var(--mc-muted)',
                }}
              >
                {s}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
