import capstone

exe_path = r"C:\Program Files\Epic Games\SuperMeatBoy\SuperMeatBoy.exe"
with open(exe_path, "rb") as f:
    exe = f.read()

cs = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
# Disassemble 0x95b80 (RVA 0x95b80 -> in .text, RVA 0x1000 is Raw 0x400, so offset is 0x95b80 - 0x1000 + 0x400 = 0x94f80)
# Wait, let's find file offset of RVA 0x95b80
# From earlier: Section .text: RVA 0x00001000, Raw 0x00000400
offset = 0x95b80 - 0x1000 + 0x400
print(f"RVA 0x95b80 -> File offset 0x{offset:x}")

code = exe[offset:offset+60]
for ins in cs.disasm(code, 0x95b80):
    print(f"0x{ins.address:06x}: {ins.mnemonic:<8} {ins.op_str}")
