import struct

def inspect_records(filepath):
    with open(filepath, 'rb') as f:
        buf = f.read()

    # Find 100 and 35 (or level width and height)
    # Search for pattern: [W, 0, 0, 0, H, 0, 0, 0]
    for i in range(16, 100):
        w, h = struct.unpack('<II', buf[i:i+8])
        if (w == 100 or w == 40 or w == 60) and (h == 35 or h == 60 or h == 53 or h == 42 or h == 22 or h == 30):
            print(f"\n{filepath}: Found Width={w}, Height={h} at offset 0x{i:x} ({i})")
            counts = struct.unpack('<8I', buf[i+8:i+40])
            print(f"8 Layer counts: {counts}")
            
            # Now let's inspect the data right after the counts
            cur = i + 40
            for layer_idx, count in enumerate(counts):
                print(f"  Layer {layer_idx}: {count} items at offset 0x{cur:x} ({cur})")
                if count > 0:
                    # Let's inspect the first 2 items of this layer
                    # Let's see what record size could be
                    chunk = buf[cur:cur+min(64, len(buf)-cur)]
                    print(f"    Raw bytes: {' '.join(f'{b:02x}' for b in chunk[:32])}")
                    # Try reading as floats or ints
                    fvals = struct.unpack(f'<{min(8, len(chunk)//4)}f', chunk[:min(32, len(chunk)//4 * 4)])
                    ivals = struct.unpack(f'<{min(8, len(chunk)//4)}I', chunk[:min(32, len(chunk)//4 * 4)])
                    print(f"    As floats: {[round(x, 2) for x in fvals]}")
                    print(f"    As ints:   {list(ivals)}")
                    # Advance dummy or break
                # For now just break to analyze
            break

inspect_records('public/assets/levels/1-1.smbl')
inspect_records('public/assets/levels/1-2.smbl')
inspect_records('public/assets/levels/1-3.smbl')
