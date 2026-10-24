import os
import subprocess

os.makedirs('scratch/ch1_levels', exist_ok=True)

# In scratch/ch1_frames, we have f_0001.png to f_0200.png (1 fps)
# Let's inspect the progression:
# Let's check frames around:
# 1-1: f_0006.png - f_0008.png
# 1-2: f_0009.png - f_0010.png
# 1-3: f_0011.png - f_0012.png
# 1-4: f_0013.png - f_0014.png
# 1-5: f_0015.png - f_0017.png
# 1-6: f_0018.png - f_0020.png
# 1-7: f_0021.png - f_0023.png
# 1-8: f_0024.png - f_0026.png
# 1-9: f_0027.png - f_0030.png
# 1-10: f_0031.png - f_0033.png
# 1-11: f_0034.png - f_0036.png
# 1-12: f_0037.png - f_0040.png
# 1-13: f_0041.png - f_0044.png
# 1-14: f_0045.png - f_0048.png
# 1-15: f_0049.png - f_0052.png
# 1-16: f_0053.png - f_0056.png
# 1-17: f_0057.png - f_0064.png
# 1-18: f_0065.png - f_0068.png
# 1-19: f_0069.png - f_0073.png
# 1-20: f_0074.png - f_0082.png
# Boss: f_0085.png - f_0120.png

print("Mapping candidates ready")
