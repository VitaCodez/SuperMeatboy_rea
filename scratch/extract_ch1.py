import subprocess
import os
import json
from PIL import Image
import numpy as np

# We have scratch/playthrough_360p.mp4
# Let's extract frames across Chapter 1 (0 to 180s) and find the levels
os.makedirs('scratch/ch1_frames', exist_ok=True)
cmd = [
    'ffmpeg', '-y', '-ss', '0', '-to', '200',
    '-i', 'scratch/playthrough_360p.mp4',
    '-vf', 'fps=1', # 1 frame per second
    'scratch/ch1_frames/f_%04d.png'
]
subprocess.run(cmd, check=True)
files = sorted([f for f in os.listdir('scratch/ch1_frames') if f.endswith('.png')])
print(f"Extracted {len(files)} frames for Chapter 1")
