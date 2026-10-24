import struct

data = open('public/assets/animations/obstacles.am', 'rb').read()
pos = 750
print("Header at 750:")
for i in range(pos, pos+40, 4):
    print(f"  {i}: int={struct.unpack('<i', data[i:i+4])[0]}  float={struct.unpack('<f', data[i:i+4])[0]}")

pos = 750 + 12 + 20 # 782
print("\nLayer 0:")
for i in range(pos, pos+80, 4):
    print(f"  {i}: int={struct.unpack('<i', data[i:i+4])[0]}  float={struct.unpack('<f', data[i:i+4])[0]}")
