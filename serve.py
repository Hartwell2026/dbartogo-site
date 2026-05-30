"""Threaded static server with HTTP Range support + a Retell chat proxy (keeps the secret key server-side)."""
import http.server, os, re, socketserver, mimetypes, json, urllib.request, urllib.error

PORT = 8087
ROOT = os.path.dirname(os.path.abspath(__file__))
mimetypes.add_type("video/mp4", ".mp4")

RETELL_AGENT_ID = "agent_b6dcda4d322941ba560dd2f620"  # Olá

def retell_key():
    k = os.environ.get("RETELL_API_KEY")
    if k:
        return k.strip()
    try:  # fallback: credential file outside the web root (never served)
        return open(os.path.join(os.path.dirname(ROOT), ".retell_key")).read().strip()
    except Exception:
        return None

def _retell(path, body):
    key = retell_key()
    if not key:
        return None
    r = urllib.request.Request("https://api.retellai.com" + path, data=json.dumps(body).encode(),
                               headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(r, timeout=45) as resp:
        return json.loads(resp.read().decode())

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            idx = os.path.join(path, "index.html")
            if os.path.isfile(idx):
                path = idx
            else:
                return super().do_GET()
        if not os.path.isfile(path):
            self.send_error(404, "Not found")
            return
        ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
        size = os.path.getsize(path)
        start, end, status = 0, size - 1, 200
        rng = self.headers.get("Range")
        if rng:
            m = re.match(r"bytes=(\d*)-(\d*)$", rng.strip())
            if m:
                if m.group(1):
                    start = int(m.group(1))
                if m.group(2):
                    end = int(m.group(2))
                end = min(end, size - 1)
                if start > end or start >= size:
                    self.send_response(416)
                    self.send_header("Content-Range", "bytes */%d" % size)
                    self.end_headers()
                    return
                status = 206
        length = end - start + 1
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Access-Control-Allow-Origin", "*")
        # HTML/CSS/JS: never store (instant updates in dev, no manual cache-clearing); media: short cache
        if ctype in ("text/html", "text/css", "application/javascript", "text/javascript"):
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        else:
            self.send_header("Cache-Control", "public, max-age=300")
        self.send_header("Content-Length", str(length))
        if status == 206:
            self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        self.end_headers()
        if self.command == "HEAD":
            return
        with open(path, "rb") as f:
            f.seek(start)
            remaining = length
            while remaining > 0:
                chunk = f.read(min(65536, remaining))
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except (BrokenPipeError, ConnectionResetError):
                    break
                remaining -= len(chunk)

    do_HEAD = do_GET

    def _json(self, code, obj):
        b = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_POST(self):
        if self.path != "/api/retell-chat":
            self.send_error(404, "Not found")
            return
        try:
            ln = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(ln) or b"{}")
            msg = (body.get("message") or "").strip()
            chat_id = body.get("chatId")
            if not chat_id:
                chat = _retell("/create-chat", {"agent_id": RETELL_AGENT_ID})
                if not chat:
                    return self._json(500, {"error": "Retell key missing on server"})
                chat_id = chat.get("chat_id")
            comp = _retell("/create-chat-completion", {"chat_id": chat_id, "content": msg})
            reply = ""
            for m in (comp.get("messages", []) if isinstance(comp, dict) else []):
                if m.get("role") == "agent":
                    reply = m.get("content", "")
            self._json(200, {"chatId": chat_id, "reply": reply or "…"})
        except Exception as e:
            self._json(500, {"error": str(e)[:200]})

    def log_message(self, *a):
        pass

class Server(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True

os.chdir(ROOT)
print("Serving %s on http://127.0.0.1:%d (threaded, range-enabled)" % (ROOT, PORT), flush=True)
Server(("127.0.0.1", PORT), Handler).serve_forever()
