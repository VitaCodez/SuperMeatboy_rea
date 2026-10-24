import os

frames_dir = 'scratch/ch1_frames'
files = sorted([f for f in os.listdir(frames_dir) if f.endswith('.png')])

html = ["<!DOCTYPE html><html><head><style>body{background:#111;color:#eee;font-family:sans-serif;} .grid{display:flex;flex-wrap:wrap;gap:10px;} .card{background:#222;padding:5px;border-radius:4px;text-align:center;} img{width:320px;height:180px;object-fit:cover;} </style></head><body>"]
html.append(f"<h1>Chapter 1 Playthrough Frames ({len(files)} total)</h1><div class='grid'>")

for idx, f in enumerate(files):
    t_sec = idx # 1fps
    mins = t_sec // 60
    secs = t_sec % 60
    time_str = f"{mins:02d}:{secs:02d}"
    html.append(f"<div class='card'><img src='ch1_frames/{f}'><br><span>{f} ({time_str})</span></div>")

html.append("</div></body></html>")

with open('scratch/gallery_ch1.html', 'w', encoding='utf-8') as out:
    out.write("\n".join(html))

print("Created scratch/gallery_ch1.html")
