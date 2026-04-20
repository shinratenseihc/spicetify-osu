/**
 * renderer.ts
 * Pure rendering functions: difficulty badges, number formatting, beatmap rows.
 * No state, no side effects — easy to unit test or replace.
 */
import { OsuBeatmapset, OsuBeatmap } from "./osuApi"
import { openInLazer } from "./osuApi"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function diffColor(stars: number): string {
	if (stars < 2) return "#4fc3f7"   // Easy
	if (stars < 3) return "#66bb6a"   // Normal
	if (stars < 4) return "#ffa726"   // Hard
	if (stars < 5) return "#ef5350"   // Insane
	if (stars < 6.5) return "#ab47bc" // Expert
	return "#1a1a1a"                   // Expert+
}

export function fmtNum(n: number): string {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
	if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
	return n.toString()
}

function fmtTime(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = seconds % 60
	return `${m}:${s.toString().padStart(2, "0")}`
}

// ─── Difficulty tooltip panel ─────────────────────────────────────────────────

function buildDiffTooltip(b: OsuBeatmap): HTMLElement {
	const totalNotes = (b.count_circles || 0) + (b.count_sliders || 0)
	const nps = b.hit_length > 0 ? (totalNotes / b.hit_length).toFixed(2) : "?"

	const panel = document.createElement("div")
	panel.style.cssText = `
		display:none;position:absolute;z-index:10000;
		background:var(--spice-main);border:1px solid rgba(255,255,255,0.15);
		border-radius:8px;padding:10px 12px;min-width:180px;
		box-shadow:0 4px 16px rgba(0,0,0,0.5);font-size:11px;
		color:var(--spice-subtext);line-height:1.7;
	`
	panel.innerHTML = `
		<div style="font-weight:700;color:var(--spice-text);margin-bottom:6px;">${b.version}</div>
		<div>⭐ <b>${b.difficulty_rating.toFixed(2)}</b> stars</div>
		<div>🎵 <b>${nps}</b> NPS</div>
		<div>⏱ <b>${fmtTime(b.hit_length)}</b> drain / <b>${fmtTime(b.total_length)}</b> total</div>
		<div>○ <b>${b.count_circles}</b> circles &nbsp; ◇ <b>${b.count_sliders}</b> sliders</div>
		<div style="margin-top:4px;border-top:1px solid rgba(255,255,255,0.08);padding-top:4px;">
			AR <b>${b.ar}</b> &nbsp; CS <b>${b.cs}</b> &nbsp; OD <b>${b.accuracy}</b> &nbsp; HP <b>${b.drain}</b>
		</div>
	`
	return panel
}

// ─── Difficulty badges with hover tooltip ────────────────────────────────────

export function renderDiffBadges(beatmaps: OsuBeatmapset["beatmaps"]): HTMLElement {
	const wrapper = document.createElement("div")
	wrapper.style.cssText = "display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;position:relative;"

	if (!beatmaps || beatmaps.length === 0) return wrapper

	const sorted = [...beatmaps].sort((a, b) => a.difficulty_rating - b.difficulty_rating)

	sorted.forEach(b => {
		const color = diffColor(b.difficulty_rating)
		const stars = b.difficulty_rating.toFixed(1)
		const tooltip = buildDiffTooltip(b)

		const badge = document.createElement("span")
		badge.style.cssText = `
			display:inline-block;background:${color};color:#fff;
			font-size:10px;font-weight:700;padding:2px 6px;
			border-radius:3px;cursor:pointer;position:relative;
		`
		badge.textContent = `${stars}★`
		badge.appendChild(tooltip)

		badge.onmouseenter = () => {
			tooltip.style.display = "block"
			// Position above badge if near bottom
			const rect = badge.getBoundingClientRect()
			if (rect.bottom + 160 > window.innerHeight) {
				tooltip.style.bottom = "24px"
				tooltip.style.top = "auto"
			} else {
				tooltip.style.top = "24px"
				tooltip.style.bottom = "auto"
			}
			tooltip.style.left = "0"
		}
		badge.onmouseleave = () => { tooltip.style.display = "none" }

		wrapper.appendChild(badge)
	})

	return wrapper
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

	const titleEl = document.createElement("div")
	titleEl.style.cssText = "font-size:13px;font-weight:600;color:var(--spice-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
	titleEl.textContent = map.title

	const metaEl = document.createElement("div")
	metaEl.style.cssText = "font-size:11px;color:var(--spice-subtext);margin-top:2px;"
	metaEl.innerHTML = `${map.artist} • <span style="opacity:0.7">${map.creator}</span>`

	const statsEl = document.createElement("div")
	statsEl.style.cssText = "display:flex;gap:10px;margin-top:4px;font-size:10px;color:var(--spice-subtext);"
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
