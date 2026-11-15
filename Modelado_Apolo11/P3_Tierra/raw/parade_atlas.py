# Textura de fachada (ventanas) 512x512 en gris claro: se tinta con baseColorFactor por edificio.
# Un tile = 4 pisos x 4 vanos. python3 parade_atlas.py -> parade-facade.png
import os, random
from PIL import Image, ImageDraw
random.seed(3)
im = Image.new('RGB', (512, 512), (232, 228, 220)); d = ImageDraw.Draw(im)
for fl in range(4):
    y0 = fl*128
    d.rectangle([0, y0+112, 512, y0+127], fill=(205, 200, 192))           # cornisa de piso
    for b in range(4):
        x0 = b*128
        lit = random.random()
        col = (60, 70, 85) if lit > 0.25 else (150, 140, 110)
        d.rectangle([x0+30, y0+22, x0+98, y0+100], fill=(180, 176, 168))
        d.rectangle([x0+36, y0+28, x0+92, y0+96], fill=col)
        d.line([x0+64, y0+28, x0+64, y0+96], fill=(180, 176, 168), width=4)
        d.line([x0+36, y0+60, x0+92, y0+60], fill=(180, 176, 168), width=4)
        if random.random() < 0.3:   # cinta/papel colgando de la ventana
            d.rectangle([x0+50, y0+96, x0+56, y0+128], fill=(250, 250, 250))
im.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'parade-facade.png'))
print('ok')
