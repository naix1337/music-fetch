"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, ListMusic, Library, Music } from "lucide-react"
import { StarsBackground } from "@/components/ui/stars"
import { SearchTab } from "@/components/search-tab"
import { PlaylistTab } from "@/components/playlist-tab"
import { LibraryTab } from "@/components/library-tab"
import { DownloadQueue } from "@/components/download-queue"
import { ToastContainer } from "@/components/toast"
import { cn } from "@/lib/utils"

type Tab = "search" | "playlists" | "library"

interface TabConfig {
  id: Tab
  label: string
  icon: React.ReactNode
}

const tabs: TabConfig[] = [
  { id: "search", label: "Suchen", icon: <Search className="w-4 h-4" /> },
  {
    id: "playlists",
    label: "Playlists",
    icon: <ListMusic className="w-4 h-4" />,
  },
  {
    id: "library",
    label: "Bibliothek",
    icon: <Library className="w-4 h-4" />,
  },
]

const tabComponents: Record<Tab, React.ReactNode> = {
  search: <SearchTab />,
  playlists: <PlaylistTab />,
  library: <LibraryTab />,
}

function EqualizerBars() {
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

function FloatingMusicNotes() {
  const [notes] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      delay: i * 1.5 + Math.random() * 2,
      duration: 14 + Math.random() * 8,
      size: 14 + Math.random() * 18,
    })),
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

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden">
      {/* Animated gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute -top-1/3 -left-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-500/15 to-purple-500/15"
          animate={{
            x: [0, 120, 0],
            y: [0, -60, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ filter: "blur(80px)" }}
        />
        <motion.div
          className="absolute -bottom-1/3 -right-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-r from-cyan-500/10 to-indigo-500/15"
          animate={{
            x: [0, -100, 0],
            y: [0, 80, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ filter: "blur(80px)" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-purple-500/8 to-cyan-500/8"
          animate={{
            x: [0, 60, -60, 0],
            y: [0, -40, 40, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ filter: "blur(100px)" }}
        />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />

        {/* Stars */}
        {mounted && <StarsBackground />}
      </div>

      {/* Floating music notes */}
      {mounted && <FloatingMusicNotes />}

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Glassmorphism Header */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-black/20 border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="MusicFetch"
                className="h-8 w-auto object-contain"
              />
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-indigo-200 to-slate-100 bg-clip-text text-transparent">
                  MusicFetch
                </h1>
                <EqualizerBars />
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="flex gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    activeTab === tab.id
                      ? "text-indigo-200"
                      : "text-slate-400 hover:text-slate-300",
                  )}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>

                  {/* Active indicator */}
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

          {/* Gradient accent line under header */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 via-purple-500/30 to-transparent" />
        </header>

        {/* Content with page transitions */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8,
              }}
            >
              {tabComponents[activeTab]}
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
