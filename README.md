# spicetify-osu

A Spicetify extension that automatically searches osu! beatmaps for the song currently playing in Spotify.

> Built by [Shinra Tensei](https://github.com/shinratenseihc) with a lot of vibecoding. Contributions welcome — keep improvements centralized here via PRs.

![Preview](https://github.com/shinratenseihc/spicetify-osu/blob/main/preview%20osu%20spicetify.png)

---

## What it does

- Detects the current track playing in Spotify
- Searches osu! for matching beatmaps automatically
- Shows a popup with two tabs: **Track** (direct matches) and **Artist** (all maps from that artist)
- Displays difficulty badges, play count, and favourites for each beatmap
- One click opens the beatmap directly in **osu!lazer** via `osu://` deep link

---

## Requirements

- Windows
- [Spicetify](https://spicetify.app/) installed
- [Node.js](https://nodejs.org/) (v18+)
- Python 3.x
- osu!lazer installed
- An osu! OAuth API app (free, takes 2 minutes)

---

## Installation

### 1. Get your osu! API credentials

1. Go to https://osu.ppy.sh/home/account/edit
2. Scroll to the **OAuth** section
3. Click **New OAuth Application**
4. Name it anything (e.g. `spicetify-osu`), leave Callback URL empty
5. Save your **Client ID** and **Client Secret**

### 2. Clone this repo

```bash
git clone https://github.com/shinratenseihc/spicetify-osu.git
cd spicetify-osu
```

### 3. Configure your credentials

```bash
copy config.example.json config.json
```

Edit `config.json`:

```json
{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET"
}
```

> ⚠️ Never share or commit your `config.json`. It's already in `.gitignore`.

### 4. Install dependencies and build

```bash
npm install
npx gulp build
```

### 5. Install the Spicetify extension

```bash
copy dist\spicetify-osu.js %APPDATA%\spicetify\Extensions\spicetify-osu.js
spicetify config extensions spicetify-osu.js
spicetify apply
```

### 6. Start the backend

The backend needs to run in the background. It auto-starts with Windows via `start-backend.vbs` (already configured).

To run it manually:

```bash
python backend.py
```

---

## How it works

Spotify extensions can't call external APIs directly (CORS restrictions). This project uses a small local Python backend (`backend.py`) as a proxy — it handles osu! OAuth and forwards search requests. The Spicetify extension talks to it on `http://localhost:7270`.

---

## Architecture

The frontend is split into focused modules. Each file has one job:

```
src/
  main.ts           # Entry point only: init, wait for DOM, listen for track changes
  store.ts          # Shared state (current track, search results, loading flag)
  osuApi.ts         # All HTTP calls to the local backend
  player-button.ts  # The osu! button in the Spotify player bar
  popup.ts          # The beatmap popup: tabs, header, open/close lifecycle
  renderer.ts       # Pure rendering: difficulty badges, stats, beatmap rows
```

**Where to look depending on what you want to change:**

| Goal | File |
|---|---|
| Change how maps are fetched / matched | `main.ts` |
| Add a new field to the API response | `osuApi.ts` |
| Change the popup layout or tabs | `popup.ts` |
| Change how difficulty badges look | `renderer.ts` |
| Change the player bar button | `player-button.ts` |
| Add new shared state | `store.ts` |
| Change the backend proxy / API auth | `backend.py` |

---

## Project structure

```
spicetify-osu/
├── src/                    # TypeScript source (compiled to dist/)
│   ├── main.ts             # Entry point
│   ├── store.ts            # Shared state
│   ├── osuApi.ts           # API calls
│   ├── player-button.ts    # Player bar button
│   ├── popup.ts            # Search popup
│   └── renderer.ts         # UI rendering
├── types/                  # Spicetify type declarations
├── backend.py              # Local Python proxy server
├── config.json             # Your osu! credentials (not committed)
├── config.example.json     # Example config
├── start-backend.vbs       # Silent Windows autostart script
├── gulpfile.ts             # Build system
└── dist/                   # Compiled output (not committed)
```

---

## Contributing

Issues and pull requests are welcome. If you fork this project, any modifications must remain open source under the same GPL v3 license — meaning improvements come back to the community.

---

## License

[GPL v3](./LICENSE) — use it, modify it, but keep it open source.
