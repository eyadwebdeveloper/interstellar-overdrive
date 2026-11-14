from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path('/home/ubuntu/auravitals/_technical_support/redesign'); OUT=ROOT/'screens'; OUT.mkdir(exist_ok=True)
ROUTES=['/','/dashboard','/alerts','/checkin','/exercise','/support','/medical-event','/pvt','/body','/crew','/system/cardiovascular']
with sync_playwright() as p:
 b=p.chromium.launch(executable_path="/usr/bin/chromium",args=["--no-sandbox"])
 issues=[]
 for width,height,label in [(1440,1050,'desktop'),(390,844,'mobile')]:
  ctx=b.new_context(viewport={'width':width,'height':height},device_scale_factor=1)
  pg=ctx.new_page();pg.on('pageerror',lambda e:issues.append(str(e)));pg.on('console',lambda m:issues.append(m.text) if m.type=='error' else None)
  for route in ROUTES:
   pg.goto('http://localhost:3000/#'+route,wait_until='networkidle');pg.locator('main h1').first.wait_for(state='visible'); pg.wait_for_timeout(200); pg.evaluate('document.fonts.ready')
   slug=route.strip('/').replace('/','-') or 'overview'
   pg.screenshot(path=str(OUT/f'{slug}-{label}.png'),full_page=True)
   if pg.evaluate('document.documentElement.scrollWidth>window.innerWidth+1'):issues.append(f'{label} overflow {route}')
  pg.goto('http://localhost:3000/#/',wait_until='networkidle');pg.screenshot(path=str(OUT/f'overview-after-routes-{label}.png'),full_page=True)
  print(label,'routes captured',flush=True);ctx.close()
 b.close()
 (ROOT/'ui-health.json').write_text(json.dumps(issues,indent=2));print('Issues:',issues,flush=True)
