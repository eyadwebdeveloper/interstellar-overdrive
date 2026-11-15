"""Smoke test for the AI features: loads routes, opens the copilot, asks questions, captures console errors and screenshots."""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173/#"
OUT = "/home/claude/shots"
import os; os.makedirs(OUT, exist_ok=True)
errors = []

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"])
    for name, vp in [("desktop", {"width": 1440, "height": 900}), ("mobile", {"width": 390, "height": 844})]:
        ctx = b.new_context(viewport=vp)
        page = ctx.new_page()
        page.on("console", lambda m: errors.append((name, m.type, m.text)) if m.type in ("error",) else None)
        page.on("pageerror", lambda e: errors.append((name, "pageerror", str(e))))
        page.goto(BASE + "/"); page.wait_for_timeout(2500)
        page.screenshot(path=f"{OUT}/{name}-home.png")
        canvases = page.locator("canvas").count()
        print(name, "home canvases:", canvases, "| labels:", page.locator(".twin-label").count())
        # open copilot via hero chip
        page.locator(".ai-chips button").first.click(); page.wait_for_timeout(2500)
        page.screenshot(path=f"{OUT}/{name}-copilot.png")
        print(name, "copilot messages:", page.locator(".copilot-msg").count())
        page.keyboard.press("Escape")
        page.goto(BASE + "/intelligence"); page.wait_for_timeout(2500)
        page.screenshot(path=f"{OUT}/{name}-intelligence.png", full_page=True)
        page.goto(BASE + "/body"); page.wait_for_timeout(3500)
        page.screenshot(path=f"{OUT}/{name}-body.png")
        print(name, "body twin fallback:", page.locator(".model-viewport-twin").count())
        ctx.close()
    b.close()
print("ERRORS:")
for e in errors: print(" ", e)
