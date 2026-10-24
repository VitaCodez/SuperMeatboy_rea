import json

with open('public/assets/data/chapters.json') as f:
    data = json.load(f)

campaign = ['Forest', 'Hospital', 'SaltFactory', 'Hell', 'Rapture', 'DrFetus', 'Bandage']

for c in campaign:
    entries = data.get(c, [])
    print(f"\n==========================================")
    print(f"CHAPTER: {c}")
    for item in entries:
        kind = item[0]
        val = item[1]
        if kind == 'chapter':
            print(f"  Header: name='{val.get('name')}', music='{val.get('music')}', boss='{val.get('bossmusic')}'")
        elif kind in ('normlevel', 'darklevel', 'boss'):
            print(f"  [{kind}] file={val.get('file')} | name=\"{val.get('name')}\" | par={val.get('par')}")
