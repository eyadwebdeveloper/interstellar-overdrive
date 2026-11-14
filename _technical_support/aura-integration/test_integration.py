"""Integration check: live (mock backend) vs fallback (backend down). Run from project root."""
import subprocess, sys, time, urllib.request
from playwright.sync_api import sync_playwright

def wait(url, n=40):
    for _ in range(n):
        try: urllib.request.urlopen(url, timeout=1); return True
        except Exception: time.sleep(0.5)
    return False

def run(label, backend_up):
    procs = []
    if backend_up:
        procs.append(subprocess.Popen([sys.executable, "_technical_support/aura-integration/mock_backend.py", "8000"]))
    procs.append(subprocess.Popen(["npx", "vite", "--port", "3111", "--strictPort"]))
    assert wait("http://127.0.0.1:3111/"), "vite did not start"
    res = {}
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(); pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "Failed to load resource" not in m.text and "proxy" not in m.text.lower() else None)
            pg.goto("http://127.0.0.1:3111/alerts"); pg.wait_for_timeout(2500)
            txt = pg.inner_text("body")
            res["banner"] = "Simulated data." in txt
            res["live_msg"] = "Connected to the local AURA backend" in txt
            res["fallback_msg"] = "built-in demo data" in txt
            res["official_live"] = "Resting heart rate: R2" in txt
            res["advisory_live"] = "Pattern notice" in txt
            res["demo_official"] = "Sustained tachycardia" in txt
            pg.goto("http://127.0.0.1:3111/dashboard"); pg.wait_for_timeout(2500)
            txt = pg.inner_text("body")
            res["risk_card"] = "Cardiovascular conditioning trend" in txt
            res["forecast"] = "Where this is heading" in txt
            res["not_diagnosis"] = "Not a diagnosis" in txt
            res["console_errors"] = errs
            b.close()
    finally:
        for pr in procs: pr.terminate()
    print(label, res); return res

live = run("LIVE", True)
time.sleep(1)
down = run("FALLBACK", False)
ok = (live["banner"] and live["live_msg"] and live["official_live"] and live["advisory_live"] and not live["demo_official"]
      and live["risk_card"] and live["forecast"] and not live["console_errors"]
      and down["banner"] and down["fallback_msg"] and down["demo_official"] and down["risk_card"] and down["forecast"] and not down["console_errors"])
print("PASS" if ok else "FAIL"); sys.exit(0 if ok else 1)
