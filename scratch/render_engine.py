import struct, os, sys
from PIL import Image, ImageDraw

def parse(name):
    d = open(os.path.join('public', 'assets', 'levels', name), 'rb').read()
    pos = 0
    def rd(n):
        nonlocal pos
        v = d[pos:pos+n]; pos += n; return v
    def u8(): return rd(1)[0]
    def u16(): return struct.unpack('<H', rd(2))[0]
    def u32(): return struct.unpack('<I', rd(4))[0]
    def i32(): return struct.unpack('<i', rd(4))[0]
    def f32(): return struct.unpack('<f', rd(4))[0]
    magic = u32(); ver = u32(); ln = u8(); pal = rd(ln+1)
    A = f32(); B = f32(); w = u16(); h = u16()
    groups = []
    for g in range(8):
        groups.append(([f32() for _ in range(4)], i32()))
    counts = [i32() for _ in range(3)]
    layers = []
    for c in counts:
        cells = []
        for k in range(c):
            v = u32(); cells += [v & 0x3FFFFF] * (v >> 22)
        layers.append(cells)
    oc = [i32() for _ in range(8)]
    objs = []
    for g, c in enumerate(oc):
        for k in range(c):
            x, y, z, ww, hh = struct.unpack('<5f', d[pos:pos+20])
            Bv = struct.unpack('<i', d[pos+24:pos+28])[0]
            objs.append((g, x, y, z, ww, hh, Bv)); pos += 50
    bounds = struct.unpack('<4f', d[pos:pos+16])
    return dict(w=w, h=h, layers=layers, objs=objs, A=A, B=B, bounds=bounds, ver=ver, magic=magic, pal=pal)

name = sys.argv[1]
L = parse(name)
w, h = L['w'], L['h']

TILE = 24
COLORS = {
    0: (22, 22, 26),
    1: (60, 120, 60),
    12: (90, 130, 70),
    13: (70, 110, 55),
}
def base_color(v):
    if v == 0: return (22, 22, 26)
    idx = v & 0xFFF
    if idx in (12, 13): return (90, 130, 70) if idx == 12 else (70, 110, 55)
    if idx in (0x28, 0x29): return (120, 120, 130)
    if v & 0x8000: return (170, 40, 40)
    if v & 0x4000: return (140, 110, 70)
    if v & 0x2000: return (100, 80, 150)
    if v & 0x1000: return (60, 90, 160)
    return (110, 90, 60)

img = Image.new('RGB', (w*TILE, h*TILE), (22, 22, 26))
px = img.load()
for er in range(h):
    for ec in range(w):
        fr = h - 1 - er
        v = L['layers'][0][fr*w + ec]
        if v == 0: continue
        c = base_color(v)
        for yy in range(TILE):
            for xx in range(TILE):
                px[ec*TILE+xx, er*TILE+yy] = c

d = ImageDraw.Draw(img)
def w2e(x, y):
    return (x + w*10)/20*TILE, (h*10 - y)/20*TILE
sx, sy = w2e(L['A'], L['B'])
d.ellipse([sx-8, sy-8, sx+8, sy+8], fill=(0, 255, 0))
for g, x, y, z, ww, hh, Bv in L['objs']:
    ex, ey = w2e(x, y)
    if g == 4:
        col = (255, 0, 255)
    elif g == 3:
        col = (255, 0, 0)
    elif g == 1:
        col = (0, 255, 255)
    elif g == 2:
        col = (255, 255, 0)
    else:
        col = (200, 200, 200)
    r = max(3, int(ww/20*TILE/2))
    d.ellipse([ex-r, ey-r, ex+r, ey+r], outline=col, width=2)
    if g == 4:
        d.text((ex+6, ey-6), f'g4 B{Bv}', fill=(255, 0, 255))
    if g == 3:
        d.text((ex+6, ey-6), f'g3', fill=(255, 80, 80))

out = 'scratch\\eng_' + name + '.png'
img.save(out)
print('saved', out, img.size, 'start', sx, sy)
