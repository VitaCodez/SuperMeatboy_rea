import struct

with open('public/assets/levels/1-1.smbl', 'rb') as f:
    buf = f.read()

# Inspect Obj 05 at 0x1f8
record = buf[0x1f8:0x1f8+48]
print("Raw 48 bytes:", ' '.join(f'{b:02x}' for b in record))

# Print as 12 ints
ivals = struct.unpack('<12I', record)
print("12 ints:  ", ivals)

# Print as 12 floats
fvals = struct.unpack('<12f', record)
print("12 floats:", [round(x, 2) for x in fvals])

# Print as 24 shorts
svals = struct.unpack('<24h', record)
print("24 shorts:", svals)
