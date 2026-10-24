import struct
d=open(r'public\assets\levels\1-1.smbl','rb').read()
def fl(o): return struct.unpack('<f',d[o:o+4])[0]
def i(o): return struct.unpack('<i',d[o:o+4])[0]
counts=[26,16,2,9,2,0,16,0]
o=2125
for g,c in enumerate(counts):
    print('=== group',g,'count',c)
    for k in range(c):
        x,y,z,w,h=fl(o),fl(o+4),fl(o+8),fl(o+12),fl(o+16)
        A,B,C,D=i(o+20),i(o+24),i(o+28),i(o+32)
        E,F,G,H=fl(o+36),fl(o+40),fl(o+44),fl(o+48)
        print(' %2d %7.2f %7.2f z=%6.1f w=%5.1f h=%5.1f A=%d B=%d C=%d D=%d E=%.2f F=%.2f G=%.2f H=%.2f'%(k,x,y,z,w,h,A,B,C,D,E,F,G,H))
        o+=50
print('end',o,'bounds',[round(fl(o+4*j),2) for j in range(4)])
