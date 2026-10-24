import struct

data = open('public/assets/animations/obstacles.am', 'rb').read()
pos = 1020
for i in range(pos, 1060, 2):
    s = struct.unpack('<h', data[i:i+2])[0]
    u = struct.unpack('<H', data[i:i+2])[0]
    print(f"  {i}: int16={s:6d} uint16={u:6d} (0x{u:04x})")
