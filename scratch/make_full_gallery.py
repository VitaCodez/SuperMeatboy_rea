import os

samples_dir = 'scratch/all_chapter_samples'
files = sorted([f for f in os.listdir(samples_dir) if f.endswith('.png')])

html = ["<!DOCTYPE html><html><head><style>body{background:#111;color:#eee;font-family:sans-serif;} .grid{display:flex;flex-wrap:wrap;gap:8px;} .card{background:#222;padding:4px;border-radius:4px;text-align:center;} img{width:280px;height:157px;object-fit:cover;} </style></head><body>"]
html.append(f"<h1>Full Playthrough 10s Timeline ({len(files)} frames)</h1><div class='grid'>")

for idx, f in enumerate(files):
    t_sec = idx * 10
    mins = t_sec // 60
    secs = t_sec % 60
    time_str = f"{mins:02d}:{secs:02d}"
    html.append(f"<div class='card'><img src='all_chapter_samples/{f}'><br><span>{time_str}</span></div>")

html.append("</div></body></html>")

with open('scratch/gallery_full.html', 'w', encoding='utf-8') as out:
    out.write("\n".join(html))

print("Created scratch/gallery_full.html")
