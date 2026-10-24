import struct, capstone, re
EXE=r'C:\Program Files\Epic Games\SuperMeatBoy\SuperMeatBoy.exe'
d=open(EXE,'rb').read()
sections=[('.text',0x1000,0x278400,0x400),('.rdata',0x27a000,0x75200,0x278800),('.data',0x2f0000,0x12e00,0x2eda00),('_RDATA',0x30d000,0x600,0x300800),('.rsrc',0x30e000,0x4f000,0x300e00),('.reloc',0x35d000,0x24400,0x34fe00)]
def va2off(va):
    for n,v,r,o in sections:
        if v<=va<v+r: return o+(va-v)
    return None
def rdstr(va, maxlen=60):
    off=va2off(va)
    if off is None: return None
    b=d[off:off+maxlen]
    if not b or b[0]<32 or b[0]>126: return None
    end=b.find(b'\x00')
    if end<4: return None
    try: s=b[:end].decode('utf-8')
    except: return None
    if re.fullmatch(r'[\x20-\x7e]+', s): return s
    return None
md=capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
md.detail=True
md.skipdata=True
start=0x68240; end=0x69000
off=va2off(start)
code=d[off:va2off(end)]
for ins in md.disasm(code, start):
    ann=''
    if ins.id==0:
        print("%08x  %-24s %s %s"%(ins.address, ins.bytes.hex(), ins.mnemonic, ins.op_str)); continue
    for op in ins.operands:
        if op.type==capstone.x86.X86_OP_MEM and op.mem.base==0 and op.mem.index==0:
            s=rdstr(op.mem.disp)
            if s: ann += ' ; \"%s\"'%s
        elif op.type==capstone.x86.X86_OP_IMM:
            s=rdstr(op.imm)
            if s: ann += ' ; \"%s\"'%s
    print('%08x  %-24s %s %s%s'%(ins.address, ins.bytes.hex(), ins.mnemonic, ins.op_str, ann))
