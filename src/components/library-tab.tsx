"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Music, HardDrive } from "lucide-react"
import { showToast } from "@/components/toast"

interface LibraryTrack {
  id: string
  title: string
  artist: string
  album: string
  fileSize: number
}

export function LibraryTab() {
  const [tracks, setTracks] = useState<LibraryTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)

  const fetchLibrary = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/library")
      if (!res.ok) throw new Error("Bibliothek konnte nicht geladen werden")
      const data = await res.json()
      if (Array.isArray(data)) {
        setTracks(data)
      } else if (data.tracks) {
        setTracks(data.tracks)
      } else {
        setTracks([])
      }
    } catch {
      setTracks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLibrary()
  }, [])

  const handleScan = async () => {
    setScanning(true)
    try {
      const res = await fetch("/api/scan", { method: "POST" })
      if (!res.ok) throw new Error("Scan fehlgeschlagen")
      showToast("Scan abgeschlossen", "success")
      await fetchLibrary()
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Scan fehlgeschlagen",
        "error",
      )
    } finally {
      setScanning(false)
    }
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Bibliothek</h2>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw
            className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`}
          />
          Scan erneuern
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && tracks.length === 0 && (
        <div className="flex flex-col items-center py-16 text-slate-500">
          <Music className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm">Keine Musik in der Bibliothek</p>
          <p className="text-xs text-slate-600 mt-1">
            F&uuml;hren Sie einen Scan durch, um Ihre Musik zu finden
          </p>
        </div>
      )}

      {/* Track list */}
      {!loading && tracks.length > 0 && (
        <div className="space-y-2">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex items-center gap-4 hover:bg-slate-800/80 transition-all duration-200"
            >
              <Music className="w-5 h-5 text-indigo-400/50 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">
                  {track.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {track.artist}
                  {track.album ? ` · ${track.album}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                <HardDrive className="w-3.5 h-3.5" />
                <span>{formatSize(track.fileSize)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
