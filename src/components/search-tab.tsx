"use client"

import { useState } from "react"
import { Search, Music, Clock, Download, Loader2 } from "lucide-react"
import { addDownload } from "@/components/download-queue"
import { showToast } from "@/components/toast"

interface SearchResult {
  id: string
  title: string
  channel: string
  duration: string
  url: string
}

const sources = ["YouTube", "SoundCloud", "Bandcamp", "Vimeo"]

export function SearchTab() {
  const [query, setQuery] = useState("")
  const [source, setSource] = useState("YouTube")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), source }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.message ?? "Search fehlgeschlagen")
      }
      const data = await res.json()
      setResults(data.results ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search fehlgeschlagen")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (result: SearchResult) => {
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.url, source }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.message ?? "Download fehlgeschlagen")
      }
      const data = await res.json()
      if (data.taskId) {
        addDownload(data.taskId, result.title)
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Download fehlgeschlagen",
        "error",
      )
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Search Bar */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="flex-1 flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Song, Artist oder URL eingeben..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
          />
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200"
          >
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/50 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Suchen
        </button>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Initial empty state */}
        {!loading && !error && results.length === 0 && !query && (
          <div className="flex flex-col items-center py-16 text-slate-500">
            <Music className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">Geben Sie einen Suchbegriff ein</p>
          </div>
        )}

        {/* No results */}
        {!loading && !error && results.length === 0 && query && (
          <div className="flex flex-col items-center py-16 text-slate-500">
            <Music className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">Keine Ergebnisse gefunden</p>
          </div>
        )}

        {/* Results list */}
        {!loading &&
          results.map((result) => (
            <div
              key={result.id}
              className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex items-center gap-4 hover:bg-slate-800/80 transition-all duration-200"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">
                  {result.title}
                </p>
                <p className="text-xs text-slate-400 mt-1">{result.channel}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>{result.duration}</span>
              </div>
              <button
                onClick={() => handleDownload(result)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded-md text-xs font-medium transition-all duration-200 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          ))}
      </div>
    </div>
  )
}
