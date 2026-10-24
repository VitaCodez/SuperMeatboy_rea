from PIL import Image
import numpy as np

def describe_img(idx):
    fn = f'scratch/ch1_levels/lvl_{idx:02d}.png'
    im = Image.open(fn).convert('RGB')
    thumb = im.resize((32, 18), Image.Resampling.BILINEAR)
    arr = np.array(thumb)
    
    grid_str = []
    for y in range(18):
        row = []
        for x in range(32):
            r, g, b = arr[y, x]
            if (int(r)+int(g)+int(b)) // 3 < 60:
                row.append('#')
            else:
                row.append('.')
        grid_str.append(''.join(row))
    return '\n'.join(grid_str)

for i in range(11, 21):
    print(f"\n--- Level {i:02d} ---")
    print(describe_img(i))
