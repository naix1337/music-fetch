"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle2, XCircle, Info } from "lucide-react"

type ToastType = "success" | "error" | "info"

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

let toastId = 0
let addToastFn: ((toast: ToastItem) => void) | null = null

export function showToast(message: string, type: ToastType = "info"): void {
  const toast: ToastItem = { id: ++toastId, message, type }
  addToastFn?.(toast)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    addToastFn = (toast: ToastItem) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 3000)
    }
    return () => {
      addToastFn = null
    }
  }, [])

  const iconMap: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-indigo-400" />,
  }

  const bgMap: Record<ToastType, string> = {
    success: "bg-green-500/10 border-green-500/30",
    error: "bg-red-500/10 border-red-500/30",
    info: "bg-indigo-500/10 border-indigo-500/30",
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-2xl transition-all duration-200 min-w-[280px] ${bgMap[t.type]}`}
        >
          {iconMap[t.type]}
          <span className="text-sm text-slate-100">{t.message}</span>
        </div>
      ))}
    </div>
  )
}
