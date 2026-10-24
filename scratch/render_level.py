import struct,glob,os
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
    magic=u32(); ver=u32(); ln=u8(); pal=rd(ln+1)
    a=i32(); b=i32(); h=u16(); w=u16()
    for g in range(8):
        for _ in range(4): f32()
        i32()
    counts=[i32() for _ in range(3)]
    layers=[]
    for c in counts:
        runs=[]
        for k in range(c):
            v=u32(); runs.append((v>>22,(v>>16)&0x3f,v&0xffff))
        layers.append(runs)
    oc=[i32() for _ in range(8)]
    return d,pos,magic,ver,h,w,layers,oc
def expand(runs):
    out=[]
    for run,tid,par in runs: out += [(tid,par)]*run
    return out
name=os.path.basename(sys.argv[1]) if False else '1-10.smbl'
d,pos,magic,ver,h,w,layers,oc=parse(os.path.join('public','assets','levels',name))
print(name,'h,w',h,w,'counts',[len(x) for x in layers],'sums',[sum(r for r,_,_ in x) for x in layers],'oc',oc)
cols={0:(30,30,30),1:(80,80,80),2:(120,120,120),3:(160,160,160),4:(200,200,200),5:(220,180,120),6:(180,220,120),7:(120,220,180),8:(120,180,220),9:(180,120,220),10:(220,120,180),11:(255,255,255)}
S=16; H=h*S; W=w*S
img=Image.new('RGB',(W*3+40,H),(20,20,20)); dr=ImageDraw.Draw(img)
for li in range(3):
    cells=expand(layers[li])
    for i,(tid,par) in enumerate(cells):
        row=i//w; col=i%w
        x=li*(W+20)+col*S; y=(h-1-row)*S
        c=cols.get(tid,(255,0,255))
        dr.rectangle([x,y,x+S-1,y+S-1],fill=c)
        if tid!=0 and S>=16:
            dr.text((x+3,y+2),str(tid),fill=(0,0,0))
    dr.text((li*(W+20)+4,4),'layer %d'%li,fill=(255,255,0))
img.save('scratch\\render_'+name+'.png')
print('saved',img.size)
