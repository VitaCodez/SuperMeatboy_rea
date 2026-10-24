with open(r'C:\Program Files\Epic Games\SuperMeatBoy\SuperMeatBoy.exe', 'rb') as f:
    data = f.read()

def get_str(va):
    off = (va - 0x400000 - 0x27a000) + 0x278800
    end = data.find(b'\x00', off)
    return data[off:end].decode('latin1', errors='replace')

for va in [0x683c58, 0x683c70, 0x683c78, 0x683c80, 0x683c8c, 0x683c98, 0x683ca4, 0x682698]:
    print(f'{hex(va)}: "{get_str(va)}"')
