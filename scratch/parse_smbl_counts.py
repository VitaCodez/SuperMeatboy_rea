import struct

with open('public/assets/levels/1-1.smbl', 'rb') as f:
    buf = f.read()

print(f"Total size: {len(buf)}")

# Let's inspect the 8 counts read at offset 0x3c or around
# Let's see: where is 0x64 (100) and 0x23 (35)?
# In 1-1.smbl:
# 0030: 08 f8 cf b0 08 64 00 00 00 23 00 00 00 01 00 00
# 0040: 00 02 00 00 00 08 00 00 00 49 00 00 00 00 00 00
# 0050: 00 00 10 00 b0 00 00 00 00 e8 8f ed 09 40 32 c1
pos = 0x34
w, h = struct.unpack('<II', buf[pos:pos+8])
print(f"Width={w}, Height={h}")
pos += 8

# Let's read 8 integers:
counts = struct.unpack('<8I', buf[pos:pos+32])
print(f"8 counts: {counts}")
pos += 32
print(f"Position after 8 counts: 0x{pos:x} ({pos})")
