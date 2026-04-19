"""
spicetify-osu backend - proxy HTTP pour contourner le CORS de Spotify
Lance avec: python backend.py
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json, urllib.request, urllib.parse, subprocess, os

PORT = 7270
BASE = os.path.dirname(os.path.abspath(__file__))
token_cache = {"token": None, "expiry": 0}

# Charge les credentials depuis config.json
with open(os.path.join(BASE, "config.json")) as f:
    CONFIG = json.load(f)
CLIENT_ID = CONFIG["client_id"]
CLIENT_SECRET = CONFIG["client_secret"]

def get_token():
    import time
    if token_cache["token"] and time.time() < token_cache["expiry"]:
        return token_cache["token"]
    data = json.dumps({"client_id": int(CLIENT_ID), "client_secret": CLIENT_SECRET, "grant_type": "client_credentials", "scope": "public"}).encode()
    req = urllib.request.Request("https://osu.ppy.sh/oauth/token", data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as res:
        result = json.loads(res.read())
        token_cache["token"] = result["access_token"]
        token_cache["expiry"] = time.time() + result["expires_in"] - 60
        return token_cache["token"]

class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args): pass
    def send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    def do_OPTIONS(self):
        self.send_response(200); self.send_cors(); self.end_headers()
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = dict(urllib.parse.parse_qsl(parsed.query))
        if parsed.path == "/open":
            try:
                subprocess.Popen(["cmd", "/c", f"start osu://s/{params.get('id','')}"])
                self.send_response(200); self.send_cors(); self.end_headers()
                self.wfile.write(b'{"ok":true}')
            except Exception as e:
                self.send_response(500); self.send_cors(); self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        elif parsed.path == "/search":
            try:
                token = get_token()
                url = f"https://osu.ppy.sh/api/v2/beatmapsets/search?q={urllib.parse.quote(params.get('q',''))}&s=any"
                req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
                with urllib.request.urlopen(req) as res:
                    data = res.read()
                self.send_response(200); self.send_header("Content-Type", "application/json")
                self.send_cors(); self.end_headers(); self.wfile.write(data)
            except Exception as e:
                self.send_response(500); self.send_cors(); self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404); self.end_headers()

if __name__ == "__main__":
    print(f"[spicetify-osu] Backend running on http://localhost:{PORT}")
    HTTPServer(("localhost", PORT), Handler).serve_forever()
