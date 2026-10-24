import struct

with open('public/assets/levels/1-1.smbl', 'rb') as f:
    data = f.read()

print("File size:", len(data))
# Look at footer
print("Footer:", data[-32:])

# Search for any strings or markers in data
for i in range(len(data) - 4):
    if data[i:i+4] in [b'DNET', b'TL02', b'TEND']:
        print(f"Marker {data[i:i+4]} at {i} (0x{i:x})")

# Look at offsets around 0x30 to 0x100
for i in range(0, 0x120, 4):
    val_u32 = struct.unpack('<I', data[i:i+4])[0]
    val_f = struct.unpack('<f', data[i:i+4])[0]
    print(f"0x{i:03x}: {val_u32:<10} | {val_f:<12.4f}")
