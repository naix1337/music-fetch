"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { addDownloadHistory } from "@/components/download-history"

interface DownloadItem {
  taskId: string
  title: string
  status: "active" | "completed" | "error"
  message?: string
  progress?: number
}

let _addDownloadFn: ((taskId: string, title: string) => void) | null = null

export function addDownload(taskId: string, title: string): void {
  _addDownloadFn?.(taskId, title)
}

function CompletionCheckmark() {
  const circumference = 2 * Math.PI * 10

  return (
    <div className="relative w-8 h-8 shrink-0">
      <svg className="w-8 h-8" viewBox="0 0 24 24">
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="#34d399"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <motion.path
          d="M8 12l2 2 4-4"
          fill="none"
          stroke="#34d399"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
        />
      </svg>
    </div>
  )
}

interface DownloadItemCardProps {
  download: DownloadItem
  onDismiss: (taskId: string) => void
}

function DownloadItemCard({ download, onDismiss }: DownloadItemCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        x: 100,
        transition: { duration: 0.3, ease: "easeIn" },
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "relative overflow-hidden rounded-xl border backdrop-blur-xl p-4",
        "bg-white/[0.04] border-white/[0.08]",
        download.status === "error" && "border-red-500/30",
        download.status === "completed" && "border-emerald-500/20",
      )}
    >
      {/* Error shake */}
      {download.status === "error" && (
        <motion.div
          className="absolute inset-0 bg-red-500/5 pointer-events-none"
          animate={{ x: [0, -6, 6, -6, 6, -3, 3, 0] }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      )}

      <div className="flex items-start gap-3 relative">
        {/* Status icon */}
        {download.status === "active" && (
          <div className="relative shrink-0 mt-0.5">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          </div>
        )}
        {download.status === "completed" && <CompletionCheckmark />}
        {download.status === "error" && (
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <X className="w-4 h-4 text-red-400" />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-sm font-medium text-slate-100 truncate pr-4">
            {download.title}
          </p>
          <p
            className={cn(
              "text-xs",
              download.status === "active" && "text-indigo-300/70",
              download.status === "completed" && "text-emerald-400/70",
              download.status === "error" && "text-red-400/70",
            )}
          >
            {download.status === "active" &&
              (download.message ?? "Wird heruntergeladen...")}
            {download.status === "completed" && "Download abgeschlossen"}
            {download.status === "error" &&
              (download.message ?? "Download fehlgeschlagen")}
          </p>

          {/* Progress bar */}
          {download.status === "active" && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                  initial={{ width: "0%" }}
                  animate={{ width: `${download.progress ?? 0}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono tabular-nums shrink-0 w-8 text-right">
                {download.progress ?? 0}%
              </span>
            </div>
          )}
        </div>

        {/* Dismiss button for completed/error */}
        {(download.status === "completed" || download.status === "error") && (
          <button
            onClick={() => onDismiss(download.taskId)}
            className="absolute top-0 right-0 p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-colors"
            aria-label="Entfernen"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

export function DownloadQueue() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const downloadsRef = useRef(downloads)
  downloadsRef.current = downloads
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const dismissDownload = useCallback((taskId: string) => {
    setDownloads((prev) => prev.filter((d) => d.taskId !== taskId))
  }, [])

  // SSE für Echtzeit-Updates (fallback: Polling)
  useEffect(() => {
    const evtSource = new EventSource('/api/events')
    evtSource.addEventListener('download-update', (e) => {
      try {
        const data = JSON.parse(e.data)
        setDownloads((prev) => {
          // Bei completed: in Verlauf speichern
          if (data.status === 'completed') {
            const existing = prev.find((d) => d.taskId === data.taskId)
            if (existing) {
              addDownloadHistory({
                taskId: data.taskId,
                title: existing.title,
                artist: existing.message || '',
                url: '',
                completedAt: new Date().toISOString(),
                file: '',
              })
            }
          }
          return prev.map((d) =>
            d.taskId === data.taskId
              ? { ...d, status: data.status, message: data.error || d.message, progress: data.progress }
              : d,
          )
        })
      } catch {}
    })
    return () => evtSource.close()
  }, [])

  // Adaptive polling: fallback falls SSE ausfallt
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      if (document.hidden) return // Tab nicht sichtbar
      const current = downloadsRef.current
      const activeDownloads = current.filter((d) => d.status === "active")
      if (activeDownloads.length === 0) return

      for (const download of activeDownloads) {
        try {
          const res = await fetch(`/api/status/${download.taskId}`)
          if (!res.ok) {
            if (res.status === 404) {
              setDownloads((prev) =>
                prev.map((d) =>
                  d.taskId === download.taskId
                    ? { ...d, status: "error" as const, message: "Server neu gestartet" }
                    : d,
                ),
              )
            }
            continue
          }
          const data = await res.json()

          setDownloads((prev) => {
            const existing = prev.find((d) => d.taskId === download.taskId)
            if (!existing || existing.status !== "active") return prev

            const progress = data.progress ?? existing.progress ?? 0

            if (data.status === "completed") {
              addDownloadHistory({
                taskId: download.taskId,
                title: data.result?.title ?? download.title,
                artist: data.result?.channel ?? "",
                url: data.result?.url ?? "",
                completedAt: new Date().toISOString(),
                file: data.result?.file ?? "",
              })
              setTimeout(() => {
                setDownloads((p) => p.filter((x) => x.taskId !== download.taskId))
              }, 4000)
              return prev.map((d) =>
                d.taskId === download.taskId
                  ? { ...d, status: "completed" as const, message: "Fertig", progress: 100 }
                  : d,
              )
            }

            if (data.status === "error") {
              setTimeout(() => {
                setDownloads((p) => p.filter((x) => x.taskId !== download.taskId))
              }, 5000)
              return prev.map((d) =>
                d.taskId === download.taskId
                  ? { ...d, status: "error" as const, message: data.error ?? "Download fehlgeschlagen", progress }
                  : d,
              )
            }

            return prev.map((d) =>
              d.taskId === download.taskId
                ? {
                    ...d,
                    message: data.progress ?? "Wird heruntergeladen...",
                    progress: progress,
                  }
                : d,
            )
          })
        } catch {
          // Network error — keep trying
        }
      }
    }, 1500)

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
  }, [])

  // Module-level addDownload registrieren
  useEffect(() => {
    _addDownloadFn = (taskId: string, title: string) => {
      setDownloads((prev) => [...prev, { taskId, title, status: "active" }])
    }
    return () => { _addDownloadFn = null }
  }, [])

  return (
    <AnimatePresence>
      {downloads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 z-40 w-80 flex flex-col gap-2"
        >
          {downloads.map((download) => (
            <DownloadItemCard
              key={download.taskId}
              download={download}
              onDismiss={dismissDownload}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
