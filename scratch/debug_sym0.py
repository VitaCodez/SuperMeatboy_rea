import struct

with open('public/assets/animations/obstacles.am', 'rb') as f:
    data = f.read()

pos = 750
val1, ign1, ign2 = struct.unpack('<Iff', data[pos:pos+12])
pos += 12
layers = val1 >> 1
print(f"Symbol 0: layers={layers}, loop={val1&1}")
layer_unknowns = struct.unpack(f'<{layers}I', data[pos:pos+4*layers])
pos += 4 * layers
print(f"layer_unknowns: {layer_unknowns}")

for l in range(layers):
    z, kfc, dur = struct.unpack('<IIf', data[pos:pos+12])
    pos += 12
    ff1, ff2, ff3 = struct.unpack('<III', data[pos:pos+12])
    pos += 12
    print(f"Layer {l}: z={z}, kfc={kfc}, dur={dur}, ff=({hex(ff1)}, {hex(ff2)}, {hex(ff3)})")
    for k in range(kfc):
        tex_id = struct.unpack('<I', data[pos:pos+4])[0]
        pos += 56
        print(f"  kf {k}: tex_id={tex_id}")

print(f"Pos after symbol 0: {pos}")
print(f"Next 40 bytes: {[hex(x) for x in data[pos:pos+40]]}")
