import struct
import json
import traceback
import sys

def parse_am(file_path):
    print(f"Reading {file_path}...", flush=True)
    with open(file_path, 'rb') as f:
        data = f.read()

    pos = 0
    sig = data[pos:pos+4]
    pos += 4

    is_signed = False
    if sig in (b'101F', b'001F'):
        is_signed = True
        str_len, symbol_count, sig2, ftex_count = struct.unpack('<HIHI', data[pos:pos+12])
        pos += 12
        assert sig2 == 0x41F0
    else:
        sig_val = struct.unpack('<I', sig)[0]
        str_len = sig_val & 0xFFFF
        symbol_count = sig_val >> 16
        more = struct.unpack('<H', data[pos:pos+2])[0]
        symbol_count |= (more << 16)
        pos += 2
        sig2 = struct.unpack('<H', data[pos:pos+2])[0]
        pos += 2
        assert sig2 == 0x41F0
        ftex_count = 0

    print(f"Header: is_signed={is_signed}, str_len={str_len}, symbol_count={symbol_count}, ftex_count={ftex_count}", flush=True)

    # Parse string table
    str_data = data[pos:pos+str_len]
    pos += str_len
    strings = []
    curr = 0
    total_names = symbol_count + ftex_count
    for _ in range(total_names):
        end = str_data.find(b'\x00', curr)
        if end == -1:
            break
        strings.append(str_data[curr:end].decode('ascii', errors='ignore'))
        curr = end + 1

    symbols = {}
    for i in range(symbol_count):
        sym_name = strings[i] if i < len(strings) else f'sym_{i}'
        print(f"Parsing symbol {i}: {sym_name} at pos {pos}", flush=True)
        data_val = struct.unpack('<I', data[pos:pos+4])[0]
        pos += 4
        loop = bool(data_val & 1)
        layer_count = data_val >> 1
        
        ign1, ign2 = struct.unpack('<ff', data[pos:pos+8])
        pos += 8

        # Unknowns per layer
        for _ in range(layer_count):
            pos += 4

        layers = []
        for l in range(layer_count):
            zero_val = struct.unpack('<I', data[pos:pos+4])[0]
            pos += 4

            kf_count = struct.unpack('<I', data[pos:pos+4])[0]
            pos += 4

            duration = struct.unpack('<f', data[pos:pos+4])[0]
            pos += 4

            if is_signed:
                ff1, ff2, ff3 = struct.unpack('<III', data[pos:pos+12])
                pos += 12

            keyframes = []
            for k in range(kf_count):
                tex_id, xpos, ypos, xscale, yscale, xskew, yskew, xoff, yoff = struct.unpack('<Iffffffff', data[pos:pos+36])
                pos += 36
                r, ri, g, gi, b, bi, a, ai = struct.unpack('<hhhhhhhh', data[pos:pos+16])
                pos += 16
                zero_end = struct.unpack('<I', data[pos:pos+4])[0]
                pos += 4

                keyframes.append({
                    'texture_id': tex_id,
                    'x': xpos,
                    'y': ypos,
                    'scale_x': xscale,
                    'scale_y': yscale,
                    'skew_x': xskew,
                    'skew_y': yskew,
                    'offset_x': xoff,
                    'offset_y': yoff,
                    'color': {'r': r, 'ri': ri, 'g': g, 'gi': gi, 'b': b, 'bi': bi, 'a': a, 'ai': ai}
                })
            layers.append({
                'duration': duration,
                'keyframes': keyframes
            })

        symbols[sym_name] = {
            'index': i,
            'name': sym_name,
            'loop': loop,
            'ign1': ign1,
            'ign2': ign2,
            'layers': layers
        }

    print(f"Finished parsing {len(symbols)} symbols. Ending pos: {pos} / {len(data)}", flush=True)
    return {
        'is_signed': is_signed,
        'string_table_size': str_len,
        'symbol_count': symbol_count,
        'ftex_count': ftex_count,
        'strings': strings,
        'symbols': symbols
    }

try:
    res_obs = parse_am('public/assets/animations/obstacles.am')
    print("Writing scratch/obstacles_parsed.json...", flush=True)
    with open('scratch/obstacles_parsed.json', 'w') as out:
        json.dump(res_obs, out, indent=2)
    print("Saved scratch/obstacles_parsed.json successfully!", flush=True)
except Exception as e:
    traceback.print_exc(file=sys.stdout)
    sys.stdout.flush()
