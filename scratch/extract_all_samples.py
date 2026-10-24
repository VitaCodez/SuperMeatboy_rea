import subprocess
import os

os.makedirs('scratch/all_chapter_samples', exist_ok=True)

# Sample 1 frame every 10 seconds across the entire 19m22s video (1162 seconds)
cmd = [
    'ffmpeg', '-y', '-i', 'scratch/playthrough_360p.mp4',
    '-vf', 'fps=1/10', # 1 frame every 10 seconds
    'scratch/all_chapter_samples/f_%04d.png'
]
subprocess.run(cmd, check=True)
count = len(os.listdir('scratch/all_chapter_samples'))
print(f"Extracted {count} samples across the whole playthrough.")
