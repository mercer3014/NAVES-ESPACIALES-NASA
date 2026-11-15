# Genera la textura atlas 512x512 de earth-props (todo dibujado por codigo, sin assets externos).
# python3 earth_props_atlas.py  -> earth-props-atlas.png
# Fuentes: Google Fonts (OFL) instaladas en el sistema, solo rasterizadas.
import math, random, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
random.seed(11)
HERE = os.path.dirname(os.path.abspath(__file__))
G = '/usr/share/fonts/truetype/sand-box/google/'
def F(path, size):
    return ImageFont.truetype(G + path, size)
S = 2  # supersampling
A = Image.new('RGB', (512*S, 512*S), (200, 200, 200))
D = ImageDraw.Draw(A)

def region(x, y, w, h):
    return [x*S, y*S, (x+w)*S, (y+h)*S]

# ---- 1. pizarra (0,0)-(512,256): "TOUGH AND COMPETENT" con tiza ----
x0, y0, w, h = 0, 0, 512, 256
board = Image.new('RGB', (w*S, h*S), (38, 58, 46))
bd = ImageDraw.Draw(board)
for i in range(1800):  # polvo de tiza / manchas de borrado
    px, py = random.randint(0, w*S), random.randint(0, h*S)
    r = random.randint(4, 30)
    c = random.randint(44, 58)
    bd.ellipse([px-r, py-r//3, px+r, py+r//3], fill=(c-6, c+12, c))
board = board.filter(ImageFilter.GaussianBlur(6))
bd = ImageDraw.Draw(board)
fnt = F('Kalam/Kalam-Bold.ttf', 56*S)
for line, yy in (("TOUGH", 40), ("AND COMPETENT", 132)):
    tw = bd.textlength(line, font=fnt)
    xx = (w*S - tw)/2
    for k in range(3):
        bd.text((xx+random.randint(-2, 2), yy*S+random.randint(-2, 2)), line, font=fnt, fill=(205+k*10, 210+k*10, 200+k*10))
board = board.filter(ImageFilter.GaussianBlur(0.8))
A.paste(board, (x0*S, y0*S))

# ---- 2. parche de mision (0,256)-(256,512): aguila sobre la Luna con rama de olivo ----
P = 1024
pat = Image.new('RGBA', (P, P), (0, 0, 0, 0))
pd = ImageDraw.Draw(pat)
c = P/2
def pt(x, y, r=0.80):  # coords normalizadas (y arriba) -> pixeles dentro del disco interior
    return (c + x*c*r, c - y*c*r)
pd.ellipse([8, 8, P-8, P-8], fill=(225, 178, 60))                 # borde dorado
pd.ellipse([22, 22, P-22, P-22], fill=(18, 24, 60))               # anillo azul de texto
pd.ellipse([c-c*0.80, c-c*0.80, c+c*0.80, c+c*0.80], fill=(225, 178, 60))
inner = Image.new('RGBA', (P, P), (0, 0, 0, 0))
idr = ImageDraw.Draw(inner)
idr.ellipse([c-c*0.77, c-c*0.77, c+c*0.77, c+c*0.77], fill=(8, 14, 40))
for i in range(70):  # estrellas
    a, rr = random.uniform(0, 2*math.pi), random.uniform(0, 0.74)
    x, y = math.cos(a)*rr, math.sin(a)*rr
    if y < -0.15: continue
    s = random.choice((2, 3, 4))
    idr.ellipse([c+x*c-s, c-y*c-s, c+x*c+s, c-y*c+s], fill=(230, 230, 210))
# Tierra arriba a la izquierda
ex, ey, er = pt(-0.45, 0.55)[0], pt(-0.45, 0.55)[1], 0.17*c
idr.ellipse([ex-er, ey-er, ex+er, ey+er], fill=(50, 110, 200))
idr.pieslice([ex-er, ey-er, ex+er, ey+er], 90, 270, fill=(14, 30, 70))     # terminador
idr.polygon([(ex+er*0.15, ey-er*0.6), (ex+er*0.55, ey-er*0.35), (ex+er*0.6, ey+er*0.2), (ex+er*0.25, ey+er*0.45), (ex+er*0.15, ey)], fill=(70, 140, 70))
idr.ellipse([ex+er*0.2, ey-er*0.95, ex+er*0.7, ey-er*0.75], fill=(235, 240, 245))
# superficie lunar con crateres
idr.chord([c-c*1.6, c+c*0.05, c+c*1.6, c+c*2.8], 180, 360, fill=(150, 148, 140))
for (x, y, r) in [(-0.4, -0.38, 0.09), (0.35, -0.5, 0.12), (0.0, -0.62, 0.07), (-0.15, -0.3, 0.05), (0.55, -0.28, 0.05)]:
    X, Y = pt(x, y, 1.0)
    idr.ellipse([X-r*c, Y-r*c*0.4, X+r*c, Y+r*c*0.4], fill=(110, 108, 102))
    idr.ellipse([X-r*c*0.8, Y-r*c*0.3, X+r*c*0.8, Y+r*c*0.25], fill=(128, 126, 120))
# aguila (silueta propia), posada con alas abiertas
def poly(pts, fill):
    idr.polygon([pt(x, y, 1.0) for x, y in pts], fill=fill)
brown, dark, white, yellow = (120, 72, 30), (78, 44, 18), (240, 238, 228), (240, 190, 40)
# ala trasera (derecha), plumas en dientes de sierra
poly([(0.05, 0.02), (0.20, 0.30), (0.38, 0.52), (0.62, 0.62), (0.55, 0.50), (0.66, 0.48), (0.56, 0.38), (0.64, 0.33), (0.52, 0.25), (0.58, 0.18), (0.42, 0.12), (0.30, -0.02)], dark)
# cuerpo
poly([(-0.20, 0.08), (0.02, 0.10), (0.25, 0.02), (0.36, -0.10), (0.30, -0.20), (0.08, -0.22), (-0.10, -0.12)], brown)
# cola blanca
poly([(0.28, -0.12), (0.55, -0.20), (0.58, -0.30), (0.48, -0.34), (0.30, -0.24)], white)
# ala delantera (izquierda)
poly([(-0.02, 0.06), (-0.08, 0.30), (-0.20, 0.50), (-0.12, 0.66), (-0.02, 0.52), (0.04, 0.62), (0.08, 0.48), (0.16, 0.56), (0.17, 0.40), (0.26, 0.42), (0.22, 0.26), (0.30, 0.22), (0.18, 0.06)], brown)
poly([(-0.02, 0.06), (-0.06, 0.24), (0.10, 0.20), (0.18, 0.06)], dark)
# cabeza blanca y pico
poly([(-0.16, 0.08), (-0.20, 0.17), (-0.27, 0.21), (-0.34, 0.19), (-0.37, 0.13), (-0.30, 0.07), (-0.26, 0.02), (-0.16, -0.02)], white)
poly([(-0.36, 0.18), (-0.45, 0.165), (-0.48, 0.12), (-0.455, 0.08), (-0.44, 0.115), (-0.37, 0.115)], yellow)
poly([(-0.25, 0.20), (-0.35, 0.185), (-0.31, 0.205)], (200, 200, 190))
X, Y = pt(-0.32, 0.165, 1.0); idr.ellipse([X-6, Y-6, X+6, Y+6], fill=(20, 20, 20))
# patas con garras
poly([(0.00, -0.18), (0.04, -0.18), (0.00, -0.34), (-0.04, -0.34)], yellow)
poly([(0.12, -0.20), (0.16, -0.20), (0.14, -0.34), (0.10, -0.34)], yellow)
# rama de olivo en las garras
X0, Y0 = pt(-0.30, -0.36, 1.0); X1, Y1 = pt(0.38, -0.34, 1.0)
idr.line([X0, Y0, X1, Y1], fill=(90, 70, 30), width=10)
for i in range(9):
    t = i/8
    X, Y = X0 + (X1-X0)*t, Y0 + (Y1-Y0)*t
    for sgn in (-1, 1):
        lx, ly = X + 22*sgn*0.4, Y + 26*sgn
        idr.ellipse([lx-16, ly-8, lx+16, ly+8], fill=(80, 140, 60))
mask = Image.new('L', (P, P), 0)
ImageDraw.Draw(mask).ellipse([c-c*0.77, c-c*0.77, c+c*0.77, c+c*0.77], fill=255)
pat.paste(inner, (0, 0), mask)
# texto en arco "APOLLO 11"
fnt = F('Barlow Condensed/BarlowCondensed-Bold.ttf', 92)
txt = "APOLLO 11"
R = c*0.885
ang_total = 62
for i, ch in enumerate(txt):
    a = math.radians(90 + ang_total/2 - i*ang_total/(len(txt)-1))
    g = Image.new('RGBA', (120, 120), (0, 0, 0, 0))
    ImageDraw.Draw(g).text((60, 60), ch, font=fnt, fill=(240, 205, 90), anchor='mm')
    g = g.rotate(math.degrees(a) - 90, resample=Image.BICUBIC)
    X, Y = c + R*math.cos(a), c - R*math.sin(a)
    pat.alpha_composite(g, (int(X-60), int(Y-60)))
pat = pat.resize((256*S, 256*S), Image.LANCZOS)
bg = Image.new('RGB', pat.size, (225, 178, 60)); bg.paste(pat, (0, 0), pat)
A.paste(bg, (0, 256*S))

# ---- 3. hoja de alarmas de Garman (256,256) 128x165 ----
sh = Image.new('RGB', (128*S*2, 165*S*2), (238, 234, 218))
sd = ImageDraw.Draw(sh)
for yy in range(40, sh.height, 22):
    sd.line([0, yy, sh.width, yy], fill=(160, 185, 215), width=2)
sd.line([46, 0, 46, sh.height], fill=(220, 120, 120), width=2)
hw = F('Caveat/Caveat-VariableFont_wght.ttf', 42)
hws = F('Caveat/Caveat-VariableFont_wght.ttf', 30)
sd.text((56, 8), "PGM ALARMS - LGC", font=hws, fill=(30, 40, 90))
sd.text((60, 72), "1201 - 1202", font=F('Caveat/Caveat-VariableFont_wght.ttf', 66), fill=(25, 30, 80))
sd.text((60, 148), "exec overflow", font=hw, fill=(30, 40, 90))
sd.text((60, 192), "GO if not continuous", font=hws, fill=(30, 40, 90))
sd.line([60, 236, 360, 232], fill=(30, 40, 90), width=3)
for i, t in enumerate(["1106  ?", "1107  ?", "1210  NO GO", "1302  ?", "1520  ?"]):
    sd.text((70, 252 + i*44), t, font=hws, fill=(60, 60, 70))
sd.ellipse([48, 60, 330, 140], outline=(170, 30, 30), width=4)
sh = sh.resize((128*S, 165*S), Image.LANCZOS)
A.paste(sh, (256*S, 256*S))

# ---- 4. foto enmarcada generica (384,256) 128x128: paisaje sin personas ----
ph = Image.new('RGB', (128*S, 128*S))
pdd = ImageDraw.Draw(ph)
for yy in range(ph.height):
    t = yy/ph.height
    pdd.line([0, yy, ph.width, yy], fill=(int(120+100*t), int(160+60*t), int(210+20*t)))
pdd.ellipse([150, 40, 200, 90], fill=(250, 230, 170))
pdd.polygon([(0, 170), (60, 120), (110, 150), (170, 110), (256, 160), (256, 256), (0, 256)], fill=(80, 110, 80))
pdd.polygon([(0, 200), (256, 185), (256, 256), (0, 256)], fill=(150, 140, 90))
pdd.rectangle([40, 168, 90, 205], fill=(235, 230, 215)); pdd.polygon([(34, 170), (65, 145), (96, 170)], fill=(140, 60, 40))
pdd.rectangle([58, 185, 70, 205], fill=(90, 60, 40))
ph = ph.filter(ImageFilter.GaussianBlur(1.2))
sep = Image.new('RGB', ph.size, (112, 86, 60))
ph = Image.blend(ph, sep, 0.25)
A.paste(ph, (384*S, 256*S))

# ---- 5. sobre firmado (384,384) 128x56 ----
en = Image.new('RGB', (128*S*2, 56*S*2), (236, 230, 212))
ed = ImageDraw.Draw(en)
ed.rectangle([420, 14, 492, 96], fill=(170, 40, 40)); ed.rectangle([428, 22, 484, 88], fill=(225, 205, 160))
ed.ellipse([360, 20, 440, 100], outline=(40, 40, 40), width=3)
for k in range(4): ed.line([300, 34+k*14, 420, 34+k*14], fill=(40, 40, 40), width=2)
def squiggle(x, y, w, seed):
    r = random.Random(seed); pts = []
    for i in range(30):
        t = i/29
        pts.append((x + w*t + r.uniform(-3, 3), y + 10*math.sin(t*r.uniform(8, 14)) + r.uniform(-4, 4)))
    ed.line(pts, fill=(20, 30, 110), width=3)
squiggle(30, 120, 150, 1); squiggle(40, 160, 130, 2); squiggle(200, 150, 140, 3)
ed.text((40, 30), "KENNEDY SPACE CENTER", font=F('Barlow Condensed/BarlowCondensed-Bold.ttf', 22), fill=(60, 60, 60))
ed.text((40, 56), "JULY 16 1969", font=F('Barlow Condensed/BarlowCondensed-Bold.ttf', 22), fill=(60, 60, 60))
en = en.resize((128*S, 56*S), Image.LANCZOS)
A.paste(en, (384*S, 384*S))

# ---- 6. tapa de libreta (256,421) 128x91 ----
nb = Image.new('RGB', (128*S, 91*S), (110, 30, 30))
nd = ImageDraw.Draw(nb)
nd.rectangle([10, 10, nb.width-10, nb.height-10], outline=(200, 160, 80), width=3)
nd.text((nb.width/2, nb.height/2), "ADDRESSES", font=F('Barlow Condensed/BarlowCondensed-Bold.ttf', 34), fill=(215, 175, 90), anchor='mm')
A.paste(nb, (256*S, 421*S))

# ---- 7. papel liso/blanco (384,440) 128x72 para bordes de paginas ----
D.rectangle(region(384, 440, 128, 72), fill=(232, 228, 214))

A = A.resize((512, 512), Image.LANCZOS)
A.save(os.path.join(HERE, 'earth-props-atlas.png'))
A.crop((0, 256, 256, 512)).resize((512, 512)).save('/tmp/patch_check.png')
print('ok')
