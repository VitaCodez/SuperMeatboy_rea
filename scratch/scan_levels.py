import struct,sys,glob,os
def parse(path):
    d=open(path,'rb').read(); pos=0
    def rd(n):
        nonlocal pos; v=d[pos:pos+n]; pos+=n; return v
    def u8(): return rd(1)[0]
    def u16(): return struct.unpack('<H',rd(2))[0]
    def u32(): return struct.unpack('<I',rd(4))[0]
    def i32(): return struct.unpack('<i',rd(4))[0]
    def f32(): return struct.unpack('<f',rd(4))[0]
    magic=u32(); ver=u32(); ln=u8(); pal=rd(ln+1)
    a=i32(); b=i32(); h=u16(); w=u16()
    for g in range(8):
        for _ in range(4): f32()
        i32()
    counts=[i32() for _ in range(3)]
    for c in counts:
        for k in range(c): u32()
    oc=[i32() for _ in range(8)]
    return d,pos,magic,ver,pal,h,w,counts,oc
for p in sorted(glob.glob(r'public\assets\levels\1-*.smbl')):
    try:
        d,pos,magic,ver,pal,h,w,counts,oc=parse(p)
        n=sum(oc)
        tail50=pos+50*n; tail52=pos+52*n
        def f4(o): return [round(struct.unpack('<f',d[o+4*j:o+4*j+4])[0],1) for j in range(4)]
        print(os.path.basename(p),'len',len(d),'magic',hex(magic),'ver',ver,'pal',pal[:12],'h,w',h,w,'counts',counts,'oc',oc,'n',n,'objpos',pos)
        print('  at50',tail50,f4(tail50) if tail50+16<=len(d) else None,' at52',tail52,f4(tail52) if tail52+16<=len(d) else None)
    except Exception as e:
        print(os.path.basename(p),'ERR',e)
