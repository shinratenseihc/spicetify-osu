/**
 * store.ts
 * Shared state between modules.
 * Any module that needs to read or mutate app state imports from here.
 */
import { OsuBeatmapset } from "./osuApi"

export let currentTrackId: string | null = null
export let currentArtist = ""
export let currentTitle = ""
export let matchedMaps: OsuBeatmapset[] = []
export let artistMaps: OsuBeatmapset[] = []
export let searching = false

export function setState(patch: {
	currentTrackId?: string | null
	currentArtist?: string
	currentTitle?: string
	matchedMaps?: OsuBeatmapset[]
	artistMaps?: OsuBeatmapset[]
	searching?: boolean
}) {
	if (patch.currentTrackId !== undefined) currentTrackId = patch.currentTrackId
	if (patch.currentArtist !== undefined) currentArtist = patch.currentArtist
	if (patch.currentTitle !== undefined) currentTitle = patch.currentTitle
	if (patch.matchedMaps !== undefined) matchedMaps = patch.matchedMaps
	if (patch.artistMaps !== undefined) artistMaps = patch.artistMaps
	if (patch.searching !== undefined) searching = patch.searching
}
