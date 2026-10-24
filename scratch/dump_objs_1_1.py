import struct, os, math

d = open(os.path.join('public', 'assets', 'levels', '1-1.smbl'), 'rb').read()
pos = 0
def rd(n):
    global pos
    v = d[pos:pos+n]; pos += n; return v
def u8(): return rd(1)[0]
def u16(): return struct.unpack('<H', rd(2))[0]
def u32(): return struct.unpack('<I', rd(4))[0]
def i32(): return struct.unpack('<i', rd(4))[0]
def f32(): return struct.unpack('<f', rd(4))[0]
magic = u32(); ver = u32(); ln = u8(); pal = rd(ln+1)
A = f32(); B = f32(); w = u16(); h = u16()
print('magic', hex(magic), 'ver', ver, 'pal', pal, 'A,B', A, B, 'w,h', w, h)
groups = []
for g in range(8):
    groups.append(([f32() for _ in range(4)], i32()))
for g in range(8):
    print('group', g, groups[g])
counts = [i32() for _ in range(3)]
layers = []
for c in counts:
    cells = []
    for k in range(c):
        v = u32(); cells += [v & 0x3FFFFF] * (v >> 22)
    layers.append(cells)
oc = [i32() for _ in range(8)]
print('layer counts', counts, 'group counts', oc)
objs = []
for g, c in enumerate(oc):
    for k in range(c):
        x, y, z, ww, hh = struct.unpack('<5f', d[pos:pos+20])
        Aint, Bint, Cint, Dint = struct.unpack('<4i', d[pos+20:pos+36])
        E, F, G = struct.unpack('<3f', d[pos+36:pos+48])
        H = struct.unpack('<H', d[pos+48:pos+50])[0]
        objs.append(dict(g=g, x=x, y=y, z=z, w=ww, h=hh, a=Aint, b=Bint, c=Cint, dd=Dint, e=E, f=F, gg=G, hh=H))
        pos += 50
bounds = struct.unpack('<4f', d[pos:pos+16])
print('bounds', bounds, 'pos after', pos, 'filelen', len(d), 'remain', len(d)-pos)
for o in objs:
    fr = (o['y'] + h*10) / 20.0
    fc = (o['x'] + w*10) / 20.0
    er = h - 1 - int(math.floor(fr))
    ec = int(math.floor(fc))
    tile = layers[0][int(fr)*w + int(fc)] if 0 <= int(fr) < h and 0 <= int(fc) < w else -1
    engx = o['x'] + w*10
    engy = h*10 - o['y']
    print(f"g{o['g']} x{o['x']:8.2f} y{o['y']:8.2f} z{o['z']:6.1f} w{o['w']:7.2f} h{o['h']:7.2f} "
          f"A{o['a']:5d} B{o['b']:5d} C{o['c']:8d} D{o['dd']:3d} E{o['e']:7.2f} F{o['f']:7.2f} G{o['gg']:7.2f} H{o['hh']:3d} "
          f"| tile({int(fr)},{int(fc)})={tile:8d} eng({engx:7.1f},{engy:7.1f})")
