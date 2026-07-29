"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Search,
  Music,
  Clock,
  Download,
  BadgeCheck,
  Play,
} from "lucide-react"
import { addDownload } from "@/components/download-queue"
import { showToast } from "@/components/toast"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  title: string
  channel: string
  duration_str: string
  url: string
}

interface Source {
  value: string
  label: string
}

const sources: Source[] = [
  { value: "youtube", label: "YouTube" },
  { value: "soundcloud", label: "SoundCloud" },
]

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="relative overflow-hidden rounded-xl bg-white/[0.04] border border-white/[0.06] p-4"
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-2.5">
          <div className="h-4 bg-white/[0.08] rounded-full w-3/4" />
          <div className="h-3 bg-white/[0.04] rounded-full w-1/2" />
        </div>
        <div className="h-3 bg-white/[0.06] rounded w-14" />
        <div className="h-8 bg-white/[0.06] rounded-lg w-24" />
      </div>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
}

export function SearchTab() {
  const [query, setQuery] = useState("")
  const [source, setSource] = useState("youtube")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())

  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&source=${source}`,
      )
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error ?? "Suche fehlgeschlagen")
      }
      const data = await res.json()
      setResults(data.results ?? [])
      if (!data.results || data.results.length === 0) {
        setError("Keine Ergebnisse gefunden")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suche fehlgeschlagen")
    } finally {
      setLoading(false)
    }
  }, [query, source])

  const handleDownload = useCallback(
    async (result: SearchResult) => {
      if (downloadingIds.has(result.id)) return
      setDownloadingIds((prev) => new Set(prev).add(result.id))
      try {
        const res = await fetch("/api/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: result.url,
            title: result.title,
            channel: result.channel,
          }),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => null)
          throw new Error(errData?.error ?? "Download fehlgeschlagen")
        }
        const data = await res.json()
        if (data.task_id) {
          addDownload(data.task_id, result.title)
          showToast("Download gestartet: " + result.title, "success")
        }
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Download fehlgeschlagen",
          "error",
        )
      } finally {
        setDownloadingIds((prev) => {
          const next = new Set(prev)
          next.delete(result.id)
          return next
        })
      }
    },
    [downloadingIds],
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Search Bar */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="flex-1 flex gap-3">
          <div className="relative flex-1 group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-500 pointer-events-none" />
            <div className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Song, Künstler oder Album..."
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all duration-300 backdrop-blur-md"
              />
            </div>
          </div>
        </div>
        <motion.button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 disabled:from-indigo-500/50 disabled:to-purple-500/50 text-white rounded-xl text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
        >
          <Search className="w-4 h-4" />
          Suchen
        </motion.button>
      </div>

      {/* Source Pills */}
      <div className="flex flex-wrap gap-2">
        {sources.map((s) => (
          <motion.button
            key={s.value}
            onClick={() => setSource(s.value)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 border",
              source === s.value
                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-sm shadow-indigo-500/10"
                : "bg-white/[0.04] border-white/[0.06] text-slate-400 hover:text-slate-300 hover:bg-white/[0.08]",
            )}
          >
            {s.label}
          </motion.button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-3">
        {/* Loading skeletons */}
        <AnimatePresence>
          {loading && (
            <motion.div
              key="skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} delay={i * 0.05} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {!loading && error && results.length === 0 && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        <AnimatePresence>
          {!loading && !error && results.length === 0 && !query && (
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
                <Music className="w-16 h-16 mb-4 opacity-20 text-indigo-400" />
              </motion.div>
              <p className="text-sm text-slate-600">
                Gib einen Suchbegriff ein
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results list */}
        <AnimatePresence mode="popLayout">
          {!loading && results.length > 0 && (
            <motion.div
              key="results"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {results.map((result) => {
                const isDownloading = downloadingIds.has(result.id)
                return (
                  <motion.div
                    key={result.id}
                    variants={itemVariants}
                    layout
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="group relative rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-indigo-500/20 hover:bg-white/[0.07] transition-all duration-300 p-4 overflow-hidden"
                  >
                    {/* Hover glow */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    />

                    <div className="flex items-center gap-4 relative">
                      {/* Play icon on hover */}
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all duration-300">
                        <Music className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors duration-300" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-100 truncate group-hover:text-indigo-200 transition-colors duration-300">
                          {result.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <BadgeCheck className="w-3 h-3 text-indigo-400/60" />
                          <span>{result.channel}</span>
                        </p>
                      </div>

                      {/* Duration badge */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-slate-400 shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{result.duration_str}</span>
                      </div>

                      {/* Download button */}
                      <motion.button
                        onClick={() => handleDownload(result)}
                        disabled={isDownloading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 shrink-0",
                          isDownloading
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 cursor-not-allowed"
                            : "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/30",
                        )}
                      >
                        <motion.div
                          animate={isDownloading ? { rotate: 360 } : { rotate: 0 }}
                          transition={
                            isDownloading
                              ? { repeat: Infinity, duration: 1, ease: "linear" }
                              : {}
                          }
                        >
                          <Download className="w-3.5 h-3.5" />
                        </motion.div>
                        {isDownloading ? "Starte..." : "Download"}
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
