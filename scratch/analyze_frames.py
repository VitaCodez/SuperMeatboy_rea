from PIL import Image
import os
import numpy as np

frames_dir = 'scratch/video_frames'
files = sorted([f for f in os.listdir(frames_dir) if f.endswith('.png')])

for idx, f in enumerate(files):
    sec = idx * 5
    path = os.path.join(frames_dir, f)
    img = Image.open(path)
    # Check top/bottom colors or mean intensity
    arr = np.array(img)
    mean_color = arr.mean(axis=(0, 1))
    print(f"Frame {idx+1:03d} (t={sec:3d}s) {f}: size={img.size} mean_rgb=({mean_color[0]:.1f}, {mean_color[1]:.1f}, {mean_color[2]:.1f})")
