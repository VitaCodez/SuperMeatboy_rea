import re

exe_path = r"C:\Program Files\Epic Games\SuperMeatBoy\SuperMeatBoy.exe"

with open(exe_path, "rb") as f:
    exe_data = f.read()

print(f"SuperMeatBoy.exe size: {len(exe_data)} bytes")

# Find occurrences of 20LT, TL02, .smbl, etc.
for target in [b"20LT", b"TL02", b".smbl", b"DNET", b".lp"]:
    matches = [m.start() for m in re.finditer(re.escape(target), exe_data)]
    print(f"Target {target}: found {len(matches)} times at {[hex(m) for m in matches[:10]]}")
