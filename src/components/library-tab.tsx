"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { RefreshCw, Music, HardDrive, Disc3 } from "lucide-react"
import { showToast } from "@/components/toast"

interface LibraryTrack {
  title: string
  artist: string
  album: string
  size_mb: number
  path: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
}

function EmptyLibraryState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center py-24 text-slate-500"
    >
      <motion.div
        animate={{
          y: [0, -10, 0],
          rotate: [0, 5, 0, -5, 0],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        <Disc3 className="w-20 h-20 mb-5 text-indigo-400/20" />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-indigo-400/10"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      <p className="text-sm text-slate-600 mb-2">Keine Musik in der Bibliothek</p>
      <p className="text-xs text-slate-700">
        Scanne deine Musikbibliothek, um Titel zu finden
      </p>
    </motion.div>
  )
}

export function LibraryTab() {
  const [tracks, setTracks] = useState<LibraryTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)

  const fetchLibrary = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/library")
      if (!res.ok) throw new Error("Bibliothek konnte nicht geladen werden")
      const data = await res.json()
      setTracks(data.tracks ?? [])
    } catch {
      setTracks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLibrary()
  }, [fetchLibrary])

  const handleScan = useCallback(async () => {
    setScanning(true)
    try {
      await fetch("/api/scan", { method: "POST" })
      showToast("Scan ausgelost", "success")
      setTimeout(fetchLibrary, 2000)
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Scan fehlgeschlagen",
        "error",
      )
    } finally {
      setScanning(false)
    }
  }, [fetchLibrary])

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
            <Music className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Bibliothek</h2>
            {!loading && (
              <p className="text-xs text-slate-500">
                {tracks.length} Titel
              </p>
            )}
          </div>
        </div>
        <motion.button
          onClick={handleScan}
          disabled={scanning}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-indigo-300 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-500/20"
        >
          <motion.div
            animate={scanning ? { rotate: 360 } : { rotate: 0 }}
            transition={
              scanning
                ? { repeat: Infinity, duration: 1, ease: "linear" }
                : {}
            }
          >
            <RefreshCw className="w-4 h-4" />
          </motion.div>
          {scanning ? "Scanne..." : "Scan erneuern"}
        </motion.button>
      </motion.div>

      {/* Loading state */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="relative"
            >
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-400" />
              <motion.div
                className="absolute inset-1 rounded-full border-2 border-purple-500/20 border-b-purple-400"
                animate={{ rotate: -360 }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "linear",
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      <AnimatePresence>
        {!loading && tracks.length === 0 && !loading && (
          <EmptyLibraryState />
        )}
      </AnimatePresence>

      {/* Track list */}
      <AnimatePresence mode="popLayout">
        {!loading && tracks.length > 0 && (
          <motion.div
            key="library-tracks"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {tracks.map((track, i) => (
              <motion.div
                key={track.path || i}
                variants={itemVariants}
                layout
                whileHover={{ scale: 1.01, y: -2 }}
                className="group relative rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-indigo-500/20 hover:bg-white/[0.05] transition-all duration-300 p-4 overflow-hidden"
              >
                {/* Zoom effect on hover - uses scale transform */}
                <div className="flex items-center gap-4 relative">
                  {/* Album art placeholder */}
                  <motion.div
                    className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/[0.06] flex items-center justify-center group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-all duration-300"
                    whileHover={{ scale: 1.15, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <Music className="w-4 h-4 text-indigo-400/70 group-hover:text-indigo-300 transition-colors duration-300" />
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate group-hover:text-indigo-200 transition-colors duration-300">
                      {track.title || "Unbekannter Titel"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {track.artist || "Unbekannter Künstler"}
                      {track.album ? ` · ${track.album}` : ""}
                    </p>
                  </div>

                  {/* Size indicator */}
                  <motion.div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-slate-500 shrink-0"
                    whileHover={{ scale: 1.05 }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 5, 0, -5, 0] }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <HardDrive className="w-3 h-3 text-indigo-400/50" />
                    </motion.div>
                    <span>{track.size_mb} MB</span>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
