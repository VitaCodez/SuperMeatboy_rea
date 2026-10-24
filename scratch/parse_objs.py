import struct
d=open(r'public\assets\levels\1-1.smbl','rb').read(); pos=0
def rd(n):
    global pos; v=d[pos:pos+n]; pos+=n; return v
def u8(): return rd(1)[0]
def u16(): return struct.unpack('<H',rd(2))[0]
def u32(): return struct.unpack('<I',rd(4))[0]
def i32(): return struct.unpack('<i',rd(4))[0]
def f32(): return struct.unpack('<f',rd(4))[0]
magic=u32(); ver=u32(); ln=u8(); pal=rd(ln+1)
a=i32(); b=i32(); h=u16(); w=u16()
groups=[]
for g in range(8):
    vals=[f32() for _ in range(4)]; extra=i32(); groups.append((vals,extra))
counts=[i32() for _ in range(3)]
for c in counts:
    for k in range(c): u32()
objcounts=[i32() for _ in range(8)]
print('objcounts',objcounts)
for g,c in enumerate(objcounts):
    print('--- group',g,'count',c)
    for k in range(c):
        p0=pos
        v14=[f32() for _ in range(3)]
        v24=[f32() for _ in range(2)]
        v2c=i32(); v10=i32()
        if magic in (0x544c3031,0x544c3032):
            v34=i32(); v38=i32()
            v3c=[f32() for _ in range(2)]
            v44=[f32() for _ in range(2)]
        else:
            v34=v38=v3c=v44=None
        print(' #%d posoff %d 14=%s 24=%s 2c=%d 10=%d 34=%s 38=%s 3c=%s 44=%s'%(k,p0,[round(x,2) for x in v14],[round(x,2) for x in v24],v2c,v10,v34,v38,[round(x,2) for x in (v3c or [])],[round(x,2) for x in (v44 or [])]))
print('pos',pos,'len',len(d))
