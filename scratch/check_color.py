import struct

data = open('public/assets/animations/obstacles.am', 'rb').read()

# Let's inspect Layer 0 keyframe
# Layer 0 keyframe started at 806:
# tex_id: 806..810 (4 bytes)
# px, py: 810..818 (8 bytes)
# sx, sy: 818..826 (8 bytes)
# skx, sky: 826..834 (8 bytes)
# ox, oy: 834..842 (8 bytes)
# 4 + 8 + 8 + 8 + 8 = 36 bytes.
# Now what is at 842?
print("Color data at 842..862:")
for i in range(842, 866, 2):
    s = struct.unpack('<h', data[i:i+2])[0]
    u = struct.unpack('<H', data[i:i+2])[0]
    print(f"  {i}: int16={s} uint16={u} (0x{u:04x})")
