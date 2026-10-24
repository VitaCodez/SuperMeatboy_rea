import struct, glob, os, sys
def parse(path):
    d=open(path,'rb').read(); pos=0
    def rd(n):
        nonlocal pos; v=d[pos:pos+n]; pos+=n; return v
    def u8(): return rd(1)[0]
    def u16(): return struct.unpack('<H',rd(2))[0]
    def u32(): return struct.unpack('<I',rd(4))[0]
    def i32(): return struct.unpack('<i',rd(4))[0]
    def f32(): return struct.unpack('<f',rd(4))[0]
    magic=u32(); ver=u32()
    ln=u8(); pal=rd(ln+1)
    a=i32(); b=i32()
    h=u16(); w=u16()   # +0x20 height? +0x22 width?
    groups=[]
    for g in range(8):
        vals=[f32() for _ in range(4)]; extra=i32(); groups.append((vals,extra))
    counts=[i32() for _ in range(3)]
    layers=[]; raws=[]
    for c in counts:
        grid=[]
        for k in range(c):
            v=u32(); run=v>>22; tile=(v>>16)&0x3f; prm=v&0xffff
            grid.extend([(tile,prm,v)]*run)
        layers.append(grid)
    objcounts=[i32() for _ in range(8)]
    return dict(magic=magic,ver=ver,pal=pal,a=a,b=b,w=w,h=h,groups=groups,counts=counts,layers=layers,objcounts=objcounts,pos=pos,d=d,len=len(d))

if __name__=='__main__':
    L=parse(sys.argv[1] if len(sys.argv)>1 else r'public\assets\levels\1-1.smbl')
    print('w,h',L['w'],L['h'],'counts',L['counts'],'objs',L['objcounts'],'pos',L['pos'],'len',L['len'])
    chars='.123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for li in range(3):
        gr=L['layers'][li]
        print('=== layer',li)
        for row in range(L['h']-1,-1,-1):
            line=''
            for col in range(L['w']):
                i=row*L['w']+col
                t=gr[i][0] if i<len(gr) else 0
                line+=chars[t] if t<len(chars) else '?'
            print('%2d %s'%(row,line))
