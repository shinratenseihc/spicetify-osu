import React from "react"
import { OsuBeatmapset, searchBeatmapsets, openInLazer } from "./osuApi"

type State = {
	maps: OsuBeatmapset[]
	loading: boolean
	error: string | null
	query: string
	clientId: string
	clientSecret: string
	saved: boolean
}

const styles = {
	page: { padding: "24px", color: "var(--spice-text)", fontFamily: "inherit" } as React.CSSProperties,
	header: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" } as React.CSSProperties,
	logo: { width: "32px", height: "32px", opacity: 0.9 } as React.CSSProperties,
	title: { fontSize: "22px", fontWeight: 700, margin: 0 } as React.CSSProperties,
	section: { marginBottom: "24px" } as React.CSSProperties,
	label: { display: "block", fontSize: "12px", color: "var(--spice-subtext)", marginBottom: "6px", textTransform: "uppercase" as const, letterSpacing: "0.1em" },
	input: { width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.07)", color: "var(--spice-text)", fontSize: "14px", boxSizing: "border-box" as const },
	btn: { padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600 },
	btnPrimary: { background: "var(--spice-button)", color: "var(--spice-button-text)" },
	btnOutline: { background: "transparent", color: "var(--spice-text)", border: "1px solid rgba(255,255,255,0.2)" },
	table: { width: "100%", borderCollapse: "collapse" as const },
	th: { textAlign: "left" as const, padding: "8px 12px", fontSize: "11px", color: "var(--spice-subtext)", textTransform: "uppercase" as const, letterSpacing: "0.1em", borderBottom: "1px solid rgba(255,255,255,0.1)" },
	td: { padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)", verticalAlign: "middle" as const },
	cover: { width: "48px", height: "48px", borderRadius: "4px", objectFit: "cover" as const },
	trackName: { fontSize: "13px", fontWeight: 600, color: "var(--spice-text)" },
	trackSub: { fontSize: "11px", color: "var(--spice-subtext)", marginTop: "2px" },
	status: { fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.1)", color: "var(--spice-subtext)" },
}

export class OsuApp extends React.Component<{}, State> {
	constructor(props: {}) {
		super(props)
		this.state = {
			maps: [],
			loading: false,
			error: null,
			query: "",
			clientId: Spicetify.LocalStorage.get("osu:clientId") ?? "",
			clientSecret: Spicetify.LocalStorage.get("osu:clientSecret") ?? "",
			saved: false,
		}
	}

	componentDidMount() {
		// Auto-search current track when plugin opens
		this.searchCurrentTrack()
		// Listen for track changes
		Spicetify.Player.addEventListener("songchange", () => this.searchCurrentTrack())
	}

	getCurrentTrackQuery(): string {
		const meta = Spicetify.Player.data?.item?.metadata
		if (!meta) return ""
		const artist = meta["artist_name"] ?? ""
		const title = meta["title"] ?? ""
		return `${artist} ${title}`.trim()
	}

	async searchCurrentTrack() {
		const query = this.getCurrentTrackQuery()
		if (!query) return
		this.setState({ query })
		await this.doSearch(query)
	}

	async doSearch(query: string) {
		if (!query.trim()) return
		this.setState({ loading: true, error: null, maps: [] })
		try {
			const maps = await searchBeatmapsets(query)
			this.setState({ maps, loading: false })
		} catch (e: any) {
			this.setState({ error: e.message, loading: false })
		}
	}

	saveCredentials() {
		Spicetify.LocalStorage.set("osu:clientId", this.state.clientId)
		Spicetify.LocalStorage.set("osu:clientSecret", this.state.clientSecret)
		this.setState({ saved: true })
		setTimeout(() => this.setState({ saved: false }), 2000)
	}

	render() {
		const { maps, loading, error, query, clientId, clientSecret, saved } = this.state
		const hasCredentials = !!clientId && !!clientSecret

		return (
			<div style={styles.page}>
				<div style={styles.header}>
					<svg style={styles.logo} viewBox="0 0 128 128"><circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="12"/><circle cx="64" cy="64" r="24" fill="currentColor"/></svg>
					<h1 style={styles.title}>osu! Search</h1>
				</div>

				{/* Credentials */}
				<div style={styles.section}>
					<label style={styles.label}>osu! Client ID</label>
					<input style={{...styles.input, marginBottom: "8px"}} type="text" value={clientId} placeholder="Client ID" onChange={e => this.setState({ clientId: e.target.value })} />
					<label style={styles.label}>osu! Client Secret</label>
					<input style={{...styles.input, marginBottom: "8px"}} type="password" value={clientSecret} placeholder="Client Secret" onChange={e => this.setState({ clientSecret: e.target.value })} />
					<button style={{...styles.btn, ...styles.btnOutline}} onClick={() => this.saveCredentials()}>
						{saved ? "✓ Saved!" : "Save credentials"}
					</button>
				</div>

				{/* Search bar */}
				<div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
					<input style={{...styles.input, flex: 1}} type="text" value={query} placeholder="Search beatmaps..." onChange={e => this.setState({ query: e.target.value })} onKeyDown={e => e.key === "Enter" && this.doSearch(query)} />
					<button style={{...styles.btn, ...styles.btnPrimary}} onClick={() => this.doSearch(query)}>Search</button>
					<button style={{...styles.btn, ...styles.btnOutline}} onClick={() => this.searchCurrentTrack()} title="Search current track">♪</button>
				</div>

				{/* Results */}
				{loading && <div style={{ color: "var(--spice-subtext)", padding: "20px 0" }}>Searching...</div>}
				{error && <div style={{ color: "#f44336", padding: "12px", background: "rgba(244,67,54,0.1)", borderRadius: "6px", marginBottom: "16px" }}>{error}</div>}
				{!loading && maps.length > 0 && this.renderTable()}
				{!loading && !error && maps.length === 0 && query && <div style={{ color: "var(--spice-subtext)", padding: "20px 0" }}>No results.</div>}
			</div>
		)
	}

	renderTable() {
		return (
			<table style={styles.table}>
				<thead>
					<tr>
						<th style={styles.th}></th>
						<th style={styles.th}>Title</th>
						<th style={styles.th}>Artist</th>
						<th style={styles.th}>Mapper</th>
						<th style={styles.th}>Status</th>
						<th style={styles.th}>Open</th>
					</tr>
				</thead>
				<tbody>
					{this.state.maps.map(map => (
						<tr key={map.id} style={{ cursor: "default" }}>
							<td style={styles.td}><img src={map.covers.list} style={styles.cover} /></td>
							<td style={styles.td}><div style={styles.trackName}>{map.title}</div></td>
							<td style={styles.td}><div style={styles.trackSub}>{map.artist}</div></td>
							<td style={styles.td}><div style={styles.trackSub}>{map.creator}</div></td>
							<td style={styles.td}><span style={styles.status}>{map.status}</span></td>
							<td style={styles.td}>
								<button style={{...styles.btn, ...styles.btnPrimary, marginRight: "6px"}} onClick={() => openInLazer(map.id)} title="Open in osu!lazer">▶ osu!</button>
								<button style={{...styles.btn, ...styles.btnOutline}} onClick={() => window.open(`https://osu.ppy.sh/beatmapsets/${map.id}`, "_blank")} title="View on website">🌐</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		)
	}
}
