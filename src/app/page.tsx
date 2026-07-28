"use client"

import { useState } from "react"
import { Search, ListMusic, Library, Download } from "lucide-react"
import { StarsBackground } from "@/components/ui/stars"
import { SearchTab } from "@/components/search-tab"
import { PlaylistTab } from "@/components/playlist-tab"
import { LibraryTab } from "@/components/library-tab"
import { DownloadQueue } from "@/components/download-queue"
import { ToastContainer } from "@/components/toast"

type Tab = "search" | "playlists" | "library"

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
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

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("search")

  return (
    <StarsBackground>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Download className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-slate-100">MusicFetch</h1>
          </div>
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6">
          {activeTab === "search" && <SearchTab />}
          {activeTab === "playlists" && <PlaylistTab />}
          {activeTab === "library" && <LibraryTab />}
        </main>
      </div>

      {/* Overlay UI */}
      <DownloadQueue />
      <ToastContainer />
    </StarsBackground>
  )
}
