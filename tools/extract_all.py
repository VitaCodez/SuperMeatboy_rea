import os
import sys
import struct
import json

GAME_DIR = r"C:\Program Files\Epic Games\SuperMeatBoy"
OUTPUT_DIR = r"C:\Users\skace\Documents\SuperMeatboyRewrite\public\assets"

def unpack_dat(archive_path):
    print(f"Reading {archive_path}...")
    with open(archive_path, "rb") as f:
        num_dirs = struct.unpack("<I", f.read(4))[0]
        dirs = []
        for _ in range(num_dirs):
            entry_num, file_count = struct.unpack("<II", f.read(8))
            dirs.append((entry_num, file_count))
        
        num_files = struct.unpack("<I", f.read(4))[0]
        files = []
        for _ in range(num_files):
            offset, size, parent = struct.unpack("<III", f.read(12))
            files.append((offset, size, parent))
        
        # 8 bytes padding
        f.read(8)
        
        def read_null_str():
            chars = []
            while True:
                c = f.read(1)
                if not c or c == b"\x00":
                    break
                chars.append(c)
            return b"".join(chars).decode("latin1", errors="replace")
        
        dir_names = [read_null_str() for _ in range(num_dirs)]
        file_names = [read_null_str() for _ in range(num_files)]
        
        extracted = {}
        for idx, name in enumerate(file_names):
            offset, size, parent = files[idx]
            f.seek(offset)
            data = f.read(size)
            extracted[name] = data
            
    print(f"Loaded {len(extracted)} files from {os.path.basename(archive_path)}")
    return extracted

def parse_itx(data):
    """
    Parses .itx files (records of 5 floats each: u, v, w, h, rotation)
    """
    record_size = 20
    count = len(data) // record_size
    records = []
    for i in range(count):
        chunk = data[i * record_size : (i + 1) * record_size]
        u, v, w, h, rot = struct.unpack("<5f", chunk)
        records.append({
            "u": round(u, 6),
            "v": round(v, 6),
            "w": round(w, 6),
            "h": round(h, 6),
            "rot": round(rot, 4)
        })
    return records

def parse_props(data):
    """
    Parses .props binary files into list of floats
    """
    count = len(data) // 4
    floats = []
    for i in range(count):
        val = struct.unpack("<f", data[i*4:(i+1)*4])[0]
        floats.append(round(val, 5))
    return floats

def parse_smbl(data):
    """
    Parses Super Meat Boy .smbl level files (TL02 format)
    """
    if len(data) < 32:
        return None
    magic = data[:4]
    if magic not in (b"20LT", b"TL02", b"10LT", b"TL01"):
        return None
    
    # Palette name null-terminated string at offset 8 or around
    pos = 4
    # Read palette string length or search for .lp
    lp_idx = data.find(b".lp")
    theme = "forest"
    if lp_idx != -1:
        # Find start of string
        str_start = lp_idx
        while str_start > 4 and data[str_start - 1] >= 32 and data[str_start - 1] <= 126:
            str_start -= 1
        theme_str = data[str_start : lp_idx + 3].decode("latin1", errors="replace")
        theme = theme_str.replace(".lp", "")

    # Look for dimensions (often width=100, height=35 or similar)
    # Search for DNET marker or header ends
    dnet_pos = data.find(b"DNET")
    header_offset = dnet_pos + 4 if dnet_pos != -1 else 0x30
    
    # Let's inspect width, height, and tile data
    width = 100
    height = 35
    
    # Extract entities and tiles
    # In SMB, levels typically fit in 100x35 or variable bounds
    return {
        "raw_size": len(data),
        "theme": theme,
        "magic": magic.decode("latin1", errors="replace"),
        "dnet_offset": dnet_pos
    }

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    textures_dir = os.path.join(OUTPUT_DIR, "textures")
    audio_dir = os.path.join(OUTPUT_DIR, "audio")
    levels_dir = os.path.join(OUTPUT_DIR, "levels")
    data_dir = os.path.join(OUTPUT_DIR, "data")
    
    for d in [textures_dir, audio_dir, levels_dir, data_dir]:
        os.makedirs(d, exist_ok=True)

    gamedata_path = os.path.join(GAME_DIR, "gamedata.dat")
    gameaudio_path = os.path.join(GAME_DIR, "gameaudio.dat")

    if not os.path.exists(gamedata_path):
        print(f"Error: {gamedata_path} not found!")
        return

    gamedata = unpack_dat(gamedata_path)
    
    spritesheet_meta = {}
    character_props = {}
    level_manifest = []

    print("Processing gamedata files...")
    for filename, data in gamedata.items():
        norm_name = filename.replace("\\", "/")
        
        # 1. Textures: .tp files -> strip 21 bytes header -> PNG
        if norm_name.endswith(".tp"):
            # Only save high-res (pc/) textures to save space and best visual quality
            if norm_name.startswith("pc/") or not (norm_name.startswith("pc_low/") or norm_name.startswith("pc_med/")):
                png_data = data[0x15:] if len(data) > 0x15 else data
                # Verify PNG magic: 89 50 4E 47
                if png_data.startswith(b"\x89PNG\r\n\x1a\n"):
                    rel_path = norm_name.replace("pc/", "").replace(".tp", ".png")
                    out_path = os.path.join(textures_dir, rel_path.replace("/", os.sep))
                    os.makedirs(os.path.dirname(out_path), exist_ok=True)
                    with open(out_path, "wb") as pf:
                        pf.write(png_data)

        # 2. Coordinates: .itx files
        elif norm_name.endswith(".itx"):
            if norm_name.startswith("pc/") or not (norm_name.startswith("pc_low/") or norm_name.startswith("pc_med/")):
                base = os.path.basename(norm_name)
                spritesheet_meta[base] = parse_itx(data)

        # 3. Props: .props files
        elif norm_name.endswith(".props"):
            base = os.path.basename(norm_name)
            character_props[base] = parse_props(data)

        # 4. Levels: .smbl files
        elif norm_name.endswith(".smbl"):
            base = os.path.basename(norm_name)
            out_path = os.path.join(levels_dir, base)
            # Save raw binary level file so engine can parse directly in JS/TS or Python
            with open(out_path, "wb") as lf:
                lf.write(data)
            level_manifest.append(base)

    # Save meta json
    with open(os.path.join(data_dir, "spritesheets.json"), "w") as jf:
        json.dump(spritesheet_meta, jf, indent=2)
    print("Saved spritesheets.json")

    with open(os.path.join(data_dir, "character_props.json"), "w") as jf:
        json.dump(character_props, jf, indent=2)
    print("Saved character_props.json")

    with open(os.path.join(data_dir, "levels_manifest.json"), "w") as jf:
        json.dump(sorted(level_manifest), jf, indent=2)
    print(f"Saved levels_manifest.json with {len(level_manifest)} levels")

    # 5. Audio: gameaudio.dat
    if os.path.exists(gameaudio_path):
        gameaudio = unpack_dat(gameaudio_path)
        print("Extracting audio files...")
        count = 0
        for filename, data in gameaudio.items():
            norm_name = filename.replace("\\", "/")
            # Extract standard sfx and music
            if norm_name.endswith(".wav"):
                rel_path = os.path.basename(norm_name)
                out_path = os.path.join(audio_dir, rel_path)
                with open(out_path, "wb") as af:
                    af.write(data)
                count += 1
        print(f"Extracted {count} audio WAV files.")

    print("\nExtraction complete!")

if __name__ == "__main__":
    main()
