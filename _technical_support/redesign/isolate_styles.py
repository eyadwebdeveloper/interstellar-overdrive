from pathlib import Path
import re
root=Path('/home/ubuntu/auravitals')
for name,scope in [('workflows','workflow'),('health','health'),('response','response')]:
    p=root/'src/styles'/f'{name}.css'
    text=p.read_text()
    if not text.startswith('/* Isolated page styles */'):
        text=text.replace(':root', ':scope')
        p.write_text(f'/* Isolated page styles */\n@scope (.{scope}-page, .{scope}-dialog) {{\n'+text+'\n}\n')
    files={'workflows':['CheckinPage','ExercisePage','PvtPage'],'health':['DashboardPage'],'response':['SupportPage','AlertsPage','MedicalEventPage']}[name]
    for file in files:
        page=root/'src/pages'/f'{file}.tsx'
        content=page.read_text()
        content=re.sub(r'<Dialog\s+open=',f'<Dialog className="{scope}-dialog" open=',content)
        page.write_text(content)
print('Scoped all page styles and portal dialogs.')
