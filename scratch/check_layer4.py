import struct

data = open('public/assets/animations/obstacles.am', 'rb').read()
pos = 1040
for i in range(pos, 1180, 4):
    print(f"  {i}: int={struct.unpack('<i', data[i:i+4])[0]:11d} (0x{struct.unpack('<I', data[i:i+4])[0]:08x})  float={struct.unpack('<f', data[i:i+4])[0]:12.4f}")
