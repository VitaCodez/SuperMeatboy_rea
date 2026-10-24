import os
from PIL import Image
import numpy as np

frames_dir = 'scratch/ch1_frames'
files = sorted([f for f in os.listdir(frames_dir) if f.endswith('.png')])

print(f"Total frames: {len(files)}")

prev_arr = None
transitions = []

for idx, f in enumerate(files):
    path = os.path.join(frames_dir, f)
    im = Image.open(path).convert('RGB')
    arr = np.array(im, dtype=np.float32)
    
    # Check if mostly black (screen wipe)
    mean_val = arr.mean()
    
    if prev_arr is not None:
        diff = np.abs(arr - prev_arr).mean()
        if diff > 35 or mean_val < 5:
            mins = idx // 60
            secs = idx % 60
            transitions.append((idx, f"{mins:02d}:{secs:02d}", diff, mean_val))
    prev_arr = arr

print("Major scene transitions / black frames:")
for t in transitions:
    print(f"Frame {t[0]:03d} ({t[1]}): diff={t[2]:.1f}, brightness={t[3]:.1f}")
