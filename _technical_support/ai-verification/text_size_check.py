"""Visits every route at two viewports and two text sizes; reports horizontal overflow and console errors, saves screenshots."""
import os
from playwright.sync_api import sync_playwright
BASE="http://localhost:4173/#"; OUT="/home/claude/shots/text"; os.makedirs(OUT,exist_ok=True)
ROUTES=["/","/intelligence","/dashboard","/body","/alerts","/checkin","/exercise","/support","/crew","/games","/games/fuel","/games/load","/games/clock","/games/facts","/pvt","/medical-event","/system/cardiovascular"]
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-webgl","--ignore-gpu-blocklist"])
    for vp_name,vp in [("desktop",{"width":1440,"height":900}),("mobile",{"width":390,"height":844})]:
        for size in ["100%","125%"]:
            ctx=b.new_context(viewport=vp); page=ctx.new_page()
            page.on("pageerror",lambda e: errs.append(str(e)))
            page.on("console",lambda m: errs.append(m.text) if m.type=="error" and "502" not in m.text and "404" not in m.text and "models" not in m.text else None)
            page.goto(BASE+"/"); page.wait_for_timeout(800)
            page.evaluate(f"document.documentElement.style.fontSize='{size}'")
            for r in ROUTES:
                page.goto(BASE+r); page.wait_for_timeout(1300)
                page.evaluate(f"document.documentElement.style.fontSize='{size}'"); page.wait_for_timeout(150)
                over=page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
                if over>2: print(f"OVERFLOW {vp_name} {size} {r}: +{over}px")
                if size=="100%" and r in ("/","/dashboard","/alerts","/checkin","/exercise"):
                    page.screenshot(path=f"{OUT}/{vp_name}-{r.strip('/') or 'home'}.png")
            ctx.close()
    b.close()
print("ERRORS",sorted(set(errs))[:10])
