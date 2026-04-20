/**
 * tracklist-watcher.ts
 * Watches Spotify tracklist pages and injects a small osu! badge
 * next to tracks that have a matching beatmap.
 *
 * - MutationObserver watches for new track rows
 * - Queue with 300ms throttle to avoid hammering the backend
 * - Cache by "artist|title" to avoid re-fetching
 */
import { searchBeatmapsets } from "./osuApi"

const OSU_BADGE_ATTR = "data-osu-checked"
const resultCache = new Map<string, boolean>()
const pendingQueue: Array<{ cacheKey: string; artist: string; title: string; titleEl: HTMLElement }> = []
let isProcessing = false

// ─── Badge ────────────────────────────────────────────────────────────────────

function createBadge(): HTMLElement {
	const badge = document.createElement("span")
	badge.className = "osu-tracklist-badge"
	badge.title = "Beatmap available on osu!"
	badge.style.cssText = "display:inline-flex;align-items:center;justify-content:center;margin-left:6px;vertical-align:middle;width:16px;height:16px;flex-shrink:0;opacity:0.75;"
	badge.innerHTML = `<svg width="14" height="14" viewBox="0 0 128 128" fill="currentColor"><circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" stroke-width="14"/><circle cx="64" cy="64" r="20" fill="currentColor"/></svg>`
	return badge
}

function injectBadge(titleEl: HTMLElement) {
	if (titleEl.querySelector(".osu-tracklist-badge")) return
	titleEl.appendChild(createBadge())
}

// ─── Queue processor (throttled) ─────────────────────────────────────────────

async function processQueue() {
	if (isProcessing || pendingQueue.length === 0) return
	isProcessing = true

	while (pendingQueue.length > 0) {
		const item = pendingQueue.shift()!

		if (resultCache.has(item.cacheKey)) {
			if (resultCache.get(item.cacheKey)) injectBadge(item.titleEl)
			continue
		}

		try {
			const maps = await searchBeatmapsets(`${item.artist} ${item.title}`)
			const titleLower = item.title.toLowerCase()
			const artistLower = item.artist.toLowerCase()
			const found = maps.some(map =>
				map.title.toLowerCase().includes(titleLower) || titleLower.includes(map.title.toLowerCase())
				|| map.artist.toLowerCase().includes(artistLower) || artistLower.includes(map.artist.toLowerCase())
			)
			resultCache.set(item.cacheKey, found)
			if (found) injectBadge(item.titleEl)
		} catch {
			// Backend unavailable, skip silently
		}

		await new Promise(resolve => setTimeout(resolve, 350))
	}

	isProcessing = false
}

// ─── Row scanner ──────────────────────────────────────────────────────────────

function scanRow(row: Element) {
	if (row.getAttribute(OSU_BADGE_ATTR)) return

	// Try multiple Spotify tracklist row selectors
	const titleEl = row.querySelector<HTMLElement>(
		"[data-testid='tracklist-row'] .encore-text-body-medium, " +
		".tracklist-row__name, " +
		"[data-encore-id='text'].encore-text-body-medium"
	)
	if (!titleEl) return

	row.setAttribute(OSU_BADGE_ATTR, "1")

	const artistEl = row.querySelector<HTMLElement>(
		"[data-testid='tracklist-row'] .encore-text-body-small a, " +
		".tracklist-row__artist-name a"
	)

	const trackTitle = titleEl.textContent?.trim() ?? ""
	const trackArtist = artistEl?.textContent?.trim() ?? ""
	if (!trackTitle) return

	const cacheKey = `${trackArtist}|${trackTitle}`.toLowerCase()

	if (resultCache.has(cacheKey)) {
		if (resultCache.get(cacheKey)) injectBadge(titleEl)
		return
	}

	pendingQueue.push({ cacheKey, artist: trackArtist, title: trackTitle, titleEl })
	processQueue()
}

// ─── MutationObserver ─────────────────────────────────────────────────────────

let observer: MutationObserver | null = null

export function startTracklistWatcher() {
	if (observer) return

	// Delay initial scan to let Spotify fully render
	setTimeout(() => {
		document.querySelectorAll("[data-testid='tracklist-row'], .tracklist-row").forEach(scanRow)
	}, 2000)

	observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			mutation.addedNodes.forEach(node => {
				if (!(node instanceof Element)) return
				if (node.matches("[data-testid='tracklist-row'], .tracklist-row")) {
					scanRow(node)
				}
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
