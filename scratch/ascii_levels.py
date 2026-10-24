from PIL import Image
import numpy as np

def describe_img(idx):
    im = Image.open(f'scratch/ch1_levels/lvl_{idx:02d}.png').convert('RGB')
    w, h = im.size
    # Downsample to grid of 32 x 18 blocks
    thumb = im.resize((32, 18), Image.Resampling.BILINEAR)
    arr = np.array(thumb)
    
    # Analyze brightness / color in 32x18 grid
    # SMB Forest tiles are dark greenish/brown, background is lighter
    grid_str = []
    for y in range(18):
        row = []
        for x in range(32):
            r, g, b = arr[y, x]
            # Meat boy is red
            if r > 150 and g < 70 and b < 70:
                row.append('M')
            # Bandage girl is pink
            elif r > 180 and g > 110 and b > 140:
                row.append('B')
            # Solid tiles are dark (brightness < 65)
            elif (int(r)+int(g)+int(b)) // 3 < 65:
                row.append('#')
            else:
                row.append('.')
        grid_str.append(''.join(row))
    return '\n'.join(grid_str)

for i in range(1, 11):
    print(f"\n--- Level {i:02d} ASCII approx ---")
    print(describe_img(i))
