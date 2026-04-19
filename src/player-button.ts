/**
 * player-button.ts
 * The osu! button injected into the Spotify player bar.
 * Handles injection, visibility, and click-to-open-popup.
 */
import { matchedMaps, artistMaps } from "./store"
import { openPopup, closePopup } from "./popup"

let osuButton: HTMLElement | null = null

// ─── Public API ───────────────────────────────────────────────────────────────

export function injectPlayerButton() {
	const container =
		document.querySelector(".main-nowPlayingBar-extraControls") ??
		document.querySelector(".extra-controls-container")

	if (!container || document.getElementById("spicetify-osu-btn")) return

	osuButton = _createButton()
	osuButton.style.display = "none"
	container.prepend(osuButton)
}

export function setPlayerButtonVisible(visible: boolean) {
	if (!osuButton) return
	osuButton.style.display = visible ? "flex" : "none"
}

// ─── Private ──────────────────────────────────────────────────────────────────

function _createButton(): HTMLElement {
	const btn = document.createElement("button")
	btn.id = "spicetify-osu-btn"
	btn.style.cssText = `
		background:transparent;border:none;cursor:pointer;
		padding:4px 8px;border-radius:4px;
		color:var(--spice-subtext);font-size:12px;font-weight:600;
		display:flex;align-items:center;gap:6px;
		opacity:0.6;transition:opacity 0.15s,color 0.15s;
	`
	btn.onmouseenter = () => { btn.style.opacity = "1"; btn.style.color = "var(--spice-text)" }
	btn.onmouseleave = () => { btn.style.opacity = "0.6"; btn.style.color = "var(--spice-subtext)" }
	btn.onclick = () => {
		if (matchedMaps.length > 0 || artistMaps.length > 0) openPopup(btn)
	}
	btn.innerHTML = `
		<svg width="16" height="16" viewBox="0 0 128 128" fill="currentColor">
			<circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" stroke-width="12"/>
			<circle cx="64" cy="64" r="22" fill="currentColor"/>
		</svg>
		<span>osu!</span>
	`
	return btn
}
