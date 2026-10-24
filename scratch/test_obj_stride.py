import struct

with open('public/assets/levels/1-1.smbl', 'rb') as f:
    buf = f.read()

# Let's inspect objects starting at 0x108
pos = 0x108
for obj_idx in range(25):
    if pos + 48 > len(buf):
        break
    # Try unpacking pos, size, etc.
    chunk = buf[pos:pos+64]
    fx, fy = struct.unpack('<ff', chunk[0:8])
    u1, u2 = struct.unpack('<HH', chunk[8:12])
    sx, sy = struct.unpack('<ff', chunk[12:20])
    print(f"Obj {obj_idx:02d} @ 0x{pos:04x}: pos=({fx:8.2f}, {fy:8.2f}) u=({u1}, {u2}) scale=({sx:.2f}, {sy:.2f})")
    
    # Let's see what record stride could be: try 32, 40, 48, 56, 64
    pos += 48 # test stride
