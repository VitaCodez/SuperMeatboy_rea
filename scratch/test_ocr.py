from PIL import Image
import os
import numpy as np

# In SMB, when a level loads, in the first 1-2 seconds, the level title appears.
# Also, let's detect the text in the frames. Let's see if we can use Windows OCR or PowerShell OCR or PIL!
# Windows 10/11 has Windows.Media.Ocr built into PowerShell!
# Let's test if Windows.Media.Ocr is available via PowerShell!
