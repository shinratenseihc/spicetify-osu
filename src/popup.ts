/**
 * popup.ts
 * Manages the beatmap search popup: creation, tabs, open/close lifecycle.
 * Reads shared state from store.ts, renders rows via renderer.ts.
 */
import { matchedMaps, artistMaps, currentArtist, currentTitle } from "./store"
import { renderMapsInto } from "./renderer"

let popup: HTMLElement | null = null
let activeTab: "tracks" | "artist" = "tracks"

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
		position:fixed;bottom:90px;right:16px;width:460px;max-height:500px;
		display:flex;flex-direction:column;
		background:var(--spice-card);border:1px solid rgba(255,255,255,0.1);
		border-radius:10px;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.5);
	`

	popup.appendChild(_buildHeader())
	const { tabTrack, tabArtist, tabs } = _buildTabs()
	popup.appendChild(tabs)

	const content = document.createElement("div")
	content.style.cssText = "overflow-y:auto;padding:10px 12px;flex:1;"
	popup.appendChild(content)

	const setTab = (tab: "tracks" | "artist") => {
		activeTab = tab
		content.innerHTML = ""
		tabTrack.style.color = tab === "tracks" ? "var(--spice-text)" : "var(--spice-subtext)"
		tabTrack.style.borderBottomColor = tab === "tracks" ? "var(--spice-button)" : "transparent"
		tabArtist.style.color = tab === "artist" ? "var(--spice-text)" : "var(--spice-subtext)"
		tabArtist.style.borderBottomColor = tab === "artist" ? "var(--spice-button)" : "transparent"
		renderMapsInto(content, tab === "tracks" ? matchedMaps : artistMaps, closePopup)
	}

	tabTrack.onclick = () => setTab("tracks")
	tabArtist.onclick = () => setTab("artist")
	setTab(matchedMaps.length > 0 ? "tracks" : "artist")

	document.body.appendChild(popup)
	popup.querySelector("#osu-popup-close")?.addEventListener("click", closePopup)

	// Close on outside click
	setTimeout(() => {
		document.addEventListener("click", (e) => {
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
				<svg width="14" height="14" viewBox="0 0 128 128" fill="currentColor">
					<circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" stroke-width="12"/>
					<circle cx="64" cy="64" r="22" fill="currentColor"/>
				</svg>
				<span style="font-size:13px;font-weight:700;color:var(--spice-text)">osu! Beatmaps</span>
			</div>
			<button id="osu-popup-close" style="background:none;border:none;cursor:pointer;color:var(--spice-subtext);font-size:16px">✕</button>
		</div>
		<div style="font-size:11px;color:var(--spice-subtext);padding:5px 8px;background:rgba(255,255,255,0.05);border-radius:5px;margin-bottom:8px;">
			<span style="opacity:0.6">Artist: </span><strong style="color:var(--spice-text)">${currentArtist}</strong>
			&nbsp;&nbsp;<span style="opacity:0.6">Title: </span><strong style="color:var(--spice-text)">${currentTitle}</strong>
		</div>
	`
	return header
}

function _buildTabs() {
	const tabs = document.createElement("div")
	tabs.style.cssText = "display:flex;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0;padding:0 12px;"

	const tabTrack = document.createElement("button")
	tabTrack.textContent = `Track (${matchedMaps.length})`
	tabTrack.style.cssText = `background:none;border:none;cursor:pointer;padding:8px 12px;font-size:12px;font-weight:600;border-bottom:2px solid transparent;`

	const tabArtist = document.createElement("button")
	tabArtist.textContent = `Artist (${artistMaps.length})`
	tabArtist.style.cssText = `background:none;border:none;cursor:pointer;padding:8px 12px;font-size:12px;font-weight:600;border-bottom:2px solid transparent;`

	tabs.appendChild(tabTrack)
	tabs.appendChild(tabArtist)
	return { tabTrack, tabArtist, tabs }
}
