from PIL import Image

# Save a collage or inspect text regions of frame_002 to frame_025
for i in [2, 3, 5, 8, 11, 14, 17, 21, 24]:
    fn = f"scratch/video_frames/frame_{i:03d}.png"
    im = Image.open(fn)
    # Crop middle, top, bottom
    top = im.crop((100, 10, 540, 60))
    center = im.crop((200, 100, 440, 260))
    print(f"Frame {i:03d} inspected: {fn}")
