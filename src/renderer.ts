/**
 * renderer.ts
 * Pure rendering functions: difficulty badges, number formatting, beatmap rows.
 * No state, no side effects — easy to unit test or replace.
 */
import { OsuBeatmapset } from "./osuApi"
import { openInLazer } from "./osuApi"

// ─── Difficulty badge colors (osu! standard palette) ─────────────────────────

function diffColor(stars: number): string {
	if (stars < 2) return "#4fc3f7"   // Easy
	if (stars < 3) return "#66bb6a"   // Normal
	if (stars < 4) return "#ffa726"   // Hard
	if (stars < 5) return "#ef5350"   // Insane
	if (stars < 6.5) return "#ab47bc" // Expert
	return "#1a1a1a"                   // Expert+
}

export function renderDiffBadges(beatmaps: OsuBeatmapset["beatmaps"]): string {
	if (!beatmaps || beatmaps.length === 0) return ""
	return [...beatmaps]
		.sort((a, b) => a.difficulty_rating - b.difficulty_rating)
		.map(b => {
			const color = diffColor(b.difficulty_rating)
			const stars = b.difficulty_rating.toFixed(1)
			return `<span title="${b.version} (${stars}★)" style="display:inline-block;background:${color};color:#fff;font-size:10px;font-weight:700;padding:1px 5px;border-radius:3px;margin:1px 2px 1px 0;">${stars}★</span>`
		})
		.join("")
}

// ─── Number formatting ────────────────────────────────────────────────────────

export function fmtNum(n: number): string {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
	if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
	return n.toString()
}

// ─── Beatmap row ──────────────────────────────────────────────────────────────

export function renderBeatmapRow(map: OsuBeatmapset, onOpen: () => void): HTMLElement {
	const row = document.createElement("div")
	row.style.cssText = `display:flex;align-items:flex-start;gap:10px;padding:8px;border-radius:6px;margin-bottom:4px;background:rgba(255,255,255,0.04);transition:background 0.1s;`
	row.onmouseenter = () => row.style.background = "rgba(255,255,255,0.08)"
	row.onmouseleave = () => row.style.background = "rgba(255,255,255,0.04)"

	const img = document.createElement("img")
	img.src = map.covers.list || map.covers.card || map.covers.cover
	img.style.cssText = "width:52px;height:52px;border-radius:4px;object-fit:cover;flex-shrink:0;margin-top:2px;background:rgba(255,255,255,0.1);"
	img.onerror = () => { img.style.visibility = "hidden" }

	const info = document.createElement("div")
	info.style.cssText = "flex:1;min-width:0;"
	info.innerHTML = `
		<div style="font-size:13px;font-weight:600;color:var(--spice-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${map.title}</div>
		<div style="font-size:11px;color:var(--spice-subtext);margin-top:2px">${map.artist} • <span style="opacity:0.7">${map.creator}</span></div>
		<div style="margin-top:4px;line-height:1.4">${renderDiffBadges(map.beatmaps)}</div>
		<div style="display:flex;gap:10px;margin-top:4px;font-size:10px;color:var(--spice-subtext);">
			<span title="Play count">▶ ${fmtNum(map.play_count || 0)}</span>
			<span title="Favourites">♥ ${fmtNum(map.favourite_count || 0)}</span>
			<span style="opacity:0.5">${map.status}</span>
		</div>
	`

	const btn = document.createElement("button")
	btn.textContent = "▶ osu!"
	btn.style.cssText = `background:var(--spice-button);color:var(--spice-button-text);border:none;border-radius:5px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0;margin-top:2px;`
	btn.onclick = () => { openInLazer(map.id); onOpen() }

	row.appendChild(img)
	row.appendChild(info)
	row.appendChild(btn)
	return row
}

// ─── Map list into container ──────────────────────────────────────────────────

export function renderMapsInto(container: HTMLElement, maps: OsuBeatmapset[], onOpen: () => void) {
	if (maps.length === 0) {
		const empty = document.createElement("div")
		empty.style.cssText = "padding:20px;text-align:center;color:var(--spice-subtext);font-size:13px;opacity:0.6;"
		empty.textContent = "No results found"
		container.appendChild(empty)
		return
	}
	maps.forEach(map => container.appendChild(renderBeatmapRow(map, onOpen)))
}
