import struct
p=r'public\assets\levels\1-1.smbl'
d=open(p,'rb').read()
pos=8
def u8():
    global pos; v=d[pos]; pos+=1; return v
def u16():
    global pos; v=struct.unpack('<H',d[pos:pos+2])[0]; pos+=2; return v
def i32():
    global pos; v=struct.unpack('<i',d[pos:pos+4])[0]; pos+=4; return v
def f32():
    global pos; v=struct.unpack('<f',d[pos:pos+4])[0]; pos+=4; return v
print('flag',hex(u8()))
blob=d[pos:pos+256]; pos+=256
print('blob dwords 0..64:')
for i in range(0,64,4):
    print(i, struct.unpack('<I',blob[i:i+4])[0], struct.unpack('<f',blob[i:i+4])[0])
print('after blob pos',pos)
print('A',i32(),'B',i32())
print('w?',u16(),'h?',u16())
for g in range(7):
    vals=[i32() for _ in range(4)]
    extra=i32()
    print('group',g,vals,extra)
print('three ints',[i32() for _ in range(3)])
print('pos now',pos)
for layer in range(3):
    cnt=i32(); print('layer',layer,'count',cnt,'at',pos-4)
    if 0<cnt<10000:
        vals=struct.unpack('<%di'%min(cnt,40),d[pos:pos+4*min(cnt,40)])
        print('  first',vals)
        pos+=4*cnt
    else: break
print('pos after layers',pos)
