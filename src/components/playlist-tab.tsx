"use client"

import { useState } from "react"
import { Link, ListMusic, Download, Loader2 } from "lucide-react"
import { addDownload } from "@/components/download-queue"
import { showToast } from "@/components/toast"

interface PlaylistTrack {
  id: string
  title: string
  channel: string
  duration: string
  url: string
}

export function PlaylistTab() {
  const [url, setUrl] = useState("")
  const [tracks, setTracks] = useState<PlaylistTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)

  const handleLoad = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.message ?? "Playlist laden fehlgeschlagen")
      }
      const data = await res.json()
      setTracks(data.tracks ?? [])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Playlist laden fehlgeschlagen",
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (track: PlaylistTrack) => {
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: track.url, source: "YouTube" }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.message ?? "Download fehlgeschlagen")
      }
      const data = await res.json()
      if (data.taskId) {
        addDownload(data.taskId, track.title)
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Download fehlgeschlagen",
        "error",
      )
    }
  }

  const handleDownloadAll = async () => {
    setBatchLoading(true)
    try {
      const res = await fetch("/api/batch-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: tracks.map((t) => t.url) }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.message ?? "Batch-Download fehlgeschlagen")
      }
      const data = await res.json()
      const taskIds: string[] = data.taskIds ?? []
      taskIds.forEach((taskId: string, i: number) => {
        addDownload(taskId, tracks[i]?.title ?? `Track ${i + 1}`)
      })
      showToast(
        `${taskIds.length} Downloads gestartet`,
        "success",
      )
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Batch-Download fehlgeschlagen",
        "error",
      )
    } finally {
      setBatchLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* URL Input */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoad()}
            placeholder="Playlist-URL einfügen..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
          />
        </div>
        <button
          onClick={handleLoad}
          disabled={loading || !url.trim()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/50 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ListMusic className="w-4 h-4" />
          )}
          Laden
        </button>
      </div>

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && tracks.length === 0 && !url && (
        <div className="flex flex-col items-center py-16 text-slate-500">
          <ListMusic className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm">Playlist-URL eingeben und laden</p>
        </div>
      )}

      {/* Track list */}
      {tracks.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">{tracks.length} Tracks</p>
            <button
              onClick={handleDownloadAll}
              disabled={batchLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {batchLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Alle {tracks.length} herunterladen
            </button>
          </div>

          <div className="space-y-3">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex items-center gap-4 hover:bg-slate-800/80 transition-all duration-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">
                    {track.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {track.channel}
                  </p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {track.duration}
                </span>
                <button
                  onClick={() => handleDownload(track)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded-md text-xs font-medium transition-all duration-200 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
