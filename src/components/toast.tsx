"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { CheckCircle2, XCircle, Info, X } from "lucide-react"

type ToastType = "success" | "error" | "info"

interface ToastItem {
  id: number
  message: string
  type: ToastType
  createdAt: number
}

interface ToastDisplayProps {
  toast: ToastItem
  onDismiss: (id: number) => void
}

let toastId = 0
let addToastFn: ((toast: ToastItem) => void) | null = null

export function showToast(message: string, type: ToastType = "info"): void {
  const toast: ToastItem = {
    id: ++toastId,
    message,
    type,
    createdAt: Date.now(),
  }
  addToastFn?.(toast)
}

const typeConfig: Record<
  ToastType,
  { border: string; bg: string; bar: string; icon: React.ReactNode }
> = {
  success: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    bar: "bg-emerald-400",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
  },
  error: {
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    bar: "bg-red-400",
    icon: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
  },
  info: {
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/10",
    bar: "bg-indigo-400",
    icon: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
  },
}

function ToastDisplay({ toast, onDismiss }: ToastDisplayProps) {
  const config = typeConfig[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl min-w-[320px] max-w-[420px] relative overflow-hidden ${config.bg} ${config.border}`}
    >
      {config.icon}
      <span className="text-sm text-slate-100 flex-1 pt-0.5">
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-0.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-colors"
        aria-label="Schliessen"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 3, ease: "linear" }}
        className={`absolute bottom-0 left-0 h-[3px] rounded-full ${config.bar}`}
      />
    </motion.div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  )

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  useEffect(() => {
    addToastFn = (toast: ToastItem) => {
      setToasts((prev) => [...prev, toast])
      const timer = setTimeout(() => {
        dismissToast(toast.id)
      }, 3000)
      timersRef.current.set(toast.id, timer)
    }
    return () => {
      addToastFn = null
      timersRef.current.forEach((timer) => clearTimeout(timer))
      timersRef.current.clear()
    }
  }, [dismissToast])

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastDisplay toast={t} onDismiss={dismissToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
