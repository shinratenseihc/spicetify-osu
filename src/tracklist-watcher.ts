/**
 * tracklist-watcher.ts
 * Watches Spotify tracklist pages (playlists, albums) and injects
 * a small osu! badge next to tracks that have a matching beatmap.
 *
 * Strategy:
 *  - MutationObserver watches for new track rows
 *  - Batch search: collects up to 10 tracks then fires one request per track
 *  - Cache: results stored by "artist|title" key to avoid re-fetching
 *  - Throttled: max 1 request per 300ms to avoid hammering the backend
 */
import { searchBeatmapsets } from "./osuApi"

const OSU_BADGE_ATTR = "data-osu-checked"
const cache = new Map<string, boolean>() // "artist|title" → has beatmap
const queue: Array<{ key: string; artist: string; title: string; el: HTMLElement }> = []
let processing = false

// ─── Badge ────────────────────────────────────────────────────────────────────

function createBadge(): HTMLElement {
	const badge = document.createElement("span")
	badge.className = "osu-tracklist-badge"
	badge.title = "Beatmap available on osu!"
	badge.style.cssText = `
		display:inline-flex;align-items:center;justify-content:center;
		margin-left:6px;vertical-align:middle;
		width:16px;height:16px;flex-shrink:0;opacity:0.75;
	`
	badge.innerHTML = `
		<svg width="14" height="14" viewBox="0 0 128 128" fill="currentColor">
			<circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" stroke-width="14"/>
			<circle cx="64" cy="64" r="20" fill="currentColor"/>
		</svg>
	`
	return badge
}

// ─── Queue processor ──────────────────────────────────────────────────────────

async function processQueue() {
	if (processing || queue.length === 0) return
	processing = true

	while (queue.length > 0) {
		const item = queue.shift()!

		// Already cached
		if (cache.has(item.key)) {
			if (cache.get(item.key)) injectBadge(item.el)
			continue
		}

		try {
			const maps = await searchBeatmapsets(`${item.artist} ${item.title}`)
			const found = maps.some(map => {
				const t = item.title.toLowerCase()
				const a = item.artist.toLowerCase()
				return map.title.toLowerCase().includes(t) || t.includes(map.title.toLowerCase())
					|| map.artist.toLowerCase().includes(a) || a.includes(map.artist.toLowerCase())
			})
			cache.set(item.key, found)
			if (found) injectBadge(item.el)
		} catch {
			// Backend unavailable, skip silently
		}

		// Throttle: 1 request per 300ms
		await new Promise(r => setTimeout(r, 300))
	}

	processing = false
}

function injectBadge(titleEl: HTMLElement) {
	if (titleEl.querySelector(".osu-tracklist-badge")) return
	titleEl.appendChild(createBadge())
}

// ─── Row scanner ──────────────────────────────────────────────────────────────

function scanRow(row: Element) {
	// Skip already processed rows
	if (row.getAttribute(OSU_BADGE_ATTR)) return

	// Spotify tracklist row selectors (xpui)
	const titleEl = row.querySelector<HTMLElement>(
		"[data-testid='tracklist-row'] .encore-text-body-medium, " +
		".tracklist-row .tracklist-name, " +
		"[data-encore-id='text'].encore-text-body-medium"
	)

	if (!titleEl) return
	row.setAttribute(OSU_BADGE_ATTR, "1")

	// Get artist from the row
	const artistEl = row.querySelector<HTMLElement>(
		"[data-testid='tracklist-row'] .encore-text-body-small a, " +
		".tracklist-row .artists-albums a"
	)

	const title = titleEl.textContent?.trim() ?? ""
	const artist = artistEl?.textContent?.trim() ?? ""

	if (!title) return

	const key = `${artist}|${title}`.toLowerCase()

	if (cache.has(key)) {
		if (cache.get(key)) injectBadge(titleEl)
		return
	}

	queue.push({ key, artist, title, el: titleEl })
	processQueue()
}

// ─── MutationObserver ─────────────────────────────────────────────────────────

let observer: MutationObserver | null = null

export function startTracklistWatcher() {
	if (observer) return

	// Scan existing rows on page
	document.querySelectorAll("[data-testid='tracklist-row'], .tracklist-row").forEach(scanRow)

	observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			mutation.addedNodes.forEach(node => {
				if (!(node instanceof Element)) return

				// Direct row
				if (node.matches("[data-testid='tracklist-row'], .tracklist-row")) {
					scanRow(node)
				}

				// Rows inside added container
				node.querySelectorAll("[data-testid='tracklist-row'], .tracklist-row").forEach(scanRow)
			})
		}
	})

	observer.observe(document.body, { childList: true, subtree: true })
}

export function stopTracklistWatcher() {
	observer?.disconnect()
	observer = null
}
