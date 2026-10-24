import capstone

with open(r'C:\Program Files\Epic Games\SuperMeatBoy\SuperMeatBoy.exe', 'rb') as f:
    data = f.read()

def disasm_func(va, size=600):
    off = (va - 0x400000 - 0x1000) + 0x400
    code = data[off : off + size]
    md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
    print(f"\n--- Disassembly of {hex(va)} (offset {hex(off)}) ---")
    for insn in md.disasm(code, va):
        print(f"0x{insn.address:x}: {insn.mnemonic:7s} {insn.op_str}")
        if insn.mnemonic in ('ret', 'retf') and insn.address > va + 10:
            break

print("=== ForestBoss::Update (0x52bb20) ===")
disasm_func(0x52bb20, 1000)

print("\n=== ForestBoss::TakeDamage / Phase (0x52b9f0) ===")
disasm_func(0x52b9f0, 400)
