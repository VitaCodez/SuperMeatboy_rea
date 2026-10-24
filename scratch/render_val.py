import struct,os,sys
from PIL import Image, ImageDraw
def parse(path):
    d=open(path,'rb').read(); pos=0
    def rd(n):
        nonlocal pos; v=d[pos:pos+n]; pos+=n; return v
    def u8(): return rd(1)[0]
    def u16(): return struct.unpack('<H',rd(2))[0]
    def u32(): return struct.unpack('<I',rd(4))[0]
    def i32(): return struct.unpack('<i',rd(4))[0]
    def f32(): return struct.unpack('<f',rd(4))[0]
    magic=u32(); ver=u32(); ln=u8(); pal=rd(ln+1); a=i32(); b=i32(); h=u16(); w=u16()
    groups=[]
    for g in range(8):
        groups.append(([f32() for _ in range(4)],i32()))
    counts=[i32() for _ in range(3)]
    layers=[]
    for c in counts:
        runs=[]
        for k in range(c):
            v=u32(); runs.append((v>>22,v&0x3FFFFF))
        layers.append(runs)
    oc=[i32() for _ in range(8)]
    objs=[]; o=pos
    for g,c in enumerate(oc):
        for k in range(c):
            objs.append((g,o)); o+=50
    bounds=list(struct.unpack('<4f',d[o:o+16])) if o+16<=len(d) else None
    return dict(d=d,h=h,w=w,layers=layers,oc=oc,objs=objs,bounds=bounds,magic=magic,groups=groups)
def expand(runs):
    out=[]
    for run,val in runs: out += [val]*run
    return out
name=os.path.basename(sys.argv[1])
L=parse(os.path.join('public','assets','levels',name))
h,w=L['h'],L['w']; layers=L['layers']
print(name,'h,w',h,w,'sums',[sum(r for r,_ in x) for x in layers],'oc',L['oc'],'bounds',L['bounds'])
palette=[(0,0,0),(60,60,60),(90,90,90),(120,120,120),(150,150,150),(180,180,180),(200,160,100),(120,200,120),(100,180,220),(180,120,220),(220,120,180),(255,255,0),(255,120,0),(120,255,255),(255,0,0),(0,255,0)]
S=14; H=h*S; W=w*S
img=Image.new('RGB',(W*3+40,H),(15,15,15)); dr=ImageDraw.Draw(img)
for li in range(3):
    cells=expand(layers[li])
    for i,val in enumerate(cells):
        row=i//w; col=i%w
        if val==0: continue
        x=li*(W+20)+col*S; y=(h-1-row)*S
        c=palette[(val>>12)&0xf]
        if val&0x8000: c=(255,0,255)
        elif val&0x4000: c=(0,255,0)
        elif val&0x2000: c=(0,128,255)
        elif val&0x1000: c=(255,255,0)
        dr.rectangle([x,y,x+S-1,y+S-1],fill=c)
    dr.text((li*(W+20)+4,4),'layer %d'%li,fill=(255,255,0))
# overlay objects on layer 0 panel: world -400..400 x, -380..380 y? use tile size 20 and h,w extents
for g,o in L['objs']:
    x,y,z=struct.unpack('<fff',L['d'][o:o+12])
    col=(255,0,0) if g==4 else ((255,255,0) if g==2 else (0,255,255))
    # assume x in [-w*10, w*10], y in [-h*10, h*10]
    px=(x+w*10)/20*S; py=(h*10-y)/20*S
    dr.ellipse([px-3,py-3,px+3,py+3],outline=col,width=2)
img.save('scratch\\val_'+name+'.png')
print('saved',img.size)
