/**
 * popup.ts
 * Manages the beatmap search popup: creation, tabs, open/close lifecycle.
 * Tabs: Track | Artist + mode filter: All | osu! | Taiko | Catch | Mania
 */
import { matchedMaps, artistMaps, currentArtist, currentTitle } from "./store"
import { OsuBeatmapset } from "./osuApi"
import { renderMapsInto } from "./renderer"

let popup: HTMLElement | null = null

// ─── osu! game modes ──────────────────────────────────────────────────────────

type GameMode = "osu" | "taiko" | "fruits" | "mania"

const MODES: Array<{ key: GameMode; label: string; emoji: string }> = [
	{ key: "osu",    label: "osu!",  emoji: "⊙" },
	{ key: "taiko",  label: "Taiko", emoji: "🥁" },
	{ key: "fruits", label: "Catch", emoji: "🍎" },
	{ key: "mania",  label: "Mania", emoji: "🎹" },
]

function filterByMode(maps: OsuBeatmapset[], mode: GameMode): OsuBeatmapset[] {
	const result: OsuBeatmapset[] = []
	maps.forEach(function(map) {
		const filtered = (map.beatmaps || []).filter(function(b) { return b.mode === mode })
		if (filtered.length > 0) {
			result.push(Object.assign({}, map, { beatmaps: filtered }))
		}
	})
	return result
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

export function closePopup() {
	popup?.remove()
	popup = null
}

export function openPopup(playerButton: HTMLElement | null) {
	closePopup()

	popup = document.createElement("div")
	popup.id = "spicetify-osu-popup"
	popup.style.cssText = `
		position:fixed;bottom:90px;right:16px;width:500px;max-height:540px;
		display:flex;flex-direction:column;
		background:var(--spice-card);border:1px solid rgba(255,255,255,0.1);
		border-radius:10px;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.5);
	`

	popup.appendChild(_buildHeader())

	const row1 = _buildTabRow()
	popup.appendChild(row1.tabs)

	const row2 = _buildModeRow()
	popup.appendChild(row2.tabs)

	const content = document.createElement("div")
	content.style.cssText = "overflow-y:auto;padding:10px 12px;flex:1;"
	popup.appendChild(content)

	let activeSource: "tracks" | "artist" = matchedMaps.length > 0 ? "tracks" : "artist"
	let activeMode: GameMode | "all" = "all"

	function refresh() {
		content.innerHTML = ""
		const base = activeSource === "tracks" ? matchedMaps : artistMaps
		const filtered = activeMode === "all" ? base : filterByMode(base, activeMode)
		renderMapsInto(content, filtered, closePopup)
	}

	function setSource(src: "tracks" | "artist") {
		activeSource = src
		row1.tabTrack.style.color = src === "tracks" ? "var(--spice-text)" : "var(--spice-subtext)"
		row1.tabTrack.style.borderBottomColor = src === "tracks" ? "#FF66AA" : "transparent"
		row1.tabArtist.style.color = src === "artist" ? "var(--spice-text)" : "var(--spice-subtext)"
		row1.tabArtist.style.borderBottomColor = src === "artist" ? "#FF66AA" : "transparent"
		refresh()
	}

	function setMode(mode: GameMode | "all", btn: HTMLElement) {
		activeMode = mode
		row2.tabs.querySelectorAll<HTMLElement>(".osu-mode-tab").forEach(function(b) {
			b.style.color = "var(--spice-subtext)"
			b.style.borderBottomColor = "transparent"
		})
		btn.style.color = "var(--spice-text)"
		btn.style.borderBottomColor = "#FF66AA"
		refresh()
	}

	row1.tabTrack.onclick = function() { setSource("tracks") }
	row1.tabArtist.onclick = function() { setSource("artist") }
	row2.modeButtons.forEach(function(item) {
		item.btn.onclick = function() { setMode(item.key, item.btn) }
	})

	setSource(activeSource)
	setMode("all", row2.modeButtons[0].btn)

	document.body.appendChild(popup)
	popup.querySelector("#osu-popup-close")?.addEventListener("click", closePopup)

	setTimeout(function() {
		document.addEventListener("click", function(e) {
			if (popup && !popup.contains(e.target as Node) && e.target !== playerButton) closePopup()
		}, { once: true })
	}, 100)
}

// ─── Private builders ─────────────────────────────────────────────────────────

function _buildHeader(): HTMLElement {
	const header = document.createElement("div")
	header.style.cssText = "padding:12px 12px 0 12px;flex-shrink:0;"
	header.innerHTML = `
		<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
			<div style="display:flex;align-items:center;gap:8px;">
				<svg width="14" height="14" viewBox="0 0 128 128">
					<circle cx="64" cy="64" r="56" fill="none" stroke="#FF66AA" stroke-width="12"/>
					<circle cx="64" cy="64" r="22" fill="#FF66AA"/>
				</svg>
				<span style="font-size:13px;font-weight:700;color:var(--spice-text)">osu! Beatmaps</span>
			</div>
			<button id="osu-popup-close" style="background:none;border:none;cursor:pointer;color:var(--spice-subtext);font-size:16px">✕</button>
		</div>
		<div style="font-size:11px;color:var(--spice-subtext);padding:5px 8px;background:rgba(255,255,255,0.05);border-radius:5px;">
			<span style="opacity:0.6">Artist: </span><strong style="color:var(--spice-text)">${currentArtist}</strong>
			&nbsp;&nbsp;<span style="opacity:0.6">Title: </span><strong style="color:var(--spice-text)">${currentTitle}</strong>
		</div>
	`
	return header
}

function _tabBtn(label: string, extraClass?: string): HTMLButtonElement {
	const btn = document.createElement("button")
	btn.textContent = label
	if (extraClass) btn.className = extraClass
	btn.style.cssText = `background:none;border:none;cursor:pointer;padding:7px 10px;font-size:11px;font-weight:600;border-bottom:2px solid transparent;color:var(--spice-subtext);white-space:nowrap;`
	return btn
}

function _buildTabRow() {
	const tabs = document.createElement("div")
	tabs.style.cssText = "display:flex;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0;padding:0 12px;margin-top:8px;"
	const tabTrack = _tabBtn(`Track (${matchedMaps.length})`)
	const tabArtist = _tabBtn(`Artist (${artistMaps.length})`)
	tabs.appendChild(tabTrack)
	tabs.appendChild(tabArtist)
	return { tabs, tabTrack, tabArtist }
}

function _buildModeRow() {
	const tabs = document.createElement("div")
	tabs.style.cssText = "display:flex;border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0;padding:0 12px;background:rgba(255,255,255,0.02);"

	const modeButtons: Array<{ key: GameMode | "all"; btn: HTMLButtonElement }> = []

	const allBtn = _tabBtn("All", "osu-mode-tab")
	tabs.appendChild(allBtn)
	modeButtons.push({ key: "all", btn: allBtn })

	MODES.forEach(function(mode) {
		const btn = _tabBtn(`${mode.emoji} ${mode.label}`, "osu-mode-tab")
		tabs.appendChild(btn)
		modeButtons.push({ key: mode.key, btn })
	})

	return { tabs, modeButtons }
}
