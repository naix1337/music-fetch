"use client"

import * as React from "react"
import { motion, useMotionValue, useSpring } from "motion/react"
import { cn } from "@/lib/utils"

interface StarLayerProps {
  count: number
  size: number
  color: string
  speedMs: number
  twinkleSpeed?: number
  className?: string
}

function generateStars(count: number, color: string): string {
  const shadows: string[] = []
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 4000) - 2000
    const y = Math.floor(Math.random() * 4000) - 2000
    shadows.push(`${x}px ${y}px ${color}`)
  }
  return shadows.join(", ")
}

function StarLayer({
  count = 500,
  size = 1,
  color = "#fff",
  speedMs = 50000,
  twinkleSpeed = 3,
  className,
}: StarLayerProps) {
  const [boxShadow, setBoxShadow] = React.useState("")

  React.useEffect(() => {
    setBoxShadow(generateStars(count, color))
  }, [count, color])

  return (
    <motion.div
      data-slot="star-layer"
      className={cn("absolute top-0 left-0 w-full h-[2000px]", className)}
      animate={{ y: [0, -2000] }}
      transition={{
        repeat: Infinity,
        duration: speedMs / 1000,
        ease: "linear",
      }}
    >
      <motion.div
        className="absolute bg-transparent rounded-full"
        style={{
          width: size,
          height: size,
          boxShadow: boxShadow,
        }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{
          repeat: Infinity,
          duration: twinkleSpeed,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bg-transparent rounded-full top-[2000px]"
        style={{
          width: size,
          height: size,
          boxShadow: boxShadow,
        }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{
          repeat: Infinity,
          duration: twinkleSpeed + 1,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  )
}

export function StarsBackground() {
  const offsetX = useMotionValue(0)
  const offsetY = useMotionValue(0)

  const springX = useSpring(offsetX, { stiffness: 80, damping: 25 })
  const springY = useSpring(offsetY, { stiffness: 80, damping: 25 })

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      const factor = 0.12
      offsetX.set(-(e.clientX - centerX) * factor)
      offsetY.set(-(e.clientY - centerY) * factor)
    },
    [offsetX, offsetY],
  )

  return (
    <div
      data-slot="stars-background"
      className="absolute inset-0 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none"
        style={{ x: springX, y: springY }}
      >
        {/* Layer 1: Tiny white stars */}
        <StarLayer
          count={1200}
          size={1}
          color="#ffffff"
          speedMs={40000}
          twinkleSpeed={2.5}
        />
        {/* Layer 2: Small blue stars */}
        <StarLayer
          count={500}
          size={1.5}
          color="#93c5fd"
          speedMs={60000}
          twinkleSpeed={3.5}
        />
        {/* Layer 3: Medium purple stars */}
        <StarLayer
          count={250}
          size={2}
          color="#c4b5fd"
          speedMs={80000}
          twinkleSpeed={4}
        />
        {/* Layer 4: Larger cyan stars */}
        <StarLayer
          count={100}
          size={3}
          color="#67e8f9"
          speedMs={100000}
          twinkleSpeed={5}
        />
      </motion.div>
    </div>
  )
}
