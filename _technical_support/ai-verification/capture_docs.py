"""Captures documentation screenshots (non-3D screens) into docs/screenshots."""
import os
from playwright.sync_api import sync_playwright
BASE="http://localhost:4173/#"; OUT=os.path.join(os.path.dirname(__file__),"..","..","docs","screenshots"); os.makedirs(OUT,exist_ok=True)
def el(page,sel,name,pad=0):
    page.locator(sel).first.scroll_into_view_if_needed(); page.wait_for_timeout(400)
    page.locator(sel).first.screenshot(path=f"{OUT}/{name}.png")
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=swiftshader","--enable-webgl"])
    HIDE = "document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='.copilot-launcher-wrap{display:none!important}';document.head.appendChild(s)})"
    ctx=b.new_context(viewport={"width":1440,"height":900},device_scale_factor=1.5); ctx.add_init_script(HIDE); page=ctx.new_page()
    page.goto(BASE+"/intelligence"); page.wait_for_timeout(2500)
    page.evaluate("localStorage.setItem('aura-copilot-hint','1')")
    page.screenshot(path=f"{OUT}/intelligence-top.png",clip={"x":224,"y":80,"width":1216,"height":560})
    el(page,".ai-pipeline","pipeline"); el(page,".ai-signals","signals"); el(page,".ai-patterns","patterns"); el(page,".ai-whatif","what-if")
    # copilot conversation
    page.goto(BASE+"/alerts"); page.wait_for_timeout(1500)
    page.keyboard.press("Control+j"); page.wait_for_timeout(600)
    for q in ["Why is my reaction time slower?","What happens if I sleep 8 hours all week?"]:
        page.locator(".copilot-form textarea").fill(q); page.keyboard.press("Enter"); page.wait_for_timeout(600)
        page.wait_for_selector(".copilot-send[aria-label='Send'], .copilot-send:disabled", timeout=30000); page.wait_for_timeout(500)
    page.locator(".copilot").screenshot(path=f"{OUT}/copilot.png"); page.keyboard.press("Escape"); page.wait_for_timeout(500)
    for r,n in [("/dashboard","dashboard"),("/alerts","alerts"),("/checkin","checkin"),("/exercise","exercise"),("/games","games")]:
        page.goto(BASE+r); page.wait_for_timeout(1800); page.screenshot(path=f"{OUT}/{n}.png",clip={"x":224,"y":80,"width":1216,"height":760})
    # Settings dialog with the text-size control
    page.goto(BASE+"/dashboard"); page.wait_for_timeout(1200)
    page.locator(".profile-button").click(); page.wait_for_timeout(500)
    page.get_by_role("button", name="Large", exact=True).click(); page.wait_for_timeout(500)
    page.screenshot(path=f"{OUT}/settings.png"); page.keyboard.press("Escape")
    page.evaluate("document.documentElement.style.fontSize='100%'")
    # Text size comparison
    page.goto(BASE+"/dashboard"); page.wait_for_timeout(1500)
    page.evaluate("document.documentElement.style.fontSize='125%'"); page.wait_for_timeout(500)
    page.screenshot(path=f"{OUT}/dashboard-xl.png",clip={"x":224,"y":80,"width":1216,"height":760})
    ctx.close()
    m=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2); mp=m.new_page()
    mp.goto(BASE+"/checkin"); mp.wait_for_timeout(1500); mp.evaluate("localStorage.setItem('aura-copilot-hint','1')")
    mp.keyboard.press("Control+j"); mp.wait_for_timeout(700); mp.screenshot(path=f"{OUT}/mobile-copilot.png")
    b.close()
print(sorted(os.listdir(OUT)))
