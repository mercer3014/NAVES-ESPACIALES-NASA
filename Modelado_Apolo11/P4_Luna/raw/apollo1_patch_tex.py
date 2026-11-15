# Textura 512 px del parche del Apolo 1: diseno propio inspirado en la insignia de la mision (AS-204):
# borde azul con APOLLO 1 y GRISSOM - WHITE - CHAFFEE, CSM en orbita, Tierra, Luna al fondo y franjas rojas y blancas.
# Dibujado desde cero con PIL (no se copia ninguna imagen).
from PIL import Image, ImageDraw, ImageFont
import math, random
S = 1024; im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
C = S / 2
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
d.ellipse([4, 4, S - 4, S - 4], fill=(14, 30, 92, 255))                 # borde azul
d.ellipse([18, 18, S - 18, S - 18], outline=(214, 178, 72, 255), width=10)  # filete dorado exterior
R_in = 360
d.ellipse([C - R_in - 10, C - R_in - 10, C + R_in + 10, C + R_in + 10], fill=(214, 178, 72, 255))
d.ellipse([C - R_in, C - R_in, C + R_in, C + R_in], fill=(6, 8, 20, 255))  # espacio
inner = Image.new('L', (S, S), 0); ImageDraw.Draw(inner).ellipse([C - R_in, C - R_in, C + R_in, C + R_in], fill=255)
art = Image.new('RGBA', (S, S), (6, 8, 20, 255)); a = ImageDraw.Draw(art)
random.seed(4)
for _ in range(90):
    x, y = random.uniform(C - R_in, C + R_in), random.uniform(C - R_in, C + R_in * 0.2); r = random.choice([1.5, 2, 2.5, 3.5])
    a.ellipse([x - r, y - r, x + r, y + r], fill=(235, 235, 220, 255))
# Luna al fondo (arriba a la derecha)
a.ellipse([C + 90, C - 300, C + 260, C - 130], fill=(196, 192, 180, 255))
for (dx, dy, rr) in [(150, -250, 18), (210, -190, 26), (130, -170, 12), (190, -265, 10)]:
    a.ellipse([C + dx - rr, C + dy - rr, C + dx + rr, C + dy + rr], fill=(160, 156, 146, 255))
# Tierra abajo con franjas rojas y blancas (homenaje a la bandera) sobre el horizonte
a.ellipse([C - 520, C + 120, C + 520, C + 1160], fill=(40, 96, 190, 255))
for i, col in enumerate([(200, 30, 36), (245, 245, 245)] * 3):
    y0 = C + 180 + i * 34
    a.rectangle([C - R_in, y0, C + R_in, y0 + 34], fill=col + (255,))
mask = Image.new('L', (S, S), 0); ImageDraw.Draw(mask).ellipse([C - 520, C + 120, C + 520, C + 1160], fill=255)
earth = Image.new('RGBA', (S, S), (40, 96, 190, 255)); e = ImageDraw.Draw(earth)
for (x, y, w, h) in [(C - 220, C + 150, 180, 70), (C + 60, C + 170, 150, 50)]:
    e.ellipse([x, y, x + w, y + h], fill=(70, 140, 80, 255))
for i, col in enumerate([(200, 30, 36), (245, 245, 245)] * 3):
    y0 = C + 250 + i * 34
    e.rectangle([0, y0, S, y0 + 34], fill=col + (255,))
art.paste(earth, (0, 0), mask)
# orbita y CSM estilizado (cono + modulo de servicio + tobera) en diagonal
a.arc([C - 330, C - 120, C + 330, C + 170], start=190, end=350, fill=(214, 178, 72, 255), width=6)
ang = math.radians(-18); cx, cy = C - 40, C - 40
def rot(px, py): return (cx + px * math.cos(ang) - py * math.sin(ang), cy + px * math.sin(ang) + py * math.cos(ang))
a.polygon([rot(80, 0), rot(10, -45), rot(10, 45)], fill=(232, 232, 236, 255))            # CM
a.polygon([rot(10, -40), rot(-140, -40), rot(-140, 40), rot(10, 40)], fill=(205, 205, 212, 255))  # SM
a.polygon([rot(-140, -20), rot(-190, -38), rot(-190, 38), rot(-140, 20)], fill=(120, 120, 128, 255))  # tobera
for k in range(4):
    x0 = -120 + k * 32; a.line([rot(x0, -40), rot(x0, 40)], fill=(150, 150, 160, 255), width=3)
im.paste(art, (0, 0), inner)
# texto en arco
F = ImageFont.truetype(FB, 64); F2 = ImageFont.truetype(FB, 46)
def arc_text(txt, font, radius, center_deg, top=True, col=(240, 236, 220, 255)):
    widths = [font.getlength(ch) for ch in txt]; total = sum(widths)
    span = total / radius; start = math.radians(center_deg) - (span / 2 if top else -span / 2)
    t = start
    for ch, w in zip(txt, widths):
        mid = t + (w / 2 / radius if top else -w / 2 / radius)
        x = C + radius * math.sin(mid); y = C - radius * math.cos(mid)
        g = Image.new('RGBA', (110, 110), (0, 0, 0, 0)); ImageDraw.Draw(g).text((55, 55), ch, font=font, fill=col, anchor='mm')
        g = g.rotate(-math.degrees(mid) + (0 if top else 180), resample=Image.BICUBIC)
        im.alpha_composite(g, (int(x - 55), int(y - 55)))
        t += (w / radius if top else -w / radius)
arc_text('APOLLO 1', F, 435, 0, top=True)
arc_text('GRISSOM  WHITE  CHAFFEE', F2, 440, 180, top=False)
for deg in (-62, 62):
    x = C + 435 * math.sin(math.radians(deg)); y = C - 435 * math.cos(math.radians(deg))
    d2 = ImageDraw.Draw(im); r = 13
    pts = [(x + r * math.cos(math.radians(90 + 144 * k)), y - r * math.sin(math.radians(90 + 144 * k))) for k in range(5)]
    d2.polygon(pts, fill=(214, 178, 72, 255))
im = im.resize((512, 512), Image.LANCZOS)
bg = Image.new('RGB', (512, 512), (14, 30, 92)); bg.paste(im, (0, 0), im)
bg.save('apollo1-patch.png'); print('ok')
