from PIL import Image
import os
import numpy as np

# In scratch/ch1_frames, frames are f_0000.png to f_0199.png
# Let's inspect frames between 30 and 40 to find level 1-11
for i in range(32, 42):
    fn = f"scratch/ch1_frames/f_{i:04d}.png"
    im = Image.open(fn).convert('RGB')
    arr = np.array(im)
    print(f"Frame {i:03d} (00:{i:02d}): brightness = {arr.mean():.1f}")
