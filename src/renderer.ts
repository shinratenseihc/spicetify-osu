/**
 * renderer.ts
 * Pure rendering functions: difficulty badges, number formatting, beatmap rows.
 * No state, no side effects — easy to unit test or replace.
 */
import { OsuBeatmapset, OsuBeatmap } from "./osuApi"
import { openInLazer } from "./osuApi"

// ─── osu! color palette ───────────────────────────────────────────────────────
// Matches the official osu! difficulty color scheme

const OSU_PINK = "#FF66AA"

function diffColor(stars: number): string {
	if (stars < 2) return "#88CCFF"   // Easy    - light blue
	if (stars < 3) return "#88DD88"   // Normal  - green
	if (stars < 4) return "#FFCC22"   // Hard    - yellow
	if (stars < 5) return "#FF6655"   // Insane  - red/orange
	if (stars < 6.5) return "#AA44FF" // Expert  - purple
	return "#000000"                   // Expert+ - black
}

export function fmtNum(n: number): string {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
	if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
	return n.toString()
}

function fmtTime(seconds: number): string {
	const mins = Math.floor(seconds / 60)
	const secs = seconds % 60
	return `${mins}:${secs.toString().padStart(2, "0")}`
}

// ─── Difficulty tooltip ───────────────────────────────────────────────────────

function buildDiffTooltip(diff: OsuBeatmap): HTMLElement {
	const totalNotes = (diff.count_circles || 0) + (diff.count_sliders || 0)
	const nps = diff.hit_length > 0 ? (totalNotes / diff.hit_length).toFixed(2) : "?"
	const panel = document.createElement("div")
	panel.style.cssText = `
		display:none;position:absolute;z-index:10000;bottom:28px;left:0;
		background:#1a1a1a;border:1px solid rgba(255,255,255,0.15);
		border-radius:8px;padding:10px 12px;min-width:185px;
		box-shadow:0 4px 16px rgba(0,0,0,0.6);font-size:11px;
		color:#ccc;line-height:1.8;white-space:nowrap;
	`
	panel.innerHTML = `
		<div style="font-weight:700;color:#fff;margin-bottom:5px;">${diff.version}</div>
		<div>⭐ <b style="color:#fff">${diff.difficulty_rating.toFixed(2)}</b> stars &nbsp; 🎵 <b style="color:#fff">${nps}</b> NPS</div>
		<div>⏱ <b style="color:#fff">${fmtTime(diff.hit_length)}</b> drain &nbsp; / &nbsp; <b style="color:#fff">${fmtTime(diff.total_length)}</b> total</div>
		<div>○ <b style="color:#fff">${diff.count_circles}</b> circles &nbsp; ◇ <b style="color:#fff">${diff.count_sliders}</b> sliders</div>
		<div style="margin-top:4px;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;color:#999;">
			AR <b style="color:#fff">${diff.ar}</b> &nbsp; CS <b style="color:#fff">${diff.cs}</b> &nbsp; OD <b style="color:#fff">${diff.accuracy}</b> &nbsp; HP <b style="color:#fff">${diff.drain}</b>
		</div>
	`
	return panel
}

// ─── Difficulty badges (style osu! website) ──────────────────────────────────
// Affiche le nom de la difficulté avec la couleur correspondante

export function renderDiffBadges(beatmaps: OsuBeatmapset["beatmaps"]): HTMLElement {
	const wrapper = document.createElement("div")
	wrapper.style.cssText = "display:flex;flex-wrap:wrap;gap:3px;margin-top:5px;position:relative;"
	if (!beatmaps || beatmaps.length === 0) return wrapper

	const sorted = [...beatmaps].sort(function(a, b) { return a.difficulty_rating - b.difficulty_rating })

	sorted.forEach(function(diff) {
		const color = diffColor(diff.difficulty_rating)
		const stars = diff.difficulty_rating.toFixed(1)
		const tooltip = buildDiffTooltip(diff)

		const badge = document.createElement("span")
		badge.style.cssText = `
			display:inline-flex;align-items:center;gap:4px;
			background:rgba(0,0,0,0.3);border:1px solid ${color};
			color:${color};font-size:10px;font-weight:700;
			padding:2px 7px;border-radius:20px;cursor:pointer;
			position:relative;transition:background 0.1s;
		`

		// Petit cercle coloré + nom de la difficulté + étoiles
		badge.innerHTML = `
			<span style="width:7px;height:7px;border-radius:50%;background:${color};flex-shrink:0;"></span>
			<span>${diff.version}</span>
			<span style="opacity:0.7">${stars}★</span>
		`
		badge.appendChild(tooltip)

		badge.onmouseenter = function() {
			badge.style.background = color + "22"
			tooltip.style.display = "block"
		}
		badge.onmouseleave = function() {
			badge.style.background = "rgba(0,0,0,0.3)"
			tooltip.style.display = "none"
		}

		wrapper.appendChild(badge)
	})

	return wrapper
}

// ─── Beatmap row ──────────────────────────────────────────────────────────────

export function renderBeatmapRow(map: OsuBeatmapset, onOpen: () => void): HTMLElement {
	const row = document.createElement("div")
	row.style.cssText = `display:flex;align-items:flex-start;gap:10px;padding:8px;border-radius:6px;margin-bottom:4px;background:rgba(255,255,255,0.04);transition:background 0.1s;`
	row.onmouseenter = function() { row.style.background = "rgba(255,255,255,0.08)" }
	row.onmouseleave = function() { row.style.background = "rgba(255,255,255,0.04)" }

	const img = document.createElement("img")
	img.src = map.covers.list || map.covers.card || map.covers.cover
	img.style.cssText = "width:52px;height:52px;border-radius:4px;object-fit:cover;flex-shrink:0;margin-top:2px;background:rgba(255,255,255,0.1);"
	img.onerror = function() { img.style.visibility = "hidden" }

	const info = document.createElement("div")
	info.style.cssText = "flex:1;min-width:0;"

	const titleEl = document.createElement("div")
	titleEl.style.cssText = "font-size:13px;font-weight:600;color:var(--spice-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
	titleEl.textContent = map.title

	const metaEl = document.createElement("div")
	metaEl.style.cssText = "font-size:11px;color:var(--spice-subtext);margin-top:2px;"
	metaEl.innerHTML = `${map.artist} • <span style="opacity:0.7">${map.creator}</span>`

	const statsEl = document.createElement("div")
	statsEl.style.cssText = "display:flex;gap:10px;margin-top:5px;font-size:10px;color:var(--spice-subtext);"
	statsEl.innerHTML = `
		<span title="Play count">▶ ${fmtNum(map.play_count || 0)}</span>
		<span title="Favourites">♥ ${fmtNum(map.favourite_count || 0)}</span>
		<span style="opacity:0.5">${map.status}</span>
	`

	info.appendChild(titleEl)
	info.appendChild(metaEl)
	info.appendChild(renderDiffBadges(map.beatmaps))
	info.appendChild(statsEl)

	const btn = document.createElement("button")
	btn.style.cssText = `
		background:${OSU_PINK};color:#fff;border:none;border-radius:5px;
		padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;
		flex-shrink:0;margin-top:2px;transition:opacity 0.1s;
	`
	btn.textContent = "▶ osu!"
	btn.onmouseenter = function() { btn.style.opacity = "0.85" }
	btn.onmouseleave = function() { btn.style.opacity = "1" }
	btn.onclick = function() { openInLazer(map.id); onOpen() }

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
	maps.forEach(function(map) { container.appendChild(renderBeatmapRow(map, onOpen)) })
}
