/**
 * osuApi.ts
 * All HTTP calls to the local backend proxy.
 * Backend address, search, and open-in-lazer logic lives here.
 */

export type OsuBeatmap = {
	id: number
	version: string              // Difficulty name
	difficulty_rating: number    // Star rating
	mode: string
	hit_length: number           // Drain time in seconds
	total_length: number         // Total length in seconds
	bpm: number
	count_circles: number
	count_sliders: number
	count_spinners: number
	accuracy: number             // OD
	ar: number                   // Approach rate
	cs: number                   // Circle size
	drain: number                // HP drain
}

export type OsuBeatmapset = {
	id: number
	title: string
	artist: string
	creator: string
	status: string
	play_count: number
	favourite_count: number
	bpm: number
	covers: { list: string; card: string; cover: string }
	beatmaps?: OsuBeatmap[]
}

const BACKEND = "http://localhost:7270"

async function backendSearch(query: string): Promise<OsuBeatmapset[]> {
	const url = `${BACKEND}/search?q=${encodeURIComponent(query)}`
	const res = await fetch(url)
	if (!res.ok) throw new Error(`Backend error ${res.status}`)
	const data = await res.json()
	return data.beatmapsets as OsuBeatmapset[]
}

export async function searchBeatmapsets(query: string): Promise<OsuBeatmapset[]> {
	return backendSearch(query)
}

export async function searchBeatmapsetsByArtist(artist: string): Promise<OsuBeatmapset[]> {
	return backendSearch(artist)
}

export async function openInLazer(beatmapsetId: number): Promise<void> {
	await fetch(`${BACKEND}/open?id=${beatmapsetId}`)
}
