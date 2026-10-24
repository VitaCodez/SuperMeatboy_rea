import capstone

exe_path = r"C:\Program Files\Epic Games\SuperMeatBoy\SuperMeatBoy.exe"

with open(exe_path, "rb") as f:
    exe = f.read()

# PE Header info
# e_lfanew at 0x3c
lfanew = int.from_bytes(exe[0x3c:0x40], 'little')
image_base = int.from_bytes(exe[lfanew+0x34:lfanew+0x38], 'little')
print(f"Image Base: 0x{image_base:08x}")

# Disassemble around 0x68cdf
# Note: 0x68cdf in file offset. In a standard 32-bit PE, .text usually starts at file offset 0x1000 with RVA 0x1000.
# Let's verify section headers
num_sections = int.from_bytes(exe[lfanew+6:lfanew+8], 'little')
opt_header_size = int.from_bytes(exe[lfanew+20:lfanew+22], 'little')
sec_table = lfanew + 24 + opt_header_size

print(f"Num sections: {num_sections}")
for i in range(num_sections):
    sec = exe[sec_table + i*40 : sec_table + (i+1)*40]
    name = sec[:8].rstrip(b'\x00').decode('latin1')
    vsize = int.from_bytes(sec[8:12], 'little')
    rva = int.from_bytes(sec[12:16], 'little')
    raw_size = int.from_bytes(sec[16:20], 'little')
    raw_ptr = int.from_bytes(sec[20:24], 'little')
    print(f"Section {name}: RVA 0x{rva:08x}, Raw 0x{raw_ptr:08x} - 0x{raw_ptr+raw_size:08x}")

# Disassemble 0x68cc0 to 0x68e00
cs = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
code = exe[0x68cc0:0x68e00]
print("\n--- Disassembly around 0x68cc0 ---")
for ins in cs.disasm(code, 0x68cc0):
    print(f"0x{ins.address:06x}: {ins.mnemonic} {ins.op_str}")
