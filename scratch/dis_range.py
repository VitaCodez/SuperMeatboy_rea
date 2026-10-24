import capstone, sys

EXE = r'C:\Program Files\Epic Games\SuperMeatBoy\SuperMeatBoy.exe'
d = open(EXE, 'rb').read()
sections = [
    ('.text', 0x1000, 0x278400, 0x400),
    ('.rdata', 0x27a000, 0x75200, 0x278800),
    ('.data', 0x2f0000, 0x12e00, 0x2eda00),
    ('_RDATA', 0x30d000, 0x600, 0x300800),
    ('.rsrc', 0x30e000, 0x4f000, 0x300e00),
    ('.reloc', 0x35d000, 0x24400, 0x34fe00),
]


def va2off(va):
    for n, v, r, o in sections:
        if v <= va < v + r:
            return o + (va - v)


start = int(sys.argv[1], 16)
end = int(sys.argv[2], 16)
md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
md.skipdata = True
for ins in md.disasm(d[va2off(start):va2off(end)], start):
    print('%08x  %-20s %s %s' % (ins.address, ins.bytes.hex(), ins.mnemonic, ins.op_str))
