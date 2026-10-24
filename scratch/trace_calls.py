import capstone

exe_path = r"C:\Program Files\Epic Games\SuperMeatBoy\SuperMeatBoy.exe"
with open(exe_path, "rb") as f:
    exe = f.read()

cs = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
# Function starts around 0x68cd0 and goes to 0x69500
code = exe[0x68cd0:0x69550]
insns = list(cs.disasm(code, 0x68cd0))

# Print calls to 0x95ab0, 0x95b80 or memory copies
for i, ins in enumerate(insns):
    if ins.mnemonic == 'call':
        target = ins.op_str
        # look at previous pushes
        prev_pushes = []
        for j in range(max(0, i-6), i):
            if insns[j].mnemonic == 'push':
                prev_pushes.append(insns[j].op_str)
        print(f"0x{ins.address:06x}: CALL {target} | pushes: {prev_pushes}")
