import struct

with open(r'C:\Program Files\Epic Games\SuperMeatBoy\SuperMeatBoy.exe', 'rb') as f:
    data = f.read()

vtable_va = 0x683c14
vtable_off = (vtable_va - 0x400000 - 0x27a000) + 0x278800

print(f"Vtable at offset {hex(vtable_off)} (VA {hex(vtable_va)}):")
for i in range(16):
    func_va = struct.unpack('<I', data[vtable_off + i*4 : vtable_off + (i+1)*4])[0]
    func_off = (func_va - 0x400000 - 0x1000) + 0x400 if func_va < 0x67a000 else 0
    print(f"  vtable[{i}]: VA {hex(func_va)}, file offset {hex(func_off)}")
