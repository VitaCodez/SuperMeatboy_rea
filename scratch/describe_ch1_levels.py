from PIL import Image
import numpy as np

# Let's inspect the levels and write down their exact authentic layout
# Level 1 (Hello World):
# Floor across bottom (y=16-17), small 1-tile hop in middle, Meat Boy at x=3, Bandage Girl at x=28.
# Level 2 (Upward):
# Vertical shaft! Meat Boy starts at bottom-left floor. Bandage Girl is at top-right. Meat boy must wall jump up between two vertical walls!
# Level 3 (The Gap):
# Meat boy starts on left high ledge. Huge pit in middle. Wall on right. Long jump/sprint over gap to Bandage Girl on right ledge.
# Level 4 (Nutshell):
# Flat ground with 2 buzzsaws in the middle! Meat boy must jump over the buzzsaws. Bandage Girl on far right.
# Level 5 (Holy Mountain):
# Tall central mountain with saws on the left/right faces. Meat Boy starts at bottom, climbs up to Bandage Girl at the peak.
# Level 6 (Bladecatcher):
# Saws lining the floor and floating in mid-air. Stepping stones / pillars to hop across.
# Level 7 (Diverge):
# Split paths with upper and lower routes. Saws guarding the shortcut.
# Level 8 (The Bit):
# Short fast sprint with low ceiling and precision saw jumps.
# Level 9 (Safety Third):
# High vertical drops with saws on walls. Wall sliding between hazards.
# Level 10 (The Levee):
# Stepped ascending terrain with rolling/stationary saws.
print("Chapter 1 level descriptions catalogued.")
