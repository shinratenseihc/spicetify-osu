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
var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
const react_1 = __importDefault(require("react"));
const react_dom_1 = __importDefault(require("react-dom"));
const ui_1 = require("./ui");
function main() {
  var _a, _b, _c;
  return __awaiter(this, void 0, void 0, function* () {
    while (!((_a = Spicetify === null || Spicetify === void 0 ? void 0 : Spicetify.Player) === null || _a === void 0 ? void 0 : _a.data) || !(Spicetify === null || Spicetify === void 0 ? void 0 : Spicetify.LocalStorage)) {
      yield new Promise(r => setTimeout(r, 100));
    }
    // Register as a custom app page
    const root = document.createElement("div");
    root.id = "spicetify-osu-root";
    root.style.cssText = "width:100%;height:100%;overflow:auto;";
    react_dom_1.default.render(react_1.default.createElement(ui_1.OsuApp, null), root);
    // Hook into Spicetify custom app render
    // @ts-ignore
    if ((_c = (_b = window.Spicetify) === null || _b === void 0 ? void 0 : _b.Platform) === null || _c === void 0 ? void 0 : _c.History) {
      // @ts-ignore
      Spicetify.Platform.History.listen(({
        pathname
      }) => {
        if (pathname.startsWith("/spicetify-osu")) {
          const container = document.querySelector(".main-view-container__scroll-node-child");
          if (container && !container.contains(root)) {
            container.innerHTML = "";
            container.appendChild(root);
          }
        }
      });
    }
  });
}
exports.default = main;
},{"./ui":3,"react":"react","react-dom":"react-dom"}],2:[function(require,module,exports){
"use strict";

// osu! API v2 - client credentials (no user login needed)
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
exports.openInLazer = exports.searchBeatmapsets = void 0;
let cache = null;
function getToken() {
  return __awaiter(this, void 0, void 0, function* () {
    if (cache && Date.now() < cache.expiry) return cache.token;
    const clientId = Spicetify.LocalStorage.get("osu:clientId");
    const clientSecret = Spicetify.LocalStorage.get("osu:clientSecret");
    if (!clientId || !clientSecret) throw new Error("osu! credentials missing");
    const res = yield fetch("https://osu.ppy.sh/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: parseInt(clientId),
        client_secret: clientSecret,
        grant_type: "client_credentials",
        scope: "public"
      })
    });
    const data = yield res.json();
    cache = {
      token: data.access_token,
      expiry: Date.now() + (data.expires_in - 60) * 1000
    };
    return cache.token;
  });
}
function searchBeatmapsets(query) {
  return __awaiter(this, void 0, void 0, function* () {
    const token = yield getToken();
    const url = new URL("https://osu.ppy.sh/api/v2/beatmapsets/search");
    url.searchParams.set("q", query);
    url.searchParams.set("s", "any"); // any status (ranked, loved, graveyard...)
    const res = yield fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) throw new Error(`osu! API error ${res.status}`);
    const data = yield res.json();
    return data.beatmapsets;
  });
}
exports.searchBeatmapsets = searchBeatmapsets;
function openInLazer(beatmapsetId) {
  const a = document.createElement("a");
  a.href = `osu://s/${beatmapsetId}`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
exports.openInLazer = openInLazer;
},{}],3:[function(require,module,exports){
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
var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OsuApp = void 0;
const react_1 = __importDefault(require("react"));
const osuApi_1 = require("./osuApi");
const styles = {
  page: {
    padding: "24px",
    color: "var(--spice-text)",
    fontFamily: "inherit"
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px"
  },
  logo: {
    width: "32px",
    height: "32px",
    opacity: 0.9
  },
  title: {
    fontSize: "22px",
    fontWeight: 700,
    margin: 0
  },
  section: {
    marginBottom: "24px"
  },
  label: {
    display: "block",
    fontSize: "12px",
    color: "var(--spice-subtext)",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.1em"
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.07)",
    color: "var(--spice-text)",
    fontSize: "14px",
    boxSizing: "border-box"
  },
  btn: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600
  },
  btnPrimary: {
    background: "var(--spice-button)",
    color: "var(--spice-button-text)"
  },
  btnOutline: {
    background: "transparent",
    color: "var(--spice-text)",
    border: "1px solid rgba(255,255,255,0.2)"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    fontSize: "11px",
    color: "var(--spice-subtext)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    borderBottom: "1px solid rgba(255,255,255,0.1)"
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    verticalAlign: "middle"
  },
  cover: {
    width: "48px",
    height: "48px",
    borderRadius: "4px",
    objectFit: "cover"
  },
  trackName: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--spice-text)"
  },
  trackSub: {
    fontSize: "11px",
    color: "var(--spice-subtext)",
    marginTop: "2px"
  },
  status: {
    fontSize: "10px",
    padding: "2px 6px",
    borderRadius: "4px",
    background: "rgba(255,255,255,0.1)",
    color: "var(--spice-subtext)"
  }
};
class OsuApp extends react_1.default.Component {
  constructor(props) {
    var _a, _b;
    super(props);
    this.state = {
      maps: [],
      loading: false,
      error: null,
      query: "",
      clientId: (_a = Spicetify.LocalStorage.get("osu:clientId")) !== null && _a !== void 0 ? _a : "",
      clientSecret: (_b = Spicetify.LocalStorage.get("osu:clientSecret")) !== null && _b !== void 0 ? _b : "",
      saved: false
    };
  }
  componentDidMount() {
    // Auto-search current track when plugin opens
    this.searchCurrentTrack();
    // Listen for track changes
    Spicetify.Player.addEventListener("songchange", () => this.searchCurrentTrack());
  }
  getCurrentTrackQuery() {
    var _a, _b, _c, _d;
    const meta = (_b = (_a = Spicetify.Player.data) === null || _a === void 0 ? void 0 : _a.item) === null || _b === void 0 ? void 0 : _b.metadata;
    if (!meta) return "";
    const artist = (_c = meta["artist_name"]) !== null && _c !== void 0 ? _c : "";
    const title = (_d = meta["title"]) !== null && _d !== void 0 ? _d : "";
    return `${artist} ${title}`.trim();
  }
  searchCurrentTrack() {
    return __awaiter(this, void 0, void 0, function* () {
      const query = this.getCurrentTrackQuery();
      if (!query) return;
      this.setState({
        query
      });
      yield this.doSearch(query);
    });
  }
  doSearch(query) {
    return __awaiter(this, void 0, void 0, function* () {
      if (!query.trim()) return;
      this.setState({
        loading: true,
        error: null,
        maps: []
      });
      try {
        const maps = yield (0, osuApi_1.searchBeatmapsets)(query);
        this.setState({
          maps,
          loading: false
        });
      } catch (e) {
        this.setState({
          error: e.message,
          loading: false
        });
      }
    });
  }
  saveCredentials() {
    Spicetify.LocalStorage.set("osu:clientId", this.state.clientId);
    Spicetify.LocalStorage.set("osu:clientSecret", this.state.clientSecret);
    this.setState({
      saved: true
    });
    setTimeout(() => this.setState({
      saved: false
    }), 2000);
  }
  render() {
    const {
      maps,
      loading,
      error,
      query,
      clientId,
      clientSecret,
      saved
    } = this.state;
    const hasCredentials = !!clientId && !!clientSecret;
    return react_1.default.createElement("div", {
      style: styles.page
    }, react_1.default.createElement("div", {
      style: styles.header
    }, react_1.default.createElement("svg", {
      style: styles.logo,
      viewBox: "0 0 128 128"
    }, react_1.default.createElement("circle", {
      cx: "64",
      cy: "64",
      r: "56",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "12"
    }), react_1.default.createElement("circle", {
      cx: "64",
      cy: "64",
      r: "24",
      fill: "currentColor"
    })), react_1.default.createElement("h1", {
      style: styles.title
    }, "osu! Search")), react_1.default.createElement("div", {
      style: styles.section
    }, react_1.default.createElement("label", {
      style: styles.label
    }, "osu! Client ID"), react_1.default.createElement("input", {
      style: Object.assign(Object.assign({}, styles.input), {
        marginBottom: "8px"
      }),
      type: "text",
      value: clientId,
      placeholder: "Client ID",
      onChange: e => this.setState({
        clientId: e.target.value
      })
    }), react_1.default.createElement("label", {
      style: styles.label
    }, "osu! Client Secret"), react_1.default.createElement("input", {
      style: Object.assign(Object.assign({}, styles.input), {
        marginBottom: "8px"
      }),
      type: "password",
      value: clientSecret,
      placeholder: "Client Secret",
      onChange: e => this.setState({
        clientSecret: e.target.value
      })
    }), react_1.default.createElement("button", {
      style: Object.assign(Object.assign({}, styles.btn), styles.btnOutline),
      onClick: () => this.saveCredentials()
    }, saved ? "✓ Saved!" : "Save credentials")), react_1.default.createElement("div", {
      style: {
        display: "flex",
        gap: "8px",
        marginBottom: "20px"
      }
    }, react_1.default.createElement("input", {
      style: Object.assign(Object.assign({}, styles.input), {
        flex: 1
      }),
      type: "text",
      value: query,
      placeholder: "Search beatmaps...",
      onChange: e => this.setState({
        query: e.target.value
      }),
      onKeyDown: e => e.key === "Enter" && this.doSearch(query)
    }), react_1.default.createElement("button", {
      style: Object.assign(Object.assign({}, styles.btn), styles.btnPrimary),
      onClick: () => this.doSearch(query)
    }, "Search"), react_1.default.createElement("button", {
      style: Object.assign(Object.assign({}, styles.btn), styles.btnOutline),
      onClick: () => this.searchCurrentTrack(),
      title: "Search current track"
    }, "\u266A")), loading && react_1.default.createElement("div", {
      style: {
        color: "var(--spice-subtext)",
        padding: "20px 0"
      }
    }, "Searching..."), error && react_1.default.createElement("div", {
      style: {
        color: "#f44336",
        padding: "12px",
        background: "rgba(244,67,54,0.1)",
        borderRadius: "6px",
        marginBottom: "16px"
      }
    }, error), !loading && maps.length > 0 && this.renderTable(), !loading && !error && maps.length === 0 && query && react_1.default.createElement("div", {
      style: {
        color: "var(--spice-subtext)",
        padding: "20px 0"
      }
    }, "No results."));
  }
  renderTable() {
    return react_1.default.createElement("table", {
      style: styles.table
    }, react_1.default.createElement("thead", null, react_1.default.createElement("tr", null, react_1.default.createElement("th", {
      style: styles.th
    }), react_1.default.createElement("th", {
      style: styles.th
    }, "Title"), react_1.default.createElement("th", {
      style: styles.th
    }, "Artist"), react_1.default.createElement("th", {
      style: styles.th
    }, "Mapper"), react_1.default.createElement("th", {
      style: styles.th
    }, "Status"), react_1.default.createElement("th", {
      style: styles.th
    }, "Open"))), react_1.default.createElement("tbody", null, this.state.maps.map(map => react_1.default.createElement("tr", {
      key: map.id,
      style: {
        cursor: "default"
      }
    }, react_1.default.createElement("td", {
      style: styles.td
    }, react_1.default.createElement("img", {
      src: map.covers.list,
      style: styles.cover
    })), react_1.default.createElement("td", {
      style: styles.td
    }, react_1.default.createElement("div", {
      style: styles.trackName
    }, map.title)), react_1.default.createElement("td", {
      style: styles.td
    }, react_1.default.createElement("div", {
      style: styles.trackSub
    }, map.artist)), react_1.default.createElement("td", {
      style: styles.td
    }, react_1.default.createElement("div", {
      style: styles.trackSub
    }, map.creator)), react_1.default.createElement("td", {
      style: styles.td
    }, react_1.default.createElement("span", {
      style: styles.status
    }, map.status)), react_1.default.createElement("td", {
      style: styles.td
    }, react_1.default.createElement("button", {
      style: Object.assign(Object.assign(Object.assign({}, styles.btn), styles.btnPrimary), {
        marginRight: "6px"
      }),
      onClick: () => (0, osuApi_1.openInLazer)(map.id),
      title: "Open in osu!lazer"
    }, "\u25B6 osu!"), react_1.default.createElement("button", {
      style: Object.assign(Object.assign({}, styles.btn), styles.btnOutline),
      onClick: () => window.open(`https://osu.ppy.sh/beatmapsets/${map.id}`, "_blank"),
      title: "View on website"
    }, "\uD83C\uDF10"))))));
  }
}
exports.OsuApp = OsuApp;
},{"./osuApi":2,"react":"react"}]},{},[1]);
