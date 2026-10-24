import capstone

exe_path = r"C:\Program Files\Epic Games\SuperMeatBoy\SuperMeatBoy.exe"
with open(exe_path, "rb") as f:
    exe = f.read()

cs = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
code = exe[0x68dc0:0x68f00]
print("--- Disassembly 0x68dc0 to 0x68f00 ---")
for ins in cs.disasm(code, 0x68dc0):
    print(f"0x{ins.address:06x}: {ins.mnemonic:<8} {ins.op_str}")
