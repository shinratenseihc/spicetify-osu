/**
 * main.ts — Entry point
 *
 * Responsibilities (and only these):
 *   1. Wait for Spicetify + DOM to be ready
 *   2. Inject the player button
 *   3. Listen for track changes
 *   4. Fetch beatmaps and update shared state
 *
 * For UI logic → see popup.ts and player-button.ts
 * For rendering → see renderer.ts
 * For API calls → see osuApi.ts
 * For shared state → see store.ts
 */
import { searchBeatmapsets, searchBeatmapsetsByArtist } from "./osuApi"
import { setState, currentTrackId, searching } from "./store"
import { injectPlayerButton, setPlayerButtonVisible } from "./player-button"
import { closePopup } from "./popup"

// ─── Track change handler ─────────────────────────────────────────────────────

async function onSongChange() {
	if (searching) return

	const meta = Spicetify.Player.data?.item?.metadata
	if (!meta) return

	const trackId = Spicetify.Player.data?.item?.uri
	const artist = meta["artist_name"] ?? ""
	const title = meta["title"] ?? ""
	const query = `${artist} ${title}`.trim()

	if (!query || trackId === currentTrackId) return

	setState({ currentTrackId: trackId, currentArtist: artist, currentTitle: title })
	setState({ matchedMaps: [], artistMaps: [] })
	setPlayerButtonVisible(false)
	closePopup()
	setState({ searching: true })

	try {
		const [allMaps, byArtist] = await Promise.all([
			searchBeatmapsets(query),
			searchBeatmapsetsByArtist(artist),
		])

		const matched = allMaps.filter(map => {
			const t = title.toLowerCase()
			const a = artist.toLowerCase()
			return map.title.toLowerCase().includes(t) || t.includes(map.title.toLowerCase())
				|| map.artist.toLowerCase().includes(a) || a.includes(map.artist.toLowerCase())
		})

		setState({ matchedMaps: matched, artistMaps: byArtist })

		if (matched.length > 0 || byArtist.length > 0) setPlayerButtonVisible(true)
	} catch (e) {
		console.error("[spicetify-osu] Search failed:", e)
	} finally {
		setState({ searching: false })
	}
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function main() {
	// Wait for Spicetify APIs
	while (!Spicetify?.Player?.data || !Spicetify?.LocalStorage) {
		await new Promise(r => setTimeout(r, 300))
	}

	// Wait for player bar DOM
	let attempts = 0
	while (attempts++ < 20) {
		const bar = document.querySelector(".main-nowPlayingBar-extraControls")
			?? document.querySelector(".extra-controls-container")
		if (bar) break
		await new Promise(r => setTimeout(r, 500))
	}

	injectPlayerButton()
	Spicetify.Player.addEventListener("songchange", onSongChange)
	onSongChange()
}

main()
