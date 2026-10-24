import os
import struct

archive_path = r"C:\Program Files\Epic Games\SuperMeatBoy\gamedata.dat"

with open(archive_path, "rb") as f:
    num_dirs = struct.unpack("<I", f.read(4))[0]
    dirs = []
    for _ in range(num_dirs):
        dirs.append(struct.unpack("<II", f.read(8)))
    
    num_files = struct.unpack("<I", f.read(4))[0]
    files = []
    for _ in range(num_files):
        files.append(struct.unpack("<III", f.read(12)))
    
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
    
    print(f"Total files in gamedata.dat: {len(file_names)}")
    smbl_files = [(i, name, files[i]) for i, name in enumerate(file_names) if name.endswith('.smbl')]
    print(f"Total .smbl files in gamedata.dat: {len(smbl_files)}")
    for i, name, (offset, size, parent) in smbl_files[:20]:
        print(f"  {name} (dir={dir_names[parent] if parent < len(dir_names) else parent}): offset={offset}, size={size}")
