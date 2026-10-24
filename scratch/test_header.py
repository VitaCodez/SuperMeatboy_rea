import struct

def parse_header(filepath):
    with open(filepath, 'rb') as f:
        buf = f.read()

    pos = 0
    magic = buf[:4]
    version = struct.unpack('<I', buf[4:8])[0]
    pos = 8
    marker = buf[pos]
    pos += 1
    
    pal_end = buf.find(b'\x00', pos)
    palette = buf[pos:pal_end].decode('latin1')
    pos = pal_end + 1
    
    print(f"File: {filepath}")
    print(f"  Magic: {magic}, Version: {version}, Palette: '{palette}', pos after pal: 0x{pos:x} ({pos})")
    
    # Let's inspect the next 48 bytes
    chunk = buf[pos:pos+48]
    hex_str = ' '.join(f"{b:02x}" for b in chunk)
    print(f"  Next bytes: {hex_str}")

for fn in ['1-1.smbl', '1-2.smbl', '2-1.smbl', '3-1.smbl', '4-1.smbl']:
    parse_header(f'public/assets/levels/{fn}')
