"use client"

import { useMemo } from "react"
import { motion, type Transition } from "motion/react"

interface StarLayerProps {
  factor: number
  speed: number
  transition?: Transition
  starColor?: string
}

function StarLayer({ factor, speed, transition, starColor = "#fff" }: StarLayerProps) {
  const boxShadow = useMemo(() => {
    const count = Math.floor(100 * factor)
    const shadows: string[] = []
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 2000
      const y = Math.random() * 1000
      const size = Math.random() * 2 + 0.5
      shadows.push(`${x}px ${y}px ${size}px ${starColor}`)
      shadows.push(`${x}px ${y + 1000}px ${size}px ${starColor}`)
    }
    return shadows.join(", ")
  }, [factor, starColor])

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        width: 1,
        height: 1,
        boxShadow,
      }}
      animate={{ y: [0, -1000] }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: "linear",
        ...transition,
      }}
    />
  )
}

interface StarsBackgroundProps {
  children: React.ReactNode
}

export function StarsBackground({ children }: StarsBackgroundProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-slate-950" />
      <StarLayer factor={0.1} speed={120} starColor="rgba(148, 163, 184, 0.3)" />
      <StarLayer factor={0.05} speed={80} starColor="rgba(148, 163, 184, 0.5)" />
      <StarLayer factor={0.02} speed={40} starColor="rgba(255, 255, 255, 0.8)" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/0 via-slate-950/60 to-slate-950 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
