import struct, sys
p=r'public\assets\levels\1-1.smbl'
d=open(p,'rb').read()
pos=0
def u8():
    global pos; v=d[pos]; pos+=1; return v
def rd(n):
    global pos; v=d[pos:pos+n]; pos+=n; return v
def u16():
    return struct.unpack('<H',rd(2))[0]
def u32():
    return struct.unpack('<I',rd(4))[0]
def i32():
    return struct.unpack('<i',rd(4))[0]
def f32():
    return struct.unpack('<f',rd(4))[0]
magic=u32(); ver=u32()
print('magic',hex(magic),'ver',ver)
ln=u8(); pal=rd(ln+1); pos+=0  # fixed string read length+1
print('pal len byte',ln,'bytes',pal[:40])
print('1d2c',i32(),'1d30',i32())
w=u16(); h=u16()
print('w,h',w,h)
for g in range(8):
    vals=[f32() for _ in range(4)]
    extra=i32()
print('after groups pos',pos)
counts=[i32() for _ in range(3)]
print('layer counts',counts)
layers=[]
for li,c in enumerate(counts):
    runs=[]
    total=0
    for k in range(c):
        v=u32()
        run=v>>22; tile=(v>>16)&0x3f; param=v&0xffff
        runs.append((run,tile,param,v))
        total+=run
    print('layer',li,'total tiles',total,'expected',w*h, 'runs',len(runs))
    # expand
    grid=[]
    for run,tile,param,v in runs:
        grid.extend([(tile,param,v)]*run)
    layers.append(grid)
print('pos after layers',pos)
objcounts=[i32() for _ in range(8)]
print('object counts',objcounts)
print('pos',pos,'len',len(d))
# dump layer0 grid as chars: tile 0 empty, others letter
chars='.123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij'
for y in range(h):
    row=''.join(chars[t] if t<len(chars) else '?' for t,p,v in layers[0][y*w:(y+1)*w])
    print('%2d %s'%(y,row))
print('tile ids layer0',sorted(set(t for t,p,v in layers[0])))
print('params layer0 sample',sorted(set(p for t,p,v in layers[0]))[:40])
print('layer1 tile ids',sorted(set(t for t,p,v in layers[1])))
print('layer2 tile ids',sorted(set(t for t,p,v in layers[2])))
