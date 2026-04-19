// osu! API via backend local HTTP (bypass CORS)
// Les credentials sont dans config.json cote backend, pas besoin de les stocker ici

export type OsuBeatmapset = {
	id: number
	title: string
	artist: string
	creator: string
	status: string
	play_count: number
	favourite_count: number
	covers: { list: string; card: string; cover: string }
	beatmaps?: { id: number; version: string; difficulty_rating: number; mode: string }[]
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
