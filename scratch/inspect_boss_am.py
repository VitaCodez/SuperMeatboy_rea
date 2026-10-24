import struct

def inspect_am(path):
    with open(path, 'rb') as f:
        data = f.read()

    pos = 0
    sig = data[pos:pos+4]
    pos += 4
    is_signed = sig in (b'101F', b'001F')

    if is_signed:
        str_len, symbol_count, sig2, ftex_count = struct.unpack('<HIHI', data[pos:pos+12])
        pos += 12
    else:
        sig_val = struct.unpack('<I', sig)[0]
        str_len = sig_val & 0xFFFF
        symbol_count = sig_val >> 16
        more = struct.unpack('<H', data[pos:pos+2])[0]
        symbol_count |= (more << 16)
        pos += 2
        sig2 = struct.unpack('<H', data[pos:pos+2])[0]
        pos += 2
        ftex_count = 0

    print(f"{path}: is_signed={is_signed}, str_len={str_len}, symbol_count={symbol_count}")
    str_data = data[pos:pos+str_len]
    pos += str_len
    strings = [s.decode('latin1') for s in str_data.split(b'\x00') if s]
    print(f"Symbols in {path}:", strings[:15])

inspect_am('public/assets/animations/forestboss.am')
inspect_am('public/assets/animations/boss2.am')
