/**
 * tracklist-watcher.ts
 * Watches Spotify tracklist pages and injects a small osu! badge
 * next to tracks that have a matching beatmap.
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
			const found = maps.some(function(map) {
				return map.title.toLowerCase().includes(titleLower)
					|| titleLower.includes(map.title.toLowerCase())
					|| map.artist.toLowerCase().includes(artistLower)
					|| artistLower.includes(map.artist.toLowerCase())
			})
			resultCache.set(item.cacheKey, found)
			if (found) injectBadge(item.titleEl)
		} catch {
			// Backend unavailable, skip silently
		}

		await new Promise(function(resolve) { setTimeout(resolve, 350) })
	}

	isProcessing = false
}

// ─── Row scanner ──────────────────────────────────────────────────────────────
// Sélecteurs confirmés via inspection DOM Spotify xpui (Avril 2026)
// Row class: .main-trackList-trackListRow
// Titre: premier span avec classe encore-text-body-medium dans la row
// Artiste: span avec standalone-ellipsis-one-line + encore-text-body-small

function getTitleAndArtist(row: Element): { titleEl: HTMLElement | null; title: string; artist: string } {
	// Le titre est dans le premier span encore-text-body-medium de la row
	const titleEl = row.querySelector<HTMLElement>(
		".encore-text-body-medium:not(.encore-internal-color-text-subdued)"
	)

	// L'artiste est dans un span standalone-ellipsis-one-line encore-text-body-small
	const artistEl = row.querySelector<HTMLElement>(
		".main-trackList-rowSectionEnd .encore-text-body-small.standalone-ellipsis-one-line, " +
		".encore-text-body-small.standalone-ellipsis-one-line"
	)

	return {
		titleEl,
		title: titleEl?.textContent?.trim() ?? "",
		artist: artistEl?.textContent?.trim() ?? "",
	}
}

function scanRow(row: Element) {
	if (row.getAttribute(OSU_BADGE_ATTR)) return
	row.setAttribute(OSU_BADGE_ATTR, "1")

	const { titleEl, title, artist } = getTitleAndArtist(row)
	if (!titleEl || !title) return

	const cacheKey = `${artist}|${title}`.toLowerCase()

	if (resultCache.has(cacheKey)) {
		if (resultCache.get(cacheKey)) injectBadge(titleEl)
		return
	}

	pendingQueue.push({ cacheKey, artist, title, titleEl })
	processQueue()
}

// ─── MutationObserver ─────────────────────────────────────────────────────────

const ROW_SELECTOR = ".main-trackList-trackListRow"

let observer: MutationObserver | null = null

export function startTracklistWatcher() {
	if (observer) return

	setTimeout(function() {
		document.querySelectorAll(ROW_SELECTOR).forEach(scanRow)
	}, 2000)

	observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			mutation.addedNodes.forEach(function(node) {
				if (!(node instanceof Element)) return
				if (node.matches(ROW_SELECTOR)) {
					scanRow(node)
				} else {
					node.querySelectorAll(ROW_SELECTOR).forEach(scanRow)
				}
			})
		})
	})

	observer.observe(document.body, { childList: true, subtree: true })
}

export function stopTracklistWatcher() {
	observer?.disconnect()
	observer = null
}
