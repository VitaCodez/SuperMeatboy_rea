import struct, os

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
    a = i32(); b = i32(); w = u16(); h = u16()
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
    objs = []; o = pos
    for g, c in enumerate(oc):
        for k in range(c):
            x, y, z, ww, hh = struct.unpack('<5f', d[o:o+20])
            objs.append((g, x, y, z, ww, hh, d[o+24])); o += 50
    return dict(w=w, h=h, layers=layers, objs=objs, groups=groups, a=a, b=b, ver=ver)

L = parse('1-1.smbl')
w, h = L['w'], L['h']; lay = L['layers'][0]
def cell(i): return lay[i] if 0 <= i < len(lay) else -1
print('1-1 w,h', w, h, 'a,b', L['a'], L['b'], 'ver', L['ver'])
for g, x, y, z, ww, hh, B in L['objs']:
    if g in (4, 2):
        col = int((x + w*10)/20); rb = int((y + h*10)/20); rt = int((h*10 - y)/20)
        print(f'g{g} x{x:8.2f} y{y:8.2f} w{ww:.1f} h{hh:.1f} B{B:6d} col{col:3d} rb{rb:3d} rt{rt:3d} '
              f'rowBot={cell(rb*w+col):8d} rowTop={cell(rt*w+col):8d} colBot={cell(col*h+rb):8d} colTop={cell(col*h+rt):8d}')

L2 = parse('1-10.smbl'); w2, h2 = L2['w'], L2['h']; L2a = L2['layers'][0]
def c2(i): return L2a[i] if 0 <= i < len(L2a) else -1
print('\n1-10 w,h', w2, h2, 'a,b', L2['a'], L2['b'])
for g, x, y, z, ww, hh, B in L2['objs']:
    if g in (4, 2):
        col = int((x + w2*10)/20); rb = int((y + h2*10)/20); rt = int((h2*10 - y)/20)
        print(f'g{g} x{x:8.2f} y{y:8.2f} w{ww:.1f} h{hh:.1f} B{B:6d} col{col:3d} rb{rb:3d} rt{rt:3d} '
              f'rowBot={c2(rb*w2+col):8d} rowTop={c2(rt*w2+col):8d} colBot={c2(col*h2+rb):8d} colTop={c2(col*h2+rt):8d}')

variants = [
    ('rowMaj_bot', lambda r, c: c2(r*w2 + c)),
    ('rowMaj_top', lambda r, c: c2((h2-1-r)*w2 + c)),
    ('colMaj_bot', lambda r, c: c2(c*h2 + r)),
    ('colMaj_top', lambda r, c: c2(c*h2 + (h2-1-r))),
]
for namev, fn in variants:
    print('\n---', namev, f'{w2}x{h2}')
    for r in range(h2):
        print(''.join('#' if fn(r, c) else '.' for c in range(w2)))
