# music-fetch

Next.js Web-App zum Herunterladen von YouTube-Musik als MP3 – mit Playlist-Support, Multi-Provider-Suche und Navidrome-Integration.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-cyan)

---

## Funktionen

| Feature | Beschreibung |
|---|---|
| **🔍 Multi-Provider Suche** | YouTube, SoundCloud, Bandcamp, Vimeo |
| **📋 Playlists** | YouTube-Playlists laden & alle Tracks batch-downloaden |
| **⬇️ Download** | Ein Klick → MP3 mit Metadaten & Cover |
| **✨ StarsBackground** | Animierter Sternenhimmel mit Parallax-Effekt |
| **🎨 Dark Theme** | Tailwind CSS, responsiv |
| **📚 Bibliothek** | Bereits geladene Tracks anzeigen |
| **🎵 Navidrome** | Automatischer Import – Scan-Trigger + chown |
| **⚡ Parallel** | Bis zu 3 Downloads gleichzeitig |

## Schnellstart

```bash
git clone https://github.com/naix1337/music-fetch.git
cd music-fetch
npm install
npm run build
npm start
# → http://localhost:5000
```

## Entwicklung

```bash
npm run dev
# → http://localhost:3000
```

## Autostart (systemd)

```bash
sudo cp music-fetch.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now music-fetch
```

Logs:

```bash
journalctl -u music-fetch -f
```

## API-Endpunkte

| Endpunkt | Methode | Beschreibung |
|---|---|---|
| `/api/search?q=...&source=...` | GET | Multi-Provider Suche |
| `/api/download` | POST | Download starten |
| `/api/status/[id]` | GET | Download-Fortschritt |
| `/api/library` | GET | Bereits geladene Tracks |
| `/api/scan` | POST | Navidrome-Scan triggern |
| `/api/playlist` | POST | Playlist-Tracks abrufen |
| `/api/batch-download` | POST | Batch-Download |

## Voraussetzungen

- Node.js 20+
- yt-dlp, ffmpeg
- `/opt/navidrome/music/` (ausreichend Speicherplatz)

## Lizenz

MIT
