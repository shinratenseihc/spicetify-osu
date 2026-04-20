(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * main.ts — Entry point
 *
 * Responsibilities (and only these):
 *   1. Wait for Spicetify + DOM to be ready
 *   2. Inject the player button
 *   3. Listen for track changes and fetch beatmaps
 *   4. Start the tracklist watcher (badge on playlist tracks)
 *
 * For UI logic         → popup.ts, player-button.ts
 * For rendering        → renderer.ts
 * For API calls        → osuApi.ts
 * For shared state     → store.ts
 * For playlist badges  → tracklist-watcher.ts
 */
const osuApi_1 = require("./osuApi");
const store_1 = require("./store");
const player_button_1 = require("./player-button");
const popup_1 = require("./popup");
const tracklist_watcher_1 = require("./tracklist-watcher");
// ─── Track change handler ─────────────────────────────────────────────────────
function onSongChange() {
  var _a, _b, _c, _d, _e, _f;
  return __awaiter(this, void 0, void 0, function* () {
    if (store_1.searching) return;
    const meta = (_b = (_a = Spicetify.Player.data) === null || _a === void 0 ? void 0 : _a.item) === null || _b === void 0 ? void 0 : _b.metadata;
    if (!meta) return;
    const trackId = (_d = (_c = Spicetify.Player.data) === null || _c === void 0 ? void 0 : _c.item) === null || _d === void 0 ? void 0 : _d.uri;
    const artist = (_e = meta["artist_name"]) !== null && _e !== void 0 ? _e : "";
    const title = (_f = meta["title"]) !== null && _f !== void 0 ? _f : "";
    const query = `${artist} ${title}`.trim();
    if (!query || trackId === store_1.currentTrackId) return;
    (0, store_1.setState)({
      currentTrackId: trackId,
      currentArtist: artist,
      currentTitle: title
    });
    (0, store_1.setState)({
      matchedMaps: [],
      artistMaps: []
    });
    (0, player_button_1.setPlayerButtonVisible)(false);
    (0, popup_1.closePopup)();
    (0, store_1.setState)({
      searching: true
    });
    try {
      const [allMaps, byArtist] = yield Promise.all([(0, osuApi_1.searchBeatmapsets)(query), (0, osuApi_1.searchBeatmapsetsByArtist)(artist)]);
      const matched = allMaps.filter(map => {
        const t = title.toLowerCase();
        const a = artist.toLowerCase();
        return map.title.toLowerCase().includes(t) || t.includes(map.title.toLowerCase()) || map.artist.toLowerCase().includes(a) || a.includes(map.artist.toLowerCase());
      });
      (0, store_1.setState)({
        matchedMaps: matched,
        artistMaps: byArtist
      });
      if (matched.length > 0 || byArtist.length > 0) (0, player_button_1.setPlayerButtonVisible)(true);
    } catch (e) {
      console.error("[spicetify-osu] Search failed:", e);
    } finally {
      (0, store_1.setState)({
        searching: false
      });
    }
  });
}
// ─── Bootstrap ────────────────────────────────────────────────────────────────
function main() {
  var _a, _b;
  return __awaiter(this, void 0, void 0, function* () {
    while (!((_a = Spicetify === null || Spicetify === void 0 ? void 0 : Spicetify.Player) === null || _a === void 0 ? void 0 : _a.data) || !(Spicetify === null || Spicetify === void 0 ? void 0 : Spicetify.LocalStorage)) {
      yield new Promise(r => setTimeout(r, 300));
    }
    let attempts = 0;
    while (attempts++ < 20) {
      const bar = (_b = document.querySelector(".main-nowPlayingBar-extraControls")) !== null && _b !== void 0 ? _b : document.querySelector(".extra-controls-container");
      if (bar) break;
      yield new Promise(r => setTimeout(r, 500));
    }
    (0, player_button_1.injectPlayerButton)();
    (0, tracklist_watcher_1.startTracklistWatcher)();
    Spicetify.Player.addEventListener("songchange", onSongChange);
    onSongChange();
  });
}
main();
},{"./osuApi":2,"./player-button":3,"./popup":4,"./store":6,"./tracklist-watcher":7}],2:[function(require,module,exports){
"use strict";

/**
 * osuApi.ts
 * All HTTP calls to the local backend proxy.
 * Backend address, search, and open-in-lazer logic lives here.
 */
var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.openInLazer = exports.searchBeatmapsetsByArtist = exports.searchBeatmapsets = void 0;
const BACKEND = "http://localhost:7270";
function backendSearch(query) {
  return __awaiter(this, void 0, void 0, function* () {
    const url = `${BACKEND}/search?q=${encodeURIComponent(query)}`;
    const res = yield fetch(url);
    if (!res.ok) throw new Error(`Backend error ${res.status}`);
    const data = yield res.json();
    return data.beatmapsets;
  });
}
function searchBeatmapsets(query) {
  return __awaiter(this, void 0, void 0, function* () {
    return backendSearch(query);
  });
}
exports.searchBeatmapsets = searchBeatmapsets;
function searchBeatmapsetsByArtist(artist) {
  return __awaiter(this, void 0, void 0, function* () {
    return backendSearch(artist);
  });
}
exports.searchBeatmapsetsByArtist = searchBeatmapsetsByArtist;
function openInLazer(beatmapsetId) {
  return __awaiter(this, void 0, void 0, function* () {
    yield fetch(`${BACKEND}/open?id=${beatmapsetId}`);
  });
}
exports.openInLazer = openInLazer;
},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setPlayerButtonVisible = exports.injectPlayerButton = void 0;
/**
 * player-button.ts
 * The osu! button injected into the Spotify player bar.
 * Handles injection, visibility, and click-to-open-popup.
 */
const store_1 = require("./store");
const popup_1 = require("./popup");
let osuButton = null;
// ─── Public API ───────────────────────────────────────────────────────────────
function injectPlayerButton() {
  var _a;
  const container = (_a = document.querySelector(".main-nowPlayingBar-extraControls")) !== null && _a !== void 0 ? _a : document.querySelector(".extra-controls-container");
  if (!container || document.getElementById("spicetify-osu-btn")) return;
  osuButton = _createButton();
  osuButton.style.display = "none";
  container.prepend(osuButton);
}
exports.injectPlayerButton = injectPlayerButton;
function setPlayerButtonVisible(visible) {
  if (!osuButton) return;
  osuButton.style.display = visible ? "flex" : "none";
}
exports.setPlayerButtonVisible = setPlayerButtonVisible;
// ─── Private ──────────────────────────────────────────────────────────────────
function _createButton() {
  const btn = document.createElement("button");
  btn.id = "spicetify-osu-btn";
  btn.style.cssText = `
		background:transparent;border:none;cursor:pointer;
		padding:4px 8px;border-radius:4px;
		color:var(--spice-subtext);font-size:12px;font-weight:600;
		display:flex;align-items:center;gap:6px;
		opacity:0.6;transition:opacity 0.15s,color 0.15s;
	`;
  btn.onmouseenter = () => {
    btn.style.opacity = "1";
    btn.style.color = "var(--spice-text)";
  };
  btn.onmouseleave = () => {
    btn.style.opacity = "0.6";
    btn.style.color = "var(--spice-subtext)";
  };
  btn.onclick = () => {
    if (store_1.matchedMaps.length > 0 || store_1.artistMaps.length > 0) (0, popup_1.openPopup)(btn);
  };
  btn.innerHTML = `
		<svg width="16" height="16" viewBox="0 0 128 128" fill="currentColor">
			<circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" stroke-width="12"/>
			<circle cx="64" cy="64" r="22" fill="currentColor"/>
		</svg>
		<span>osu!</span>
	`;
  return btn;
}
},{"./popup":4,"./store":6}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.openPopup = exports.closePopup = void 0;
/**
 * popup.ts
 * Manages the beatmap search popup: creation, tabs, open/close lifecycle.
 * Reads shared state from store.ts, renders rows via renderer.ts.
 */
const store_1 = require("./store");
const renderer_1 = require("./renderer");
let popup = null;
let activeTab = "tracks";
// ─── Lifecycle ────────────────────────────────────────────────────────────────
function closePopup() {
  popup === null || popup === void 0 ? void 0 : popup.remove();
  popup = null;
}
exports.closePopup = closePopup;
function openPopup(playerButton) {
  var _a;
  closePopup();
  popup = document.createElement("div");
  popup.id = "spicetify-osu-popup";
  popup.style.cssText = `
		position:fixed;bottom:90px;right:16px;width:460px;max-height:500px;
		display:flex;flex-direction:column;
		background:var(--spice-card);border:1px solid rgba(255,255,255,0.1);
		border-radius:10px;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.5);
	`;
  popup.appendChild(_buildHeader());
  const {
    tabTrack,
    tabArtist,
    tabs
  } = _buildTabs();
  popup.appendChild(tabs);
  const content = document.createElement("div");
  content.style.cssText = "overflow-y:auto;padding:10px 12px;flex:1;";
  popup.appendChild(content);
  const setTab = tab => {
    activeTab = tab;
    content.innerHTML = "";
    tabTrack.style.color = tab === "tracks" ? "var(--spice-text)" : "var(--spice-subtext)";
    tabTrack.style.borderBottomColor = tab === "tracks" ? "var(--spice-button)" : "transparent";
    tabArtist.style.color = tab === "artist" ? "var(--spice-text)" : "var(--spice-subtext)";
    tabArtist.style.borderBottomColor = tab === "artist" ? "var(--spice-button)" : "transparent";
    (0, renderer_1.renderMapsInto)(content, tab === "tracks" ? store_1.matchedMaps : store_1.artistMaps, closePopup);
  };
  tabTrack.onclick = () => setTab("tracks");
  tabArtist.onclick = () => setTab("artist");
  setTab(store_1.matchedMaps.length > 0 ? "tracks" : "artist");
  document.body.appendChild(popup);
  (_a = popup.querySelector("#osu-popup-close")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", closePopup);
  // Close on outside click
  setTimeout(() => {
    document.addEventListener("click", e => {
      if (popup && !popup.contains(e.target) && e.target !== playerButton) closePopup();
    }, {
      once: true
    });
  }, 100);
}
exports.openPopup = openPopup;
// ─── Private builders ─────────────────────────────────────────────────────────
function _buildHeader() {
  const header = document.createElement("div");
  header.style.cssText = "padding:12px 12px 0 12px;flex-shrink:0;";
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
			<span style="opacity:0.6">Artist: </span><strong style="color:var(--spice-text)">${store_1.currentArtist}</strong>
			&nbsp;&nbsp;<span style="opacity:0.6">Title: </span><strong style="color:var(--spice-text)">${store_1.currentTitle}</strong>
		</div>
	`;
  return header;
}
function _buildTabs() {
  const tabs = document.createElement("div");
  tabs.style.cssText = "display:flex;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0;padding:0 12px;";
  const tabTrack = document.createElement("button");
  tabTrack.textContent = `Track (${store_1.matchedMaps.length})`;
  tabTrack.style.cssText = `background:none;border:none;cursor:pointer;padding:8px 12px;font-size:12px;font-weight:600;border-bottom:2px solid transparent;`;
  const tabArtist = document.createElement("button");
  tabArtist.textContent = `Artist (${store_1.artistMaps.length})`;
  tabArtist.style.cssText = `background:none;border:none;cursor:pointer;padding:8px 12px;font-size:12px;font-weight:600;border-bottom:2px solid transparent;`;
  tabs.appendChild(tabTrack);
  tabs.appendChild(tabArtist);
  return {
    tabTrack,
    tabArtist,
    tabs
  };
}
},{"./renderer":5,"./store":6}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.renderMapsInto = exports.renderBeatmapRow = exports.renderDiffBadges = exports.fmtNum = void 0;
const osuApi_1 = require("./osuApi");
// ─── Helpers ──────────────────────────────────────────────────────────────────
function diffColor(stars) {
  if (stars < 2) return "#4fc3f7";
  if (stars < 3) return "#66bb6a";
  if (stars < 4) return "#ffa726";
  if (stars < 5) return "#ef5350";
  if (stars < 6.5) return "#ab47bc";
  return "#1a1a1a";
}
function fmtNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}
exports.fmtNum = fmtNum;
function fmtTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
// ─── Difficulty tooltip panel ─────────────────────────────────────────────────
function buildDiffTooltip(diff) {
  const totalNotes = (diff.count_circles || 0) + (diff.count_sliders || 0);
  const nps = diff.hit_length > 0 ? (totalNotes / diff.hit_length).toFixed(2) : "?";
  const panel = document.createElement("div");
  panel.style.cssText = `
		display:none;position:absolute;z-index:10000;
		background:var(--spice-main);border:1px solid rgba(255,255,255,0.15);
		border-radius:8px;padding:10px 12px;min-width:180px;
		box-shadow:0 4px 16px rgba(0,0,0,0.5);font-size:11px;
		color:var(--spice-subtext);line-height:1.7;
	`;
  panel.innerHTML = `
		<div style="font-weight:700;color:var(--spice-text);margin-bottom:6px;">${diff.version}</div>
		<div>⭐ <b>${diff.difficulty_rating.toFixed(2)}</b> stars</div>
		<div>🎵 <b>${nps}</b> NPS</div>
		<div>⏱ <b>${fmtTime(diff.hit_length)}</b> drain / <b>${fmtTime(diff.total_length)}</b> total</div>
		<div>○ <b>${diff.count_circles}</b> circles &nbsp; ◇ <b>${diff.count_sliders}</b> sliders</div>
		<div style="margin-top:4px;border-top:1px solid rgba(255,255,255,0.08);padding-top:4px;">
			AR <b>${diff.ar}</b> &nbsp; CS <b>${diff.cs}</b> &nbsp; OD <b>${diff.accuracy}</b> &nbsp; HP <b>${diff.drain}</b>
		</div>
	`;
  return panel;
}
// ─── Difficulty badges with hover tooltip ────────────────────────────────────
function renderDiffBadges(beatmaps) {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;position:relative;";
  if (!beatmaps || beatmaps.length === 0) return wrapper;
  const sorted = [...beatmaps].sort((a, b) => a.difficulty_rating - b.difficulty_rating);
  sorted.forEach(function (diff) {
    const color = diffColor(diff.difficulty_rating);
    const stars = diff.difficulty_rating.toFixed(1);
    const tooltip = buildDiffTooltip(diff);
    const badge = document.createElement("span");
    badge.style.cssText = `display:inline-block;background:${color};color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;cursor:pointer;position:relative;`;
    badge.textContent = `${stars}★`;
    badge.appendChild(tooltip);
    badge.onmouseenter = function () {
      tooltip.style.display = "block";
      const rect = badge.getBoundingClientRect();
      if (rect.bottom + 160 > window.innerHeight) {
        tooltip.style.bottom = "24px";
        tooltip.style.top = "auto";
      } else {
        tooltip.style.top = "24px";
        tooltip.style.bottom = "auto";
      }
      tooltip.style.left = "0";
    };
    badge.onmouseleave = function () {
      tooltip.style.display = "none";
    };
    wrapper.appendChild(badge);
  });
  return wrapper;
}
exports.renderDiffBadges = renderDiffBadges;
// ─── Beatmap row ──────────────────────────────────────────────────────────────
function renderBeatmapRow(map, onOpen) {
  const row = document.createElement("div");
  row.style.cssText = `display:flex;align-items:flex-start;gap:10px;padding:8px;border-radius:6px;margin-bottom:4px;background:rgba(255,255,255,0.04);transition:background 0.1s;`;
  row.onmouseenter = function () {
    row.style.background = "rgba(255,255,255,0.08)";
  };
  row.onmouseleave = function () {
    row.style.background = "rgba(255,255,255,0.04)";
  };
  const img = document.createElement("img");
  img.src = map.covers.list || map.covers.card || map.covers.cover;
  img.style.cssText = "width:52px;height:52px;border-radius:4px;object-fit:cover;flex-shrink:0;margin-top:2px;background:rgba(255,255,255,0.1);";
  img.onerror = function () {
    img.style.visibility = "hidden";
  };
  const info = document.createElement("div");
  info.style.cssText = "flex:1;min-width:0;";
  const titleEl = document.createElement("div");
  titleEl.style.cssText = "font-size:13px;font-weight:600;color:var(--spice-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
  titleEl.textContent = map.title;
  const metaEl = document.createElement("div");
  metaEl.style.cssText = "font-size:11px;color:var(--spice-subtext);margin-top:2px;";
  metaEl.innerHTML = `${map.artist} • <span style="opacity:0.7">${map.creator}</span>`;
  const statsEl = document.createElement("div");
  statsEl.style.cssText = "display:flex;gap:10px;margin-top:4px;font-size:10px;color:var(--spice-subtext);";
  statsEl.innerHTML = `
		<span title="Play count">▶ ${fmtNum(map.play_count || 0)}</span>
		<span title="Favourites">♥ ${fmtNum(map.favourite_count || 0)}</span>
		<span style="opacity:0.5">${map.status}</span>
	`;
  info.appendChild(titleEl);
  info.appendChild(metaEl);
  info.appendChild(renderDiffBadges(map.beatmaps));
  info.appendChild(statsEl);
  const btn = document.createElement("button");
  btn.textContent = "▶ osu!";
  btn.style.cssText = `background:var(--spice-button);color:var(--spice-button-text);border:none;border-radius:5px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0;margin-top:2px;`;
  btn.onclick = function () {
    (0, osuApi_1.openInLazer)(map.id);
    onOpen();
  };
  row.appendChild(img);
  row.appendChild(info);
  row.appendChild(btn);
  return row;
}
exports.renderBeatmapRow = renderBeatmapRow;
// ─── Map list into container ──────────────────────────────────────────────────
function renderMapsInto(container, maps, onOpen) {
  if (maps.length === 0) {
    const empty = document.createElement("div");
    empty.style.cssText = "padding:20px;text-align:center;color:var(--spice-subtext);font-size:13px;opacity:0.6;";
    empty.textContent = "No results found";
    container.appendChild(empty);
    return;
  }
  maps.forEach(function (map) {
    container.appendChild(renderBeatmapRow(map, onOpen));
  });
}
exports.renderMapsInto = renderMapsInto;
},{"./osuApi":2}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setState = exports.searching = exports.artistMaps = exports.matchedMaps = exports.currentTitle = exports.currentArtist = exports.currentTrackId = void 0;
exports.currentTrackId = null;
exports.currentArtist = "";
exports.currentTitle = "";
exports.matchedMaps = [];
exports.artistMaps = [];
exports.searching = false;
function setState(patch) {
  if (patch.currentTrackId !== undefined) exports.currentTrackId = patch.currentTrackId;
  if (patch.currentArtist !== undefined) exports.currentArtist = patch.currentArtist;
  if (patch.currentTitle !== undefined) exports.currentTitle = patch.currentTitle;
  if (patch.matchedMaps !== undefined) exports.matchedMaps = patch.matchedMaps;
  if (patch.artistMaps !== undefined) exports.artistMaps = patch.artistMaps;
  if (patch.searching !== undefined) exports.searching = patch.searching;
}
exports.setState = setState;
},{}],7:[function(require,module,exports){
"use strict";

var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stopTracklistWatcher = exports.startTracklistWatcher = void 0;
/**
 * tracklist-watcher.ts
 * Injects a small osu! badge after the track title in Spotify tracklists.
 * Selector confirmed via DOM inspection (Spotify xpui, April 2026):
 *   Row:   .main-trackList-trackListRow
 *   Title: .main-trackList-rowMainContent .encore-text-body-medium
 *   Artist: first .encore-text-body-small a inside the row
 */
const osuApi_1 = require("./osuApi");
const OSU_BADGE_ATTR = "data-osu-checked";
const resultCache = new Map();
const pendingQueue = [];
let isProcessing = false;
// ─── Badge ────────────────────────────────────────────────────────────────────
function createBadge() {
  const badge = document.createElement("span");
  badge.className = "osu-tracklist-badge";
  badge.title = "Beatmap available on osu!";
  badge.style.cssText = ["display:inline-flex", "align-items:center", "margin-left:5px", "vertical-align:middle", "opacity:0.7", "position:relative", "top:-1px"].join(";");
  badge.innerHTML = `<svg width="13" height="13" viewBox="0 0 128 128" fill="currentColor"><circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" stroke-width="14"/><circle cx="64" cy="64" r="20" fill="currentColor"/></svg>`;
  return badge;
}
function injectBadge(titleEl) {
  if (titleEl.querySelector(".osu-tracklist-badge")) return;
  titleEl.appendChild(createBadge());
}
// ─── Queue processor ──────────────────────────────────────────────────────────
function processQueue() {
  return __awaiter(this, void 0, void 0, function* () {
    if (isProcessing || pendingQueue.length === 0) return;
    isProcessing = true;
    while (pendingQueue.length > 0) {
      const item = pendingQueue.shift();
      if (resultCache.has(item.cacheKey)) {
        if (resultCache.get(item.cacheKey)) injectBadge(item.titleEl);
        continue;
      }
      try {
        const maps = yield (0, osuApi_1.searchBeatmapsets)(`${item.artist} ${item.title}`);
        const titleLower = item.title.toLowerCase();
        const artistLower = item.artist.toLowerCase();
        const found = maps.some(function (map) {
          return map.title.toLowerCase().includes(titleLower) || titleLower.includes(map.title.toLowerCase()) || map.artist.toLowerCase().includes(artistLower) || artistLower.includes(map.artist.toLowerCase());
        });
        resultCache.set(item.cacheKey, found);
        if (found) injectBadge(item.titleEl);
      } catch (_a) {
        // Backend unavailable, skip silently
      }
      yield new Promise(function (resolve) {
        setTimeout(resolve, 350);
      });
    }
    isProcessing = false;
  });
}
// ─── Row scanner ──────────────────────────────────────────────────────────────
function scanRow(row) {
  var _a, _b, _c, _d;
  if (row.getAttribute(OSU_BADGE_ATTR)) return;
  row.setAttribute(OSU_BADGE_ATTR, "1");
  // Title span: confirmed selector for Spotify xpui (April 2026)
  const titleEl = row.querySelector(".main-trackList-rowMainContent .encore-text-body-medium");
  if (!titleEl) return;
  // Artist: first link inside the row that's not the title container
  const artistEl = row.querySelector(".main-trackList-rowSectionEnd a, " + ".encore-text-body-small a");
  const title = (_b = (_a = titleEl.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
  const artist = (_d = (_c = artistEl === null || artistEl === void 0 ? void 0 : artistEl.textContent) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "";
  if (!title) return;
  const cacheKey = `${artist}|${title}`.toLowerCase();
  if (resultCache.has(cacheKey)) {
    if (resultCache.get(cacheKey)) injectBadge(titleEl);
    return;
  }
  pendingQueue.push({
    cacheKey,
    artist,
    title,
    titleEl
  });
  processQueue();
}
// ─── MutationObserver ─────────────────────────────────────────────────────────
const ROW_SELECTOR = ".main-trackList-trackListRow";
let observer = null;
function startTracklistWatcher() {
  if (observer) return;
  // Initial scan — delay to let Spotify render
  setTimeout(function () {
    document.querySelectorAll(ROW_SELECTOR).forEach(scanRow);
  }, 2000);
  observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (!(node instanceof Element)) return;
        if (node.matches(ROW_SELECTOR)) {
          scanRow(node);
        } else {
          node.querySelectorAll(ROW_SELECTOR).forEach(scanRow);
        }
      });
    });
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
exports.startTracklistWatcher = startTracklistWatcher;
function stopTracklistWatcher() {
  observer === null || observer === void 0 ? void 0 : observer.disconnect();
  observer = null;
}
exports.stopTracklistWatcher = stopTracklistWatcher;
},{"./osuApi":2}]},{},[1]);
