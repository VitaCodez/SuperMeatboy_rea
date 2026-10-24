import struct

with open('public/assets/animations/obstacles.am', 'rb') as f:
    data = f.read()

pos = 1138
print("pos 1138 bytes:", [int(x) for x in data[pos:pos+40]], flush=True)
val1, f1, f2 = struct.unpack('<Iff', data[pos:pos+12])
print(f"val1={val1} (layers={val1>>1}, loop={val1&1}), f1={f1}, f2={f2}", flush=True)
pos += 12
layers = val1 >> 1
for _ in range(layers):
    pos += 4
for l in range(layers):
    z, kfc, dur = struct.unpack('<IIf', data[pos:pos+12])
    print(f"  layer {l}: z={z}, kfc={kfc}, dur={dur}", flush=True)
    pos += 12
    # if signed:
    ff = data[pos:pos+12]
    print(f"  ff: {[hex(x) for x in ff]}", flush=True)
    pos += 12
    for k in range(kfc):
        tex_id = struct.unpack('<I', data[pos:pos+4])[0]
        print(f"    kf {k}: tex_id={tex_id}", flush=True)
        pos += 56
print(f"Next pos: {pos}", flush=True)
