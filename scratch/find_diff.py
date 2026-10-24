with open('public/assets/levels/1-1.smbl', 'rb') as f1, open('public/assets/levels/1-2.smbl', 'rb') as f2:
    b1 = f1.read()
    b2 = f2.read()

print(f"1-1 len={len(b1)}, 1-2 len={len(b2)}")
for i in range(min(len(b1), len(b2))):
    if b1[i] != b2[i]:
        print(f"First diff at byte {i} (0x{i:x}): b1=0x{b1[i]:02x}, b2=0x{b2[i]:02x}")
        # print context
        print(f"Context 1-1: {' '.join(f'{b:02x}' for b in b1[max(0, i-8):i+16])}")
        print(f"Context 1-2: {' '.join(f'{b:02x}' for b in b2[max(0, i-8):i+16])}")
        break
