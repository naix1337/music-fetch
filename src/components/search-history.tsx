"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Clock, X, Trash2, Search } from "lucide-react"

const STORAGE_KEY = "musicfetch_search_history"
const MAX_ITEMS = 20

interface SearchHistoryProps {
  onSelect: (query: string) => void
  visible: boolean
}

function loadHistory(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s): s is string => typeof s === "string").slice(0, MAX_ITEMS)
  } catch {
    return []
  }
}

function saveHistory(history: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ITEMS)))
  } catch {
    // localStorage full or unavailable
  }
}

export function addSearchHistory(query: string): void {
  const trimmed = query.trim()
  if (!trimmed) return
  const history = loadHistory()
  const filtered = history.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())
  saveHistory([trimmed, ...filtered])
}

export function SearchHistory({ onSelect, visible }: SearchHistoryProps) {
  const [history, setHistory] = useState<string[]>([])

  const refresh = useCallback(() => {
    setHistory(loadHistory())
  }, [])

  useEffect(() => {
    if (visible) {
      refresh()
    }
  }, [visible, refresh])

  const handleRemove = useCallback(
    (e: React.MouseEvent, query: string) => {
      e.stopPropagation()
      const next = history.filter((s) => s.toLowerCase() !== query.toLowerCase())
      saveHistory(next)
      setHistory(next)
    },
    [history],
  )

  const handleClearAll = useCallback(() => {
    saveHistory([])
    setHistory([])
  }, [])

  const handleSelect = useCallback(
    (query: string) => {
      onSelect(query)
    },
    [onSelect],
  )

  return (
    <AnimatePresence>
      {visible && history.length > 0 && (
        <motion.div
          key="search-history"
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="mt-2 rounded-xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span>Suchverlauf</span>
              </div>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Alle lschen
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {history.map((item, i) => (
                <motion.button
                  key={`${item}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.15 }}
                  onClick={() => handleSelect(item)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.06] transition-colors text-left group"
                >
                  <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="flex-1 truncate">{item}</span>
                  <button
                    onClick={(e) => handleRemove(e, item)}
                    className="shrink-0 p-1 rounded-md text-slate-600 hover:text-slate-300 hover:bg-white/[0.08] opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Eintrag entfernen"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
