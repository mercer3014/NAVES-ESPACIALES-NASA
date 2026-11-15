import sys
from PIL import Image
out = sys.argv[1]; ims = [Image.open(p).convert('RGB') for p in sys.argv[2:]]
h = max(i.height for i in ims); W = sum(int(i.width * h / i.height) for i in ims)
S = Image.new('RGB', (W, h), 'white'); x = 0
for i in ims:
    i = i.resize((int(i.width * h / i.height), h)); S.paste(i, (x, 0)); x += i.width
S.save(out)
