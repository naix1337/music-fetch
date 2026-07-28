"use client"

import * as React from "react"
import { motion, useMotionValue, useSpring } from "motion/react"

interface StarLayerProps {
  count: number
  size: number
  color: string
  speedMs: number
  twinkleSpeed?: number
  className?: string
}

const StarLayer = React.memo(function StarLayer({
  count = 500,
  size = 1,
  color = "#fff",
  speedMs = 50000,
  twinkleSpeed = 3,
  className,
}: StarLayerProps) {
  const boxShadow = React.useMemo(() => {
    const shadows: string[] = []
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * 4000) - 2000
      const y = Math.floor(Math.random() * 4000) - 2000
      shadows.push(`${x}px ${y}px ${color}`)
    }
    return shadows.join(", ")
  }, [count, color])

  return (
    <motion.div
      data-slot="star-layer"
      className={`absolute top-0 left-0 w-full h-[2000px] pointer-events-none ${className ?? ""}`}
      animate={{ y: [0, -2000] }}
      transition={{
        repeat: Infinity,
        duration: speedMs / 1000,
        ease: "linear",
      }}
    >
      <div
        className="absolute bg-transparent rounded-full"
        style={{ width: size, height: size, boxShadow }}
      />
      <div
        className="absolute bg-transparent rounded-full top-[2000px]"
        style={{ width: size, height: size, boxShadow }}
      />
    </motion.div>
  )
})

export function StarsBackground() {
  const offsetX = useMotionValue(0)
  const offsetY = useMotionValue(0)
  const springX = useSpring(offsetX, { stiffness: 80, damping: 25 })
  const springY = useSpring(offsetY, { stiffness: 80, damping: 25 })

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      offsetX.set(-(e.clientX - centerX) * 0.12)
      offsetY.set(-(e.clientY - centerY) * 0.12)
    },
    [offsetX, offsetY],
  )

  return (
    <div
      data-slot="stars-background"
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none"
        style={{ x: springX, y: springY }}
      >
        <StarLayer count={800} size={1} color="#ffffff" speedMs={40000} twinkleSpeed={2.5} />
        <StarLayer count={350} size={1.5} color="#93c5fd" speedMs={60000} twinkleSpeed={3.5} />
        <StarLayer count={180} size={2} color="#c4b5fd" speedMs={80000} twinkleSpeed={4} />
        <StarLayer count={70} size={3} color="#67e8f9" speedMs={100000} twinkleSpeed={5} />
      </motion.div>
    </div>
  )
}
