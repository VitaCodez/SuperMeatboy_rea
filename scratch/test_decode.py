import struct

def decode_smbl(filepath):
    with open(filepath, 'rb') as f:
        buf = f.read()

    # 1. Magic
    magic = buf[:4]
    version = struct.unpack('<I', buf[4:8])[0]
    
    pos = 8
    marker = buf[pos]
    pos += 1
    pal_end = buf.find(b'\x00', pos)
    palette = buf[pos:pal_end].decode('latin1')
    pos = pal_end + 1
    
    # Next reads:
    # 4 bytes, 4 bytes
    v1, v2 = struct.unpack('<II', buf[pos:pos+8])
    pos += 8
    
    # 2 bytes, 2 bytes
    dim_w, dim_h = struct.unpack('<HH', buf[pos:pos+4])
    pos += 4
    
    print(f"Decoded {filepath}:")
    print(f"  Version: {version}, Palette: {palette}")
    print(f"  v1: {v1}, v2: {v2}")
    print(f"  dim_w: {dim_w}, dim_h: {dim_h}")
    
    # Next, let's inspect the next 64 bytes
    print(f"  Offset pos = 0x{pos:x} ({pos}):")
    # Let's read 16 floats or ints
    vals = struct.unpack('<16I', buf[pos:pos+64])
    print(f"  Next 16 ints: {vals}")
    fvals = struct.unpack('<16f', buf[pos:pos+64])
    print(f"  Next 16 floats: {[round(x, 2) for x in fvals]}")

decode_smbl('public/assets/levels/1-1.smbl')
decode_smbl('public/assets/levels/1-2.smbl')
