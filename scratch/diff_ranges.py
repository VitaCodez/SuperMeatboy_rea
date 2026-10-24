with open('public/assets/levels/1-1.smbl', 'rb') as f1, open('public/assets/levels/1-2.smbl', 'rb') as f2:
    b1 = f1.read()
    b2 = f2.read()

diff_ranges = []
in_diff = False
start = 0

for i in range(min(len(b1), len(b2))):
    diff = (b1[i] != b2[i])
    if diff and not in_diff:
        in_diff = True
        start = i
    elif not diff and in_diff:
        in_diff = False
        diff_ranges.append((start, i))

if in_diff:
    diff_ranges.append((start, min(len(b1), len(b2))))

print(f"Total diff segments: {len(diff_ranges)}")
for s, e in diff_ranges[:15]:
    print(f"Diff from 0x{s:x} to 0x{e:x} (len {e-s}):")
    print(f"  1-1: {' '.join(f'{b:02x}' for b in b1[s:min(s+16, e)])}")
    print(f"  1-2: {' '.join(f'{b:02x}' for b in b2[s:min(s+16, e)])}")
