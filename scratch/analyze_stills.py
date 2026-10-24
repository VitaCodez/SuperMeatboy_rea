import os
from PIL import Image
import numpy as np

# Let's inspect each level frame from 1 to 21
for i in range(1, 22):
    fn = f"scratch/ch1_levels/lvl_{i:02d}.png"
    if os.path.exists(fn):
        im = Image.open(fn).convert('RGB')
        arr = np.array(im)
        print(f"Level {i:02d}: Image shape {arr.shape}, mean color {arr.mean(axis=(0,1)).round(1)}")

