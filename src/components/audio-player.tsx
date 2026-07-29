"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Music,
  Volume2,
  VolumeX,
} from "lucide-react"

interface TrackInfo {
  title: string
  artist: string
  file: string
}

interface AudioPlayerProps {
  track: TrackInfo | null
  onClose: () => void
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function AudioPlayer({ track, onClose }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [loading, setLoading] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  // Build stream URL from file path
  const streamUrl = track
    ? `/api/stream/${encodeURIComponent(track.file.replace(/^\/+/, ""))}`
    : null

  // Reset state when track changes
  useEffect(() => {
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setLoading(!!track)
  }, [track])

  // Handle audio element events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return

    const onLoadedMetadata = () => {
      setDuration(audio.duration)
      setLoading(false)
      audio.play().then(() => setPlaying(true)).catch(() => {})
    }

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const onEnded = () => {
      setPlaying(false)
      setCurrentTime(0)
    }

    const onWaiting = () => setLoading(true)
    const onCanPlay = () => setLoading(false)
    const onError = () => setLoading(false)

    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("waiting", onWaiting)
    audio.addEventListener("canplay", onCanPlay)
    audio.addEventListener("error", onError)

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("waiting", onWaiting)
      audio.removeEventListener("canplay", onCanPlay)
      audio.removeEventListener("error", onError)
    }
  }, [track])

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      audioRef.current.muted = muted
    }
  }, [volume, muted])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {})
    }
  }, [playing])

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current
      if (!audio || !duration) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const ratio = Math.max(0, Math.min(1, x / rect.width))
      audio.currentTime = ratio * duration
      setCurrentTime(audio.currentTime)
    },
    [duration],
  )

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value)
      setVolume(val)
      if (val === 0) setMuted(true)
      else setMuted(false)
    },
    [],
  )

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <AnimatePresence>
      {track && (
        <motion.div
          key="audio-player"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-2xl border-t border-white/[0.08] shadow-2xl"
        >
          {/* Progress bar (clickable strip at top) */}
          <div
            ref={progressRef}
            onClick={handleSeek}
            className="relative h-1.5 bg-white/[0.06] cursor-pointer group/progress"
          >
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-[width] duration-100 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-indigo-400 shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
            {/* Cover / Icon */}
            <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/[0.06] flex items-center justify-center">
              {loading ? (
                <div className="w-4 h-4 border-2 border-indigo-400/50 border-t-indigo-400 rounded-full animate-spin" />
              ) : (
                <Music className="w-4 h-4 text-indigo-400" />
              )}
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">
                {track.title}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {track.artist}
              </p>
            </div>

            {/* Time display */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 shrink-0 tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span className="text-slate-600">/</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const a = audioRef.current
                  if (a) a.currentTime = Math.max(0, a.currentTime - 10)
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-all"
                aria-label="10 Sekunden zurck"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <motion.button
                onClick={togglePlay}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg shadow-indigo-500/25 transition-all"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </motion.button>

              <button
                onClick={() => {
                  const a = audioRef.current
                  if (a) a.currentTime = Math.min(a.duration, a.currentTime + 10)
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-all"
                aria-label="10 Sekunden vor"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Volume */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <button
                onClick={() => setMuted(!muted)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-all"
                aria-label={muted ? "Stummschaltung aufheben" : "Stummschalten"}
              >
                {muted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 appearance-none bg-white/[0.1] rounded-full cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-400
                  [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3
                  [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-400
                  [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                aria-label="Lautstarke"
              />
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.08] transition-all"
              aria-label="Player schlieen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Hidden audio element */}
          {streamUrl && (
            <audio
              key={streamUrl}
              ref={audioRef}
              preload="auto"
              src={streamUrl}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
