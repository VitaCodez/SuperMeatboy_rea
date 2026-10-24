import struct

with open('public/assets/animations/obstacles.am', 'rb') as f:
    data = f.read()

pos = 1100
for i in range(pos, 1200, 4):
    u = struct.unpack('<I', data[i:i+4])[0]
    f = struct.unpack('<f', data[i:i+4])[0]
    print(f"{i}: {u:10d} (0x{u:08x})  f={f}", flush=True)
