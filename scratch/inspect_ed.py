import struct

def inspect_around_ed(filepath):
    with open(filepath, 'rb') as f:
        buf = f.read()
    print(f"\n{filepath} around 0xed:")
    # print bytes from 0xdb to 0x140
    for i in range(0xd8, 0x180, 16):
        chunk = buf[i:i+16]
        hex_s = ' '.join(f'{b:02x}' for b in chunk)
        print(f"  0x{i:04x}: {hex_s}")

inspect_around_ed('public/assets/levels/1-1.smbl')
inspect_around_ed('public/assets/levels/1-2.smbl')
