import json
import re

with open('public/assets/data/chapters.json', 'r', encoding='utf-8') as f:
    ch = json.load(f)

with open('src/engine/levels/chapter1.ts', 'r', encoding='utf-8') as f:
    c1_src = f.read()

with open('src/engine/levels/otherChapters.ts', 'r', encoding='utf-8') as f:
    other_src = f.read()

# Extract Chapter 1 levels from chapter1.ts
c1_matches = re.findall(r"buildLevel\(\s*'([^']+)',\s*(?:'([^']*)'|\"([^\"]*)\"),.*?([\d\.]+)\s*\);", c1_src, re.DOTALL)
c1_dict = {m[0]: {'name': m[1] or m[2], 'par': float(m[3])} for m in c1_matches}

print('=== CHAPTER 1 VERIFICATION ===')
c1_off = [x[1] for x in ch['Forest'] if x[0] in ['normlevel', 'bosslevel']]
for i in range(1, 22):
    lvl_id = f'1-{i}'
    off = c1_off[i-1]
    code = c1_dict.get(lvl_id)
    assert code is not None, f'Missing {lvl_id}'
    assert off['name'].lower() in code['name'].lower(), f'Name mismatch {lvl_id}: {off["name"]} vs {code["name"]}'
    assert abs(code['par'] - off['par']) < 1e-4, f'Par mismatch {lvl_id}: {off["par"]} vs {code["par"]}'
    print(f'Level {lvl_id:4s}: {code["name"]:25s} | Par: {code["par"]:4.1f}s | Parity: 100% OK')

# Extract Chapters 2 to 7 from otherChapters.ts
chapters = [
    (2, 'Hospital', 'Chapter 2: Hospital'),
    (3, 'SaltFactory', 'Chapter 3: Salt Factory'),
    (4, 'Hell', 'Chapter 4: Hell'),
    (5, 'Rapture', 'Chapter 5: The Rapture'),
    (6, 'DrFetus', 'Chapter 6: The End'),
    (7, 'Bandage', 'Chapter 7: Cotton Alley'),
]

for c_num, c_key, c_name in chapters:
    print(f'\n=== {c_name.upper()} VERIFICATION ===')
    off_levels = [x[1] for x in ch[c_key] if x[0] in ['normlevel', 'bosslevel']]
    dict_name = f'CH{c_num}_NAMES'
    m_dict = re.search(dict_name + r': Record<number, \{ name: string; par: number \}> = \{(.*?)\};', other_src, re.DOTALL)
    assert m_dict, f'Missing {dict_name}'
    dict_body = m_dict.group(1)
    entries = re.findall(r"(\d+):\s*\{\s*name:\s*(?:'([^']*)'|\"([^\"]*)\"),\s*par:\s*([\d\.]+)\s*\}", dict_body)
    parsed = {int(e[0]): {'name': e[1] or e[2], 'par': float(e[3])} for e in entries}
    
    for l_num, off in enumerate(off_levels, start=1):
        code = parsed.get(l_num)
        assert code is not None, f'Missing {c_num}-{l_num}'
        assert off['name'].lower() == code['name'].lower(), f'Name mismatch {c_num}-{l_num}: {off["name"]} vs {code["name"]}'
        assert abs(code['par'] - off['par']) < 1e-4, f'Par mismatch {c_num}-{l_num}: {off["par"]} vs {code["par"]}'
        print(f'Level {c_num}-{l_num:02d}: {code["name"]:25s} | Par: {code["par"]:4.1f}s | Parity: 100% OK')

print('\nALL CHAPTERS 1 THROUGH 7 ACHIEVED 100% DATA AND MANIFEST PARITY!')
