import struct,os,sys
from PIL import Image
def parse(path):
    d=open(path,'rb').read(); pos=0
    def rd(n):
        nonlocal pos; v=d[pos:pos+n]; pos+=n; return v
    def u8(): return rd(1)[0]
    def u16(): return struct.unpack('<H',rd(2))[0]
    def u32(): return struct.unpack('<I',rd(4))[0]
    def i32(): return struct.unpack('<i',rd(4))[0]
    def f32(): return struct.unpack('<f',rd(4))[0]
    magic=u32(); ver=u32(); ln=u8(); pal=rd(ln+1); a=i32(); b=i32(); w=u16(); h=u16()
    groups=[]
    for g in range(8):
        groups.append(([f32() for _ in range(4)],i32()))
    counts=[i32() for _ in range(3)]
    layers=[]
    for c in counts:
        cells=[]
        for k in range(c):
            v=u32(); cells += [(v&0x3FFFFF)]*(v>>22)
        layers.append(cells)
    oc=[i32() for _ in range(8)]
    objs=[]; o=pos
    for g,c in enumerate(oc):
        for k in range(c):
            objs.append((g,o)); o+=50
    bounds=list(struct.unpack('<4f',d[o:o+16]))
    return dict(d=d,w=w,h=h,layers=layers,oc=oc,objs=objs,bounds=bounds,magic=magic,groups=groups)
name=os.path.basename(sys.argv[1])
L=parse(os.path.join('public','assets','levels',name))
w,h=L['w'],L['h']
print(name,'width',w,'height',h,'counts',[len(x) for x in L['layers']],'oc',L['oc'],'bounds',[round(x,1) for x in L['bounds']])
S=12
img=Image.new('RGB',(w*S*3+40,h*S),(15,15,15))
px=img.load()
def color(val):
    if val==0: return (15,15,15)
    idx=val&0xfff
    base=[(90,60,40),(110,80,50),(130,100,60),(70,50,30),(60,40,25),(150,120,80),(100,140,80),(70,110,70),(120,120,120),(150,150,150),(80,80,80),(180,180,180)]
    c=base[(idx*7)%len(base)]
    if val&0x4000: c=(min(255,c[0]+40),min(255,c[1]+40),min(255,c[2]+40))
    if val&0x8000: c=(min(255,c[0]+80),c[1],c[2])
    if val&0x2000: c=(c[0],min(255,c[1]+60),c[2])
    if val&0x1000: c=(c[0],c[1],min(255,c[2]+80))
    return c
for li in range(3):
    cells=L['layers'][li]
    ox=li*(w*S+20)
    for i,val in enumerate(cells):
        if val==0: continue
        row=i//w; col=i%w
        x=ox+col*S; y=(h-1-row)*S
        c=color(val)
        for yy in range(S):
            for xx in range(S): px[x+xx,y+yy]=c
for g,o in L['objs']:
    x,y,z=struct.unpack('<fff',L['d'][o:o+12])
    col=(255,0,0) if g==4 else ((0,255,0) if g==2 else ((0,255,255) if g==1 else (255,255,0)))
    cxp=int((x+w*10)/20*S); cyp=int((h*10-y)/20*S)
    for yy in range(-2,3):
        for xx in range(-2,3):
            X=cxp+xx; Y=cyp+yy
            if 0<=X<img.width and 0<=Y<img.height: px[X,Y]=col
img.save('scratch\\map_'+name+'.png')
print('saved',img.size)
