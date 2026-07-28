"use client"

import { useState, useEffect, useMemo, lazy, Suspense } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, ListMusic, Library, Music } from "lucide-react"
import { StarsBackground } from "@/components/ui/stars"
import { DownloadQueue } from "@/components/download-queue"
import { ToastContainer } from "@/components/toast"
import { cn } from "@/lib/utils"

// Lazy-loaded tab components for code splitting
const SearchTab = lazy(() =>
  import("@/components/search-tab").then((m) => ({ default: m.SearchTab })),
)
const PlaylistTab = lazy(() =>
  import("@/components/playlist-tab").then((m) => ({ default: m.PlaylistTab })),
)
const LibraryTab = lazy(() =>
  import("@/components/library-tab").then((m) => ({ default: m.LibraryTab })),
)

type Tab = "search" | "playlists" | "library"

interface TabConfig {
  id: Tab
  label: string
  icon: React.ReactNode
}

const tabs: TabConfig[] = [
  { id: "search", label: "Suchen", icon: <Search className="w-4 h-4" /> },
  { id: "playlists", label: "Playlists", icon: <ListMusic className="w-4 h-4" /> },
  { id: "library", label: "Bibliothek", icon: <Library className="w-4 h-4" /> },
]

const tabComponent: Record<Tab, React.LazyExoticComponent<any>> = {
  search: SearchTab,
  playlists: PlaylistTab,
  library: LibraryTab,
}

// Tab loading skeleton
function TabFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
    </div>
  )
}

// --- Sub-components with reduced-motion support ---

function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return prefersReduced
}

function EqualizerBars({ reduced }: { reduced: boolean }) {
  if (reduced) return null
  return (
    <div className="flex items-end gap-[3px] h-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-indigo-400 via-purple-400 to-cyan-300"
          animate={{
            height: ["30%", "70%", "40%", "90%", "50%", "30%"],
          }}
          transition={{
            duration: 0.7 + i * 0.15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.12,
          }}
        />
      ))}
    </div>
  )
}

function GradientBlobs({ reduced }: { reduced: boolean }) {
  const baseClass =
    "absolute rounded-full bg-gradient-to-r pointer-events-none"
  const baseStyle = { filter: "blur(80px)" } as const

  if (reduced) {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.08)_0%,_transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        className={`${baseClass} -top-1/3 -left-1/4 w-[800px] h-[800px] from-indigo-500/15 to-purple-500/15`}
        animate={{ x: [0, 120, 0], y: [0, -60, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        style={baseStyle}
      />
      <motion.div
        className={`${baseClass} -bottom-1/3 -right-1/4 w-[700px] h-[700px] from-cyan-500/10 to-indigo-500/15`}
        animate={{ x: [0, -100, 0], y: [0, 80, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        style={baseStyle}
      />
      <motion.div
        className={`${baseClass} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] from-purple-500/8 to-cyan-500/8`}
        animate={{ x: [0, 60, -60, 0], y: [0, -40, 40, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        style={{ filter: "blur(100px)" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />
    </div>
  )
}

function FloatingMusicNotes({ reduced }: { reduced: boolean }) {
  if (reduced) return null

  const notes = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: `${5 + Math.random() * 90}%`,
        delay: i * 1.5 + Math.random() * 2,
        duration: 14 + Math.random() * 8,
        size: 14 + Math.random() * 18,
      })),
    [],
  )

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
      {notes.map((note) => (
        <motion.div
          key={note.id}
          className="absolute text-indigo-300/10"
          style={{ left: note.left }}
          initial={{ y: "calc(100vh + 40px)", opacity: 0 }}
          animate={{
            y: ["calc(100vh + 40px)", "-80px"],
            opacity: [0, 0.35, 0.35, 0],
          }}
          transition={{
            duration: note.duration,
            repeat: Infinity,
            delay: note.delay,
            ease: "linear",
          }}
        >
          <Music size={note.size} />
        </motion.div>
      ))}
    </div>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("search")
  const [mounted, setMounted] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    setMounted(true)
  }, [])

  const TabComponent = tabComponent[activeTab]

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden">
      {/* Background layer */}
      {mounted && <GradientBlobs reduced={reduced} />}
      {mounted && !reduced && <StarsBackground />}
      {mounted && <FloatingMusicNotes reduced={reduced} />}

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-black/20 border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="MusicFetch"
                className="h-8 w-auto object-contain"
                loading="eager"
              />
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-indigo-200 to-slate-100 bg-clip-text text-transparent">
                  MusicFetch
                </h1>
                <EqualizerBars reduced={reduced} />
              </div>
            </div>

            {/* Tab Navigation */}
            <nav aria-label="Hauptnavigation" className="flex gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    activeTab === tab.id
                      ? "text-indigo-200"
                      : "text-slate-400 hover:text-slate-300",
                  )}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-cyan-500/10 border border-white/[0.08]"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>
          <div className="h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 via-purple-500/30 to-transparent" />
        </header>

        {/* Content with page transitions */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: reduced ? 0 : 24, scale: reduced ? 1 : 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduced ? 0 : -16, scale: reduced ? 1 : 0.97 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8,
                duration: reduced ? 0.1 : undefined,
              }}
            >
              <Suspense fallback={<TabFallback />}>
                <TabComponent />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Overlay UI */}
      <DownloadQueue />
      <ToastContainer />
    </div>
  )
}
