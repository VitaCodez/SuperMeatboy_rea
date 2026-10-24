from PIL import Image
import numpy as np

def analyze_frame(level_idx, img_path):
    im = Image.open(img_path).convert('RGB')
    arr = np.array(im)
    h, w, _ = arr.shape
    
    # Meat boy color is reddish: R > 150, G < 60, B < 60
    mb_mask = (arr[:, :, 0] > 140) & (arr[:, :, 1] < 60) & (arr[:, :, 2] < 60)
    mb_pts = np.argwhere(mb_mask)
    mb_pos = None
    if len(mb_pts) > 5:
        mb_pos = (float(mb_pts[:, 1].mean()), float(mb_pts[:, 0].mean()))
    
    # Bandage girl is pink: R > 200, G > 120, B > 140
    bg_mask = (arr[:, :, 0] > 180) & (arr[:, :, 1] > 100) & (arr[:, :, 1] < 180) & (arr[:, :, 2] > 140)
    bg_pts = np.argwhere(bg_mask)
    bg_pos = None
    if len(bg_pts) > 5:
        bg_pos = (float(bg_pts[:, 1].mean()), float(bg_pts[:, 0].mean()))
        
    print(f"Level {level_idx:02d}: size={w}x{h}, MeatBoy={mb_pos}, BandageGirl={bg_pos}")

for i in range(1, 11):
    analyze_frame(i, f"scratch/ch1_levels/lvl_{i:02d}.png")
