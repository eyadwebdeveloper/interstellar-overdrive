"""Loads Overview, Intelligence and Body with a stand-in atlas served via request interception; screenshots + console errors."""
import os, mimetypes
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173/#"
MODELS = os.path.join(os.path.dirname(__file__), "fake-models")
OUT = "/home/claude/shots"; os.makedirs(OUT, exist_ok=True)
errors = []

def serve(route):
    name = route.request.url.split("/models/")[-1].split("?")[0]
    path = os.path.join(MODELS, name)
    if os.path.exists(path):
        route.fulfill(path=path, content_type="application/json" if name.endswith(".json") else "application/octet-stream")
    else:
        route.fulfill(status=404, body="")

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"])
    for name, vp in [("desktop", {"width": 1440, "height": 900}), ("mobile", {"width": 390, "height": 844})]:
        ctx = b.new_context(viewport=vp); page = ctx.new_page()
        page.route("**/models/**", serve)
        page.on("console", lambda m: errors.append((name, m.text)) if m.type == "error" and "502" not in m.text else None)
        page.on("pageerror", lambda e: errors.append((name, str(e))))
        page.goto(BASE + "/"); page.wait_for_timeout(4500)
        print(name, "home atlas stage:", page.locator(".atlas-stage canvas").count(), "twin fallback:", page.locator(".twin").count(), "labels:", page.locator(".atlas-stage .twin-label:visible").count())
        page.screenshot(path=f"{OUT}/{name}-atlas-home.png")
        page.goto(BASE + "/body"); page.wait_for_timeout(4500)
        page.screenshot(path=f"{OUT}/{name}-atlas-body.png")
        if name == "desktop":
            page.get_by_role("button", name="Back", exact=True).click(); page.wait_for_timeout(1800)
            page.screenshot(path=f"{OUT}/{name}-atlas-body-back.png")
            page.get_by_role("button", name="Head", exact=True).click(); page.wait_for_timeout(1800)
            page.screenshot(path=f"{OUT}/{name}-atlas-body-head.png")
        page.goto(BASE + "/intelligence"); page.wait_for_timeout(4500)
        page.screenshot(path=f"{OUT}/{name}-atlas-intel.png", full_page=True)
        ctx.close()
    b.close()
print("ERRORS:", errors)
