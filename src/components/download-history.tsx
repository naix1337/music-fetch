"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Clock,
  Download,
  Trash2,
  FileAudio,
  X,
  Music,
  ExternalLink,
} from "lucide-react"

const STORAGE_KEY = "musicfetch_download_history"
const MAX_ITEMS = 100

export interface DownloadHistoryItem {
  taskId: string
  title: string
  artist: string
  url: string
  completedAt: string
  file?: string
}

function loadHistory(): DownloadHistoryItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, MAX_ITEMS)
  } catch {
    return []
  }
}

function saveHistory(history: DownloadHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ITEMS)))
  } catch {
    // localStorage full or unavailable
  }
}

export function addDownloadHistory(item: DownloadHistoryItem): void {
  const history = loadHistory()
  // Remove duplicates by taskId
  const filtered = history.filter((h) => h.taskId !== item.taskId)
  saveHistory([item, ...filtered])
}

export function DownloadHistory() {
  const [history, setHistory] = useState<DownloadHistoryItem[]>([])

  const refresh = useCallback(() => {
    setHistory(loadHistory())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleRemove = useCallback(
    (e: React.MouseEvent, taskId: string) => {
      e.stopPropagation()
      const next = history.filter((h) => h.taskId !== taskId)
      saveHistory(next)
      setHistory(next)
    },
    [history],
  )

  const handleClearAll = useCallback(() => {
    saveHistory([])
    setHistory([])
  }, [])

  function formatDate(iso: string): string {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.06]"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Download-Verlauf</h2>
            {history.length > 0 && (
              <p className="text-xs text-slate-500">
                {history.length} Eintrge
              </p>
            )}
          </div>
        </div>
        {history.length > 0 && (
          <motion.button
            onClick={handleClearAll}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-all duration-200 border border-red-500/20"
          >
            <Trash2 className="w-4 h-4" />
            Alle lschen
          </motion.button>
        )}
      </motion.div>

      {/* Empty state */}
      <AnimatePresence>
        {history.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-20 text-slate-500"
          >
            <motion.div
              animate={{
                y: [0, -8, 0],
                rotate: [0, -5, 0, 5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Download className="w-16 h-16 mb-4 opacity-20 text-indigo-400" />
            </motion.div>
            <p className="text-sm text-slate-600">Noch keine Downloads abgeschlossen</p>
            <p className="text-xs text-slate-700 mt-1">
              Abgeschlossene Downloads erscheinen hier automatisch
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History list */}
      <AnimatePresence mode="popLayout">
        {history.length > 0 && (
          <motion.div
            key="history-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {history.map((item, i) => (
              <motion.div
                key={item.taskId}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
                transition={{
                  delay: i * 0.03,
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
                layout
                whileHover={{ scale: 1.01, y: -2 }}
                className="group relative rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-indigo-500/20 hover:bg-white/[0.05] transition-all duration-300 p-4 overflow-hidden"
              >
                <div className="flex items-center gap-4 relative">
                  {/* Icon */}
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors duration-300">
                    <FileAudio className="w-4 h-4 text-indigo-400/70" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate group-hover:text-indigo-200 transition-colors duration-300">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400 truncate">
                        {item.artist}
                      </p>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.completedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-white/[0.08] transition-all"
                        aria-label="Original URL offnen"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={(e) => handleRemove(e, item.taskId)}
                      className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-white/[0.08] transition-all opacity-0 group-hover:opacity-100"
                      aria-label="Eintrag entfernen"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
