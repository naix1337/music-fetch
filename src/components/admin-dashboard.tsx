"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  HardDrive,
  Music,
  Download,
  Activity,
  RefreshCw,
  Server,
  Disc3,
  ArrowDown,
  Database,
} from "lucide-react"

interface AdminStats {
  diskTotal: string
  diskUsed: string
  diskFree: string
  diskPercent: string
  trackCount: number
  activeDownloads: number
  totalDownloads: number
}

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
  color: "indigo" | "emerald" | "cyan" | "amber" | "rose"
  loading?: boolean
}

function StatCard({ label, value, icon, color, loading }: StatCardProps) {
  const borderColor = {
    indigo: "border-indigo-500/20 hover:border-indigo-500/30",
    emerald: "border-emerald-500/20 hover:border-emerald-500/30",
    cyan: "border-cyan-500/20 hover:border-cyan-500/30",
    amber: "border-amber-500/20 hover:border-amber-500/30",
    rose: "border-rose-500/20 hover:border-rose-500/30",
  }

  const iconBg = {
    indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    rose: "bg-rose-500/10 border-rose-500/20 text-rose-400",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative rounded-xl bg-white/[0.03] border ${borderColor[color]} transition-all duration-300 p-5 overflow-hidden`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {label}
          </p>
          {loading ? (
            <div className="h-7 w-20 bg-white/[0.06] rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-slate-100">{value}</p>
          )}
        </div>
        <div
          className={`shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${iconBg[color]}`}
        >
          {icon}
        </div>
      </div>

      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      />
    </motion.div>
  )
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/stats")
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error ?? "Stats konnten nicht geladen werden")
      }
      const data = await res.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.06]"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Server className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Admin Dashboard</h2>
            <p className="text-xs text-slate-500">Server-Statistiken und bersicht</p>
          </div>
        </div>

        <motion.button
          onClick={fetchStats}
          disabled={loading}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-indigo-300 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-500/20"
        >
          <motion.div
            animate={loading ? { rotate: 360 } : { rotate: 0 }}
            transition={
              loading
                ? { repeat: Infinity, duration: 1, ease: "linear" }
                : {}
            }
          >
            <RefreshCw className="w-4 h-4" />
          </motion.div>
          Aktualisieren
        </motion.button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Tracks in Bibliothek"
          value={stats ? stats.trackCount.toLocaleString("de-DE") : "—"}
          icon={<Music className="w-4 h-4" />}
          color="indigo"
          loading={loading}
        />
        <StatCard
          label="Downloads (gesamt)"
          value={stats ? stats.totalDownloads.toLocaleString("de-DE") : "—"}
          icon={<ArrowDown className="w-4 h-4" />}
          color="emerald"
          loading={loading}
        />
        <StatCard
          label="Aktive Downloads"
          value={stats ? String(stats.activeDownloads) : "—"}
          icon={<Activity className="w-4 h-4" />}
          color="amber"
          loading={loading}
        />
        <StatCard
          label="Speicher (belegt)"
          value={stats ? stats.diskUsed : "—"}
          icon={<HardDrive className="w-4 h-4" />}
          color="cyan"
          loading={loading}
        />
        <StatCard
          label="Speicher (frei)"
          value={stats ? stats.diskFree : "—"}
          icon={<Database className="w-4 h-4" />}
          color="emerald"
          loading={loading}
        />
        <StatCard
          label="Speicher (total)"
          value={stats ? stats.diskTotal : "—"}
          icon={<Disc3 className="w-4 h-4" />}
          color="rose"
          loading={loading}
        />
      </div>

      {/* Disk Usage Bar */}
      {stats && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.06]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-slate-200">
                Speichernutzung
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {stats.diskUsed} von {stats.diskTotal} ({stats.diskPercent})
            </span>
          </div>
          <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: stats.diskPercent,
              }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
            />
          </div>
        </motion.div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 backdrop-blur-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
