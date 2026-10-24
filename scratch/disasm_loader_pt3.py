import capstone

exe_path = r"C:\Program Files\Epic Games\SuperMeatBoy\SuperMeatBoy.exe"
with open(exe_path, "rb") as f:
    exe = f.read()

cs = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
# Let's disassemble from 0x69280 to 0x69500
code = exe[0x69250:0x69500]
print("--- Disassembly 0x69250 to 0x69500 ---")
for ins in cs.disasm(code, 0x69250):
    print(f"0x{ins.address:06x}: {ins.mnemonic:<8} {ins.op_str}")
