import re

with open(r"C:\Program Files\Epic Games\SuperMeatBoy\SuperMeatBoy.exe", "rb") as f:
    exe = f.read()

# Search for strings like "Hello World" or "1-1" or level names
matches = re.findall(b"[0-9]+-[0-9]+[a-zA-Z0-9 :\'!\?\.\-]+", exe)
for m in set(matches):
    try:
        s = m.decode('latin1')
        if len(s) > 4 and len(s) < 50:
            print(s)
    except:
        pass
