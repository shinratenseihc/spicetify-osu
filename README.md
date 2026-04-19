# spicetify-osu

A Spicetify extension that automatically searches osu! beatmaps for the song currently playing in Spotify.

> Built by [Shinra Tensei](https://github.com/shinratenseihc) with a lot of vibecoding. This is a personal project — contributions are welcome but please don't fork it into a separate project.

---

## What it does

- Detects the current track playing in Spotify
- Searches osu! for matching beatmaps automatically
- Shows a popup with two tabs: **Track** (direct matches) and **Artist** (all maps from that artist)
- Displays difficulty badges, play count, and favourites for each beatmap
- One click opens the beatmap directly in **osu!lazer** via `osu://` deep link

## Preview

The osu! button appears in the Spotify player bar when a matching beatmap is found:

```
[Spotify player bar] ... ⊙ osu!
```

Click it to open the popup.

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

Copy the example config and fill in your credentials:

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

The backend needs to run in the background for the extension to work. It's set up to auto-start with Windows via `start-backend.vbs`.

To test it manually:

```bash
python backend.py
```

---

## How it works

Spotify extensions can't make direct HTTP requests to external APIs due to CORS restrictions. This project uses a small local Python backend (`backend.py`) as a proxy that handles osu! API authentication and forwards search requests. The Spicetify extension communicates with this backend on `http://localhost:7270`.

---

## Project structure

```
spicetify-osu/
├── src/
│   ├── main.tsx        # Spicetify extension entry point
│   └── osuApi.ts       # API calls to local backend
├── backend.py          # Local Python proxy server
├── config.json         # Your osu! credentials (not committed)
├── config.example.json # Example config file
├── start-backend.vbs   # Silent Windows autostart script
└── gulpfile.ts         # Build system
```

---

## Contributing

Issues and pull requests are welcome. Please contribute to this repo directly rather than forking it into a separate project — the goal is to keep improvements centralized here.

---

## License

See [LICENSE](./LICENSE). Personal use only, no forks as separate projects.
