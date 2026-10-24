import subprocess
import json

url = 'https://youtu.be/ecnlsRa1pb0?si=7k-MrLFechN6gtpC'

cmd = ['python', '-m', 'yt_dlp', '--dump-json', url]
try:
    proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
    info = json.loads(proc.stdout)
    print('Title:', info.get('title'))
    print('Duration:', info.get('duration'))
    print('Chapters:', len(info.get('chapters') or []))
    if info.get('chapters'):
        for c in info['chapters']:
            print(f"  {c.get('start_time')} - {c.get('title')}")
    else:
        print('No chapters in video metadata.')
except Exception as e:
    print('Error getting metadata:', e)
