from PIL import Image
import os

os.makedirs('scratch/level_stills', exist_ok=True)
# Save frames at gameplay moments
# Frame 007 is 1-1
# Frame 009 is 1-2
# Frame 011 is 1-3
# Frame 013 is 1-4
# Frame 015 is 1-5
# Frame 017 is 1-6
# Frame 020 is 1-7
# Frame 022 is 1-8
# Let's save frames 6 through 90
for i in range(5, 95):
    src = f"scratch/ch1_frames/f_{i:04d}.png"
    if os.path.exists(src):
        dst = f"scratch/level_stills/f_{i:04d}.png"
        im = Image.open(src)
        im.save(dst)

print("Saved level stills 5 to 94")
