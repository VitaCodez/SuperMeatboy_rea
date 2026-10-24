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
    u32(); u32(); ln = u8(); rd(ln+1)
    f32(); f32(); w = u16(); h = u16()
    for g in range(8):
        for _ in range(4): f32()
        i32()
    counts = [i32() for _ in range(3)]
    for c in counts:
        for k in range(c): u32()
    oc = [i32() for _ in range(8)]
    objs = []
    for g, c in enumerate(oc):
        for k in range(c):
            x, y, z, ww, hh = struct.unpack('<5f', d[pos:pos+20])
            a, b, cc, dd = struct.unpack('<4i', d[pos+20:pos+36])
            e, f, gg = struct.unpack('<3f', d[pos+36:pos+48])
            hh2 = struct.unpack('<H', d[pos+48:pos+50])[0]
            objs.append(dict(g=g, x=x, y=y, z=z, w=ww, h=hh, a=a, b=b, c=cc,
                             d=dd, e=e, f=f, gg=gg, hh=hh2))
            pos += 50
    return w, h, objs

for nm in ('1-1.smbl', '1-10.smbl', '1-16.smbl', '1-17.smbl', '1-12.smbl'):
    try:
        w, h, objs = parse(nm)
    except Exception as ex:
        print(nm, 'ERR', ex); continue
    print('=====', nm, 'w,h', w, h, 'objects', len(objs))
    for o in objs:
        if o['g'] == 2 or o['b'] in (17, 20, 512, 12300):
            ex = o['x'] + w*10; ey = h*10 - o['y']
            cf = struct.unpack('<f', struct.pack('<i', o['c']))[0]
            print("g%d x%8.1f y%8.1f z%6.0f w%6.1f h%6.1f A%6d B%6d C%7d(%7.2f) D%6d E%7.2f F%7.2f G%7.2f H%3d eng(%7.1f,%7.1f)" % (
                o['g'], o['x'], o['y'], o['z'], o['w'], o['h'], o['a'], o['b'], o['c'], cf,
                o['d'], o['e'], o['f'], o['gg'], o['hh'], ex, ey))
