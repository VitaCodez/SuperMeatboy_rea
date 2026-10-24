import struct

def analyze_smbl(filepath):
    with open(filepath, 'rb') as f:
        data = f.read()

    print(f"File: {filepath} ({len(data)} bytes)")
    print(f"Header: {data[:16]}")
    # Inspect first 100 bytes
    for i in range(0, min(len(data), 128), 16):
        chunk = data[i:i+16]
        hex_str = ' '.join(f"{b:02x}" for b in chunk)
        ascii_str = ''.join(chr(b) if 32 <= b <= 126 else '.' for b in chunk)
        print(f"{i:04x}: {hex_str:<48} | {ascii_str}")

analyze_smbl('public/assets/levels/1-1.smbl')
analyze_smbl('public/assets/levels/1-2.smbl')
