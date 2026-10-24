import struct

for fn in ['1-1.smbl', '1-2.smbl', '1-3.smbl']:
    with open(f'public/assets/levels/{fn}', 'rb') as f:
        buf = f.read()
    # find 100, 35
    idx = buf.find(b'\x64\x00\x00\x00\x23\x00\x00\x00')
    print(f"\n{fn} at offset 0x{idx:x}:")
    ints = struct.unpack('<16I', buf[idx:idx+64])
    print(f"  Ints: {ints}")
