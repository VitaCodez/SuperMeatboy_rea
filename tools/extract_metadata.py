import os, struct, json, re

GAME_DAT = r'C:\Program Files\Epic Games\SuperMeatBoy\gamedata.dat'
OUT_BASE = r'C:\Users\skace\Documents\SuperMeatboyRewrite\public\assets'

def unpack_dat(archive_path):
    with open(archive_path, 'rb') as f:
        num_dirs = struct.unpack('<I', f.read(4))[0]
        dirs = [struct.unpack('<II', f.read(8)) for _ in range(num_dirs)]
        num_files = struct.unpack('<I', f.read(4))[0]
        files = [struct.unpack('<III', f.read(12)) for _ in range(num_files)]
        f.read(8)
        def read_null_str():
            chars = []
            while True:
                c = f.read(1)
                if not c or c == b'\x00':
                    break
                chars.append(c)
            return b''.join(chars).decode('latin1', errors='replace')
        dir_names = [read_null_str() for _ in range(num_dirs)]
        file_names = [read_null_str() for _ in range(num_files)]
        
        extracted = {}
        for idx, name in enumerate(file_names):
            offset, size, parent = files[idx]
            f.seek(offset)
            extracted[name] = f.read(size)
        return extracted

print('Unpacking gamedata.dat...')
data = unpack_dat(GAME_DAT)

chapters_dir = os.path.join(OUT_BASE, 'chapters')
palettes_dir = os.path.join(OUT_BASE, 'palettes')
anim_dir = os.path.join(OUT_BASE, 'animations')
os.makedirs(chapters_dir, exist_ok=True)
os.makedirs(palettes_dir, exist_ok=True)
os.makedirs(anim_dir, exist_ok=True)

parsed_chapters = {}
parsed_palettes = {}

def parse_kv_block(text):
    blocks = []
    # match block_name { ... }
    for m in re.finditer(r'([A-Za-z0-9_]+)\s*\{([^}]+)\}', text):
        block_type = m.group(1).strip()
        body = m.group(2)
        kv = {}
        for line in body.splitlines():
            line = line.strip().rstrip(';')
            if '=' in line:
                parts = line.split('=', 1)
                k = parts[0].strip()
                v = parts[1].strip().strip('"').strip("'")
                try:
                    if '.' in v:
                        v = float(v)
                    else:
                        v = int(v)
                except ValueError:
                    pass
                kv[k] = v
        blocks.append((block_type, kv))
    return blocks

for name, raw in data.items():
    norm = name.replace('\\', '/')
    base = os.path.basename(norm)
    if norm.endswith('.chapter'):
        with open(os.path.join(chapters_dir, base), 'wb') as f:
            f.write(raw)
        txt = raw.decode('latin1', errors='replace')
        blocks = parse_kv_block(txt)
        parsed_chapters[base.replace('.chapter', '')] = blocks
    elif norm.endswith('.lp'):
        with open(os.path.join(palettes_dir, base), 'wb') as f:
            f.write(raw)
        txt = raw.decode('latin1', errors='replace')
        blocks = parse_kv_block(txt)
        parsed_palettes[base.replace('.lp', '')] = blocks
    elif norm.endswith('.am') and ('pc/' in norm or not norm.startswith('pc_')):
        with open(os.path.join(anim_dir, base), 'wb') as f:
            f.write(raw)

with open(os.path.join(OUT_BASE, 'data', 'chapters.json'), 'w') as f:
    json.dump(parsed_chapters, f, indent=2)

with open(os.path.join(OUT_BASE, 'data', 'palettes.json'), 'w') as f:
    json.dump(parsed_palettes, f, indent=2)

print(f'Extracted {len(parsed_chapters)} chapters, {len(parsed_palettes)} palettes, animations to public/assets.')
