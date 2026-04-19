// spicetify-osu extension v1.2
import { searchBeatmapsets, searchBeatmapsetsByArtist, openInLazer, OsuBeatmapset } from "./osuApi"

let currentTrackId: string | null = null
let osuButton: HTMLElement | null = null
let matchedMaps: OsuBeatmapset[] = []
let artistMaps: OsuBeatmapset[] = []
let popup: HTMLElement | null = null
let currentArtist = ""
let currentTitle = ""
let searching = false
let activeTab: "tracks" | "artist" = "tracks"

async function onSongChange() {
	if (searching) return
	const meta = Spicetify.Player.data?.item?.metadata
	if (!meta) return
	const trackId = Spicetify.Player.data?.item?.uri
	currentArtist = meta["artist_name"] ?? ""
	currentTitle = meta["title"] ?? ""
	const query = `${currentArtist} ${currentTitle}`.trim()
	if (!query || trackId === currentTrackId) return
	currentTrackId = trackId
	matchedMaps = []; artistMaps = []
	updateButton(false); closePopup()
	searching = true
	try {
		const [allMaps, byArtist] = await Promise.all([
			searchBeatmapsets(query),
			searchBeatmapsetsByArtist(currentArtist),
		])
		matchedMaps = allMaps.filter(map => {
			const t = currentTitle.toLowerCase(), a = currentArtist.toLowerCase()
			const mt = map.title.toLowerCase(), ma = map.artist.toLowerCase()
			return mt.includes(t) || t.includes(mt) || ma.includes(a) || a.includes(ma)
		})
		artistMaps = byArtist
		if (matchedMaps.length > 0 || artistMaps.length > 0) updateButton(true)
	} catch (e) {
		console.error("[spicetify-osu] search error:", e)
	} finally { searching = false }
}

function diffColor(stars: number): string {
	if (stars < 2) return "#4fc3f7"
	if (stars < 3) return "#66bb6a"
	if (stars < 4) return "#ffa726"
	if (stars < 5) return "#ef5350"
	if (stars < 6.5) return "#ab47bc"
	return "#1a1a1a"
}

function renderDiffs(beatmaps: OsuBeatmapset["beatmaps"]): string {
	if (!beatmaps || beatmaps.length === 0) return ""
	return [...beatmaps].sort((a, b) => a.difficulty_rating - b.difficulty_rating).map(b => {
		const color = diffColor(b.difficulty_rating)
		const stars = b.difficulty_rating.toFixed(1)
		return `<span title="${b.version} (${stars}★)" style="display:inline-block;background:${color};color:#fff;font-size:10px;font-weight:700;padding:1px 5px;border-radius:3px;margin:1px 2px 1px 0;">${stars}★</span>`
	}).join("")
}

function fmtNum(n: number): string {
	if (n >= 1000000) return (n / 1000000).toFixed(1) + "M"
	if (n >= 1000) return (n / 1000).toFixed(1) + "K"
	return n.toString()
}

function closePopup() {
	if (popup) { popup.remove(); popup = null }
}

function renderMapsInto(container: HTMLElement, maps: OsuBeatmapset[]) {
	if (maps.length === 0) {
		const empty = document.createElement("div")
		empty.style.cssText = "padding:20px;text-align:center;color:var(--spice-subtext);font-size:13px;opacity:0.6;"
		empty.textContent = "No results found"
		container.appendChild(empty); return
	}
	maps.forEach(map => {
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
			<div style="margin-top:4px;line-height:1.4">${renderDiffs(map.beatmaps)}</div>
			<div style="display:flex;gap:10px;margin-top:4px;font-size:10px;color:var(--spice-subtext);">
				<span title="Play count">▶ ${fmtNum(map.play_count || 0)}</span>
				<span title="Favourites">♥ ${fmtNum(map.favourite_count || 0)}</span>
				<span style="opacity:0.5">${map.status}</span>
			</div>
		`
		const osuBtn = document.createElement("button")
		osuBtn.textContent = "▶ osu!"
		osuBtn.style.cssText = `background:var(--spice-button);color:var(--spice-button-text);border:none;border-radius:5px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0;margin-top:2px;`
		osuBtn.onclick = () => { openInLazer(map.id); closePopup() }
		row.appendChild(img); row.appendChild(info); row.appendChild(osuBtn)
		container.appendChild(row)
	})
}

function openPopup() {
	closePopup()
	popup = document.createElement("div")
	popup.id = "spicetify-osu-popup"
	popup.style.cssText = `position:fixed;bottom:90px;right:16px;width:460px;max-height:500px;display:flex;flex-direction:column;background:var(--spice-card);border:1px solid rgba(255,255,255,0.1);border-radius:10px;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.5);`
	const header = document.createElement("div")
	header.style.cssText = "padding:12px 12px 0 12px;flex-shrink:0;"
	header.innerHTML = `
		<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
			<div style="display:flex;align-items:center;gap:8px;">
				<svg width="14" height="14" viewBox="0 0 128 128" fill="currentColor"><circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" stroke-width="12"/><circle cx="64" cy="64" r="22" fill="currentColor"/></svg>
				<span style="font-size:13px;font-weight:700;color:var(--spice-text)">osu! Beatmaps</span>
			</div>
			<button id="osu-popup-close" style="background:none;border:none;cursor:pointer;color:var(--spice-subtext);font-size:16px">✕</button>
		</div>
		<div style="font-size:11px;color:var(--spice-subtext);padding:5px 8px;background:rgba(255,255,255,0.05);border-radius:5px;margin-bottom:8px;">
			<span style="opacity:0.6">Artist: </span><strong style="color:var(--spice-text)">${currentArtist}</strong>
			&nbsp;&nbsp;<span style="opacity:0.6">Title: </span><strong style="color:var(--spice-text)">${currentTitle}</strong>
		</div>
	`
	popup.appendChild(header)
	const tabs = document.createElement("div")
	tabs.style.cssText = "display:flex;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0;padding:0 12px;"
	const tabTrack = document.createElement("button")
	tabTrack.textContent = `Track (${matchedMaps.length})`
	tabTrack.style.cssText = `background:none;border:none;cursor:pointer;padding:8px 12px;font-size:12px;font-weight:600;border-bottom:2px solid transparent;`
	const tabArtist = document.createElement("button")
	tabArtist.textContent = `Artist (${artistMaps.length})`
	tabArtist.style.cssText = `background:none;border:none;cursor:pointer;padding:8px 12px;font-size:12px;font-weight:600;border-bottom:2px solid transparent;`
	tabs.appendChild(tabTrack); tabs.appendChild(tabArtist)
	popup.appendChild(tabs)
	const content = document.createElement("div")
	content.style.cssText = "overflow-y:auto;padding:10px 12px;flex:1;"
	popup.appendChild(content)
	function setTab(tab: "tracks" | "artist") {
		activeTab = tab; content.innerHTML = ""
		tabTrack.style.color = tab === "tracks" ? "var(--spice-text)" : "var(--spice-subtext)"
		tabTrack.style.borderBottomColor = tab === "tracks" ? "var(--spice-button)" : "transparent"
		tabArtist.style.color = tab === "artist" ? "var(--spice-text)" : "var(--spice-subtext)"
		tabArtist.style.borderBottomColor = tab === "artist" ? "var(--spice-button)" : "transparent"
		renderMapsInto(content, tab === "tracks" ? matchedMaps : artistMaps)
	}
	tabTrack.onclick = () => setTab("tracks")
	tabArtist.onclick = () => setTab("artist")
	setTab(matchedMaps.length > 0 ? "tracks" : "artist")
	document.body.appendChild(popup)
	popup.querySelector("#osu-popup-close")?.addEventListener("click", closePopup)
	setTimeout(() => {
		document.addEventListener("click", (e) => {
			if (popup && !popup.contains(e.target as Node) && e.target !== osuButton) closePopup()
		}, { once: true })
	}, 100)
}

function createOsuButton(): HTMLElement {
	const btn = document.createElement("button")
	btn.id = "spicetify-osu-btn"
	btn.style.cssText = `background:transparent;border:none;cursor:pointer;padding:4px 8px;border-radius:4px;color:var(--spice-subtext);font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px;opacity:0.6;transition:opacity 0.15s,color 0.15s;`
	btn.onmouseenter = () => { btn.style.opacity = "1"; btn.style.color = "var(--spice-text)" }
	btn.onmouseleave = () => { btn.style.opacity = "0.6"; btn.style.color = "var(--spice-subtext)" }
	btn.onclick = () => (matchedMaps.length > 0 || artistMaps.length > 0) && openPopup()
	btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 128 128" fill="currentColor"><circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" stroke-width="12"/><circle cx="64" cy="64" r="22" fill="currentColor"/></svg><span>osu!</span>`
	return btn
}

function updateButton(visible: boolean) {
	if (!osuButton) return
	osuButton.style.display = visible ? "flex" : "none"
}

function injectButton() {
	const container = document.querySelector(".main-nowPlayingBar-extraControls") ?? document.querySelector(".extra-controls-container")
	if (!container || document.getElementById("spicetify-osu-btn")) return
	osuButton = createOsuButton()
	osuButton.style.display = "none"
	container.prepend(osuButton)
}

async function main() {
	while (!Spicetify?.Player?.data || !Spicetify?.LocalStorage) {
		await new Promise(r => setTimeout(r, 300))
	}
	let attempts = 0
	while (attempts < 20) {
		if (document.querySelector(".main-nowPlayingBar-extraControls") ?? document.querySelector(".extra-controls-container")) break
		await new Promise(r => setTimeout(r, 500))
		attempts++
	}
	injectButton()
	Spicetify.Player.addEventListener("songchange", onSongChange)
	onSongChange()
}

main()
