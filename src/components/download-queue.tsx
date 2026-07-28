"use client"

import { useState, useEffect, useRef } from "react"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface DownloadItem {
  taskId: string
  title: string
  status: "active" | "completed" | "error"
  message?: string
}

let _addDownloadFn: ((taskId: string, title: string) => void) | null = null

export function addDownload(taskId: string, title: string): void {
  _addDownloadFn?.(taskId, title)
}

export function DownloadQueue() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const downloadsRef = useRef(downloads)
  downloadsRef.current = downloads

  useEffect(() => {
    _addDownloadFn = (taskId: string, title: string) => {
      setDownloads((prev) => [...prev, { taskId, title, status: "active" }])
    }
    return () => {
      _addDownloadFn = null
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      const current = downloadsRef.current
      const activeDownloads = current.filter((d) => d.status === "active")
      if (activeDownloads.length === 0) return

      for (const download of activeDownloads) {
        try {
          const res = await fetch(`/api/status/${download.taskId}`)
          if (!res.ok) continue
          const data = await res.json()

          setDownloads((prev) => {
            const existing = prev.find((d) => d.taskId === download.taskId)
            if (!existing || existing.status !== "active") return prev

            if (data.status === "completed") {
              setTimeout(() => {
                setDownloads((p) => p.filter((d) => d.taskId !== download.taskId))
              }, 4000)
              return prev.map((d) =>
                d.taskId === download.taskId
                  ? { ...d, status: "completed" as const, message: "Fertig" }
                  : d,
              )
            }

            if (data.status === "error") {
              setTimeout(() => {
                setDownloads((p) => p.filter((d) => d.taskId !== download.taskId))
              }, 4000)
              return prev.map((d) =>
                d.taskId === download.taskId
                  ? {
                      ...d,
                      status: "error" as const,
                      message: data.message ?? "Download fehlgeschlagen",
                    }
                  : d,
              )
            }

            return prev.map((d) =>
              d.taskId === download.taskId
                ? { ...d, message: data.message ?? "Wird heruntergeladen..." }
                : d,
            )
          })
        } catch {
          // Network error — keep trying on next tick
        }
      }
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  if (downloads.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 space-y-2">
      {downloads.map((download) => (
        <div
          key={download.taskId}
          className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl flex items-start gap-3 transition-all duration-200"
        >
          {download.status === "active" && (
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0 mt-0.5" />
          )}
          {download.status === "completed" && (
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          )}
          {download.status === "error" && (
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-100 truncate">
              {download.title}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {download.status === "active" &&
                (download.message ?? "Wird heruntergeladen...")}
              {download.status === "completed" && "Download abgeschlossen"}
              {download.status === "error" &&
                (download.message ?? "Download fehlgeschlagen")}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
