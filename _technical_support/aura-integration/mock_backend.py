"""Stand-in for the AURA FastAPI backend, matching src/api/contract.ts. Test use only."""
import json, sys
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer

def snap(aid):
    hist = [62 + 0.12 * i for i in range(30)]
    return {
        "astro_id": aid, "day": 96, "simulated": True,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "tier0": {"alerts": [{"scope": "body", "astro_id": aid, "station_id": "S1", "signal": "resting_hr",
                              "rule": "R2", "level": "elevated", "alert_day": 95, "end_day": 96,
                              "explanation": "Resting heart rate 112 bpm for 3 days, above your personal limit."}]},
        "tier1": {"notices": [{"day": 96, "source": "tier1a_isolation_forest", "strangeness": 0.81,
                               "explanation": "HRV and sleep moved together away from your usual range."}]},
        "tier2": {"risk": {"band": "early", "confidence": 0.72, "drivers": ["Resting HR rising over 14 days"]},
                  "forecast": {"horizon_days": 14, "backend": "ridge", "series": [
                      {"signal": "resting_hr", "unit": "bpm", "history": hist,
                       "mu": [66 + 0.1 * i for i in range(14)], "band": [2 + 0.1 * i for i in range(14)]}]}},
    }

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        if self.path == "/api/health": body = {"status": "ok", "simulated": True}
        elif self.path.startswith("/api/astronauts/") and self.path.endswith("/snapshot"):
            body = snap(self.path.split("/")[3])
        else:
            self.send_response(404); self.end_headers(); return
        data = json.dumps(body).encode()
        self.send_response(200); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)

HTTPServer(("127.0.0.1", int(sys.argv[1]) if len(sys.argv) > 1 else 8000), H).serve_forever()
