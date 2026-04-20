/**
 * tracklist-watcher.ts
 * Injects a small osu! badge after the track title in Spotify tracklists.
 * Selector confirmed via DOM inspection (Spotify xpui, April 2026):
 *   Row:   .main-trackList-trackListRow
 *   Title: .main-trackList-rowMainContent .encore-text-body-medium
 *   Artist: first .encore-text-body-small a inside the row
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
	badge.style.cssText = [
		"display:inline-flex",
		"align-items:center",
		"margin-left:5px",
		"vertical-align:middle",
		"opacity:0.7",
		"position:relative",
		"top:-1px",
	].join(";")
	badge.innerHTML = `<svg width="13" height="13" viewBox="0 0 128 128" fill="currentColor"><circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" stroke-width="14"/><circle cx="64" cy="64" r="20" fill="currentColor"/></svg>`
	return badge
}

function injectBadge(titleEl: HTMLElement) {
	if (titleEl.querySelector(".osu-tracklist-badge")) return
	titleEl.appendChild(createBadge())
}

// ─── Queue processor ──────────────────────────────────────────────────────────

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

function scanRow(row: Element) {
	if (row.getAttribute(OSU_BADGE_ATTR)) return
	row.setAttribute(OSU_BADGE_ATTR, "1")

	// Title span: confirmed selector for Spotify xpui (April 2026)
	const titleEl = row.querySelector<HTMLElement>(
		".main-trackList-rowMainContent .encore-text-body-medium"
	)
	if (!titleEl) return

	// Artist: first link inside the row that's not the title container
	const artistEl = row.querySelector<HTMLElement>(
		".main-trackList-rowSectionEnd a, " +
		".encore-text-body-small a"
	)

	const title = titleEl.textContent?.trim() ?? ""
	const artist = artistEl?.textContent?.trim() ?? ""
	if (!title) return

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

	// Initial scan — delay to let Spotify render
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
