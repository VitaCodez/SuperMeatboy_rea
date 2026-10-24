import os
from PIL import Image

os.makedirs('scratch/ch1_levels', exist_ok=True)

candidates = [
    (1, "1-1: Hello World", "scratch/ch1_frames/f_0007.png"),
    (2, "1-2: Upward", "scratch/ch1_frames/f_0009.png"),
    (3, "1-3: The Gap", "scratch/ch1_frames/f_0011.png"),
    (4, "1-4: Nutshell", "scratch/ch1_frames/f_0013.png"),
    (5, "1-5: Holy Mountain", "scratch/ch1_frames/f_0016.png"),
    (6, "1-6: Bladecatcher", "scratch/ch1_frames/f_0018.png"),
    (7, "1-7: Diverge", "scratch/ch1_frames/f_0020.png"),
    (8, "1-8: The Bit", "scratch/ch1_frames/f_0022.png"),
    (9, "1-9: Safety Third", "scratch/ch1_frames/f_0028.png"),
    (10, "1-10: The Levee", "scratch/ch1_frames/f_0032.png"),
    (11, "1-11: Fired", "scratch/ch1_frames/f_0036.png"),
    (12, "1-12: Revolve", "scratch/ch1_frames/f_0038.png"),
    (13, "1-13: Tommy's Cabin", "scratch/ch1_frames/f_0042.png"),
    (14, "1-14: Blood Mountain", "scratch/ch1_frames/f_0046.png"),
    (15, "1-15: Cactus Jumper", "scratch/ch1_frames/f_0050.png"),
    (16, "1-16: Sidewinder", "scratch/ch1_frames/f_0053.png"),
    (17, "1-17: MorningStar", "scratch/ch1_frames/f_0060.png"),
    (18, "1-18: Altamont", "scratch/ch1_frames/f_0067.png"),
    (19, "1-19: Intermission", "scratch/ch1_frames/f_0072.png"),
    (20, "1-20: The Test", "scratch/ch1_frames/f_0076.png"),
    (21, "1-21: Lil Slugger (Boss)", "scratch/ch1_frames/f_0090.png"),
]

for num, title, frame_path in candidates:
    if os.path.exists(frame_path):
        img = Image.open(frame_path)
        out_name = f"scratch/ch1_levels/lvl_{num:02d}.png"
        img.save(out_name)
        print(f"Saved Level {num:02d} ({title}) -> {out_name}")

print("Done extracting level stills!")
