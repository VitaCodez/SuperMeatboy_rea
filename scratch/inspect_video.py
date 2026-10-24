import urllib.request
import re
import json

url = 'https://www.youtube.com/watch?v=ecnlsRa1pb0'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        title_match = re.search(r'<title>(.*?)</title>', html)
        print('Title:', title_match.group(1) if title_match else 'None')
        desc_match = re.search(r'"shortDescription":"(.*?)"', html)
        if desc_match:
            desc = desc_match.group(1).encode('utf-8').decode('unicode_escape')
            print('Description:\n', desc[:1500])
except Exception as e:
    print('Error:', e)
