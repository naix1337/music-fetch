"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Link, ListMusic, Download, Loader2, Music } from "lucide-react"
import { addDownload } from "@/components/download-queue"
import { showToast } from "@/components/toast"
import { cn } from "@/lib/utils"

interface PlaylistTrack {
  id: string
  title: string
  channel?: string
  artist?: string
  duration_str: string
  url: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
}

function RippleButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
}) {
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples((prev) => [...prev, { id, x, y }])
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 700)
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn("relative overflow-hidden", className)}
    >
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ width: 0, height: 0, x: ripple.x, y: ripple.y, opacity: 0.5 }}
          animate={{ width: 300, height: 300, x: ripple.x - 150, y: ripple.y - 150, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute rounded-full bg-white/20 pointer-events-none"
        />
      ))}
      {children}
    </button>
  )
}

export function PlaylistTab() {
  const [url, setUrl] = useState("")
  const [tracks, setTracks] = useState<PlaylistTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())
  const [batchProgress, setBatchProgress] = useState(0)

  const handleLoad = useCallback(async () => {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setTracks([])
    setBatchProgress(0)
    try {
      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error ?? "Playlist laden fehlgeschlagen")
      }
      const data = await res.json()
      setTracks(data.tracks ?? [])
      if (!data.tracks || data.tracks.length === 0) {
        setError("Keine Tracks in der Playlist gefunden")
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Playlist laden fehlgeschlagen",
      )
    } finally {
      setLoading(false)
    }
  }, [url])

  const handleDownload = useCallback(
    async (track: PlaylistTrack) => {
      if (downloadingIds.has(track.id)) return
      setDownloadingIds((prev) => new Set(prev).add(track.id))
      try {
        const res = await fetch("/api/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: track.url,
            title: track.title,
            channel: track.channel || track.artist || "",
          }),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => null)
          throw new Error(errData?.error ?? "Download fehlgeschlagen")
        }
        const data = await res.json()
        if (data.task_id) {
          addDownload(data.task_id, track.title)
          showToast("Download gestartet: " + track.title, "success")
        }
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Download fehlgeschlagen",
          "error",
        )
      } finally {
        setDownloadingIds((prev) => {
          const next = new Set(prev)
          next.delete(track.id)
          return next
        })
      }
    },
    [downloadingIds],
  )

  const handleDownloadAll = useCallback(async () => {
    if (tracks.length === 0) return
    setBatchLoading(true)
    setBatchProgress(0)
    try {
      const res = await fetch("/api/batch-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracks: tracks.map((t) => ({
            url: t.url,
            title: t.title,
            channel: t.channel || t.artist || "",
          })),
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error ?? "Batch-Download fehlgeschlagen")
      }
      const data = await res.json()
      const tasks = data.tasks ?? []
      tasks.forEach(
        (task: { task_id: string; title: string }, i: number) => {
          addDownload(task.task_id, task.title)
          setBatchProgress(((i + 1) / tasks.length) * 100)
        },
      )
      showToast(`${tasks.length} Downloads gestartet`, "success")
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Batch-Download fehlgeschlagen",
        "error",
      )
    } finally {
      setBatchLoading(false)
    }
  }, [tracks])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* URL Input */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1 group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-500 pointer-events-none" />
          <div className="relative flex items-center">
            <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoad()}
              placeholder="Playlist-URL (YouTube, SoundCloud, ...)"
              className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all duration-300 backdrop-blur-md"
            />
          </div>
        </div>
        <motion.button
          onClick={handleLoad}
          disabled={loading || !url.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 disabled:from-indigo-500/50 disabled:to-purple-500/50 text-white rounded-xl text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ListMusic className="w-4 h-4" />
          )}
          Laden
        </motion.button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {!loading && error && (
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
        {!loading && !error && tracks.length === 0 && !url && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-20 text-slate-500"
          >
            <motion.div
              animate={{ rotate: [0, 10, 0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ListMusic className="w-16 h-16 mb-4 opacity-20 text-purple-400" />
            </motion.div>
            <p className="text-sm text-slate-600">
              Playlist-URL eingeben und laden
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-16"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            >
              <Loader2 className="w-10 h-10 text-indigo-400" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Track list */}
      <AnimatePresence>
        {tracks.length > 0 && !loading && (
          <motion.div
            key="track-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Header bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-slate-300">
                    {tracks.length} Tracks
                  </span>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 20,
                    delay: 0.2,
                  }}
                  className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-xs text-indigo-300 font-medium"
                >
                  {tracks.length}
                </motion.div>
              </div>
              <RippleButton
                onClick={handleDownloadAll}
                disabled={batchLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-indigo-300 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-500/20"
              >
                {batchLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Alle herunterladen
              </RippleButton>
            </motion.div>

            {/* Batch progress */}
            <AnimatePresence>
              {batchLoading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                      animate={{ width: `${batchProgress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 text-right">
                    {Math.round(batchProgress)}%
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tracks */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {tracks.map((track, i) => {
                const isDownloading = downloadingIds.has(track.id || String(i))
                return (
                  <motion.div
                    key={track.id || i}
                    variants={itemVariants}
                    layout
                    whileHover={{ scale: 1.01, x: 4 }}
                    className="group relative rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-indigo-500/20 hover:bg-white/[0.05] transition-all duration-300 p-4"
                  >
                    <div className="flex items-center gap-4">
                      {/* Track number */}
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                        <span className="text-xs font-medium text-slate-500 group-hover:text-indigo-400 transition-colors duration-300">
                          {i + 1}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-100 truncate group-hover:text-indigo-200 transition-colors duration-300">
                          {track.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {track.channel || track.artist || ""}
                        </p>
                      </div>

                      {/* Duration */}
                      <span className="text-xs text-slate-500 shrink-0 px-2 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
                        {track.duration_str}
                      </span>

                      {/* Download button */}
                      <motion.button
                        onClick={() =>
                          handleDownload(track)
                        }
                        disabled={isDownloading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 shrink-0 border",
                          isDownloading
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/20 cursor-not-allowed"
                            : "bg-white/[0.04] hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 border-white/[0.06] hover:border-indigo-500/30",
                        )}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
