import json

with open('public/assets/data/chapters.json', 'r') as f:
    data = json.load(f)

main_chapters = ['Forest', 'Hospital', 'SaltFactory', 'Hell', 'Rapture', 'TheEnd', 'CottonAlley']

for ch in list(data.keys()):
    entries = data[ch]
    ch_info = entries[0][1] if entries and entries[0][0] == 'chapter' else {}
    levels = [e[1] for e in entries if e[0] in ('normlevel', 'darklevel', 'boss')]
    print(f"\n==============================")
    print(f"Chapter: {ch} | Display: {ch_info.get('name')} | Music: {ch_info.get('music')}")
    print(f"Total levels: {len(levels)}")
    for idx, l in enumerate(levels):
        print(f"  {idx+1:02d}. [{l.get('file')}] '{l.get('name')}' (Par: {l.get('par')}) id={l.get('id')}")
