import json

with open('public/assets/data/chapters.json', 'r') as f:
    data = json.load(f)

print("Chapters in chapters.json:", list(data.keys()))

for ch_name, entries in data.items():
    ch_info = None
    levels = []
    for item in entries:
        t, d = item[0], item[1]
        if t == 'chapter':
            ch_info = d
        elif t in ('normlevel', 'darklevel', 'boss'):
            levels.append((t, d.get('file'), d.get('name'), d.get('par'), d.get('id')))
    print(f"\n=== Chapter '{ch_name}' ({ch_info.get('name') if ch_info else 'Unknown'}): {len(levels)} levels ===")
    for lvl in levels[:10]:
        print(f"  [{lvl[0]}] file={lvl[1]} | name='{lvl[2]}' | par={lvl[3]} | id={lvl[4]}")
    if len(levels) > 10:
        print(f"  ... and {len(levels)-10} more levels")
