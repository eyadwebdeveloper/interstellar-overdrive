from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import json
ROOT=Path('/home/ubuntu/auravitals/_technical_support/redesign')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':1440,'height':1000});page=ctx.new_page();page.set_default_timeout(8000);errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 def go(path):
  page.goto('http://localhost:3000/#'+path,wait_until='networkidle');page.locator('main h1').first.wait_for()
 go('/')
 page.get_by_role('button',name='Find anything').click();page.get_by_label('Search the workspace').fill('vigilance');expect(page.get_by_role('button',name='Vigilance test',exact=False)).to_be_visible();page.keyboard.press('Escape');expect(page.get_by_role('dialog')).to_have_count(0)
 print('Search and Escape passed',flush=True)
 go('/alerts');page.locator('.response-alert').first.get_by_role('button',name='Snooze 1 hour').click();go('/');expect(page.get_by_text('Official alerts reviewed',exact=True)).to_be_visible();expect(page.locator('.nav-count')).to_have_count(0)
 page.get_by_role('button',name='Open profile and settings').click();page.get_by_role('button',name='Dr. Mo\'men Ashraf').click();page.keyboard.press('Escape');expect(page.locator('.nav-count')).to_have_count(1)
 print('Snooze count and crew scope passed',flush=True)
 go('/checkin');page.get_by_role('button',name='Continue',exact=False).click();page.get_by_label('Sleep hours',exact=True).fill('8');page.get_by_label('Additional minutes',exact=True).fill('20');page.reload(wait_until='networkidle');expect(page.get_by_label('Sleep hours',exact=True)).to_have_value('8');page.get_by_role('button',name='Continue',exact=False).click();page.locator('textarea').fill('Demo check-in note');page.get_by_role('button',name='Continue',exact=False).click();page.get_by_role('button',name='Save check-in',exact=False).click();expect(page.get_by_text('Check-in complete',exact=True)).to_be_visible()
 print('Check-in draft reload, review and save passed',flush=True)
 go('/exercise');page.get_by_role('button',name='Start session',exact=True).click();expect(page.get_by_role('dialog')).to_be_visible();page.locator('.set-row input').first.check();page.get_by_role('button',name='Save partial session',exact=True).click();expect(page.get_by_text('Partial',exact=True)).to_be_visible()
 print('Partial exercise save passed',flush=True)
 go('/support');page.get_by_role('button',name='Compose locally').first.click();page.locator('textarea').fill('Demo support note');page.get_by_role('button',name='Save to demo queue').click();page.keyboard.press('Escape');expect(page.get_by_text('Demo support note',exact=True)).to_be_visible()
 page.get_by_role('button',name='Open profile and settings').click();page.get_by_role('button',name='Commander Eyad Ashraf').click();page.keyboard.press('Escape');expect(page.get_by_text('Demo support note',exact=True)).to_have_count(0)
 print('Support compose and reactive crew queue passed',flush=True)
 go('/medical-event');page.get_by_role('radio',name='Chest',exact=True).click();page.get_by_role('radio',name='At rest',exact=True).click();page.get_by_role('button',name='Next',exact=True).click();page.get_by_role('button',name='Other',exact=True).click();page.get_by_label('Onset',exact=False).select_option(label='Just now');page.get_by_role('button',name='Next',exact=True).click();expect(page.get_by_text('Describe the other symptom or sign.',exact=True)).to_be_visible();page.get_by_label('Other symptom or sign',exact=True).fill('Demo symptom detail');page.get_by_role('button',name='Next',exact=True).click();expect(page.get_by_text('118/76',exact=True)).to_be_visible();page.get_by_role('button',name='Next',exact=True).click()
 for box in page.get_by_role('checkbox').all():box.check()
 page.get_by_role('button',name='Next',exact=True).click();expect(page.get_by_text('Review before saving',exact=True)).to_be_visible();page.get_by_role('button',name='Save locally',exact=True).click();expect(page.get_by_role('heading',name='Saved locally',exact=True)).to_be_visible();go('/support');expect(page.get_by_text('Local medical event queue · demo',exact=True)).to_have_count(0)
 print('Medical validation, review, local save and queue isolation passed',flush=True)
 go('/dashboard');page.get_by_role('button',name='Open details for Blood pressure').click();expect(page.get_by_role('dialog')).to_be_visible();page.keyboard.press('Escape');expect(page.get_by_role('dialog')).to_have_count(0)
 print('Metric detail dialog passed',flush=True)
 ctx.close()
 # A deterministic clock verifies a three-minute run can complete after an early tap.
 ctx=b.new_context();page=ctx.new_page();page.add_init_script('Math.random = () => 0');page.clock.install();page.on('pageerror',lambda e:errors.append(str(e)));go('/pvt');page.get_by_role('button',name='Start 3-minute test').click();page.clock.run_for(3100);expect(page.locator('.pvt-pad.wait')).to_be_visible();page.locator('.pvt-pad.wait').dispatch_event('pointerdown');page.clock.run_for(2200);expect(page.locator('.pvt-pad.stim')).to_be_visible();page.keyboard.press('Space');page.clock.fast_forward(178000);expect(page.get_by_text('Test complete',exact=True)).to_be_visible()
 print('PVT false start followed by full three-minute completion passed',flush=True)
 b.close();(ROOT/'flow-errors.json').write_text(json.dumps(errors,indent=2));assert not errors,errors;print('All targeted flows passed; no page errors',flush=True)
