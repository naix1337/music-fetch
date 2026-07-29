<div align="center">
  <img src="https://raw.githubusercontent.com/naix1337/music-fetch/main/screenshots/search.png" alt="MusicFetch" width="800" />
  <br/>
  <h1>🎵 MusicFetch</h1>
  <p><strong>YouTube & SoundCloud Music Downloader</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind-4-cyan?style=flat-square&logo=tailwindcss" alt="Tailwind" />
    <img src="https://img.shields.io/badge/yt--dlp-2026-brightgreen?style=flat-square" alt="yt-dlp" />
  </p>
  <br/>
</div>

## 📋 Features

| Feature | Beschreibung |
|---|---|
| **🔍 Multi-Provider Suche** | YouTube & SoundCloud durchsuchen |
| **📋 Playlists** | Playlists laden & alle Tracks auf einmal downloaden |
| **⬇️ Download** | Ein Klick → MP3 mit Metadaten & Cover |
| **🎨 Modernes UI** | Dark Theme, Glasphormismus, Animationen |
| **✨ StarsBackground** | Interaktiver Sternenhimmel mit Parallax-Effekt |
| **📚 Bibliothek** | Bereits geladene Tracks verwalten |
| **🎵 Navidrome** | Automatischer Import – Scan-Trigger + Berechtigungen |
| **⚡ Parallel** | Bis zu 3 Downloads gleichzeitig |

## 📸 Screenshots

<div align="center">
  <img src="https://raw.githubusercontent.com/naix1337/music-fetch/main/screenshots/search.png" alt="Suche" width="45%" />
  <img src="https://raw.githubusercontent.com/naix1337/music-fetch/main/screenshots/playlist.png" alt="Playlists" width="45%" />
  <br/>
  <em>Suche (links) – Playlist-Ansicht mit Download-Queue (rechts)</em>
</div>

## 🚀 Installation

### Voraussetzungen

- **Node.js 20+** – [nodejs.org](https://nodejs.org)
- **yt-dlp** – `apt install yt-dlp` oder `pip3 install yt-dlp`
- **ffmpeg** – `apt install ffmpeg`
- **Musikordner** – `/opt/navidrome/music/` muss existieren und beschreibbar sein

### 1. Repository klonen

```bash
git clone https://github.com/naix1337/music-fetch.git
cd music-fetch
```

### 2. Abhängigkeiten installieren

```bash
npm install
```

### 3. Build erstellen

```bash
npm run build
```

### 4. Starten

```bash
npm start
```

➡️ **http://localhost:5000** im Browser öffnen.

### Entwicklung

```bash
npm run dev
# → http://localhost:3000
```

## ⚙️ Autostart (systemd)

Damit MusicFetch automatisch beim Systemstart läuft:

```bash
sudo cp music-fetch.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now music-fetch
```

Logs ansehen:

```bash
journalctl -u music-fetch -f
```

## 🎵 Navidrome Integration

MusicFetch ist für den Einsatz mit [Navidrome](https://www.navidrome.org/) optimiert:

- **Automatischer Scan** – Nach jedem Download wird Navidrome via `inotify` getriggert
- **Berechtigungen** – Dateien werden automatisch auf `navidrome:navidrome` gesetzt
- **Ordnerstruktur** – `Artist/Songtitel.mp3` (kein Album-Ordner → Einzeltitel in Navidrome)

### Navidrome installieren (per Helper-Script)

**Variante A – Offizielles Install-Script (empfohlen):**
```bash
curl -sSL https://raw.githubusercontent.com/navidrome/navidrome/main/install.sh | bash
```
Installiert Navidrome + systemd Service + Konfiguration automatisch.

**Variante B – Per Docker-Helfer:**
```bash
docker run -d \
  --name navidrome \
  --restart unless-stopped \
  -p 4533:4533 \
  -v /opt/navidrome/data:/data \
  -v /opt/navidrome/music:/music:ro \
  -e ND_LOGLEVEL=info \
  deluan/navidrome:latest
```

**Variante C – Manuell (Debian/Ubuntu):**
```bash
wget https://github.com/navidrome/navidrome/releases/latest/download/navidrome_linux_amd64.tar.gz
tar xzf navidrome_linux_amd64.tar.gz
sudo install navidrome /usr/bin/
```

## 🔌 API-Endpunkte

| Endpunkt | Methode | Beschreibung |
|---|---|---|
| `/` | GET | Web UI |
| `/api/search?q=...&source=...` | GET | Suche (youtube/soundcloud) |
| `/api/download` | POST | Download starten |
| `/api/status/[id]` | GET | Download-Fortschritt abrufen |
| `/api/library` | GET | Bereits geladene Tracks |
| `/api/scan` | POST | Navidrome-Scan triggern |
| `/api/playlist` | POST | Playlist-Tracks abrufen |
| `/api/batch-download` | POST | Mehrere Tracks auf einmal downloaden |

### Beispiele

**Song suchen:**
```bash
curl "http://localhost:5000/api/search?q=linkin+park&source=youtube"
```

**Download starten:**
```bash
curl -X POST http://localhost:5000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","title":"Song Name","channel":"Artist"}'
```

**Playlist laden:**
```bash
curl -X POST http://localhost:5000/api/playlist \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/playlist?list=PL..."}'
```

## 🧪 Technik

| Bereich | Technologie |
|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, motion/react |
| **Backend** | Next.js API Routes, TypeScript |
| **Download** | yt-dlp + ffmpeg (MP3, 256kbps, embedded Cover) |
| **Animationen** | motion/react (Framer Motion) – Parallaxe, Stagger, Spring |
| **Icons** | lucide-react |
| **Design** | Dark Theme, Glasphormismus, Gradient-Blobs |

## 📁 Projektstruktur

```
src/
├── app/
│   ├── api/
│   │   ├── search/route.ts          # GET /api/search
│   │   ├── download/route.ts        # POST /api/download
│   │   ├── status/[id]/route.ts     # GET /api/status
│   │   ├── library/route.ts         # GET /api/library
│   │   ├── scan/route.ts            # POST /api/scan
│   │   ├── playlist/route.ts        # POST /api/playlist
│   │   └── batch-download/route.ts  # POST /api/batch-download
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/stars.tsx                 # StarsBackground
│   ├── search-tab.tsx
│   ├── playlist-tab.tsx
│   ├── library-tab.tsx
│   ├── download-queue.tsx
│   └── toast.tsx
└── lib/
    ├── utils.ts
    └── download-state.ts
```

## 📄 Lizenz

MIT

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/naix1337">naix1337</a></p>
</div>

### Navidrome konfigurieren

`/etc/navidrome/navidrome.toml`:
```toml
DataFolder = "/var/lib/navidrome"
MusicFolder = "/opt/navidrome/music"
DefaultAdminUsername = "admin"
DefaultAdminPassword = "admin"
```

### Navidrome als systemd Service

```bash
sudo wget https://raw.githubusercontent.com/navidrome/navidrome/main/contrib/navidrome.service -O /etc/systemd/system/navidrome.service
sudo systemctl daemon-reload
sudo systemctl enable --now navidrome
```
➡️ **http://deine-ip:4533** – Login mit `admin` / `admin`
